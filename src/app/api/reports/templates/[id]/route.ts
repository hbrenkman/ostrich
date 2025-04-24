import { NextRequest, NextResponse } from 'next/server';
import { getTemplate } from '@/lib/reportTemplateStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const savedTemplate = getTemplate();
    return NextResponse.json(savedTemplate || {
      id: 'default',
      name: 'Default Template',
      type: 'Custom',
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