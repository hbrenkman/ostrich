import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface Discipline {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting query for disciplines...');
    
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('API: No disciplines found');
      return NextResponse.json({ disciplines: [] });
    }

    console.log('API: Successfully fetched disciplines');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting POST request for discipline...');
    
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

    // Validate name length
    if (body.name.length > 50) {
      console.error('API: Name too long');
      return NextResponse.json(
        { error: 'Name must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Insert the new discipline
    const { data, error } = await supabase
      .from('disciplines')
      .insert({
        name: body.name,
        description: body.description || null
      })
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully created discipline');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('API: Starting PUT request for discipline...');
    
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

    // Validate name length
    if (body.name.length > 50) {
      console.error('API: Name too long');
      return NextResponse.json(
        { error: 'Name must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Update the discipline
    const { data, error } = await supabase
      .from('disciplines')
      .update({
        name: body.name,
        description: body.description || null
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully updated discipline');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('API: Starting DELETE request for discipline...');
    
    const supabase = createSupabaseClient();
    
    const { id } = await request.json();
    
    if (!id) {
      console.error('API: No discipline ID provided');
      return NextResponse.json(
        { error: 'Discipline ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('disciplines')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully deleted discipline');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 