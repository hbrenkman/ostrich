'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '../components/AuthProvider';
import { isPublicRoute, getStoredUser } from '../utils/auth';

export function useAuth() {
  const context = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [storedUser, setStoredUser] = useState(getStoredUser());
  
  // Refresh stored user on mount
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  useEffect(() => {
    console.log('Auth check - pathname:', pathname);
    console.log('Auth check - context user:', context.user);
    console.log('Auth check - stored user:', storedUser);
    
    // Check both context user and stored user
    const isAuthenticated = context.user || storedUser;
    
    if (!isPublicRoute(pathname) && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push('/auth/login');
    } else if (isAuthenticated && pathname === '/auth/login') {
      console.log('Already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [context.user, storedUser, pathname, router]);

  return context;
}