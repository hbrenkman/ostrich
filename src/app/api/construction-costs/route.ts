import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface ConstructionCost {
  id: string;
  building_type_id: string;
  year: number;
  cost_type: string;
  percentage: number | null;
  cost_per_sqft: number;
}

export async function GET() {
  try {
    console.log('API: Starting construction costs query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data: costs, error } = await supabase
      .from('construction_costs')
      .select(`
        id,
        building_type_id,
        year,
        cost_type,
        percentage,
        cost_per_sqft
      `)
      .order('year', { ascending: false })
      .returns<ConstructionCost[]>();

    console.log('API: Query completed. Error:', error);
    if (costs && costs.length > 0) {
      console.log('API: First cost raw data:', costs[0]);
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!costs || costs.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    return NextResponse.json(costs);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 