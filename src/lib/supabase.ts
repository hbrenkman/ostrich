import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Initialize the public Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Add detailed debug logging for public client
console.log('Supabase Public Environment Variables (Detailed):', {
  url: {
    value: supabaseUrl,
    type: typeof supabaseUrl,
    length: supabaseUrl?.length
  },
  anonKey: {
    value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'missing',
    type: typeof supabaseAnonKey,
    length: supabaseAnonKey?.length
  }
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase public credentials:', {
    url: supabaseUrl,
    anonKey: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error('Missing required Supabase public credentials. Please check your .env.local file.');
}

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ostrich-auth-token',
      flowType: 'pkce',
      debug: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'ostrich'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Add debug listener for auth state changes
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  console.log('Auth state changed:', event);
  console.log('Session:', session);
  if (session?.user) {
    console.log('User metadata:', session.user.user_metadata);
    console.log('App metadata:', session.user.app_metadata);
    console.log('Role from JWT:', session.user.role);
  }
});