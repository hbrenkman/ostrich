import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Initialize the public Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase credentials. Please check your .env.local file.');
}

// Create a single supabase client for the entire app
export const supabase = createClientComponentClient<Database>({
  supabaseUrl,
  supabaseKey,
  options: {
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
});

// Simplified auth state change logging
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      console.log(`Auth: ${event}`, {
        userId: session?.user?.id,
        role: session?.user?.app_metadata?.role
      });
    }
  });
}