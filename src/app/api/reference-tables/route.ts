import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    let queryParams: any = {};
    
    if (category) {
      queryParams.filter = [{
        column: 'category',
        operator: 'eq',
        value: category
      }];
    }
    
    const result = await fetchData('reference_tables', queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching reference tables:', error);
    return NextResponse.json({ error: 'Failed to fetch reference tables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }
    
    const result = await insertData('reference_tables', {
      name: data.name,
      category: data.category,
      description: data.description || '',
      entries: data.entries || []
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating reference table:', error);
    return NextResponse.json({ error: 'Failed to create reference table' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.name || !data.category) {
      return NextResponse.json({ error: 'ID, name, and category are required' }, { status: 400 });
    }
    
    const result = await updateData('reference_tables', 'id', data.id, {
      name: data.name,
      category: data.category,
      description: data.description || '',
      entries: data.entries || []
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating reference table:', error);
    return NextResponse.json({ error: 'Failed to update reference table' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const result = await deleteData('reference_tables', 'id', id);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reference table:', error);
    return NextResponse.json({ error: 'Failed to delete reference table' }, { status: 500 });
  }
}