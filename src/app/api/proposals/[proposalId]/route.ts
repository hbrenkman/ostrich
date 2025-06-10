import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

// GET /api/proposals/[proposalId]
export async function GET(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;
    const supabase = createSupabaseClient();
    
    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();
    
    if (error) {
      console.error('Error fetching proposal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 });
  }
}

// PUT /api/proposals/[proposalId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;
    const supabase = createSupabaseClient();
    const data = await request.json();
    
    // Add debug logging
    console.log('PUT request received data:', {
      proposalId,
      receivedData: data,
      contacts: data.clientContacts || data.contacts
    });
    
    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // Validate required fields
    if (!data.project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!data.status_id) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Prepare the update data
    const updateData = {
      project_id: data.project_id,
      proposal_number: data.proposal_number,
      revision_number: data.revision_number,
      is_temporary_revision: data.is_temporary_revision,
      status_id: data.status_id,
      contacts: data.clientContacts || data.contacts || [],
      description: data.description,
      project_data: data.project_data,
      updated_at: new Date().toISOString(),
      updated_by: data.updated_by
    };

    // Log the update data
    console.log('PUT update data being sent to database:', updateData);

    // Update the proposal
    const { data: result, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', proposalId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating proposal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the result
    console.log('PUT update result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

// POST /api/proposals/[proposalId] (for new proposals)
export async function POST(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;
    const supabase = createSupabaseClient();
    const data = await request.json();
    
    // Add debug logging
    console.log('POST request received data:', {
      proposalId,
      receivedData: data,
      contacts: data.clientContacts || data.contacts
    });
    
    if (proposalId !== 'new') {
      return NextResponse.json({ error: 'Invalid proposal ID for new proposal' }, { status: 400 });
    }

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
    } else {
      // Ensure proposal_number is a number
      const proposalNumber = Number(data.proposal_number);
      if (isNaN(proposalNumber) || !Number.isInteger(proposalNumber)) {
        return NextResponse.json({ error: 'Proposal number must be an integer' }, { status: 400 });
      }
      data.proposal_number = proposalNumber;
    }

    // Prepare the insert data
    const insertData = {
      project_id: data.project_id,
      proposal_number: data.proposal_number,
      revision_number: data.revision_number || 1,
      is_temporary_revision: data.is_temporary_revision ?? true,
      status_id: data.status_id,
      contacts: data.clientContacts || data.contacts || [],
      description: data.description,
      project_data: data.project_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: data.created_by,
      updated_by: data.updated_by
    };

    // Log the insert data
    console.log('POST insert data being sent to database:', insertData);

    // Insert the new proposal
    const { data: result, error } = await supabase
      .from('proposals')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating proposal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the result
    console.log('POST insert result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}

// DELETE /api/proposals/[proposalId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;
    const supabase = createSupabaseClient();
    
    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', proposalId);
    
    if (error) {
      console.error('Error deleting proposal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
  }
} 