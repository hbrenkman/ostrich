'use server';

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function createLocation(location: {
  name: string;
  company_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  location_type_id: string;
  is_headquarters: boolean;
  status: string;
  phone?: string;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert({
        name: location.name,
        company_id: location.company_id,
        address_line1: location.address_line1,
        address_line2: location.address_line2,
        city: location.city,
        state: location.state,
        zip: location.zip,
        location_type_id: location.location_type_id,
        is_headquarters: location.is_headquarters,
        status: location.status,
        phone: location.phone
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createLocation:', error);
    throw error;
  }
}

export async function deleteLocation(locationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('locations')
      .delete()
      .eq('id', locationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in deleteLocation:', error);
    throw error;
  }
}

export async function updateLocation(locationId: string, updates: {
  name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  location_type_id?: string;
  is_headquarters?: boolean;
  status?: string;
  phone?: string;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(updates)
      .eq('id', locationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updateLocation:', error);
    throw error;
  }
} 