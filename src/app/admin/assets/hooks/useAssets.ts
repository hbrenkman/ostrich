import { useState, useEffect } from 'react';

export interface Asset {
  id: string;
  number: string;
  description: string;
  designation: string;
  location: string;
  purchase_value: number;
  purchase_date: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Retired';
}

export function useAssets(status?: string, designation?: string) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [status, designation]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/assets', window.location.origin);
      
      if (status) {
        url.searchParams.append('status', status);
      }
      
      if (designation) {
        url.searchParams.append('designation', designation);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asset),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add asset');
      }
      
      const newAsset = await response.json();
      setAssets(prev => [...prev, newAsset[0]]);
      return newAsset[0];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const updateAsset = async (asset: Asset) => {
    try {
      const response = await fetch('/api/assets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asset),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update asset');
      }
      
      const updatedAsset = await response.json();
      setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset[0] : a));
      return updatedAsset[0];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const response = await fetch('/api/assets', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }
      
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const refreshAssets = () => {
    fetchAssets();
  };

  return {
    assets,
    loading,
    error,
    addAsset,
    updateAsset,
    deleteAsset,
    refreshAssets
  };
}