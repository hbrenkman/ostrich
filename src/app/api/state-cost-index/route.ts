import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state');
    const metro = searchParams.get('metro');
    
    let queryParams: any = {};
    
    if (state) {
      queryParams.filter = [{
        column: 'state',
        operator: 'eq',
        value: state
      }];
    }
    
    if (metro) {
      if (!queryParams.filter) queryParams.filter = [];
      queryParams.filter.push({
        column: 'metro_area',
        operator: 'eq',
        value: metro
      });
    }
    
    // Order by state and then by metro_area
    queryParams.order = [
      { column: 'state', ascending: true },
      { column: 'metro_area', ascending: true }
    ];
    
    const result = await fetchData('state_cost_index', queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    // Group by state for easier consumption
    const groupedByState = result.data.reduce((acc, item) => {
      if (!acc[item.state]) {
        acc[item.state] = {
          state: item.state,
          metros: []
        };
      }
      
      acc[item.state].metros.push({
        name: item.metro_area,
        index: item.cost_index
      });
      
      return acc;
    }, {});
    
    return NextResponse.json(Object.values(groupedByState));
  } catch (error) {
    console.error('Error fetching state cost index:', error);
    return NextResponse.json({ error: 'Failed to fetch state cost index' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.state || !data.metro_area || data.cost_index === undefined) {
      return NextResponse.json({ error: 'State, metro area, and cost index are required' }, { status: 400 });
    }
    
    const result = await insertData('state_cost_index', {
      state: data.state,
      metro_area: data.metro_area,
      cost_index: data.cost_index
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating state cost index entry:', error);
    return NextResponse.json({ error: 'Failed to create state cost index entry' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.state || !data.metro_area || data.cost_index === undefined) {
      return NextResponse.json({ error: 'ID, state, metro area, and cost index are required' }, { status: 400 });
    }
    
    const result = await updateData('state_cost_index', 'id', data.id, {
      state: data.state,
      metro_area: data.metro_area,
      cost_index: data.cost_index
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating state cost index entry:', error);
    return NextResponse.json({ error: 'Failed to update state cost index entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const result = await deleteData('state_cost_index', 'id', id);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting state cost index entry:', error);
    return NextResponse.json({ error: 'Failed to delete state cost index entry' }, { status: 500 });
  }
}