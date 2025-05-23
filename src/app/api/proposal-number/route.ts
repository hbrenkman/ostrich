import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseClient();
    
    // Get the latest proposal number for this project
    const { data: proposals, error } = await supabase
      .from('fee_proposals')
      .select('number')
      .eq('project_id', projectId)
      .order('number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest proposal number:', error);
      return NextResponse.json({ error: 'Failed to fetch latest proposal number' }, { status: 500 });
    }

    // If no proposals exist yet, start with 001
    let nextNumber = '001';
    
    if (proposals && proposals.length > 0) {
      // Extract the numeric part and increment
      const lastNumber = parseInt(proposals[0].number);
      if (!isNaN(lastNumber)) {
        nextNumber = (lastNumber + 1).toString().padStart(3, '0');
      }
    }

    return NextResponse.json({ next_number: nextNumber });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 