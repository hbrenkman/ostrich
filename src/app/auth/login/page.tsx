"use client";

import { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Attempting login for:', credentials.email);
    setIsLoading(true);

    try {
      const result = await signIn(credentials.email, credentials.password);
      console.log('Sign in result:', {
        hasSession: !!result.session,
        userId: result.session?.user?.id,
        role: result.session?.user?.app_metadata?.role,
        accessToken: result.session?.access_token ? 'present' : 'missing',
        refreshToken: result.session?.refresh_token ? 'present' : 'missing'
      });

      // Get fresh session to verify it was set
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session after login:', {
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
        role: currentSession?.user?.app_metadata?.role,
        cookieName: 'ostrich-auth-token',
        cookieValue: document.cookie.includes('ostrich-auth-token') ? 'present' : 'missing'
      });

      if (currentSession) {
        router.push('/dashboard');
      } else {
        throw new Error('Session not established after login');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!credentials.email) {
      setError('Please enter your email first');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      alert('Password reset instructions have been sent to your email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="h-12 w-auto mx-auto" /> {/* Placeholder for logo */}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-card text-card-foreground py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Loading state */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          src={theme === 'dark' ? '/images/logos/logo_ostrich_dark_background.svg' : '/images/logos/logo_ostrich_light_background.svg'}
          alt="Ostrich Logo"
          className="h-12 w-auto mx-auto"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card text-card-foreground py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted dark:text-[#4DB6AC]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-border dark:border-[#4DB6AC] rounded-md shadow-sm placeholder:text-card-muted dark:placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted dark:text-[#4DB6AC]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-border dark:border-[#4DB6AC] rounded-md shadow-sm placeholder:text-card-muted dark:placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:text-primary/80"
              >
                Forgot your password?
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}