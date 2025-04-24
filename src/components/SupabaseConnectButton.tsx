import { useState } from 'react';
import { Database } from 'lucide-react';
import { SupabaseConnectionDialog } from './SupabaseConnectionDialog';
import { useTheme } from 'next-themes';

export function SupabaseConnectButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      <button 
        onClick={() => setIsDialogOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700' 
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Database className="w-4 h-4" />
        <span>Connect to Supabase</span>
      </button>
      
      <SupabaseConnectionDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </>
  );
}