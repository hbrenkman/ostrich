import type { User } from '../types';

const USER_STORAGE_KEY = 'ostrich_user';

// List of routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/reset-password',
  '/auth/verify'
];

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

export function hasFinancialsAccess(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'project_management';
}