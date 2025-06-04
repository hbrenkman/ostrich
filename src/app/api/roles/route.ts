import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface Role {
  id: string;  // UUID
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;  // timestamp with time zone
  updated_at: string;  // timestamp with time zone
}

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting query for roles...');
    
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('API: No roles found');
      return NextResponse.json({ roles: [] });
    }

    console.log('API: Successfully fetched roles');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting POST request for role...');
    
    const supabase = createSupabaseClient();
    
    const body = await request.json();
    console.log('API: Request body:', body);

    // Validate required fields
    if (!body.name) {
      console.error('API: Missing required field: name');
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Insert the new role
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: body.name,
        description: body.description || null,
        is_active: body.is_active ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully created role');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('API: Starting PUT request for role...');
    
    const supabase = createSupabaseClient();
    
    const body = await request.json();
    console.log('API: Request body:', body);

    // Validate required fields
    if (!body.id || !body.name) {
      console.error('API: Missing required fields');
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Update the role
    const { data, error } = await supabase
      .from('roles')
      .update({
        name: body.name,
        description: body.description || null,
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully updated role');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('API: Starting DELETE request for role...');
    
    const supabase = createSupabaseClient();
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      console.error('API: No role ID provided');
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully deleted role');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 