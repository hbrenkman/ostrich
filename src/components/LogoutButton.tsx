import { LogOut } from 'lucide-react';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { useState } from 'react';

export function LogoutButton() {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50"
    >
      <LogOut className="w-5 h-5" />
      <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
    </button>
  );
}