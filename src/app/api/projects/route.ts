import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    
    let queryParams: any = {};
    
    if (status) {
      queryParams.filter = [{
        column: 'status',
        operator: 'eq',
        value: status
      }];
    }
    
    if (clientId) {
      if (!queryParams.filter) queryParams.filter = [];
      queryParams.filter.push({
        column: 'client_id',
        operator: 'eq',
        value: clientId
      });
    }
    
    // Order by number
    queryParams.order = [
      { column: 'number', ascending: true }
    ];
    
    const result = await fetchData('projects', queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.number || !data.name || !data.type || !data.status) {
      return NextResponse.json({ error: 'Number, name, type, and status are required' }, { status: 400 });
    }
    
    const result = await insertData('projects', {
      number: data.number,
      name: data.name,
      client_id: data.client_id || null,
      type: data.type,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.number || !data.name || !data.type || !data.status) {
      return NextResponse.json({ error: 'ID, number, name, type, and status are required' }, { status: 400 });
    }
    
    const result = await updateData('projects', 'id', data.id, {
      number: data.number,
      name: data.name,
      client_id: data.client_id || null,
      type: data.type,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const result = await deleteData('projects', 'id', id);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}