import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = createSupabaseClient();
    
    // Check if id is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Use the same query structure as the edit project page
    let query = supabase
      .from('projects')
      .select(`
        *,
        type:project_types(name)
      `);

    if (!isUUID) {
      query = query
        .eq('number', id)
        .order('revision', { ascending: false })
        .limit(1);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.single();
    
    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
} 