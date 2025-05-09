import { supabase } from './supabase';
import { getStoredUser } from '../modules/auth/frontend/utils/auth';

export async function getSupabaseSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (session) return session;

  // If no session, try to sign in with stored user
  const storedUser = getStoredUser();
  if (storedUser?.token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: storedUser.token,
      refresh_token: storedUser.refreshToken || '',
    });
    if (data.session) return data.session;
  }

  return null;
}
