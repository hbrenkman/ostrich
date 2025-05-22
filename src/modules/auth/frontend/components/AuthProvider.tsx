"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { User, AuthContextType } from '../types';
import type { Subscription, Session } from '@supabase/supabase-js';
import { getStoredUser, setStoredUser } from '../utils/auth';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const lastProcessedSession = useRef<string | null>(null);

  const processUserData = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setStoredUser(null);
      return;
    }

    // Check if we've already processed this session
    const sessionId = session.access_token;
    if (lastProcessedSession.current === sessionId) {
      return;
    }
    lastProcessedSession.current = sessionId;
    
    // Get role from metadata, with admin taking precedence
    const role = session.user.app_metadata?.role || 
                 session.user.user_metadata?.role ||
                 'user';

    const cookies = typeof document !== 'undefined' 
      ? document.cookie.split(';').map(c => c.trim())
      : [];

    console.log('Processing session:', {
      sessionId: sessionId.substring(0, 10) + '...',
      userId: session.user.id,
      role,
      hasAccessToken: !!session.access_token,
      hasRefreshToken: !!session.refresh_token,
      expiresAt: session.expires_at,
      cookies
    });

    // Only update JWT claims if role is missing or different
    if (role && (!session.user.app_metadata?.role || session.user.app_metadata.role !== role)) {
      try {
        console.log('Updating JWT claims with role:', role);
        const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
          data: {
            role,
            app_metadata: {
              role
            }
          }
        });
        
        if (updateError) {
          console.error('Error updating user claims:', updateError);
          // Continue with existing session even if update fails
        } else if (updatedUser) {
          // Get fresh session after updating claims
          const { data: { session: updatedSession } } = await supabase.auth.getSession();
          if (updatedSession) {
            session = updatedSession;
          }
        }
      } catch (error) {
        console.error('Error in claims update process:', error);
        // Continue with existing session even if update fails
      }
    }
                 
    const userData: User = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata.name || '',
      role
    };

    console.log('Setting user data:', {
      ...userData,
      sessionId: session.access_token.substring(0, 10) + '...',
      cookies
    });

    // Update user state and storage
    setUser(userData);
    setStoredUser(userData);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      const cookies = typeof document !== 'undefined' 
        ? document.cookie.split(';').map(c => c.trim())
        : [];

      console.log('Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        cookies
      });
      processUserData(session);
      setLoading(false);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const cookies = typeof document !== 'undefined' 
        ? document.cookie.split(';').map(c => c.trim())
        : [];

      console.log('Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        cookies
      });
      
      if (event === 'SIGNED_IN' && session) {
        // Process the session immediately
        processUserData(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setStoredUser(null);
      } else if (session) {
        // For other events, only process if session changed
        processUserData(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [processUserData]);

  const value = {
    user,
    loading,
    isAdmin: () => user?.role === 'admin',
    isProjectManager: () => user?.role === 'project_management' || user?.role === 'admin',
    signIn: async (email: string, password: string) => {
      console.log('Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      const cookies = typeof document !== 'undefined' 
        ? document.cookie.split(';').map(c => c.trim())
        : [];

      console.log('Sign in successful:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        cookies
      });

      if (data.session) {
        // Ensure session is set in the client
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        if (setSessionError) {
          console.error('Error setting session after sign in:', setSessionError);
          throw setSessionError;
        }
      }

      return data;
    },
    signOut: async () => {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      setUser(null);
      setStoredUser(null);

      const cookies = typeof document !== 'undefined' 
        ? document.cookie.split(';').map(c => c.trim())
        : [];

      console.log('Sign out successful, cookies:', cookies);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };