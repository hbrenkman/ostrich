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

interface FeeProposal {
  number: string;
  overview: string;
  designBudget: number;
  constructionSupportBudget: number;
  status: 'Active' | 'Inactive';
}

interface Project {
  number: string;
  name: string;
  client: string;
  type: string;
  status: 'Pending' | 'Design' | 'Construction' | 'Hold' | 'Cancelled';
  feeProposals: FeeProposal[];
}

export default function Projects() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Log the user data for debugging
    console.log('Current user:', user);
    console.log('Is admin:', isAdmin());
    
    // Allow access only to admin and project_management roles
    if (!isAdmin()) {
      console.log('Access denied, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }
  }, [user, router, isAdmin]);

  // Show loading state while checking permissions
  if (!user || !isAdmin()) {
    return <div>Loading...</div>;
  }

  const filter = searchParams.get('filter');

  // Generate sample projects for pagination
  const generateProjects = () => {
    const baseProjects: Project[] = [
      {
        number: "PRJ-001",
        name: "Website Redesign",
        client: "Acme Corporation",
        type: "Development",
        status: "Design",
        feeProposals: [
          {
            number: "PRJ-001.01",
            overview: "Initial website design and development",
            designBudget: 25000,
            constructionSupportBudget: 15000,
            status: "Active"
          },
          {
            number: "PRJ-001.02",
            overview: "Additional features and integrations",
            designBudget: 15000,
            constructionSupportBudget: 10000,
            status: "Inactive"
          }
        ]
      },
      {
        number: "PRJ-002",
        name: "Mobile App Development",
        client: "Stellar Solutions",
        type: "Development",
        status: "Construction",
        feeProposals: [
          {
            number: "PRJ-002.01",
            overview: "Mobile app MVP development",
            designBudget: 35000,
            constructionSupportBudget: 20000,
            status: "Active"
          }
        ]
      },
      {
        number: "PRJ-003",
        name: "Database Migration",
        client: "Global Dynamics",
        type: "Infrastructure",
        status: "Pending",
        feeProposals: [
          {
            number: "PRJ-003.01",
            overview: "Database architecture and migration",
            designBudget: 45000,
            constructionSupportBudget: 30000,
            status: "Inactive"
          }
        ]
      }
    ];

    // Generate more projects with different statuses
    return Array.from({ length: 250 }, (_, index) => {
      const baseProject = baseProjects[index % baseProjects.length];
      const status = index % 5 === 0 ? 'Pending' : 
                     index % 4 === 0 ? 'Design' :
                     index % 3 === 0 ? 'Construction' :
                     index % 2 === 0 ? 'Hold' : 'Cancelled';
      
      return {
        ...baseProject,
        number: `PRJ-${String(index + 1).padStart(3, '0')}`,
        name: `${baseProject.name} ${Math.floor(index / baseProjects.length) + 1}`,
        status: status as Project['status']
      };
    });
  };

  const allProjects = generateProjects();

  const filteredProjects = allProjects.filter(project => {
    if (filter === 'active') {
      return project.status === 'Design' || project.status === 'Construction';
    }
    if (filter === 'pending-proposals') {
      return project.status === 'Pending';
    }
    return true;
  });

  const { searchTerm, setSearchTerm, filteredItems: searchedProjects } = useProjectSearch(filteredProjects);

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedProjects,
    totalPages,
    totalItems
  } = usePagination({
    items: searchedProjects,
    itemsPerPage: 100
  });

  const designProjects = paginatedProjects.filter(project => project.status === 'Design');
  const constructionProjects = paginatedProjects.filter(project => project.status === 'Construction');

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
    const updatedProjects = [...allProjects];
    updatedProjects[projectIndex].status = newStatus;
    // In a real app, you would update the state and/or backend here
  };

  const updateProposalStatus = (projectIndex: number, proposalIndex: number, newStatus: FeeProposal['status']) => {
    const updatedProjects = [...allProjects];
    updatedProjects[projectIndex].feeProposals[proposalIndex].status = newStatus;
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

  const handleProjectClick = (project: Project) => {
    // Prevent navigation if clicking the expand button
    if (event?.target?.closest('button')) {
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
      <h4 className="text-sm font-medium mb-2">Fee Proposals</h4>
      <div className="space-y-4">
        {project.feeProposals.map((proposal, index) => (
          <div key={proposal.number} className="bg-card p-4 rounded-md border border-border">
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
                <p className="font-medium">{formatCurrency(proposal.designBudget)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Construction Support Budget</p>
                <p className="font-medium">{formatCurrency(proposal.constructionSupportBudget)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const columns = [
    {
      header: 'Number',
      accessor: 'number',
      className: 'font-medium'
    },
    {
      header: 'Name',
      accessor: 'name'
    },
    {
      header: 'Client',
      accessor: 'client'
    },
    {
      header: 'Type',
      accessor: 'type'
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
            data={paginatedProjects}
            columns={columns}
            emptyMessage="No projects found."
            expandedContent={renderExpandedContent}
            expandedRows={expandedRows}
            onRowClick={handleProjectClick}
            onExpandRow={toggleRow}
          />
          
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}