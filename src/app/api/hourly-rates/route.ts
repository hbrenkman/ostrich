import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';

interface HourlyRate {
  id: number;
  discipline_id: number;
  role_id: string;
  role_designation: string | null;
  rate: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseResult<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export async function GET() {
  try {
    console.log('API: Starting hourly rates query...');
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('hourly_rates')
      .select('*')
      .order('discipline_id', { ascending: true })
      .order('role_id', { ascending: true });

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully fetched hourly rates');
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting POST request for hourly rate...');
    const supabase = createSupabaseClient();
    
    // Get the request body
    const body = await request.json();
    console.log('API: Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const requiredFields = ['discipline_id', 'role_id', 'rate'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('API: Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate rate is a positive number
    if (typeof body.rate !== 'number' || body.rate < 0) {
      console.error('API: Invalid rate value:', body.rate);
      return NextResponse.json(
        { error: 'Rate must be a positive number' },
        { status: 400 }
      );
    }

    // Log the designation value for debugging
    console.log('API: Role designation value:', {
      value: body.role_designation,
      type: typeof body.role_designation,
      isNull: body.role_designation === null,
      isUndefined: body.role_designation === undefined,
      isString: typeof body.role_designation === 'string',
      isEmptyString: body.role_designation === ''
    });

    // Check if rate already exists for this discipline, role, and designation combination
    const { data: existingRate, error: existingRateError } = await supabase
      .from('hourly_rates')
      .select('id')
      .eq('discipline_id', body.discipline_id)
      .eq('role_id', body.role_id)
      .eq('role_designation', body.role_designation || null)
      .single();

    if (existingRateError && existingRateError.code !== 'PGRST116') {
      console.error('API: Error checking for existing rate:', existingRateError);
      return NextResponse.json({ error: existingRateError.message }, { status: 500 });
    }

    if (existingRate) {
      console.error('API: Rate already exists for this combination:', {
        discipline_id: body.discipline_id,
        role_id: body.role_id,
        role_designation: body.role_designation
      });
      return NextResponse.json(
        { error: 'A rate already exists for this discipline, role, and designation combination' },
        { status: 400 }
      );
    }

    // Insert the new rate
    const { data, error } = await supabase
      .from('hourly_rates')
      .insert({
        discipline_id: body.discipline_id,
        role_id: body.role_id,
        role_designation: body.role_designation || null,
        rate: body.rate,
        description: body.description || null
      })
      .select()
      .single();

    if (error) {
      console.error('API Error during insert:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully created hourly rate:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('API: Starting PUT request for hourly rate...');
    const supabase = createSupabaseClient();
    
    // Get the hourly rate ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const hourlyRateId = searchParams.get('id');
    
    if (!hourlyRateId) {
      console.error('API: No hourly rate ID provided');
      return NextResponse.json(
        { error: 'Hourly rate ID is required' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();
    console.log('API: Request body:', body);

    // Validate required fields
    const requiredFields = ['discipline_id', 'role_id', 'rate'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('API: Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate rate is a positive number
    if (typeof body.rate !== 'number' || body.rate < 0) {
      console.error('API: Invalid rate value');
      return NextResponse.json(
        { error: 'Rate must be a positive number' },
        { status: 400 }
      );
    }

    // Check if another rate exists with the same designation (excluding current rate)
    const { data: existingRate } = await supabase
      .from('hourly_rates')
      .select('id')
      .eq('discipline_id', body.discipline_id)
      .eq('role_id', body.role_id)
      .eq('role_designation', body.role_designation || null)
      .neq('id', hourlyRateId)
      .single();

    if (existingRate) {
      console.error('API: Another rate exists for this discipline, role, and designation');
      return NextResponse.json(
        { error: 'Another rate exists for this discipline, role, and designation combination' },
        { status: 400 }
      );
    }

    // Update the rate
    const { data, error } = await supabase
      .from('hourly_rates')
      .update({
        discipline_id: body.discipline_id,
        role_id: body.role_id,
        role_designation: body.role_designation || null,
        rate: body.rate,
        description: body.description || null
      })
      .eq('id', hourlyRateId)
      .select()
      .single();

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully updated hourly rate');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('API: Starting DELETE request for hourly rate...');
    const supabase = createSupabaseClient();
    
    // Get the hourly rate ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const hourlyRateId = searchParams.get('id');
    
    if (!hourlyRateId) {
      console.error('API: No hourly rate ID provided');
      return NextResponse.json(
        { error: 'Hourly rate ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('hourly_rates')
      .delete()
      .eq('id', hourlyRateId);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Successfully deleted hourly rate');
    return NextResponse.json({ message: 'Hourly rate deleted successfully' });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 