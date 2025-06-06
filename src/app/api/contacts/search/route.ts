import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('API: Starting contact search with query:', query);
    
    const supabase = createSupabaseClient();
    
    // Build the search query
    let searchQuery = supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        mobile,
        direct_phone,
        status,
        role:roles(name),
        location:locations(
          id,
          name,
          address_line1,
          address_line2,
          city,
          state,
          zip,
          phone,
          is_headquarters,
          company:companies(
            id,
            name,
            industry,
            status
          )
        )
      `)
      .eq('status', 'Active')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
      .limit(limit);

    // If we have a search query, add the search conditions
    if (query) {
      const searchTerm = `%${query}%`;
      searchQuery = searchQuery.or(`
        first_name.ilike.${searchTerm},
        last_name.ilike.${searchTerm},
        email.ilike.${searchTerm},
        mobile.ilike.${searchTerm},
        direct_phone.ilike.${searchTerm},
        location.name.ilike.${searchTerm},
        location.city.ilike.${searchTerm},
        location.state.ilike.${searchTerm},
        location.company.name.ilike.${searchTerm}
      `);
    }

    const { data, error } = await searchQuery;

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('API: No contacts found');
      return NextResponse.json({ contacts: [] });
    }

    console.log('API: Successfully found contacts:', data.length);
    return NextResponse.json({ contacts: data });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 