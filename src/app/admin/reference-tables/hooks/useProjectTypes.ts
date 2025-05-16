import { useState, useEffect } from 'react';

export interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchProjectTypes();
  }, []);

  const fetchProjectTypes = async () => {
    try {
      setLoading(true);
      console.log('[useProjectTypes] Fetching /api/project-types...');
      const response = await fetch('/api/project-types');
      console.log('[useProjectTypes] Response:', response);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project types');
      }
      
      const data = await response.json();
      console.log('[useProjectTypes] Data:', data);
      setProjectTypes(data);
    } catch (err) {
      console.error('[useProjectTypes] Error fetching project types:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addProjectType = async (projectType: Omit<ProjectType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/project-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectType),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add project type');
      }
      
      await fetchProjectTypes(); // Refresh data
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const updateProjectType = async (projectType: ProjectType) => {
    try {
      const response = await fetch(`/api/project-types/${projectType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectType),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project type');
      }
      
      await fetchProjectTypes(); // Refresh data
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const deleteProjectType = async (id: string) => {
    try {
      const response = await fetch(`/api/project-types/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project type');
      }
      
      await fetchProjectTypes(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  return {
    projectTypes,
    loading,
    error,
    addProjectType,
    updateProjectType,
    deleteProjectType,
    refreshProjectTypes: fetchProjectTypes
  };
} 