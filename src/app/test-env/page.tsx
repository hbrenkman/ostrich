'use client';

import { useEffect, useState } from 'react';

export default function TestEnv() {
  const [envVars, setEnvVars] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [allEnvVars, setAllEnvVars] = useState<any>(null);

  useEffect(() => {
    async function checkEnv() {
      try {
        // Check API endpoint
        const response = await fetch('/api/debug-env');
        const data = await response.json();
        setEnvVars(data);

        // Check client-side env vars
        const clientEnvVars = {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          // Log all env vars that start with NEXT_PUBLIC
          allPublicVars: Object.keys(process.env)
            .filter(key => key.startsWith('NEXT_PUBLIC_'))
            .reduce((acc, key) => ({ ...acc, [key]: process.env[key] ? 'present' : 'missing' }), {})
        };
        setAllEnvVars(clientEnvVars);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch environment variables');
      }
    }
    checkEnv();
  }, []);

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variables</h1>
      
      <h2 className="text-xl font-semibold mt-4 mb-2">API Environment Variables:</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto mb-4">
        {envVars ? JSON.stringify(envVars, null, 2) : 'Loading...'}
      </pre>

      <h2 className="text-xl font-semibold mt-4 mb-2">Client Environment Variables:</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {allEnvVars ? JSON.stringify(allEnvVars, null, 2) : 'Loading...'}
      </pre>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">Troubleshooting Steps:</h3>
        <ol className="list-decimal list-inside mt-2 text-yellow-700">
          <li>Verify .env.local exists in the root directory</li>
          <li>Check file permissions on .env.local</li>
          <li>Ensure no spaces around = in .env.local</li>
          <li>Try restarting the development server</li>
          <li>Check if other .env files exist (.env, .env.development, etc.)</li>
        </ol>
      </div>
    </div>
  );
} 