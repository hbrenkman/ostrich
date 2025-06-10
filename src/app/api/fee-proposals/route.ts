import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface Proposal {
  id: string;
  project_id: string;
  proposal_number: number;
  revision_number: number;
  is_temporary_revision: boolean;
  status_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  project_data: Record<string, any>;
  contacts: any[];
  status: {
    name: string;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    
    // Validate project_id
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Log the request parameters
    console.log('Fetching proposals with params:', { projectId, status });
    
    const supabase = createSupabaseClient();
    
    let query = supabase
      .from('proposals')
      .select(`
        *,
        status:proposal_statuses(name)
      `)
      .order('proposal_number', { ascending: true });
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    if (status) {
      query = query.eq('status.name', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error fetching proposals:', error);
      return NextResponse.json({ 
        error: 'Database error fetching proposals',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    // Log the query results
    console.log('Query results:', { 
      count: data?.length || 0,
      firstProposal: data?.[0] || null
    });
    
    // Transform the data to include status_name
    const transformedData = (data as Proposal[]).map(proposal => ({
      ...proposal,
      status_name: proposal.status?.name || 'Unknown'
    }));
    
    return NextResponse.json(transformedData);
  } catch (error) {
    // Log the full error object
    console.error('Unexpected error fetching proposals:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch proposals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const supabase = createSupabaseClient();
    
    if (!data.project_id || !data.status_id) {
      return NextResponse.json({ error: 'Project ID and status are required' }, { status: 400 });
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
      project_data: data.project_data || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: data.created_by,
      updated_by: data.updated_by
    };

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
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const supabase = createSupabaseClient();
    
    if (!data.id || !data.project_id || !data.status_id) {
      return NextResponse.json({ error: 'ID, project ID, and status are required' }, { status: 400 });
    }

    // Prepare the update data
    const updateData = {
      project_id: data.project_id,
      proposal_number: data.proposal_number,
      revision_number: data.revision_number,
      is_temporary_revision: data.is_temporary_revision,
      status_id: data.status_id,
      contacts: data.contacts,
      description: data.description,
      project_data: data.project_data,
      updated_at: new Date().toISOString(),
      updated_by: data.updated_by
    };

    // Update the proposal
    const { data: result, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating proposal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const supabase = createSupabaseClient();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);
    
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