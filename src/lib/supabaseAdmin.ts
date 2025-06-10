import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize the admin Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase admin credentials. Please check your .env.local file.');
}

const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'ostrich-admin'
      }
    },
    // Disable query logging
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

export { supabaseAdmin };