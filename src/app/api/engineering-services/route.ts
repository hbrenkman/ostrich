import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface EngineeringService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  estimated_fee: string | null;
  default_setting: boolean;
}

export async function GET() {
  try {
    console.log('API: Starting engineering services query...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data: services, error } = await supabase
      .from('engineering_services')
      .select('*')
      .order('discipline', { ascending: true })
      .order('service_name', { ascending: true })
      .returns<EngineeringService[]>();

    console.log('API: Query completed. Error:', error);
    if (services && services.length > 0) {
      console.log('API: First service raw data:', services[0]);
    }

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!services || services.length === 0) {
      console.log('API: No data returned');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    return NextResponse.json(services);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 