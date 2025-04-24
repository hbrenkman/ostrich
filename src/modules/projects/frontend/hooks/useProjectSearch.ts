import { useState } from 'react';

export interface ProjectSearchOptions {
  number?: string;
  name?: string;
  client?: string;
}

export function useProjectSearch<T extends ProjectSearchOptions>(items: T[]) {
  const [searchTerm, setSearchTerm] = useState('');

  // Always perform filtering after the hooks are called
  const filteredItems = !searchTerm 
    ? items 
    : items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.number?.toLowerCase().includes(searchLower) || false) ||
          (item.name?.toLowerCase().includes(searchLower) || false) ||
          (item.client?.toLowerCase().includes(searchLower) || false)
        );
      });

  return {
    searchTerm,
    setSearchTerm,
    filteredItems
  };
}