import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('API: Starting building categories query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data: categories, error } = await supabase
      .from('building_categories')
      .select(`
        id,
        name,
        description
      `)
      .order('name');

    console.log('API: Query completed. Error:', error);
    if (categories && categories.length > 0) {
      console.log('API: First category raw data:', categories[0]);
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!categories || categories.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 