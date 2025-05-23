import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface ProjectConstructionType {
  id: number;
  project_type: string;
  definition: string;
  description: string;
  relative_cost_index: number;
  created_at: string;
}

export async function GET() {
  try {
    console.log('API: Starting project construction types query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data: constructionTypes, error } = await supabase
      .from('project_construction_types')
      .select('*')
      .order('project_type')
      .returns<ProjectConstructionType[]>();

    console.log('API: Query completed. Error:', error);
    if (constructionTypes && constructionTypes.length > 0) {
      console.log('API: First construction type raw data:', constructionTypes[0]);
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!constructionTypes || constructionTypes.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    return NextResponse.json(constructionTypes);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 