import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
    SUPABASE_KEY: process.env.SUPABASE_KEY ? 'present' : 'missing',
    SUPABASE_URL: process.env.SUPABASE_URL,
    // Log all environment variables that start with SUPABASE
    allSupabaseVars: Object.keys(process.env)
      .filter(key => key.startsWith('SUPABASE'))
      .reduce((acc, key) => ({ ...acc, [key]: process.env[key] ? 'present' : 'missing' }), {})
  });
} 