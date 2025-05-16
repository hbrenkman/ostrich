import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    console.log('API: Starting project types query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data: projectTypes, error } = await supabase
      .from('project_types')
      .select(`
        id,
        name,
        description,
        display_order,
        is_active,
        created_at,
        updated_at
      `)
      .order('display_order')
      .returns<ProjectType[]>();

    console.log('API: Query completed. Error:', error);
    if (projectTypes && projectTypes.length > 0) {
      console.log('API: First project type raw data:', projectTypes[0]);
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!projectTypes || projectTypes.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    return NextResponse.json(projectTypes);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();

    const { data: projectType, error } = await supabase
      .from('project_types')
      .insert([
        {
          name: data.name,
          description: data.description || null,
          display_order: data.display_order || 0,
          is_active: data.is_active ?? true
        }
      ])
      .select()
      .single()
      .returns<ProjectType>();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projectType);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();

    const { data: projectType, error } = await supabase
      .from('project_types')
      .update({
        name: data.name,
        description: data.description || null,
        display_order: data.display_order,
        is_active: data.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single()
      .returns<ProjectType>();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projectType);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();

    const { error } = await supabase
      .from('project_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 