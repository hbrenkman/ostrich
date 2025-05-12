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

    console.log('Current session:', session);
    console.log('User metadata:', session.user.user_metadata);
    console.log('App metadata:', session.user.app_metadata);
    console.log('Detected role:', role);

    // Always update JWT claims first
    if (role) {
      try {
        console.log('Updating JWT claims with role:', role);
        await supabase.auth.updateUser({
          data: {
            role,
            app_metadata: {
              role
            }
          }
        });
        
        // Get fresh session after updating claims
        const { data: { session: updatedSession } } = await supabase.auth.getSession();
        if (updatedSession?.user) {
          console.log('Updated session:', updatedSession);
          console.log('Updated JWT claims:', updatedSession.user.app_metadata);
          session = updatedSession;
        }
      } catch (error) {
        console.error('Error updating user claims:', error);
      }
    }
                 
    const userData: User = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata.name || '',
      role
    };

    console.log('Final user data being set:', userData);

    // Update user state and storage
    setUser(userData);
    setStoredUser(userData);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      processUserData(session);
      setLoading(false);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      processUserData(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [processUserData]);

  const value = {
    user,
    loading,
    isAdmin: () => user?.role === 'admin',
    isProjectManager: () => user?.role === 'project_management' || user?.role === 'admin',
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setStoredUser(null);
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