import { NextRequest, NextResponse } from 'next/server';
import { getTemplate } from '@/lib/templateStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const savedTemplate = getTemplate();
    // Return the saved template if it exists, otherwise return default template
    return NextResponse.json(savedTemplate || {
      id: 'default',
      name: 'Default Template',
      content: '{}',
      isDefault: true
    });
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}