import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the current sequence value
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('project_number_sequence')
      .select('current_number')
      .single();

    if (sequenceError) {
      console.error('Error fetching project number sequence:', sequenceError);
      return NextResponse.json({ error: 'Failed to fetch project number sequence' }, { status: 500 });
    }

    // Get the next number without incrementing
    const { data: previewNumber, error: previewError } = await supabase
      .rpc('preview_next_project_number');

    if (previewError) {
      console.error('Error previewing next project number:', previewError);
      return NextResponse.json({ error: 'Failed to preview next project number' }, { status: 500 });
    }

    return NextResponse.json({
      current_number: sequenceData.current_number,
      next_number: previewNumber
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 