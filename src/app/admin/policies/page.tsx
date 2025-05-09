'use client';

import { useEffect, useState } from 'react';
import { checkCompanyPolicies } from '@/lib/supabase-utils';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const result = await checkCompanyPolicies();
        setPolicies(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policies');
      } finally {
        setLoading(false);
      }
    }

    loadPolicies();
  }, []);

  if (loading) return <div>Loading policies...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!policies) return <div>No policies found</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Company Table RLS Policies</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">RLS Status</h2>
        <p>RLS Enabled: {policies.rlsEnabled ? 'Yes' : 'No'}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Policies</h2>
        <div className="grid gap-4">
          {policies.policies?.map((policy: any) => (
            <div key={policy.policyname} className="p-4 border rounded-lg">
              <h3 className="font-medium">{policy.policyname}</h3>
              <div className="text-sm text-gray-600">
                <p>Table: {policy.tablename}</p>
                <p>Command: {policy.cmd}</p>
                <p>Roles: {policy.roles}</p>
                <p>Using: {policy.qual}</p>
                <p>With Check: {policy.with_check}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 