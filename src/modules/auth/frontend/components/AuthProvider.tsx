"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from '../types';
import { getStoredUser, setStoredUser } from '../utils/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing in with email:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email, // Will be normalized in the API
          password: password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('AuthProvider: Sign in failed:', data.error);
        throw new Error(data.error || 'Invalid credentials');
      }

      const data = await response.json();
      console.log('AuthProvider: Sign in response:', data);
      return data;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const verifyCode = async (username: string, code: string) => {
    try {
      console.log('AuthProvider: Verifying code for:', username);
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('AuthProvider: Verification failed:', data.error);
        throw new Error(data.error || 'Invalid verification code');
      }

      const { user: userData } = await response.json();
      console.log('AuthProvider: User data after verification:', userData);
      setUser(userData);
      setStoredUser(userData);
      return userData;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Implement sign out
      setUser(null);
      setStoredUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin, verifyCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext }