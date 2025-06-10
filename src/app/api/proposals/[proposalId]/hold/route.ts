import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;
    const supabase = createSupabaseClient();
    
    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // First get the On Hold status ID
    const { data: statusData, error: statusError } = await supabase
      .from('proposal_statuses')
      .select('id')
      .eq('name', 'On Hold')
      .single();

    if (statusError || !statusData) {
      console.error('Error fetching On Hold status:', statusError);
      return NextResponse.json({ error: 'Failed to get On Hold status' }, { status: 500 });
    }
    
    const { data, error } = await supabase
      .from('proposals')
      .update({ status_id: statusData.id })
      .eq('id', proposalId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating proposal status to on hold:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating proposal status to on hold:', error);
    return NextResponse.json({ error: 'Failed to update proposal status' }, { status: 500 });
  }
} 