import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface ConstructionIndex {
  id: string;
  index_value: number;
  metro_area: {
    id: string;
    name: string;
    is_other: boolean;
    state: {
      id: string;
      name: string;
    };
  };
}

interface MetroData {
  name: string;
  index: number;
}

interface StateData {
  state: string;
  metros: MetroData[];
}

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    // Query starting from construction_index to ensure we get all indices
    const { data, error } = await supabase
      .from('construction_index')
      .select(`
        id,
        index_value,
        metro_area:metro_areas!inner (
          id,
          name,
          is_other,
          state:states!inner (
            id,
            name
          )
        )
      `)
      .order('index_value', { ascending: true });

    console.log('API: Query completed. Error:', error);
    if (data && data.length > 0) {
      const firstIndex = data[0] as unknown as ConstructionIndex;
      console.log('API: First index raw data:', {
        index: firstIndex.index_value,
        metro: firstIndex.metro_area.name,
        state: firstIndex.metro_area.state.name
      });
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // Group by state
    const stateMap = new Map<string, StateData>();
    
    (data as unknown as ConstructionIndex[]).forEach(index => {
      const stateName = index.metro_area.state.name;
      const metroName = index.metro_area.name;
      
      if (!stateMap.has(stateName)) {
        stateMap.set(stateName, {
          state: stateName,
          metros: []
        });
      }

      const stateData = stateMap.get(stateName)!;
      stateData.metros.push({
        name: metroName,
        index: index.index_value
      });
    });

    // Convert map to array and sort
    const result = Array.from(stateMap.values())
      .sort((a: StateData, b: StateData) => a.state.localeCompare(b.state))
      .map(state => ({
        ...state,
        metros: state.metros.sort((a: MetroData, b: MetroData) => {
          // Sort 'Other' metros to the end
          if (a.name === 'Other') return 1;
          if (b.name === 'Other') return -1;
          return a.name.localeCompare(b.name);
        })
      }));

    console.log('API: First state transformed:', {
      state: result[0]?.state,
      metroCount: result[0]?.metros.length,
      firstMetro: result[0]?.metros[0] || null
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}