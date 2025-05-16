import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface BuildingType {
  id: string;
  category_id: string;
  name: string;
  height: string | null;
  description: string | null;
}

export async function GET() {
  try {
    console.log('API: Starting building types query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data: buildingTypes, error } = await supabase
      .from('building_types')
      .select(`
        id,
        category_id,
        name,
        height,
        description
      `)
      .order('name')
      .returns<BuildingType[]>();

    console.log('API: Query completed. Error:', error);
    if (buildingTypes && buildingTypes.length > 0) {
      console.log('API: First building type raw data:', buildingTypes[0]);
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!buildingTypes || buildingTypes.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    return NextResponse.json(buildingTypes);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 