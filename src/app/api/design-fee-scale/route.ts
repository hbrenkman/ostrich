import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import type { fee_scale } from '@/types/proposal/base';

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

    // Log the raw data from the database
    console.log('Raw fee scale data from database:', data);

    // Return the data as is, since it already matches our fee_scale interface
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching design fee scale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('API: Starting PUT request for design fee scale...');
    
    const supabase = createSupabaseClient();
    
    // Get the request body
    const body = await request.json();
    console.log('API: Request body:', body);

    // Validate required fields
    if (!body.id || body.prime_consultant_rate === undefined) {
      console.error('API: Missing required fields');
      return NextResponse.json(
        { error: 'ID and prime_consultant_rate are required' },
        { status: 400 }
      );
    }

    // Update the fee scale entry
    const { data, error } = await supabase
      .from('design_fee_scale')
      .update({
        prime_consultant_rate: Number(body.prime_consultant_rate)
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully updated design fee scale');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 