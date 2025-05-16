import { useState, useEffect } from 'react';

interface MetroArea {
  name: string;
  index: number;
}

export interface StateCostIndex {
  state: string;
  metros: MetroArea[];
}

export function useStateCostIndex(state?: string) {
  const [stateData, setStateData] = useState<StateCostIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('Hook: useEffect triggered, fetching state data...');
    fetchStateData();
  }, [state]);

  const fetchStateData = async () => {
    try {
      console.log('Hook: Starting to fetch state data...');
      setLoading(true);
      const url = new URL('/api/state-cost-index', window.location.origin);
      
      if (state) {
        url.searchParams.append('state', state);
      }
      
      console.log('Hook: Fetching from URL:', url.toString());
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hook: Error response:', errorText);
        throw new Error(`Failed to fetch state cost index data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Hook: Received data:', data);
      if (data && data.length > 0) {
        console.log('Hook: First state sample:', {
          state: data[0].state,
          metros: data[0].metros.map((m: MetroArea) => ({
            name: m.name,
            index: m.index
          }))
        });
      }
      setStateData(data);
    } catch (err) {
      console.error('Hook: Error in fetchStateData:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addStateEntry = async (entry: { state: string; metro_area: string; cost_index: number }) => {
    try {
      const response = await fetch('/api/state-cost-index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add state cost index entry');
      }
      
      await fetchStateData(); // Refresh data
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const updateStateEntry = async (entry: { id: string; state: string; metro_area: string; cost_index: number }) => {
    try {
      const response = await fetch('/api/state-cost-index', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update state cost index entry');
      }
      
      await fetchStateData(); // Refresh data
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const deleteStateEntry = async (id: string) => {
    try {
      const response = await fetch('/api/state-cost-index', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete state cost index entry');
      }
      
      await fetchStateData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  return {
    stateData,
    loading,
    error,
    addStateEntry,
    updateStateEntry,
    deleteStateEntry,
    refreshStateData: fetchStateData
  };
}