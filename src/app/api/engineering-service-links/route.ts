import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('API: Starting query for engineering service links...');
    
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('engineering_service_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('API: No engineering service links found');
      return NextResponse.json({ links: [] });
    }

    console.log('API: Successfully fetched engineering service links:', data.length);
    return NextResponse.json({ links: data });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('API: Starting query for specific engineering service links...');
    
    const supabase = createSupabaseClient();
    const { standardServiceIds } = await request.json();

    if (!standardServiceIds || !Array.isArray(standardServiceIds)) {
      console.error('API: Invalid standardServiceIds:', standardServiceIds);
      return NextResponse.json(
        { error: 'standardServiceIds must be an array' },
        { status: 400 }
      );
    }

    console.log('API: Fetching service links for IDs:', standardServiceIds);
    const { data, error } = await supabase
      .from('engineering_service_links')
      .select('*')
      .in('engineering_service_id', standardServiceIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('API: No service links found for the provided IDs');
      return NextResponse.json({ links: [] });
    }

    console.log('API: Successfully fetched service links:', data.length);
    return NextResponse.json({ links: data });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('API: Starting delete request for engineering service link...');
    
    const supabase = createSupabaseClient();
    const { id } = await request.json();
    
    if (!id) {
      console.error('API: No link ID provided');
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Deleting service link:', id);
    const { error } = await supabase
      .from('engineering_service_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully deleted service link:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 