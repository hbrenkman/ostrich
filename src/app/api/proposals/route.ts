import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

// GET /api/proposals
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('project_id', projectId)
      .order('proposal_number', { ascending: true })
      .order('revision_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching proposals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

// POST /api/proposals
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const data = await request.json();

    // Validate required fields
    if (!data.project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!data.status_id) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Generate a new proposal number if not provided
    if (!data.proposal_number) {
      // Get the last proposal number
      const { data: lastProposal, error: lastProposalError } = await supabase
        .from('proposals')
        .select('proposal_number')
        .order('proposal_number', { ascending: false })
        .limit(1)
        .single();

      if (lastProposalError && lastProposalError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching last proposal number:', lastProposalError);
        return NextResponse.json({ error: 'Failed to generate proposal number' }, { status: 500 });
      }

      // Start with 1 if no proposals exist, otherwise increment the last number
      const lastNumber = lastProposal?.proposal_number || 0;
      data.proposal_number = lastNumber + 1;
    }

    // Prepare the insert data
    const insertData = {
      project_id: data.project_id,
      proposal_number: data.proposal_number,
      revision_number: data.revision_number || 1,
      is_temporary_revision: data.is_temporary_revision ?? true,
      status_id: data.status_id,
      contacts: data.contacts || [],
      description: data.description,
      project_data: data.project_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: data.created_by,
      updated_by: data.updated_by
    };

    const { data: result, error } = await supabase
      .from('proposals')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating proposal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
} 