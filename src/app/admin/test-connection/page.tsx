'use client';

import { useEffect, useState } from 'react';
import { testSupabaseConnection } from '@/lib/supabase-utils';

export default function TestConnection() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runTest() {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
      setLoading(false);
    }
    runTest();
  }, []);

  if (loading) {
    return <div>Testing connection...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
} 