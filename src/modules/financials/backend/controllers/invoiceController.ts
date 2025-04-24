import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../backend/lib/prisma';

export async function getInvoices(req: NextRequest) {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function createInvoice(req: NextRequest) {
  try {
    const data = await req.json();
    const invoice = await prisma.invoice.create({
      data
    });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}