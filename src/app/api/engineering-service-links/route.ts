import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('Fetching engineering service links...');
    const { data, error } = await supabase
      .from('engineering_service_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service links:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Service links fetched:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/engineering-service-links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service links' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient();
    const body = await request.json();
    
    console.log('Creating service link:', body);
    const { data, error } = await supabase
      .from('engineering_service_links')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating service link:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Service link created:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/engineering-service-links:', error);
    return NextResponse.json(
      { error: 'Failed to create service link' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseClient();
    const { id } = await request.json();
    
    console.log('Deleting service link:', id);
    const { error } = await supabase
      .from('engineering_service_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service link:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Service link deleted:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/engineering-service-links:', error);
    return NextResponse.json(
      { error: 'Failed to delete service link' },
      { status: 500 }
    );
  }
} 