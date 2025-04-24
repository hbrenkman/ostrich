import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Function to manually set Supabase credentials
export const setSupabaseCredentials = (url: string, key: string) => {
  // In a real app, you would update the .env file or use a secure storage method
  // For this demo, we'll use localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('SUPABASE_URL', url);
    localStorage.setItem('SUPABASE_ANON_KEY', key);
    
    // Reload the page to apply the new credentials
    window.location.reload();
  }
};

// Function to get Supabase credentials from localStorage
export const getSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('SUPABASE_URL') || '';
    const key = localStorage.getItem('SUPABASE_ANON_KEY') || '';
    return { url, key };
  }
  return { url: '', key: '' };
};