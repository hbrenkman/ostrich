import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    console.log('Fetching additional fee items from database...');
    const { data, error } = await supabase
      .from('engineering_additional_services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching additional fee items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Raw data from database:', data);
    console.log('Number of items fetched:', data.length);
    console.log('Item details:', data.map(item => ({
      id: item.id,
      name: item.name,
      phase: item.phase,
      is_active: item.is_active
    })));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching additional fee items:', error);
    return NextResponse.json({ error: 'Failed to fetch additional fee items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting POST request for additional service...');
    
    const supabase = createSupabaseClient();
    
    // Get the request body
    const body = await request.json();
    console.log('API: Raw request body:', body);
    console.log('API: Rate field type:', typeof body.rate, 'Rate value:', body.rate);

    // Validate required fields
    const requiredFields = ['name', 'default_min_value', 'rate', 'is_active'];
    const missingFields = requiredFields.filter(field => {
      const value = body[field];
      console.log(`API: Checking field ${field}:`, { value, type: typeof value });
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.error('API: Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert the new service
    const insertData = {
      name: body.name,
      description: body.description || null,
      discipline: body.discipline || null,
      phase: body.phase || 'design',
      default_min_value: Number(body.default_min_value),
      rate: Number(body.rate),
      is_active: body.is_active
    };
    console.log('API: Data being inserted:', insertData);

    const { data, error } = await supabase
      .from('engineering_additional_services')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully created additional service');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('API: Starting DELETE request for additional service...');
    
    const supabase = createSupabaseClient();
    
    // Get the service ID from the URL
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('id');
    
    if (!serviceId) {
      console.error('API: No service ID provided');
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    console.log('API: Deleting service with ID:', serviceId);

    // Delete the service
    const { error } = await supabase
      .from('engineering_additional_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully deleted additional service');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('API: Starting PUT request for additional service...');
    
    const supabase = createSupabaseClient();
    
    // Get the service ID from the URL
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('id');
    
    if (!serviceId) {
      console.error('API: No service ID provided');
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Get the request body
    const body = await request.json();
    console.log('API: Raw request body:', body);

    // Validate required fields
    const requiredFields = ['name', 'default_min_value', 'rate', 'is_active'];
    const missingFields = requiredFields.filter(field => {
      const value = body[field];
      console.log(`API: Checking field ${field}:`, { value, type: typeof value });
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.error('API: Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the service
    const updateData = {
      name: body.name,
      description: body.description || null,
      discipline: body.discipline,
      phase: body.phase || 'design',
      default_min_value: Number(body.default_min_value),
      rate: Number(body.rate),
      is_active: body.is_active
    };
    console.log('API: Data being updated:', updateData);

    const { data, error } = await supabase
      .from('engineering_additional_services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully updated additional service');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 