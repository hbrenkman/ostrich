import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Define the cookie name to match the middleware
const AUTH_COOKIE_NAME = 'ostrich-auth-token';

// Initialize the public Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;  // Always use anon key for client-side operations

// Add detailed debug logging for public client
console.log('Supabase Public Environment Variables (Detailed):', {
  environment: process.env.NODE_ENV,
  url: {
    value: supabaseUrl,
    type: typeof supabaseUrl,
    length: supabaseUrl?.length
  },
  key: {
    value: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'missing',
    type: typeof supabaseKey,
    length: supabaseKey?.length,
    isAnonKey: supabaseKey?.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') // Check if it's a JWT
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', {
    url: supabaseUrl,
    key: supabaseKey ? 'present' : 'missing',
    environment: process.env.NODE_ENV
  });
  throw new Error('Missing required Supabase credentials. Please check your .env.local file.');
}

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: AUTH_COOKIE_NAME,
      flowType: 'pkce',
      debug: true,
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${key}=`))
            ?.split('=')[1];
          console.log('Storage getItem:', { key, value: value ? 'present' : 'missing' });
          return value ? decodeURIComponent(value) : null;
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          const cookieValue = `${key}=${encodeURIComponent(value)}; path=/; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
          document.cookie = cookieValue;
          console.log('Storage setItem:', { key, value: 'present', cookieValue });
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          console.log('Storage removeItem:', { key });
        }
      }
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'ostrich'
      }
    }
  }
);

// Add debug listener for auth state changes with more detailed logging
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    const cookies = typeof document !== 'undefined' 
      ? document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      : {};

    console.log('Auth state changed:', {
      event,
      hasSession: !!session,
      userId: session?.user?.id,
      role: session?.user?.app_metadata?.role,
      cookieName: AUTH_COOKIE_NAME,
      cookieValue: cookies[AUTH_COOKIE_NAME] ? 'present' : 'missing',
      allCookies: Object.keys(cookies),
      accessToken: session?.access_token ? 'present' : 'missing',
      refreshToken: session?.refresh_token ? 'present' : 'missing',
      expiresAt: session?.expires_at,
      expiresIn: session?.expires_in,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.app_metadata?.role,
        metadata: session.user.user_metadata
      } : null
    });
  });
}