import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, AlertCircle } from 'lucide-react';

interface SupabaseConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupabaseConnectionDialog({ open, onOpenChange }: SupabaseConnectionDialogProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleConnect = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError('Please provide both Supabase URL and Anon Key');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      setSuccess(false);
      // Save credentials to .env file via API
      const response = await fetch('/api/supabase/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: supabaseUrl, key: supabaseKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect to Supabase');
      }

      // Show success message instead of immediately reloading
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <span>Connect to Supabase</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input
              id="supabaseUrl"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
            <Input
              id="supabaseKey"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="your-anon-key"
              className="w-full"
              type="password"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="text-sm text-muted-foreground">
            <p>Enter your Supabase project URL and anon key to connect.</p>
            <p className="mt-2">These credentials will be stored in your .env file.</p>
          </div>
        </div>
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Connection successful!</p>
              <p className="text-sm">Your Supabase credentials have been saved. The page will reload in a moment to apply the changes.</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting || success}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}