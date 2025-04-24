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
  const { user } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Only production role is restricted
    if (user.role === 'production') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Show nothing while checking auth
  if (!user) {
    return null;
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

  const handleProjectClick = (projectNumber: string) => {
    router.push(`/projects/${projectNumber}`);
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

  const renderProjectTable = (projects: Project[], title?: string) => (
    <>
      {title && (
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
      )}
      <table className="w-full">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="w-10 px-4 py-2"></th>
            <th className="px-4 py-2 text-left text-button">Number</th>
            <th className="px-4 py-2 text-left text-button">Name</th>
            <th className="px-4 py-2 text-left text-button">Client</th>
            <th className="px-4 py-2 text-left text-button">Type</th>
            <th className="px-4 py-2 text-left text-button">Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, projectIndex) => (
            <>
              <tr
                key={`project-${project.number}`}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer border-b border-[#4DB6AC] dark:border-[#4DB6AC]"
                onClick={() => handleProjectClick(project.number)}
              >
                <td className="px-4 py-2">
                  <button
                    onClick={(e) => toggleRow(projectIndex, e)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {expandedRows.has(projectIndex) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-2 text-body">{project.number}</td>
                <td className="px-4 py-2 text-body font-medium">
                  {project.name}
                </td>
                <td className="px-4 py-2 text-body">
                  {project.client}
                </td>
                <td className="px-4 py-2 text-body">
                  {project.type}
                </td>
                <td className="px-4 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateProjectStatus(projectIndex, 'Pending');
                      }}>
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateProjectStatus(projectIndex, 'Design');
                      }}>
                        Design
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateProjectStatus(projectIndex, 'Construction');
                      }}>
                        Construction
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateProjectStatus(projectIndex, 'Hold');
                      }}>
                        Hold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        updateProjectStatus(projectIndex, 'Cancelled');
                      }}>
                        Cancelled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
              {expandedRows.has(projectIndex) && (
                <tr key={`proposals-${project.number}`} className="bg-muted/5">
                  <td colSpan={6} className="px-4 py-2">
                    <div className="ml-4 dark:text-[#E5E7EB]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold dark:text-[#E5E7EB]">Fee Proposals</h3>
                        <Link
                          href={`/projects/${project.number}/proposals/new`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Proposal</span>
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {project.feeProposals.map((proposal, proposalIndex) => (
                          <div
                            key={proposal.number}
                            className="bg-card text-card-foreground p-3 rounded-lg border border-border"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-medium dark:text-[#E5E7EB]">{proposal.number}</span>
                                <span className="text-sm text-muted-foreground">|</span>
                                <span className="text-sm dark:text-[#E5E7EB]">{proposal.overview}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {proposal.status === 'Active' ? 'Active' : 'Inactive'}
                                  </span>
                                  <Switch
                                    checked={proposal.status === 'Active'}
                                    onCheckedChange={(checked) => {
                                      updateProposalStatus(
                                        projectIndex,
                                        proposalIndex,
                                        checked ? 'Active' : 'Inactive'
                                      );
                                    }}
                                  />
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-muted/10 rounded-full transition-colors">
                                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/projects/${project.number}/proposals/${proposal.number}`}>
                                        Edit Proposal
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium dark:text-[#E5E7EB]">Design Budget: </span>
                                <span className="text-muted-foreground">{formatCurrency(proposal.designBudget)}</span>
                              </div>
                              <div>
                                <span className="font-medium dark:text-[#E5E7EB]">Construction Support: </span>
                                <span className="text-muted-foreground">{formatCurrency(proposal.constructionSupportBudget)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {filter && (
            <Link
              href="/dashboard/performance"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary" />
            <h1 className="text-h1">Project Admin</h1>
          </div>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:text-[#E5E7EB] placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {filter && (
        <div className="mb-4 flex items-center justify-between bg-muted/5 px-4 py-2 rounded-lg border border-[#4DB6AC] dark:border-[#4DB6AC]">
          <span className="text-sm text-muted-foreground dark:text-[#E5E7EB]">
            {getFilterDescription()}
          </span>
          <button
            onClick={() => router.push('/projects')}
            className="text-sm text-muted-foreground hover:text-foreground dark:text-[#E5E7EB] dark:hover:text-[#FFFFFF]"
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="space-y-8">
        {filter === 'active' ? (
          <>
            <div className="bg-card text-card-foreground rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
              {renderProjectTable(designProjects, 'Design Projects')}
            </div>
            <div className="bg-card text-card-foreground rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
              {renderProjectTable(constructionProjects, 'Construction Projects')}
            </div>
          </>
        ) : (
          <div className="bg-card text-card-foreground rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
            {renderProjectTable(paginatedProjects)}
            <div className="px-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={totalItems}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}