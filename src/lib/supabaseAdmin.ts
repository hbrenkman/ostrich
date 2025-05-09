import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize the admin Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Add detailed debug logging for admin client
console.log('Supabase Admin Environment Variables (Detailed):', {
  url: {
    value: supabaseUrl,
    type: typeof supabaseUrl,
    length: supabaseUrl?.length
  },
  serviceRoleKey: {
    value: supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 10)}...` : 'missing',
    type: typeof supabaseServiceRoleKey,
    length: supabaseServiceRoleKey?.length
  }
});

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase admin credentials:', {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey ? 'present' : 'missing'
  });
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
    }
  }
);

// Log client creation
console.log('Supabase Admin Client Created:', {
  hasFrom: typeof supabaseAdmin.from === 'function',
  hasAuth: typeof supabaseAdmin.auth === 'object',
  hasRpc: typeof supabaseAdmin.rpc === 'function'
});

export { supabaseAdmin };