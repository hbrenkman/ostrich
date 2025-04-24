import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../backend/lib/prisma';

export async function getTimesheets(req: NextRequest) {
  try {
    const timesheets = await prisma.timesheet.findMany({
      include: {
        entries: true
      },
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json(timesheets);
  } catch (error) {
    console.error('Failed to fetch timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheets' },
      { status: 500 }
    );
  }
}

export async function createTimesheet(req: NextRequest) {
  try {
    const data = await req.json();
    const timesheet = await prisma.timesheet.create({
      data,
      include: {
        entries: true
      }
    });
    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Failed to create timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to create timesheet' },
      { status: 500 }
    );
  }
}