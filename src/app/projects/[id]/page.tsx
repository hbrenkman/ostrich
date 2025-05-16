"use client";

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { FolderKanban, Save, ArrowLeft, Plus, Trash2, MoreVertical, X, FileText, ClipboardList, MessageSquare, Eye, FileEdit, MapPin, Search, Edit2 } from 'lucide-react';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { verifyAddress } from '@/lib/geocodio';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EditContactDialog } from '@/components/ui/EditContactDialog';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import debounce from 'lodash/debounce';

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
  id: string;
  project_id: string;
  number: string;
  overview: string | null;
  design_budget: number | null;
  construction_support_budget: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

interface ProjectDocument {
  id: string;
  type: 'CityComments' | 'Addenda' | 'RFI' | 'FieldReview' | 'PunchList';
  number: string;
  title: string;
  date: string;
  status: 'Draft' | 'Issued' | 'Responded' | 'Closed';
}

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

interface CompanyLocation {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  is_headquarters: boolean;
  status: string;
  location_type_id: string | null;
  company_id: string;
}

interface Role {
  id: string;
  name: string;
}

interface CompanyContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  direct_phone: string | null;
  role_id: string | null;
  location_id: string | null;
  status: string;
  company_id: string | null;
  role?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    zip: string;
    company_id: string;
    company?: {
      id: string;
      name: string;
    }
  }
}

interface ProjectState {
  number: string;
  name: string;
  type: string;
  typeId: string;
  company: string;
  companyLocationId: string;
  companyContactFirstName: string;
  companyContactLastName: string;
  projectLocationAddress: string;
  projectLocationCity: string;
  projectLocationState: string;
  projectLocationZip: string;
  projectLocationCountry: string;
  revision: number;
}

interface ProjectRevision {
  id: string;
  number: string;
  name: string;
  type_id: string;
  company_name: string;
  company_location_id: string | null;
  company_contact_first_name: string | null;
  company_contact_last_name: string | null;
  project_location_address: string | null;
  project_location_city: string | null;
  project_location_state: string | null;
  project_location_zip: string | null;
  project_location_country: string;
  revision: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export default function ProjectDetail() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params?.id as string;

  // State declarations
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [teamMemberOpen, setTeamMemberOpen] = useState(false);
  const [projectTypeOpen, setProjectTypeOpen] = useState(false);
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [projectLocationInput, setProjectLocationInput] = useState('');
  const [proposals, setProposals] = useState<FeeProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [isContactSearchOpen, setIsContactSearchOpen] = useState(false);
  const [isEditContactDialogOpen, setIsEditContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CompanyContact | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompanyContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [projectRevisions, setProjectRevisions] = useState<ProjectRevision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);

  // Function declarations
  const fetchCompanyLocations = async (companyName: string) => {
    try {
      const company = companies.find(c => c.name === companyName);
      if (!company) {
        console.error('Company not found:', companyName);
        return;
      }

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      if (error) throw error;
      setCompanyLocations(data || []);
    } catch (error) {
      console.error('Error fetching company locations:', error);
      toast.error('Failed to load company locations');
    }
  };

