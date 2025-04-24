import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get('table');
    
    if (!table) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }
    
    // Parse filter parameters
    const filterParams: any[] = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter.')) {
        const [_, column, operator] = key.split('.');
        filterParams.push({
          column,
          operator: operator || 'eq',
          value
        });
      }
    });
    
    // Parse order parameters
    const orderParams: any[] = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith('order.')) {
        const [_, column] = key.split('.');
        orderParams.push({
          column,
          ascending: value.toLowerCase() !== 'desc'
        });
      }
    });
    
    // Parse limit and offset
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const queryParams = {
      filter: filterParams.length > 0 ? filterParams : undefined,
      order: orderParams.length > 0 ? orderParams : undefined,
      limit,
      offset
    };
    
    const result = await fetchData(table, queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { table, data } = await request.json();
    
    if (!table || !data) {
      return NextResponse.json({ error: 'Table name and data are required' }, { status: 400 });
    }
    
    const result = await insertData(table, data);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { table, idColumn, idValue, data } = await request.json();
    
    if (!table || !idColumn || !idValue || !data) {
      return NextResponse.json({ error: 'Table name, ID column, ID value, and data are required' }, { status: 400 });
    }
    
    const result = await updateData(table, idColumn, idValue, data);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in PUT route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { table, idColumn, idValue } = await request.json();
    
    if (!table || !idColumn || !idValue) {
      return NextResponse.json({ error: 'Table name, ID column, and ID value are required' }, { status: 400 });
    }
    
    const result = await deleteData(table, idColumn, idValue);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in DELETE route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}