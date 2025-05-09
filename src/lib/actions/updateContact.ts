'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function updateContactLocation(contactId: string, locationId: string | null) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        location_id: locationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .select('id, first_name, last_name, email, mobile, direct_phone, location_id');

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No contact data returned after update');
    }

    return {
      success: true,
      contactId,
      locationId
    };
  } catch (error) {
    console.error('Error in updateContactLocation:', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
} 