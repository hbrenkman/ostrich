import { useState, useEffect } from 'react';
import { Timesheet } from '../types';

export function useTimesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const response = await fetch('/api/timesheets');
      if (!response.ok) throw new Error('Failed to fetch timesheets');
      const data = await response.json();
      setTimesheets(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return { timesheets, loading, error };
}