import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    
    let queryParams: any = {};
    
    if (projectId) {
      queryParams.filter = [{
        column: 'project_id',
        operator: 'eq',
        value: projectId
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
    
    // Order by number
    queryParams.order = [
      { column: 'number', ascending: true }
    ];
    
    const result = await fetchData('fee_proposals', queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching fee proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch fee proposals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.number || !data.project_id || data.design_budget === undefined || data.construction_support_budget === undefined || !data.status) {
      return NextResponse.json({ error: 'Number, project ID, design budget, construction support budget, and status are required' }, { status: 400 });
    }
    
    const result = await insertData('fee_proposals', {
      number: data.number,
      project_id: data.project_id,
      overview: data.overview || null,
      design_budget: data.design_budget,
      construction_support_budget: data.construction_support_budget,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating fee proposal:', error);
    return NextResponse.json({ error: 'Failed to create fee proposal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.number || !data.project_id || data.design_budget === undefined || data.construction_support_budget === undefined || !data.status) {
      return NextResponse.json({ error: 'ID, number, project ID, design budget, construction support budget, and status are required' }, { status: 400 });
    }
    
    const result = await updateData('fee_proposals', 'id', data.id, {
      number: data.number,
      project_id: data.project_id,
      overview: data.overview || null,
      design_budget: data.design_budget,
      construction_support_budget: data.construction_support_budget,
      status: data.status
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating fee proposal:', error);
    return NextResponse.json({ error: 'Failed to update fee proposal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const result = await deleteData('fee_proposals', 'id', id);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fee proposal:', error);
    return NextResponse.json({ error: 'Failed to delete fee proposal' }, { status: 500 });
  }
}