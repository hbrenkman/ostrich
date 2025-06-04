import { NextRequest, NextResponse } from 'next/server';
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

    console.log('Design fee scale data structure:', {
      rowCount: data?.length,
      sampleRow: data?.[0] ? {
        id: data[0].id,
        construction_cost: data[0].construction_cost,
        prime_consultant_rate: data[0].prime_consultant_rate,
        fraction_rates: {
          mechanical: data[0].fraction_of_prime_rate_mechanical,
          plumbing: data[0].fraction_of_prime_rate_plumbing,
          electrical: data[0].fraction_of_prime_rate_electrical,
          structural: data[0].fraction_of_prime_rate_structural
        }
      } : null,
      allRows: data?.map(row => ({
        id: row.id,
        construction_cost: row.construction_cost,
        prime_consultant_rate: row.prime_consultant_rate
      }))
    });

    if (!data || data.length === 0) {
      console.warn('No design fee scale data found in database');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching design fee scale:', error);
    return NextResponse.json({ error: 'Failed to fetch design fee scale' }, { status: 500 });
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