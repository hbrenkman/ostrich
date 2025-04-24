import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../backend/lib/prisma';

export async function getTemplate(req: NextRequest) {
  try {
    const templateId = req.url.split('/').pop();
    const template = await prisma.invoiceTemplate.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function saveTemplate(req: NextRequest) {
  try {
    const data = await req.json();
    const template = await prisma.invoiceTemplate.create({
      data
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

export async function updateTemplate(req: NextRequest) {
  try {
    const templateId = req.url.split('/').pop();
    const data = await req.json();
    
    const template = await prisma.invoiceTemplate.update({
      where: { id: templateId },
      data
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