import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    let queryParams: any = {};
    
    if (type) {
      queryParams.filter = [{
        column: 'type',
        operator: 'eq',
        value: type
      }];
    }
    
    if (status) {
      if (!queryParams.filter) queryParams.filter = [];
      queryParams.filter.push({
        column: 'status',
        operator: 'eq',
        value: status
      });
    }
    
    // Order by name
    queryParams.order = [
      { column: 'name', ascending: true }
    ];
    
    const result = await fetchData('clients', queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.type || !data.status) {
      return NextResponse.json({ error: 'Name, type, and status are required' }, { status: 400 });
    }
    
    const result = await insertData('clients', {
      name: data.name,
      type: data.type,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.name || !data.type || !data.status) {
      return NextResponse.json({ error: 'ID, name, type, and status are required' }, { status: 400 });
    }
    
    const result = await updateData('clients', 'id', data.id, {
      name: data.name,
      type: data.type,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const result = await deleteData('clients', 'id', id);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}