import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // Get the latest proposal number
    const { data: proposals, error } = await supabase
      .from('proposals')
      .select('proposal_number')
      .order('proposal_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest proposal number:', error);
      return NextResponse.json({ error: 'Failed to fetch latest proposal number' }, { status: 500 });
    }

    // Start with 1 if no proposals exist, otherwise increment the last number
    const nextNumber = proposals && proposals.length > 0 ? proposals[0].proposal_number + 1 : 1;

    // Return both the raw number and the padded version for display
    return NextResponse.json({ 
      next_number: nextNumber,
      display_number: nextNumber.toString().padStart(3, '0')
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate proposal number' }, { status: 500 });
  }
} 