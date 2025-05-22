import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Define the cookie name to match the frontend client
const AUTH_COOKIE_NAME = 'ostrich-auth-token';

console.log('The middleware is running');

export async function GET() {
  try {
    console.log('API Route: Starting GET /api/admin/users');
    
    // Create a Supabase client configured to use cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Log session state and cookies for debugging
    console.log('API Route: Session state:', {
      hasSession: !!session,
      userId: session?.user?.id,
      role: session?.user?.app_metadata?.role,
      claims: session?.user?.app_metadata?.claims,
      userMetadata: session?.user?.user_metadata,
      error: sessionError?.message,
      cookies: cookieStore.getAll().map(c => ({
        name: c.name,
        value: c.value.substring(0, 10) + '...'
      })),
      cookieName: process.env.NEXT_PUBLIC_SUPABASE_AUTH_COOKIE_NAME,
      accessToken: session?.access_token ? 'present' : 'missing',
      refreshToken: session?.refresh_token ? 'present' : 'missing',
      jwtClaims: session?.access_token ? JSON.parse(atob(session.access_token.split('.')[1])) : null
    });

    if (!session) {
      console.log('API Route: No session found, returning 401');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin - check all possible role locations
    const isAdmin = 
      session.user.app_metadata?.role === 'admin' ||
      session.user.app_metadata?.claims?.role === 'admin' ||
      session.user.user_metadata?.role === 'admin' ||
      session.user.user_metadata?.app_metadata?.role === 'admin';

    console.log('API Route: Admin check:', {
      isAdmin,
      appMetadataRole: session.user.app_metadata?.role,
      appMetadataClaimsRole: session.user.app_metadata?.claims?.role,
      userMetadataRole: session.user.user_metadata?.role,
      userMetadataAppMetadataRole: session.user.user_metadata?.app_metadata?.role
    });

    if (!isAdmin) {
      console.log('API Route: User is not admin, returning 403');
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('API Route: Calling get_users RPC function');
      // Use the get_users function to fetch users
      const { data: users, error: usersError } = await supabase
        .rpc('get_users');

      if (usersError) {
        console.error('API Route: Error fetching users:', {
          error: usersError,
          message: usersError.message,
          details: usersError.details,
          hint: usersError.hint,
          code: usersError.code
        });
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to fetch users',
            details: usersError.message 
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Log the number of users found
      console.log('API Route: Successfully fetched users:', { 
        count: users?.length,
        firstUser: users?.[0] ? {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role,
          appMetadata: users[0].raw_app_meta_data,
          userMetadata: users[0].raw_user_meta_data
        } : null
      });

      return new NextResponse(
        JSON.stringify({ users }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (queryError) {
      console.error('API Route: Error in users query:', {
        error: queryError,
        message: queryError instanceof Error ? queryError.message : 'Unknown error',
        stack: queryError instanceof Error ? queryError.stack : undefined
      });
      return new NextResponse(
        JSON.stringify({ 
          error: 'Error querying users',
          details: queryError instanceof Error ? queryError.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('API Route: Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Add POST endpoint for creating users
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.app_metadata?.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, role, metadata } = await request.json();

    const { data: userId, error } = await supabase
      .rpc('create_user', {
        email,
        password,
        role: role || 'unassigned',
        metadata: metadata || {}
      });

    if (error) {
      console.error('API Route: Error creating user:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create user', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ userId }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API Route: Error in POST:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Add PATCH endpoint for updating user roles
export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.app_metadata?.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { userId, role } = await request.json();

    const { error } = await supabase
      .rpc('update_user_role', {
        user_id: userId,
        new_role: role
      });

    if (error) {
      console.error('API Route: Error updating user role:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update user role', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API Route: Error in PATCH:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 