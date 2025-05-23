import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('Fetching design fee scale...');
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('design_fee_scale')
      .select('*')
      .order('construction_cost', { ascending: true });

    if (error) {
      console.error('Error fetching design fee scale:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Design fee scale data:', data);
    if (!data || data.length === 0) {
      console.warn('No design fee scale data found in database');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching design fee scale:', error);
    return NextResponse.json({ error: 'Failed to fetch design fee scale' }, { status: 500 });
  }
} 