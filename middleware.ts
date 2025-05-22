import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the cookie name to match the frontend client
const AUTH_COOKIE_NAME = 'ostrich-auth-token';

// Only log once when middleware is loaded
console.log('Middleware file is loaded (root directory)');

export async function middleware(req: NextRequest) {
  // Create a response object that we can modify
  const res = NextResponse.next();
  
  // Log all cookies for debugging
  const allCookies = req.cookies.getAll();
  const authCookie = req.cookies.get(AUTH_COOKIE_NAME);
  
  // Parse the auth cookie if it exists
  let parsedCookie = null;
  if (authCookie?.value) {
    try {
      parsedCookie = JSON.parse(decodeURIComponent(authCookie.value));
      console.log('Middleware: Auth cookie details:', {
        name: AUTH_COOKIE_NAME,
        value: 'present',
        parsedValue: {
          access_token: parsedCookie.access_token ? 'present' : 'missing',
          refresh_token: parsedCookie.refresh_token ? 'present' : 'missing',
          user: parsedCookie.user ? {
            id: parsedCookie.user.id,
            role: parsedCookie.user.app_metadata?.role || 
                  parsedCookie.user.app_metadata?.claims?.role ||
                  parsedCookie.user.user_metadata?.app_metadata?.role ||
                  parsedCookie.user.user_metadata?.role
          } : null
        }
      });
    } catch (e) {
      console.error('Error parsing auth cookie:', e);
    }
  } else {
    console.log('Middleware: Auth cookie details:', {
      name: AUTH_COOKIE_NAME,
      value: 'missing'
    });
  }

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient(
    { req, res },
    {
      cookieOptions: {
        name: AUTH_COOKIE_NAME,
        path: '/',
        domain: req.headers.get('host')?.split(':')[0] || undefined,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  );

  // If we have a parsed cookie with session data, set it in the client
  if (parsedCookie?.access_token && parsedCookie?.refresh_token) {
    try {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: parsedCookie.access_token,
        refresh_token: parsedCookie.refresh_token
      });
      
      if (setSessionError) {
        console.error('Error setting session from cookie:', setSessionError);
      } else {
        console.log('Successfully set session from cookie');
      }
    } catch (e) {
      console.error('Error setting session:', e);
    }
  }

  // Refresh the session if it exists
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  // Log session state in a concise format
  console.log(`Middleware: Session state for ${req.nextUrl.pathname}:`, {
    hasSession: !!session,
    userId: session?.user?.id,
    role: session?.user?.app_metadata?.role || 
          session?.user?.app_metadata?.claims?.role ||
          session?.user?.user_metadata?.app_metadata?.role ||
          session?.user?.user_metadata?.role,
    cookieName: AUTH_COOKIE_NAME,
    cookieValue: authCookie?.value ? 'present' : 'missing',
    sessionError: sessionError?.message,
    accessToken: session?.access_token ? 'present' : 'missing',
    refreshToken: session?.refresh_token ? 'present' : 'missing',
    headers: {
      host: req.headers.get('host'),
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer')
    },
    responseCookies: res.cookies.getAll().map(c => c.name)
  });

  // Handle auth routes
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    if (session) {
      console.log(`Middleware: User is authenticated, redirecting from ${req.nextUrl.pathname} to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res;
  }

  // Handle protected routes
  if (req.nextUrl.pathname.startsWith('/admin/') || req.nextUrl.pathname.startsWith('/api/admin/')) {
    if (!session) {
      console.log(`Middleware: No session, redirecting to login from ${req.nextUrl.pathname}`);
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const role = session.user.app_metadata?.role || 
                 session.user.app_metadata?.claims?.role ||
                 session.user.user_metadata?.app_metadata?.role ||
                 session.user.user_metadata?.role ||
                 'user';

    console.log(`Middleware: Role check for ${req.nextUrl.pathname}:`, {
      role,
      requiredRole: 'admin',
      hasAccess: role === 'admin',
      parsedCookieRole: parsedCookie?.user?.app_metadata?.role || 
                       parsedCookie?.user?.app_metadata?.claims?.role ||
                       parsedCookie?.user?.user_metadata?.app_metadata?.role ||
                       parsedCookie?.user?.user_metadata?.role
    });

    if (req.nextUrl.pathname.startsWith('/admin/') && role !== 'admin') {
      console.log(`Middleware: Insufficient role (${role}), redirecting to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Return the response with any modified cookies
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|auth/login|auth/reset-password).*)',
  ],
}; 