"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { FolderKanban, Save, ArrowLeft, Plus, Trash2, MoreVertical, X, FileText, ClipboardList, MessageSquare, Eye, FileEdit } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { companies } from '@/modules/clients/frontend/data/companies';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  industry_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FeeProposal {
  number: string;
  overview: string;
  designBudget: string;
  constructionSupportBudget: string;
  status: 'Pending' | 'Active' | 'On Hold' | 'Cancelled';
}

interface ProjectDocument {
  id: string;
  type: 'CityComments' | 'Addenda' | 'RFI' | 'FieldReview' | 'PunchList';
  number: string;
  title: string;
  date: string;
  status: 'Draft' | 'Issued' | 'Responded' | 'Closed';
}

export default function ProjectDetail() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params?.id as string;
  const isNewProject = projectId === 'new';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [teamMemberOpen, setTeamMemberOpen] = useState(false);
  const [projectTypeOpen, setProjectTypeOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'production') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (error) throw error;
        setCompanies(data || []);
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to load companies');
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  // Example project data - in a real app, fetch this based on projectId
  const [project, setProject] = useState({
    number: isNewProject ? `PRJ-${new Date().getTime().toString().slice(-4)}` : 'PRJ-001',
    name: isNewProject ? '' : 'Website Redesign',
    type: isNewProject ? 'Development' : 'Development',
    company: isNewProject ? '' : 'Acme Corporation',
    companyId: isNewProject ? '' : '1',
  });
  
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>(
    isNewProject ? [] : [
      { id: '1', name: 'John Smith', role: 'Project Manager' },
      { id: '2', name: 'Sarah Johnson', role: 'Lead Developer' }
    ]
  );

  // Example available team members
  const availableTeamMembers: TeamMember[] = [
    { id: '1', name: 'John Smith', role: 'Project Manager' },
    { id: '2', name: 'Sarah Johnson', role: 'Lead Developer' },
    { id: '3', name: 'Michael Brown', role: 'Designer' },
    { id: '4', name: 'Emily Davis', role: 'Developer' },
    { id: '5', name: 'David Wilson', role: 'QA Engineer' }
  ];

  const [proposals, setProposals] = useState<FeeProposal[]>(
    isNewProject ? [] : [
      {
        number: 'FP-001',
        overview: 'Initial website design and development',
        designBudget: '25000',
        constructionSupportBudget: '15000',
        status: 'Active'
      }
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    router.push('/projects');
  };

  const handleDeleteProject = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      // Handle project deletion here
      router.push('/projects');
    }
  };

  const addTeamMember = (member: TeamMember) => {
    if (!selectedTeamMembers.find(m => m.id === member.id)) {
      setSelectedTeamMembers([...selectedTeamMembers, member]);
    }
  };

  const removeTeamMember = (memberId: string) => {
    setSelectedTeamMembers(selectedTeamMembers.filter(m => m.id !== memberId));
  };

  const handleAddProposal = () => {
    router.push(`/projects/${projectId}/proposals/new`);
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount));
  };

  const [documents] = useState<ProjectDocument[]>([
    {
      id: '1',
      type: 'CityComments',
      number: 'CC-001',
      title: 'Initial Plan Review Comments',
      date: '2024-03-15',
      status: 'Responded'
    },
    {
      id: '2',
      type: 'RFI',
      number: 'RFI-001',
      title: 'HVAC System Clarification',
      date: '2024-03-18',
      status: 'Issued'
    }
  ]);

  const getDocumentIcon = (type: ProjectDocument['type']) => {
    switch (type) {
      case 'CityComments':
        return <FileEdit className="w-4 h-4" />;
      case 'Addenda':
        return <FileText className="w-4 h-4" />;
      case 'RFI':
        return <MessageSquare className="w-4 h-4" />;
      case 'FieldReview':
        return <Eye className="w-4 h-4" />;
      case 'PunchList':
        return <ClipboardList className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ProjectDocument['status']) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Issued':
        return 'bg-blue-100 text-blue-800';
      case 'Responded':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProposalStatusColor = (status: FeeProposal['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-muted text-muted-foreground';
      case 'Active':
        return 'bg-primary text-primary-foreground';
      case 'On Hold':
        return 'bg-accent text-accent-foreground';
      case 'Cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary" />
            <h1 className="text-h1">{isNewProject ? 'New Project' : 'Edit Project'}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 max-w-3xl space-y-6">
          <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#D1D5DB] dark:border-[#4DB6AC]">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{project.number}</span>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  className="flex-1 text-xl border-0 focus:ring-0 p-0 focus:outline-none bg-transparent text-foreground"
                  placeholder="Enter project name"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-[#9CA3AF]">Type:</span>
                  <Popover open={projectTypeOpen} onOpenChange={setProjectTypeOpen}>
                    <PopoverTrigger asChild>
                      <button
                        role="combobox"
                        aria-expanded={projectTypeOpen}
                        className="w-[200px] flex items-center justify-between h-8 px-3 py-1.5 border border-[#D1D5DB] dark:border-[#4DB6AC] rounded-md bg-background text-sm font-normal hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className="truncate">{project.type}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandGroup>
                          {['Development', 'Infrastructure', 'Consulting', 'Support'].map((type) => (
                            <CommandItem
                              key={type}
                              value={type}
                              onSelect={() => {
                                setProject({ ...project, type });
                                setProjectTypeOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 flex-shrink-0",
                                  project.type === type ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{type}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-[#9CA3AF]">Company:</span>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <button
                        role="combobox"
                        aria-expanded={open}
                        className="w-[300px] flex items-center justify-between h-8 px-3 py-1.5 border border-[#D1D5DB] dark:border-[#4DB6AC] rounded-md bg-background text-sm font-normal hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={loading}
                      >
                        <span className="truncate">
                          {loading ? (
                            "Loading companies..."
                          ) : project.companyId ? (
                            companies.find((company) => company.id === project.companyId)?.name
                          ) : (
                            "Select company..."
                          )}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search company..." />
                        <CommandEmpty>No company found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {companies.map((company) => (
                            <CommandItem
                              key={company.id}
                              value={company.name}
                              onSelect={() => {
                                setProject({
                                  ...project,
                                  companyId: company.id,
                                  company: company.name,
                                });
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 flex-shrink-0",
                                  project.companyId === company.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{company.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">Team Members</h3>
                  <Popover open={teamMemberOpen} onOpenChange={setTeamMemberOpen}>
                    <PopoverTrigger asChild>
                      <button
                        role="combobox"
                        aria-expanded={teamMemberOpen}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add team member
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search team members..." />
                        <CommandEmpty>No team member found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {availableTeamMembers
                            .filter(member => !selectedTeamMembers.find(m => m.id === member.id))
                            .map(member => (
                              <CommandItem
                                key={member.id}
                                value={`${member.name} - ${member.role}`}
                                onSelect={() => {
                                  addTeamMember(member);
                                  setTeamMemberOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{member.name}</span>
                                  <span className="text-sm text-gray-500">{member.role}</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTeamMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-[#374151] rounded-full text-sm"
                    >
                      <span>{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(member.id)}
                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fee Proposals Section */}
          <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#D1D5DB] dark:border-[#4DB6AC]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E5E7EB]">Fee Proposals</h2>
              <button
                type="button"
                onClick={handleAddProposal}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Proposal
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {proposals.map((proposal, index) => (
                <div
                  key={index}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-[#E5E7EB]">{proposal.number}</span>
                      <span className="text-sm text-gray-500">|</span>
                      <span className="text-sm text-gray-900 dark:text-[#E5E7EB]">{proposal.overview}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProposalStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${projectId}/proposals/${proposal.number}`}>
                              Edit Proposal
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>Design:</span>
                      <span>{formatCurrency(proposal.designBudget)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Construction Support:</span>
                      <span>{formatCurrency(proposal.constructionSupportBudget)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Total:</span>
                      <span className="font-medium text-gray-900 dark:text-[#E5E7EB]">
                        {formatCurrency((Number(proposal.designBudget) + Number(proposal.constructionSupportBudget)).toString())}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {proposals.length === 0 && (
                <p className="text-sm text-gray-500 py-4">No proposals yet. Click "Add Proposal" to create one.</p>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            {!isNewProject && (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Project</span>
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Project</span>
            </button>
          </div>
        </div>

        {/* Documents Section */}
        <div className="w-80 space-y-6">
          <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#D1D5DB] dark:border-[#4DB6AC]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-[#E5E7EB]">Project Documents</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link
                      href={`/projects/${projectId}/documents/CityComments-${Date.now()}`}
                      className="flex items-center gap-2 w-full"
                    >
                    <FileEdit className="w-4 h-4 mr-2" />
                    City Comments
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href={`/projects/${projectId}/documents/Addenda-${Date.now()}`}
                      className="flex items-center gap-2 w-full"
                    >
                    <FileText className="w-4 h-4 mr-2" />
                    Addenda
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href={`/projects/${projectId}/documents/RFI-${Date.now()}`}
                      className="flex items-center gap-2 w-full"
                    >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    RFI
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href={`/projects/${projectId}/documents/FieldReview-${Date.now()}`}
                      className="flex items-center gap-2 w-full"
                    >
                    <Eye className="w-4 h-4 mr-2" />
                    Field Review
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href={`/projects/${projectId}/documents/PunchList-${Date.now()}`}
                      className="flex items-center gap-2 w-full"
                    >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Punch List
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-muted/5 rounded-lg border border-[#4DB6AC] dark:border-[#4DB6AC] hover:border-primary/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getDocumentIcon(doc.type)}
                    <span className="font-medium">{doc.number}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-[#E5E7EB] mb-2">{doc.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{doc.date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}