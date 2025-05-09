'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '../components/AuthProvider';
import { isPublicRoute } from '../utils/auth';

// Cache for auth check results
const authCheckCache = new Map<string, boolean>();

export function useAuth() {
  const context = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  useEffect(() => {
    if (!context.loading) {
      setIsChecking(false);
    }
  }, [context.loading]);

  useEffect(() => {
    if (isChecking || !pathname) return;

    console.log('Auth check - pathname:', pathname);
    console.log('Auth check - context user:', context.user);
    
    if (!isPublicRoute(pathname) && !context.user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/auth/login');
    } else if (context.user && pathname === '/auth/login') {
      console.log('Already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [context.user, pathname, router, isChecking]);

  return context;
}