import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface ProposalStatus {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting query for proposal statuses...');
    
    const supabase = createSupabaseClient();
    
    const { data: statuses, error: dbError } = await supabase
      .from('proposal_statuses')
      .select('*')
      .order('id');

    if (dbError) {
      console.error('Database error in proposal-statuses:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      });
      return NextResponse.json({ 
        error: 'Failed to fetch proposal statuses',
        details: dbError.message
      }, { status: 500 });
    }

    if (!statuses || statuses.length === 0) {
      console.warn('No proposal statuses found in the database');
      return NextResponse.json({ error: 'No proposal statuses found' }, { status: 404 });
    }

    console.log('Successfully fetched proposal statuses:', statuses.length);
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Unexpected error in proposal-statuses:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 