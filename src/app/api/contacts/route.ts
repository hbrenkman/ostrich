import { NextRequest, NextResponse } from 'next/server';
import { fetchData, insertData, updateData, deleteData } from '@/lib/supabaseUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const email = searchParams.get('email');
    
    let queryParams: any = {};
    
    if (clientId) {
      queryParams.filter = [{
        column: 'client_id',
        operator: 'eq',
        value: clientId
      }];
    }
    
    if (email) {
      if (!queryParams.filter) queryParams.filter = [];
      queryParams.filter.push({
        column: 'email',
        operator: 'eq',
        value: email
      });
    }
    
    // Order by last_name, first_name
    queryParams.order = [
      { column: 'last_name', ascending: true },
      { column: 'first_name', ascending: true }
    ];
    
    const result = await fetchData('contacts', queryParams);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.first_name || !data.last_name || !data.email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
    }
    
    const result = await insertData('contacts', {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || null,
      mobile: data.mobile || null,
      client_id: data.client_id || null,
      role: data.role || null
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.first_name || !data.last_name || !data.email) {
      return NextResponse.json({ error: 'ID, first name, last name, and email are required' }, { status: 400 });
    }
    
    const result = await updateData('contacts', 'id', data.id, {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || null,
      mobile: data.mobile || null,
      client_id: data.client_id || null,
      role: data.role || null
    });
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const result = await deleteData('contacts', 'id', id);
    
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}