"use client";

import { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { useTheme } from 'next-themes';

export default function Login() {
  const router = useRouter();
  const { signIn, verifyCode } = useAuth();
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    code: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Attempting login for:', credentials.username);
    setIsLoading(true);

    try {
      if (!showTwoFactor) {
        const result = await signIn(credentials.username, credentials.password);
        console.log('Sign in result:', result);
        if (result?.message === 'Verification code sent') {
          setShowTwoFactor(true);
        }
      } else {
        console.log('Verifying code for:', credentials.username);
        await verifyCode(credentials.username, credentials.code);
        console.log('Verification successful, redirecting to dashboard');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      if (showTwoFactor) {
        setShowTwoFactor(false);
        setCredentials({ ...credentials, code: '' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!credentials.username) {
      setError('Please enter your username first');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: credentials.username })
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

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
            {showTwoFactor ? 'Enter Verification Code' : 'Sign in to your account'}
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
          {showTwoFactor ? 'Enter Verification Code' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card text-card-foreground py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!showTwoFactor ? (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-foreground">
                    Username
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-muted dark:text-[#4DB6AC]" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="email"
                      required
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
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
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-2 focus:ring-primary/20 border-border rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-primary hover:text-primary/90"
                  >
                    Forgot your password?
                  </button>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-foreground">
                  Verification Code
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-muted dark:text-[#4DB6AC]" />
                  </div>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    maxLength={5}
                    placeholder="Enter 5-digit code"
                    value={credentials.code}
                    onChange={(e) => setCredentials({ ...credentials, code: e.target.value })}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-border dark:border-[#4DB6AC] rounded-md shadow-sm placeholder:text-card-muted dark:placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-card-muted">
                  A verification code has been sent to your email address.
                </p>
              </div>
            )}

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
                    {showTwoFactor ? 'Verify Code' : 'Sign In'}
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