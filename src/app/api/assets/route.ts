import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const designation = searchParams.get('designation');
    
    let queryParams: any = {};
    
    if (status) {
      queryParams.filter = [{
        column: 'status',
        operator: 'eq',
        value: status
      }];
    }
    
    if (designation) {
      if (!queryParams.filter) queryParams.filter = [];
      queryParams.filter.push({
        column: 'designation',
        operator: 'eq',
        value: designation
      });
    }
    
    // Order by number
    queryParams.order = [
      { column: 'number', ascending: true }
    ];
    
    const result = await fetchData('assets', queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.number || !data.description || !data.designation || !data.status) {
      return NextResponse.json({ error: 'Number, description, designation, and status are required' }, { status: 400 });
    }
    
    const result = await insertData('assets', {
      number: data.number,
      description: data.description,
      designation: data.designation,
      location: data.location || null,
      purchase_value: data.purchase_value || null,
      purchase_date: data.purchase_date || null,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.number || !data.description || !data.designation || !data.status) {
      return NextResponse.json({ error: 'ID, number, description, designation, and status are required' }, { status: 400 });
    }
    
    const result = await updateData('assets', 'id', data.id, {
      number: data.number,
      description: data.description,
      designation: data.designation,
      location: data.location || null,
      purchase_value: data.purchase_value || null,
      purchase_date: data.purchase_date || null,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const result = await deleteData('assets', 'id', id);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}