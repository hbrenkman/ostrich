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
    const supabase = createSupabaseClient();
    
    console.log('Fetching engineering services from Supabase...');
    
    // First, let's check the raw data with a direct query
    const { data: rawData, error: rawError } = await supabase
      .from('engineering_services')
      .select('id, service_name, default_setting')
      .order('discipline', { ascending: true })
      .order('service_name', { ascending: true });

    if (rawError) {
      console.error('Raw data query error:', rawError);
      return NextResponse.json({ error: rawError.message }, { status: 500 });
    }

    console.log('Raw data from Supabase (first 5 items):', rawData?.slice(0, 5).map(item => ({
      id: item.id,
      service_name: item.service_name,
      default_setting: item.default_setting,
      type: typeof item.default_setting,
      raw_value: JSON.stringify(item.default_setting)
    })));

    // Get the full data
    const { data, error } = await supabase
      .from('engineering_services')
      .select('id, service_name, default_setting, discipline, description, estimated_fee')
      .order('discipline', { ascending: true })
      .order('service_name', { ascending: true });

    if (error) {
      console.error('Full data query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('No engineering services found');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // Compare raw data with full data
    const comparison = rawData?.map(rawItem => {
      const fullItem = data.find(item => item.id === rawItem.id);
      return {
        id: rawItem.id,
        service_name: rawItem.service_name,
        raw_default_setting: rawItem.default_setting,
        raw_type: typeof rawItem.default_setting,
        full_default_setting: fullItem?.default_setting,
        full_type: typeof fullItem?.default_setting,
        match: rawItem.default_setting === fullItem?.default_setting
      };
    });

    // Prepare debugging information
    const debugInfo = {
      rawDataSample: rawData?.slice(0, 5).map(item => ({
        id: item.id,
        service_name: item.service_name,
        default_setting: item.default_setting,
        type: typeof item.default_setting,
        raw_value: JSON.stringify(item.default_setting)
      })),
      fullDataSample: data.slice(0, 5).map(item => ({
        id: item.id,
        service_name: item.service_name,
        default_setting: item.default_setting,
        type: typeof item.default_setting,
        raw_value: JSON.stringify(item.default_setting)
      })),
      comparison: comparison?.slice(0, 5)
    };

    // Process the services using the raw data values
    const services = data.map(service => {
      const rawService = rawData?.find(item => item.id === service.id);
      return {
        ...service,
        default_setting: Boolean(rawService?.default_setting ?? service.default_setting)
      };
    });

    // Return both the services and debug info
    return NextResponse.json({
      services,
      debug: debugInfo
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 