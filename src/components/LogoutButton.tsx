import { LogOut } from 'lucide-react';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';

export function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 dark:text-gray-400"
    >
      <LogOut className="w-5 h-5" />
      <span>Logout</span>
    </button>
  );
}