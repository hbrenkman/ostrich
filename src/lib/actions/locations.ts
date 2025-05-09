import { supabase } from '@/lib/supabase';

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
  const { data, error } = await supabase
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

  if (error) throw error;
  return data;
}

export async function deleteLocation(locationId: string) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId);

  if (error) throw error;
  return true;
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
  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
} 