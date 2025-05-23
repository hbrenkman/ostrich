import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface DuplicateStructureRate {
  id: string;
  rate: number;
}

export async function GET() {
  try {
    console.log('=== Fetching duplicate structure rates ===');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('fee_duplicate_structures')
      .select('*')
      .order('id', { ascending: true })
      .returns<DuplicateStructureRate[]>();

    console.log('Raw result from database:', {
      error: error?.message,
      dataLength: data?.length
    });

    if (error) {
      console.error('Error fetching duplicate structure rates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error('No data returned from database');
      return NextResponse.json({ error: 'No data returned' }, { status: 404 });
    }

    // Log the successfully fetched rates
    console.log('Successfully fetched rates:', {
      count: data.length,
      rates: data.map(rate => ({
        id: rate.id,
        rate: rate.rate
      }))
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching duplicate structure rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicate structure rates' },
      { status: 500 }
    );
  }
} 