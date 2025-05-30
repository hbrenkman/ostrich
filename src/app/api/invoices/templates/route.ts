import { NextRequest, NextResponse } from 'next/server';
import { saveTemplate } from '@/lib/templateStorage';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Save the template in memory
    const template = saveTemplate({
      id: 'default',
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to save template:', error);
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Update the template in memory
    const template = saveTemplate({
      id: 'default',
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}