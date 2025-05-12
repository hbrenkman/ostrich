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
  status: 'Pending' | 'Design' | 'Construction' | 'Hold' | 'Cancelled';
  company: {
    id: string;
    name: string;
  } | null;
  company_location: {
    id: string;
    address: string;
    city: string;
    state: string;
  } | null;
  company_contact: {
    id: string;
    name: string;
    email: string;
  } | null;
  fee_proposals: FeeProposal[];
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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          number,
          name,
          type,
          status,
          company:companies!inner(id, name),
          company_location:locations!inner(id, address, city, state),
          company_contact:contacts!inner(id, name, email),
          fee_proposals(
            id,
            number,
            overview,
            design_budget,
            construction_support_budget,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Project type
      const transformedData = (data || []).map(project => ({
        ...project,
        company: project.company?.[0] || null,
        company_location: project.company_location?.[0] || null,
        company_contact: project.company_contact?.[0] || null,
      })) as Project[];
      
      setProjects(transformedData);
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

  const filteredProjects = searchedProjects.filter(project => {
    if (filter === 'active') {
      return project.status === 'Design' || project.status === 'Construction';
    }
    if (filter === 'pending-proposals') {
      return project.status === 'Pending';
    }
    return true;
  });

  const designProjects = filteredProjects.filter(project => project.status === 'Design');
  const constructionProjects = filteredProjects.filter(project => project.status === 'Construction');

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

  const updateProjectStatus = (projectIndex: number, newStatus: Project['status']) => {
    const updatedProjects = [...projects];
    updatedProjects[projectIndex].status = newStatus;
    // In a real app, you would update the state and/or backend here
  };

  const updateProposalStatus = (projectIndex: number, proposalIndex: number, newStatus: FeeProposal['status']) => {
    const updatedProjects = [...projects];
    updatedProjects[projectIndex].fee_proposals[proposalIndex].status = newStatus;
    // In a real app, you would update the state and/or backend here
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Design':
        return 'bg-primary text-primary-foreground';
      case 'Construction':
        return 'bg-secondary text-secondary-foreground';
      case 'Pending':
        return 'bg-muted text-muted-foreground';
      case 'Hold':
        return 'bg-accent text-accent-foreground';
      case 'Cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const handleProjectClick = (project: Project, event?: React.MouseEvent) => {
    // Prevent navigation if clicking the expand button
    if (event?.target instanceof HTMLElement && event.target.closest('button')) {
      return;
    }
    router.push(`/projects/${project.number}`);
  };

  const getFilterDescription = () => {
    switch (filter) {
      case 'active':
        return 'Showing Design and Construction Projects';
      case 'pending-proposals':
        return 'Showing Projects with Pending Status';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderExpandedContent = (project: Project) => (
    <div className="py-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Company Details</h4>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Location:</span> {project.company_location?.address}, {project.company_location?.city}, {project.company_location?.state}</p>
            <p><span className="text-muted-foreground">Contact:</span> {project.company_contact?.name} ({project.company_contact?.email})</p>
          </div>
        </div>
      </div>
      
      <h4 className="text-sm font-medium mb-2">Fee Proposals</h4>
      <div className="space-y-4">
        {project.fee_proposals?.map((proposal) => (
          <div key={proposal.id} className="bg-card p-4 rounded-md border border-border">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium">{proposal.number}</h5>
                <p className="text-sm text-muted-foreground">{proposal.overview}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                proposal.status === 'Active' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {proposal.status}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Design Budget</p>
                <p className="font-medium">{formatCurrency(proposal.design_budget)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Construction Support Budget</p>
                <p className="font-medium">{formatCurrency(proposal.construction_support_budget)}</p>
              </div>
            </div>
          </div>
        ))}
        {(!project.fee_proposals || project.fee_proposals.length === 0) && (
          <p className="text-sm text-muted-foreground">No fee proposals yet.</p>
        )}
      </div>
    </div>
  );

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
    },
    {
      header: 'Type',
      accessor: (project: Project) => project.type
    },
    {
      header: 'Status',
      accessor: (project: Project) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          {filter && (
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'active' ? 'Showing Design and Construction Projects' : 'Showing Projects with Pending Status'}
            </p>
          )}
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
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