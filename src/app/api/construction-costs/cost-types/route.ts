import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('API: Starting cost types query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data: costTypes, error } = await supabase
      .from('construction_cost_types')
      .select(`
        id,
        name,
        description
      `)
      .order('name');

    console.log('API: Query completed. Error:', error);
    if (costTypes && costTypes.length > 0) {
      console.log('API: First cost type raw data:', costTypes[0]);
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!costTypes || costTypes.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    return NextResponse.json(costTypes);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 