  const fetchCompanyContacts = async (companyId: string, locationId?: string) => {
    try {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          location:locations!inner(
            id,
            name,
            company_id
          )
        `)
        .eq('location.company_id', companyId);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.order('last_name');

      if (error) throw error;
      console.log('Fetched contacts:', data);
      setCompanyContacts(data || []);
    } catch (error) {
      console.error('Error fetching company contacts:', error);
      toast.error('Failed to load company contacts');
    }
  };

  const handleCompanyChange = async (companyId: string, companyName: string) => {
    setProject(prev => ({
      ...prev,
      company: companyName,
      companyLocationId: '', // Reset location when company changes
      companyContactFirstName: '', // Reset contact when company changes
      companyContactLastName: ''   // Reset contact when company changes
    }));
    
    // Fetch locations and all company contacts
    await fetchCompanyLocations(companyName);
    await fetchCompanyContacts(companyId);
  };

  // Update handleLocationChange
  const handleLocationChange = async (locationId: string) => {
    setProject(prev => ({
      ...prev,
      companyLocationId: locationId,
      companyContactFirstName: '',
      companyContactLastName: ''
    }));
    
    // Fetch contacts for the selected location
    if (project.company) {
      const company = companies.find(c => c.name === project.company);
      if (company) {
        await fetchCompanyContacts(company.id, locationId);
      }
    }
  };

  const handleProjectLocationChange = async (address: string) => {
    setProjectLocationInput(address);
    
    // Only verify if the address is complete enough
    if (address.length > 10) {
      console.log('Attempting to verify project location:', address);
      const verifiedAddress = await verifyAddress(address);
      console.log('Project location verification result:', verifiedAddress);
      
      if (verifiedAddress) {
        setProject(prev => ({
          ...prev,
          projectLocationAddress: verifiedAddress.address_line1,
          projectLocationCity: verifiedAddress.city,
          projectLocationState: verifiedAddress.state,
          projectLocationZip: verifiedAddress.zip,
          projectLocationCountry: 'USA' // Default to USA for now
        }));
      }
    }
  };

  // Add function to fetch proposals
  const fetchProposals = async (projectId: string) => {
    if (projectId === 'new') return;
    
    // Check if projectId is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    
    if (!isUUID) {
      // If projectId is not a UUID (it's a project number), we need to get the project's UUID first
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('number', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project UUID:', projectError);
        return;
      }

      if (!projectData?.id) {
        console.error('Project not found');
        return;
      }

      projectId = projectData.id;
    }
    
    setLoadingProposals(true);
    try {
      const { data, error } = await supabase
        .from('fee_proposals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load fee proposals');
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'production') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const isNewProject = projectId === 'new';
        
        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (companiesError) throw companiesError;
        console.log('Fetched companies:', companiesData);
        setCompanies(companiesData || []);

        // Fetch project types
        const { data: typesData, error: typesError } = await supabase
          .from('project_types')
          .select('*')
          .order('display_order');

        if (typesError) throw typesError;
        setProjectTypes(typesData || []);

        if (isNewProject) {
          // New project logic
          console.log('Fetching preview number for new project...');
          const { data: previewNumber, error: previewError } = await supabase
            .rpc('preview_next_project_number');

          console.log('Preview number response:', { previewNumber, previewError });

          if (previewError) throw previewError;
          
          // Find Building Systems type
          const buildingSystemsType = typesData?.find(t => t.name === 'Building Systems');
          
          console.log('Setting project number to:', previewNumber);
          
          setProject(prev => ({
            ...prev,
            number: previewNumber || '000',
            type: buildingSystemsType?.name || 'Building Systems',
            typeId: buildingSystemsType?.id
          }));
        } else {
          // Check if projectId is a UUID
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
          
          // Fetch existing project data with updated fields
          console.log('Fetching existing project data for ID:', projectId);
          let query = supabase
            .from('projects')
            .select(`
              *,
              type:project_types(name)
            `);

          if (!isUUID) {
            query = query
              .eq('number', projectId)
              .order('revision', { ascending: false })
              .limit(1);
          } else {
            query = query.eq('id', projectId);
          }

          const { data: projectData, error: projectError } = await query.single();

          if (projectError) throw projectError;

          console.log('Project data:', projectData);

          if (projectData) {
            console.log('Setting project with data:', {
              company_name: projectData.company_name,
              company_location_id: projectData.company_location_id,
              contact_first_name: projectData.company_contact_first_name,
              contact_last_name: projectData.company_contact_last_name
            });
            
            setProject({
              number: projectData.number,
              name: projectData.name,
              type: projectData.type.name,
              typeId: projectData.type_id,
              company: projectData.company_name,
              companyLocationId: projectData.company_location_id || '',
              companyContactFirstName: projectData.company_contact_first_name || '',
              companyContactLastName: projectData.company_contact_last_name || '',
              projectLocationAddress: projectData.project_location_address || '',
              projectLocationCity: projectData.project_location_city || '',
              projectLocationState: projectData.project_location_state || '',
              projectLocationZip: projectData.project_location_zip || '',
              projectLocationCountry: projectData.project_location_country || 'USA',
              revision: projectData.revision
            });

            // Set the search query if we have contact information
            if (projectData.company_contact_first_name || projectData.company_contact_last_name) {
              setSearchQuery(
                `${projectData.company_contact_first_name || ''} ${projectData.company_contact_last_name || ''}`.trim()
              );
            }

            // Fetch company locations if company name is selected
            if (projectData.company_name) {
              console.log('Project has company name:', projectData.company_name);
              console.log('Looking for company in companies list:', companiesData?.map(c => ({ id: c.id, name: c.name })));
              
              const company = companiesData?.find(c => c.name === projectData.company_name);
              if (company) {
                console.log('Found company:', { id: company.id, name: company.name });
                const { data: locationsData, error: locationsError } = await supabase
                  .from('locations')
                  .select('*')
                  .eq('company_id', company.id)
                  .order('name');

                if (locationsError) {
                  console.error('Error fetching locations:', locationsError);
                  throw locationsError;
                }

                console.log('Fetched locations:', locationsData?.map(loc => ({ 
                  id: loc.id, 
                  name: loc.name,
                  address: `${loc.address_line1}, ${loc.city}, ${loc.state} ${loc.zip}`
                })));
                
                setCompanyLocations(locationsData || []);

                // If we have a location ID, verify it exists
                if (projectData.company_location_id) {
                  const locationExists = locationsData?.some(loc => loc.id === projectData.company_location_id);
                  console.log('Checking if location exists:', {
                    location_id: projectData.company_location_id,
                    exists: locationExists,
                    locations: locationsData?.map(loc => loc.id)
                  });
                  if (!locationExists) {
                    console.warn('Project location ID not found in company locations:', projectData.company_location_id);
                  }
                }
              } else {
                console.warn('Company not found in companies list:', {
                  company_name: projectData.company_name,
                  companies: companiesData?.map(c => c.name)
                });
              }
            } else {
              console.log('Project has no company name set');
            }

            // Fetch all revisions for this project
            await fetchProjectRevisions(projectId);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  // Update project state
  const [project, setProject] = useState<ProjectState>({
    number: projectId === 'new' ? '' : '000',
    name: projectId === 'new' ? '' : '',
    type: projectId === 'new' ? 'Building Systems' : '',
    typeId: projectId === 'new' ? '' : '',
    company: projectId === 'new' ? '' : '',
    companyLocationId: '',
    companyContactFirstName: '',
    companyContactLastName: '',
    projectLocationAddress: '',
    projectLocationCity: '',
    projectLocationState: '',
    projectLocationZip: '',
    projectLocationCountry: 'USA',
    revision: 0
  });
  
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>(
    projectId === 'new' ? [] : [
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Get the latest revision number
      const latestRevision = projectRevisions.length > 0 
        ? Math.max(...projectRevisions.map(r => r.revision))
        : 0;

      if (projectId === 'new') {
        // Get the 'created' status ID
        const { data: statusData, error: statusError } = await supabase
          .from('project_status_types')
          .select('id')
          .eq('name', 'created')
          .single();

        if (statusError) throw statusError;

        const { data: projectNumber, error: numberError } = await supabase
          .rpc('increment_project_number');
        
        if (numberError) throw numberError;

        // Create the project with updated fields
        const { error: createError } = await supabase
          .from('projects')
          .insert([{
            number: projectNumber.toString().padStart(3, '0'),
            name: project.name,
            type_id: project.typeId,
            company_name: project.company,
            company_location_id: project.companyLocationId || null,
            company_contact_first_name: project.companyContactFirstName || null,
            company_contact_last_name: project.companyContactLastName || null,
            project_location_address: project.projectLocationAddress || null,
            project_location_city: project.projectLocationCity || null,
            project_location_state: project.projectLocationState || null,
            project_location_zip: project.projectLocationZip || null,
            project_location_country: project.projectLocationCountry,
            status_id: statusData.id,
            revision: 1,
            created_by: user.id,
            updated_by: user.id
          }]);

        if (createError) throw createError;
      } else {
        // For updates, create a new revision if there are changes
        const currentRevision = projectRevisions.find(r => r.revision === selectedRevision);
        if (!currentRevision) throw new Error('Current revision not found');

        // Check if there are any changes
        const hasChanges = 
          currentRevision.name !== project.name ||
          currentRevision.type_id !== project.typeId ||
          currentRevision.company_name !== project.company ||
          currentRevision.company_location_id !== project.companyLocationId ||
          currentRevision.company_contact_first_name !== project.companyContactFirstName ||
          currentRevision.company_contact_last_name !== project.companyContactLastName ||
          currentRevision.project_location_address !== project.projectLocationAddress ||
          currentRevision.project_location_city !== project.projectLocationCity ||
          currentRevision.project_location_state !== project.projectLocationState ||
          currentRevision.project_location_zip !== project.projectLocationZip ||
          currentRevision.project_location_country !== project.projectLocationCountry;

        if (hasChanges) {
          // Create new revision
          const { error: updateError } = await supabase
            .from('projects')
            .insert([{
              number: project.number,
              name: project.name,
              type_id: project.typeId,
              company_name: project.company,
              company_location_id: project.companyLocationId || null,
              company_contact_first_name: project.companyContactFirstName || null,
              company_contact_last_name: project.companyContactLastName || null,
              project_location_address: project.projectLocationAddress || null,
              project_location_city: project.projectLocationCity || null,
              project_location_state: project.projectLocationState || null,
              project_location_zip: project.projectLocationZip || null,
              project_location_country: project.projectLocationCountry,
              revision: latestRevision + 1,
              created_by: user.id,
              updated_by: user.id
            }]);

          if (updateError) throw updateError;
        } else {
          toast.success('No changes to save');
          return;
        }
      }

      router.push('/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    }
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

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const getProposalStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'on hold':
        return 'bg-accent text-accent-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  useEffect(() => {
    async function fetchRoles() {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setRoles(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Failed to load roles');
      }
    }

    fetchRoles();
  }, []);

  const handleSaveContact = async (contact: CompanyContact) => {
    try {
      if (contact.id) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email || null,
            mobile: contact.mobile || null,
            direct_phone: contact.direct_phone || null,
            role_id: contact.role_id || null,
            location_id: contact.location_id || null
          })
          .eq('id', contact.id);

        if (error) throw error;
        toast.success('Contact updated successfully');
      } else {
        // Create new contact
        const { data, error } = await supabase
          .from('contacts')
          .insert([{
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email || null,
            mobile: contact.mobile || null,
            direct_phone: contact.direct_phone || null,
            role_id: contact.role_id || null,
            location_id: contact.location_id || null,
            status: 'Active',
            company_id: contact.location?.company_id || null
          }])
          .select()
          .single();

        if (error) throw error;
        toast.success('Contact created successfully');
        
        // Update the project with the new contact names
        if (data) {
          setProject(prev => ({
            ...prev,
            companyContactFirstName: data.first_name,
            companyContactLastName: data.last_name
          }));
          // Find company by name to get ID for fetching contacts
          const company = companies.find(c => c.name === project.company);
          if (company) {
            await fetchCompanyContacts(company.id);
          }
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    }
  };

  // Update searchContacts to work with company name
  const searchContacts = useCallback(
    debounce(async (searchTerm: string) => {
      console.log('Debounced search function called with:', searchTerm);
      
      if (!searchTerm.trim()) {
        console.log('Search cancelled - empty query');
        setSearchResults([]);
        return;
      }

      console.log('Starting database search for:', searchTerm);
      setIsSearching(true);
      
      try {
        const searchPattern = `%${searchTerm}%`;
        console.log('Using search pattern:', searchPattern);

        let dbQuery = supabase
          .from('contacts')
          .select(`
            *,
            role:roles(id, name),
            location:locations(
              id,
              name,
              address_line1,
              address_line2,
              city,
              state,
              zip,
              company_id,
              company:companies(id, name)
            )
          `)
          .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`);

        // Only filter by company if one is selected
        if (project.company) {
          const company = companies.find(c => c.name === project.company);
          if (company) {
            console.log('Filtering by company ID:', company.id);
            dbQuery = dbQuery.eq('location.company_id', company.id);
          }
        }

        console.log('Executing search query...');
        const { data, error } = await dbQuery.order('last_name');

        if (error) {
          console.error('Search error:', error);
          throw error;
        }

        if (!data) {
          console.log('No data returned from search');
          setSearchResults([]);
          return;
        }

        console.log(`Found ${data.length} contacts matching "${searchTerm}"`);
        console.log('First result (if any):', data[0]);
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching contacts:', error);
        toast.error('Failed to search contacts');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [project.company, companies]
  );

