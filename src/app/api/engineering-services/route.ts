import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface EngineeringService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  included_in_fee: boolean;
  phase: 'design' | 'construction';
  min_fee: number | null;
  rate: number | null;
}

interface RawServiceData {
  id: string;
  service_name: string;
  default_setting: boolean;
  phase: string | null;
}

interface ServiceData extends EngineeringService {
  type?: string;
  raw_value?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting query for engineering services...');
    
    // Use server-side Supabase client with service role key
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('engineering_standard_services')
      .select('*')
      .order('discipline', { ascending: true })
      .order('service_name', { ascending: true });

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('API: No engineering services found');
      return NextResponse.json({ services: [] });
    }

    console.log('API: Successfully fetched engineering services');
    return NextResponse.json({ services: data });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting POST request for engineering service...');
    
    const supabase = createSupabaseClient();
    
    // Get the request body
    const body = await request.json();
    console.log('API: Request body:', body);

    // Validate required fields
    const requiredFields = ['discipline', 'service_name', 'description'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('API: Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert the new service
    const { data, error } = await supabase
      .from('engineering_standard_services')
      .insert({
        discipline: body.discipline,
        service_name: body.service_name,
        description: body.description,
        included_in_fee: body.included_in_fee ?? false,
        phase: body.phase || 'design',
        min_fee: body.min_fee || null,
        rate: body.rate || null
      })
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully created engineering service');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('API: Starting DELETE request for engineering service...');
    
    const supabase = createSupabaseClient();
    
    // Get the service ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('id');
    
    if (!serviceId) {
      console.error('API: No service ID provided');
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Deleting service:', serviceId);

    // Delete the service
    const { error } = await supabase
      .from('engineering_standard_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully deleted engineering service');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('API: Starting PUT request for engineering service...');
    
    const supabase = createSupabaseClient();
    
    // Get the service ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('id');
    
    if (!serviceId) {
      console.error('API: No service ID provided');
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();
    console.log('API: Request body:', body);

    // Validate required fields
    const requiredFields = ['discipline', 'service_name', 'description'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('API: Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the service
    const { data, error } = await supabase
      .from('engineering_standard_services')
      .update({
        discipline: body.discipline,
        service_name: body.service_name,
        description: body.description,
        included_in_fee: body.included_in_fee ?? false,
        phase: body.phase || 'design',
        min_fee: body.min_fee || null,
        rate: body.rate || null
      })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully updated engineering service');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 