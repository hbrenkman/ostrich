import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Only log once when middleware is loaded
console.log('Middleware file is loaded (root directory)');

export async function middleware(req: NextRequest) {
  // Create a response object that we can modify
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Log session state in a concise format
  console.log(`Middleware: Session state for ${req.nextUrl.pathname}:`, {
    hasSession: !!session,
    userId: session?.user?.id,
    role: session?.user?.app_metadata?.role || 
          session?.user?.app_metadata?.claims?.role ||
          session?.user?.user_metadata?.app_metadata?.role ||
          session?.user?.user_metadata?.role,
    sessionError: sessionError?.message,
    accessToken: session?.access_token ? 'present' : 'missing',
    refreshToken: session?.refresh_token ? 'present' : 'missing',
    headers: {
      host: req.headers.get('host'),
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer')
    },
    requestCookies: req.cookies.getAll().map(c => c.name),
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
  if (req.nextUrl.pathname.startsWith('/admin/') || 
      req.nextUrl.pathname.startsWith('/api/admin/') ||
      req.nextUrl.pathname.startsWith('/api/proposals/')) {
    if (!session) {
      console.log(`Middleware: No session, redirecting to login from ${req.nextUrl.pathname}`);
      // For API routes, return 401
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
      hasAccess: role === 'admin'
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