  // Update the edit button click handler
  const handleEditContactClick = () => {
    const matchingContact = companyContacts.find(
      c => c.first_name === project.companyContactFirstName && 
           c.last_name === project.companyContactLastName
    );
    if (matchingContact) {
      setSelectedContact(matchingContact);
      setIsEditContactDialogOpen(true);
    }
  };

  // Update handleSearchChange to show results when typing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input changed:', e.target.value);
    const query = e.target.value.trim();
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
    
    if (query) {
      console.log('Triggering search for:', query);
      searchContacts(query);
    } else {
      console.log('Clearing search results');
      setSearchResults([]);
    }
  };

  // Update handleContactSelect to work with contact's location
  const handleContactSelect = async (contact: CompanyContact) => {
    console.log('Selected contact:', contact);
    
    // Keep the full name in the search bar
    setSearchQuery(`${contact.first_name} ${contact.last_name}`);
    setSearchResults([]);
    setShowSearchResults(false);

    // Update project with contact names
    setProject(prev => ({
      ...prev,
      companyContactFirstName: contact.first_name,
      companyContactLastName: contact.last_name
    }));

    // If contact has no location, open the edit dialog
    if (!contact.location_id) {
      console.log('Contact has no location, opening edit dialog');
      setSelectedContact(contact);
      setIsEditContactDialogOpen(true);
    } else {
      console.log('Contact has location_id:', contact.location_id);
      try {
        // Fetch the location details
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select(`
            *,
            company:companies(id, name)
          `)
          .eq('id', contact.location_id)
          .single();

        if (locationError) {
          console.error('Error fetching location:', locationError);
          throw locationError;
        }

        if (locationData) {
          console.log('Found location:', locationData);
          
          // Update project with company and location
          setProject(prev => ({
            ...prev,
            company: locationData.company.name,
            companyLocationId: locationData.id
          }));

          // Update company locations list
          const { data: companyLocationsData, error: companyLocationsError } = await supabase
            .from('locations')
            .select('*')
            .eq('company_id', locationData.company.id)
            .order('name');

          if (companyLocationsError) {
            console.error('Error fetching company locations:', companyLocationsError);
            throw companyLocationsError;
          }

          console.log('Fetched company locations:', companyLocationsData);
          setCompanyLocations(companyLocationsData || []);
        }
      } catch (error) {
        console.error('Error handling contact selection:', error);
        toast.error('Failed to load location information');
      }
    }
  };

  // Add effect to log search results changes
  useEffect(() => {
    if (searchQuery) {
      console.log('Search results updated:', searchResults);
    }
  }, [searchResults, searchQuery]);

  // Add function to fetch project revisions
  const fetchProjectRevisions = async (projectId: string) => {
    if (projectId === 'new') return;
    
    setIsLoadingRevisions(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('number', project.number)
        .order('revision', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched project revisions:', data);
      setProjectRevisions(data || []);
      
      // Set the latest revision as selected by default
      if (data && data.length > 0) {
        setSelectedRevision(data[0].revision);
      }
    } catch (error) {
      console.error('Error fetching project revisions:', error);
      toast.error('Failed to load project revisions');
    } finally {
      setIsLoadingRevisions(false);
    }
  };

  // Add function to load a specific revision
  const loadRevision = async (revision: number) => {
    const revisionData = projectRevisions.find(r => r.revision === revision);
    if (!revisionData) return;

    console.log('Loading revision:', revisionData);
    setSelectedRevision(revision);
    
    // Update project state with revision data
    setProject({
      number: revisionData.number,
      name: revisionData.name,
      type: projectTypes.find(t => t.id === revisionData.type_id)?.name || '',
      typeId: revisionData.type_id,
      company: revisionData.company_name,
      companyLocationId: revisionData.company_location_id || '',
      companyContactFirstName: revisionData.company_contact_first_name || '',
      companyContactLastName: revisionData.company_contact_last_name || '',
      projectLocationAddress: revisionData.project_location_address || '',
      projectLocationCity: revisionData.project_location_city || '',
      projectLocationState: revisionData.project_location_state || '',
      projectLocationZip: revisionData.project_location_zip || '',
      projectLocationCountry: revisionData.project_location_country || 'USA',
      revision: revisionData.revision
    });

    // If company is set, fetch its locations
    if (revisionData.company_name) {
      const company = companies.find(c => c.name === revisionData.company_name);
      if (company) {
        await fetchCompanyLocations(company.name);
      }
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
            <h1 className="text-h1">{projectId === 'new' ? 'New Project' : 'Edit Project'}</h1>
          </div>
        </div>
        {!isLoadingRevisions && projectRevisions.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Revision:</label>
            <Select
              value={selectedRevision?.toString()}
              onValueChange={(value) => loadRevision(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Select revision" />
              </SelectTrigger>
              <SelectContent>
                {projectRevisions.map((revision) => (
                  <SelectItem key={revision.revision} value={revision.revision.toString()}>
                    {revision.revision} ({new Date(revision.updated_at).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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

              {/* Contact Search Bar */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">Project Contact</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setShowSearchResults(true)}  // Show results when input is focused
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}  // Hide results when input loses focus
                      placeholder="Search contacts..."
                      className="w-full pl-9 pr-10 py-2 border border-[#D1D5DB] dark:border-[#4DB6AC] rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {project.companyContactFirstName && project.companyContactLastName && (
                      <button
                        type="button"
                        onClick={handleEditContactClick}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-primary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Show search results only when showSearchResults is true */}
                  {showSearchResults && searchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-[#D1D5DB] dark:border-[#4DB6AC] rounded-md shadow-lg">
                      <div className="max-h-60 overflow-auto">
                        {isSearching ? (
                          <div className="p-2 text-sm text-gray-500">Searching...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No contacts found.
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedContact({
                                  id: '',
                                  first_name: '',
                                  last_name: '',
                                  email: null,
                                  mobile: null,
                                  direct_phone: null,
                                  role_id: null,
                                  location_id: null,
                                  status: 'Active',
                                  company_id: null
                                });
                                setIsEditContactDialogOpen(true);
                              }}
                              className="ml-1 text-primary hover:underline"
                            >
                              Add new contact
                            </button>
                          </div>
                        ) : (
                          <div className="py-1">
                            {searchResults.map((contact) => (
                              <button
                                key={contact.id}
                                onClick={() => handleContactSelect(contact)}
                                className={`w-full px-3 py-2 text-left hover:bg-muted/5 focus:outline-none focus:bg-muted/5 ${
                                  contact.location_id 
                                    ? 'bg-green-50 dark:bg-green-900/20' 
                                    : 'bg-red-50 dark:bg-red-900/20'
                                }`}
                              >
                                <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                                <div className="text-sm text-gray-500">
                                  {contact.email || 'No email'}
                                  {contact.location_id ? (
                                    <span className="ml-2 text-green-600 dark:text-green-400">✓ Has location</span>
                                  ) : (
                                    <span className="ml-2 text-red-600 dark:text-red-400">⚠ Needs location</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Read-only Company and Location Display */}
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">Company & Location</label>
                  <div className="w-full min-h-[60px] px-3 py-2 border border-[#D1D5DB] dark:border-[#4DB6AC] rounded-md bg-muted/5">
                    {!project.company ? (
                      <span className="text-gray-500">No company selected</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {project.company}
                        </span>
                        {project.companyLocationId && (
                          <span className="text-sm text-gray-500 mt-1">
                            {companyLocations.find(loc => loc.id === project.companyLocationId)?.address_line1}
                            {companyLocations.find(loc => loc.id === project.companyLocationId)?.address_line2 && 
                              `, ${companyLocations.find(loc => loc.id === project.companyLocationId)?.address_line2}`}
                            {`, ${companyLocations.find(loc => loc.id === project.companyLocationId)?.city}, ${companyLocations.find(loc => loc.id === project.companyLocationId)?.state} ${companyLocations.find(loc => loc.id === project.companyLocationId)?.zip}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">Project Type</label>
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
                          {projectTypes.map((type) => (
                            <CommandItem
                              key={type.id}
                              value={type.name}
                              onSelect={() => {
                                setProject({ ...project, type: type.name, typeId: type.id });
                                setProjectTypeOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 flex-shrink-0",
                                  project.type === type.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{type.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Project Location Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-[#E5E7EB]">Project Location</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="projectLocation">Address</Label>
                    <Input
                      id="projectLocation"
                      value={projectLocationInput}
                      onChange={(e) => handleProjectLocationChange(e.target.value)}
                      placeholder="Paste full address from Google Maps"
                      className="mt-1"
                    />
                  </div>
                  {project.projectLocationAddress && (
                    <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                        <div className="space-y-1">
                          <span className="font-medium">
                            {project.projectLocationAddress}
                          </span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {project.projectLocationCity}, {project.projectLocationState} {project.projectLocationZip}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

          {/* Fee Proposals Section - Always show container */}
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

            {loadingProposals ? (
              <div className="text-sm text-gray-500">Loading proposals...</div>
            ) : proposals.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 dark:text-[#E5E7EB]">{proposal.number}</span>
                        <span className="text-sm text-gray-500">|</span>
                        <span className="text-sm text-gray-900 dark:text-[#E5E7EB]">{proposal.overview || 'No overview'}</span>
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
                        <span>{formatCurrency(proposal.design_budget)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Construction Support:</span>
                        <span>{formatCurrency(proposal.construction_support_budget)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Total:</span>
                        <span className="font-medium text-gray-900 dark:text-[#E5E7EB]">
                          {formatCurrency((proposal.design_budget || 0) + (proposal.construction_support_budget || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No proposals yet. Click "Add Proposal" to create one.</div>
            )}
          </div>

          <div className="flex justify-between">
            {projectId !== 'new' && (
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

      {/* Edit Contact Dialog */}
      {selectedContact && (
        <EditContactDialog
          open={isEditContactDialogOpen}
          onOpenChange={(open) => {
            setIsEditContactDialogOpen(open);
            if (!open) {
              setSelectedContact(null);
            }
          }}
          initialContact={selectedContact as any}
          roles={roles}
          onSave={handleSaveContact as any}
        />
      )}
    </div>
  );
}