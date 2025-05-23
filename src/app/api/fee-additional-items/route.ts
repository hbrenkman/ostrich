import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('Fetching additional fee items from database...');
    const { data, error } = await supabase
      .from('fee_additional_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching additional fee items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Raw data from database:', data);
    console.log('Number of items fetched:', data.length);
    console.log('Item details:', data.map(item => ({
      id: item.id,
      name: item.name,
      phase: item.phase,
      is_active: item.is_active
    })));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching additional fee items:', error);
    return NextResponse.json({ error: 'Failed to fetch additional fee items' }, { status: 500 });
  }
} 