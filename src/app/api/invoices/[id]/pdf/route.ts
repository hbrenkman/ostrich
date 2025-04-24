import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// Configure cache directory within writable /tmp directory
process.env.PUPPETEER_CACHE_DIR = '/tmp/puppeteer';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

async function retry<T>(
  operation: () => Promise<T>,
  retries: number,
  backoff: number,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    
    console.log(`${operationName} failed, retrying in ${backoff}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, backoff));
    
    return retry(
      operation,
      retries - 1,
      backoff * 2,
      operationName
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let browser;
  try {
    console.log('Launching browser...');
    const startTime = Date.now();
    
    // Launch browser with optimized configuration for WebContainer
    browser = await retry(
      async () => puppeteer.launch({
        headless: "new",
        timeout: 60000, // Reduced to 60 seconds
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--disable-dev-tools',
          '--mute-audio',
          '--window-size=1200,800'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
        executablePath: process.env.CHROME_BIN || undefined
      }),
      MAX_RETRIES,
      INITIAL_BACKOFF,
      'Browser launch'
    );
    
    console.log(`Browser launched in ${Date.now() - startTime}ms`);
    
    const page = await browser.newPage();
    
    // Optimize page performance
    await page.setDefaultNavigationTimeout(60000);
    await page.setRequestInterception(true);
    
    // Only allow essential resource types
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['document', 'stylesheet', 'script', 'font'].includes(resourceType)) {
        request.continue();
      } else {
        request.abort();
      }
    });
    
    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1
    });
    
    // Navigate to the print version of the invoice with retry logic
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const printUrl = `${baseUrl}/financials/invoicing/${params.id}/print`;
    console.log('Navigating to URL:', printUrl);
    
    const navigationStartTime = Date.now();
    await retry(
      async () => {
        await page.goto(printUrl, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });
      },
      MAX_RETRIES,
      INITIAL_BACKOFF,
      'Page navigation'
    );
    
    console.log(`Page navigation completed in ${Date.now() - navigationStartTime}ms`);
    
    // Generate PDF with optimized settings
    console.log('Generating PDF...');
    const pdfStartTime = Date.now();
    const pdf = await retry(
      async () => page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.4in',
          right: '0.4in',
          bottom: '0.4in',
          left: '0.4in'
        },
        preferCSSPageSize: true,
        timeout: 60000
      }),
      MAX_RETRIES,
      INITIAL_BACKOFF,
      'PDF generation'
    );
    
    console.log(`PDF generated in ${Date.now() - pdfStartTime}ms`);
    
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${params.id}.pdf"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error.message,
        type: error.name,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}