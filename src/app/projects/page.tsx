"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderKanban, Search, Plus, ChevronDown, ChevronRight, MoreVertical, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectSearch } from '@/modules/projects/frontend/hooks/useProjectSearch';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { DataTable } from '@/components/ui/data-table';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface FeeProposal {
  id: string;
  number: string;
  overview: string;
  design_budget: number;
  construction_support_budget: number;
  status: 'Pending' | 'Active' | 'On Hold' | 'Cancelled';
}

interface Project {
  id: string;
  number: string;
  name: string;
  type: string;
  company: {
    name: string;
  } | null;
  status: string;
  created_at: string;
  updated_at: string;
  revision: number;
}

export default function Projects() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm, setSearchTerm, filteredItems: searchedProjects } = useProjectSearch(projects);
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedProjects,
    totalPages,
    totalItems
  } = usePagination({
    items: projects,
    itemsPerPage: 100
  });

  const filter = searchParams?.get('filter') || null;

  // Move all effects to the top level
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (!isAdmin()) {
      console.log('Access denied, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    fetchProjects();
  }, [user, router, isAdmin]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filter, setCurrentPage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // First, get the latest revision for each project number
      const { data: latestRevisions, error: revisionError } = await supabase
        .from('projects')
        .select('number, revision')
        .order('revision', { ascending: false })
        .order('number');

      if (revisionError) throw revisionError;

      // Create a map of project numbers to their latest revision
      const latestRevisionMap = new Map(
        latestRevisions?.map(rev => [rev.number, rev.revision]) || []
      );

      // Then fetch the full project data for those specific revisions
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          type:project_types(name)
        `)
        .in('number', Array.from(latestRevisionMap.keys()))
        .order('number');

      if (error) throw error;

      // Filter to only include the latest revision of each project
      const projects = data
        ?.filter(project => project.revision === latestRevisionMap.get(project.number))
        .map(project => ({
          id: project.id,
          number: project.number,
          name: project.name,
          type: project.type.name,
          company: project.company_name ? {
            name: project.company_name
          } : null,
          status: project.status_id,
          created_at: project.created_at,
          updated_at: project.updated_at,
          revision: project.revision
        })) || [];

      setProjects(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking permissions or fetching data
  if (!user || !isAdmin() || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredProjects = searchedProjects;

  const toggleRow = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleProjectClick = (project: Project, event?: React.MouseEvent) => {
    // Prevent navigation if clicking the expand button
    if (event?.target instanceof HTMLElement && event.target.closest('button')) {
      return;
    }
    router.push(`/projects/${project.number}`);
  };

  const columns: {
    header: string;
    accessor: (project: Project) => React.ReactNode;
    className?: string;
  }[] = [
    {
      header: 'Number',
      accessor: (project: Project) => project.number,
      className: 'font-medium'
    },
    {
      header: 'Name',
      accessor: (project: Project) => project.name
    },
    {
      header: 'Client',
      accessor: (project: Project) => project.company?.name || 'N/A'
    }
  ];

  const renderExpandedContent = (project: Project) => null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
            columns={columns}
            emptyMessage="No projects found."
            expandedContent={renderExpandedContent}
            expandedRows={expandedRows}
            onRowClick={handleProjectClick}
            onExpandRow={toggleRow}
          />
          
          {Math.ceil(filteredProjects.length / itemsPerPage) > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredProjects.length / itemsPerPage)}
                totalItems={filteredProjects.length}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}