import type { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: () => boolean;
  isProjectManager: () => boolean;
  signIn: (email: string, password: string) => Promise<{ session: Session | null; user: User | null }>;
  signOut: () => Promise<void>;
}