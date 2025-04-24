import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { url, key } = await request.json();
    
    if (!url || !key) {
      return NextResponse.json({ error: 'URL and key are required' }, { status: 400 });
    }
    
    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    const envContent = `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}\n`;
    
    fs.writeFileSync(envPath, envContent);
    
    // Force environment variables to be reloaded
    try {
      execSync('npm run loadenv', { stdio: 'ignore' });
    } catch (error) {
      console.warn('Could not run loadenv command:', error);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Supabase' },
      { status: 500 }
    );
  }
}