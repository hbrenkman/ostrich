import { useState, useEffect } from 'react';

export interface ReferenceTableEntry {
  id: string;
  key: string;
  value: string | number;
  description?: string;
}

export interface ReferenceTable {
  id: string;
  name: string;
  category: 'Fee Calculation' | 'Project Types' | 'Service Types' | 'Rate Categories' | 'Cost Indices' | 'Construction Costs' | 'Engineering Services';
  description: string;
  entries: ReferenceTableEntry[];
}

export function useReferenceTables(category?: string) {
  const [tables, setTables] = useState<ReferenceTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTables();
  }, [category]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/reference-tables', window.location.origin);
      
      if (category) {
        url.searchParams.append('category', category);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch reference tables');
      }
      
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addTable = async (table: Omit<ReferenceTable, 'id'>) => {
    try {
      const response = await fetch('/api/reference-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(table),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add reference table');
      }
      
      const newTable = await response.json();
      setTables([...tables, newTable]);
      return newTable;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const updateTable = async (table: ReferenceTable) => {
    try {
      const response = await fetch('/api/reference-tables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(table),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reference table');
      }
      
      const updatedTable = await response.json();
      setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
      return updatedTable;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const response = await fetch('/api/reference-tables', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete reference table');
      }
      
      setTables(tables.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  return {
    tables,
    loading,
    error,
    addTable,
    updateTable,
    deleteTable,
    refreshTables: fetchTables
  };
}