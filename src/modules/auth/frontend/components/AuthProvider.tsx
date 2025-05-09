"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, AuthContextType } from '../types';
import { getStoredUser, setStoredUser } from '../utils/auth';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'project_management';
  }, [user?.role]);

  const processUserData = useCallback((session: any) => {
    if (!session?.user) return null;
    
    const userData = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata.name || '',
      // Check both user_metadata and app_metadata for role
      role: session.user.user_metadata.role || 
            session.user.app_metadata?.role ||
            'user'
    };

    return userData;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userData = processUserData(data);
        if (userData) {
          setUser(userData);
          setStoredUser(userData);
        }
      }

      return data;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for existing Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        if (mounted) {
          if (session) {
            const userData = processUserData(session);
            if (userData) {
              setUser(userData);
              setStoredUser(userData);
            }
          }
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/auth/login');
        return;
      }

      if (session) {
        const userData = processUserData(session);
        if (userData) {
          setUser(userData);
          setStoredUser(userData);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, processUserData]);

  // Show loading state only during initial auth check
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };