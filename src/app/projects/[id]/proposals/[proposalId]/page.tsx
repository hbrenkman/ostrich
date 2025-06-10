"use client";

// When adding/updating/deleting a space or fee, calculate the construction cost, and trigger a caclculation in FixedFees.tsx.
// --------------------------------------------------------

import React, { useState, useEffect, DragEvent, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search, Building2, Layers, Building, Home, Pencil, SplitSquareVertical, GripVertical, ChevronDown, Copy } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SpaceDialog } from './components/space-dialog';
import { createClient } from '@supabase/supabase-js'
import FixedFees from './components/FixedFees';
import FlexFees from './components/FlexFees';
import { Space, Level, Structure, EngineeringService, EngineeringServiceLink, FeeTableProps } from './types';
import { EngineeringServicesManager } from './components/EngineeringServicesManager';
import { ContactSearch } from './components/ContactSearch';
import { ProposalActions } from './components/ProposalActions';
import { toast } from 'sonner';
import { ProposalLoader } from './components/ProposalLoader';
import { ProposalStructures } from './components/ProposalStructures';
import { ProposalData, ProposalDataRef } from './components/ProposalData';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  is_primary: boolean;
  details: {
    first_name: string;
    last_name: string;
    role_id: string | null;
    location_id: string | null;
    company_id: string | null;
    status: string;
    [key: string]: string | number | boolean | null;
  };
}

interface Project {
  id: string;
  number: string;
  name: string;
  company: string;
  costIndex: number | null;
}

interface ResCheckItem {
  id: string;
  name: string;
  description: string;
  default_min_value: number;
  isActive: boolean;
}

// Add a new interface for nested items
interface NestedFeeItem {
  id: string;
  name: string;
  description: string;
  default_min_value: number;
  isActive: boolean;
  discipline: string;
  parentDiscipline?: string;  // For items that nest under other disciplines
}

interface EngineeringAdditionalServices {
  id: string;
  name: string;
  description: string;
  phase: 'design' | 'construction';
  default_min_value: number;
  is_active: boolean;
  discipline?: string;  // Add discipline field
}

// Update interfaces to better handle different item types
interface FeeItem {
  id: string;
  name: string;
  description: string;
  default_min_value: number;
  isActive: boolean;
  discipline?: string;
  parentDiscipline?: string;
  type: 'rescheck' | 'nested' | 'multi' | 'discipline' | 'additional_service';
  phase: 'design' | 'construction';  // Add phase field
  service_name?: string;  // Optional for additional_service type
  estimated_fee?: string | null;  // Optional for additional_service type
}

// Keep the original CompanyContact type for ContactSearch
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

// Add ProposalContact type for ProposalData
interface ProposalContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  is_primary: boolean;
  details: {
    first_name: string;
    last_name: string;
    role_id: string | null;
    location_id: string | null;
    company_id: string | null;
    status: string;
    [key: string]: string | number | boolean | null;
  };
}

// Update ProposalFormData to use ProposalContact
interface ProposalFormData {
  number: number;
  displayNumber: string;
  projectNumber: string;
  projectName: string;
  company: string;
  clientContacts: ProposalContact[];  // Changed from Contact to ProposalContact
  overview: string;
  designBudget: string;
  constructionSupportBudget: string;
  status: 'Pending' | 'Active' | 'On Hold' | 'Cancelled' | 'Review' | 'Approved' | 'Edit';
  is_temporary_revision: boolean;  // Add this property
  structures: Structure[];
  costIndex: number | null;
  resCheckItems: ResCheckItem[];
  nestedFeeItems: NestedFeeItem[];
  designFeeScale: FeeScale[];
  duplicateStructureRates: FeeDuplicateStructure[];
  trackedServices: TrackedService[];
  dbEngineeringServices: EngineeringService[];
  engineeringAdditionalServices: EngineeringAdditionalServices[];
  phase: 'design' | 'construction';
}

interface FeeScale {
  construction_cost: number;
  prime_consultant_rate: number;
  fraction_of_prime_rate_mechanical: number;
  fraction_of_prime_rate_plumbing: number;
  fraction_of_prime_rate_electrical: number;
  fraction_of_prime_rate_structural: number;
}

interface EngineeringAdditionalServices {
  id: string;
  name: string;
  description: string;
  phase: 'design' | 'construction';
  default_min_value: number;
  is_active: boolean;
  discipline?: string;  // Add discipline field
}

interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (space: Omit<Space, 'id'>) => void;
  costIndex: number | null;
  initialSpace?: Space | null;
  structureId: string;
  levelId: string;
}

interface FeeDuplicateStructure {
  id: number;
  rate: number;
}

interface TrackedService {
  id: string;
  serviceId: string;
  service_name: string;
  name: string;
  discipline: string;
  isDefaultIncluded: boolean;
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  phase: 'design' | 'construction' | null;  // Allow null for phase
  customFee?: number;
  isConstructionAdmin: boolean;
  fee: number;
  structureId: string;
  levelId: string;
  spaceId: string;
  isIncluded: boolean;
}

// Add DebugState type
interface DebugState {
  lastAction: string | null;
    serviceId: string | null;
    oldIncluded: boolean | null;
    newIncluded: boolean | null;
  timestamp: number;
  error: string | null;
}

interface Fee {
  id: string;
  discipline: string;
  totalConstructionCost: number;
  isActive: boolean;
  costPerSqft: number;
}

// Update the contacts array to use the new Contact interface
const contacts: Contact[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    mobile: '+1 (555) 123-4567',
    direct_phone: '+1 (555) 123-4567',
    role_id: null,
    location_id: null,
    status: 'Active',
    company_id: null,
    is_primary: true,
    details: {
      first_name: 'John',
      last_name: 'Smith',
      role_id: null,
      location_id: null,
      company_id: null,
      status: 'Active'
    }
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    mobile: '+1 (555) 234-5678',
    direct_phone: '+1 (555) 234-5678',
    role_id: null,
    location_id: null,
    status: 'Active',
    company_id: null,
    is_primary: true,
    details: {
      first_name: 'Sarah',
      last_name: 'Johnson',
      role_id: null,
      location_id: null,
      company_id: null,
      status: 'Active'
    }
  },
  {
    id: '3',
    first_name: 'Michael',
    last_name: 'Brown',
    email: 'michael.brown@example.com',
    mobile: '+1 (555) 345-6789',
    direct_phone: '+1 (555) 345-6789',
    role_id: null,
    location_id: null,
    status: 'Active',
    company_id: null,
    is_primary: true,
    details: {
      first_name: 'Michael',
      last_name: 'Brown',
      role_id: null,
      location_id: null,
      company_id: null,
      status: 'Active'
    }
  },
];

// Add UUID generation fallback
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Add this with the other type definitions at the top of the file
type ProposalStatus = 'Edit' | 'Review' | 'Approved' | 'Published' | 'Active' | 'On Hold' | 'Cancelled';

// Add helper function for number padding
const padNumber = (num: number): string => {
  return num.toString().padStart(3, '0');
};

// Update helper function to only pad proposal number
const formatProposalDisplay = (proposalNumber: number, revisionNumber: number): string => {
  const paddedProposalNumber = proposalNumber.toString().padStart(3, '0');
  return `${paddedProposalNumber} Rev ${revisionNumber}`;
};

export default function EditProposalPage() {
  const router = useRouter();
  const params = useParams();
  
  if (!params) {
    router.push('/projects');
    return null;
  }

  const id = params.id as string;
  const proposalId = params.proposalId as string;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [editingStructureName, setEditingStructureName] = useState('');
  const [engineeringAdditionalServices, setEngineeringAdditionalServices] = useState<EngineeringAdditionalServices[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [dragData, setDragData] = useState<any>(null);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [duplicateStructureRates, setDuplicateStructureRates] = useState<FeeDuplicateStructure[]>([]);
  const [collapsedDuplicates, setCollapsedDuplicates] = useState<Set<string>>(new Set());
  const [engineeringStandardServices, setEngineeringStandardServices] = useState<EngineeringService[]>([]);
  const [isLoadingStandardServices, setIsLoadingStandardServices] = useState(false);
  const [isLoadingAdditionalServices, setIsLoadingAdditionalServices] = useState(true);
  const [phase, setPhase] = useState<'design' | 'construction'>('design');
  const [designFeeScale, setDesignFeeScale] = useState<FeeScale[]>([]);
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);  // Restore this state
  const [trackedServices, setTrackedServices] = useState<TrackedService[]>([]);
  const [collapsedServices, setCollapsedServices] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [userRole, setUserRole] = useState<'PM' | 'Manager' | 'Admin'>('PM'); // This should come from your auth system
  const [revisionNumber, setRevisionNumber] = useState('1');
  const [isTemporaryRevision, setIsTemporaryRevision] = useState(false);
  const [isProposalLoaded, setIsProposalLoaded] = useState(false);
  const proposalLoadAttempted = useRef(false);

  const [proposal, setProposal] = useState<ProposalFormData>({
    number: 0,
    displayNumber: '',
    projectNumber: '',
    projectName: '',
    company: '',
    clientContacts: [],
    overview: '',
    designBudget: '',
    constructionSupportBudget: '',
    status: 'Pending',
    is_temporary_revision: false,
    structures: [],
    costIndex: null,
    resCheckItems: [],
    nestedFeeItems: [],
    designFeeScale: [],
    duplicateStructureRates: [],
    trackedServices: [],
    dbEngineeringServices: [],
    engineeringAdditionalServices: [],
    phase: 'design'
  });

  // Add a ref to track if we're opening the dialog
  const isOpeningDialog = useRef(false);

  // Add ref with proper type
  const proposalDataRef = useRef<ProposalDataRef>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || id === '000') {
        router.push('/projects');
        return;
      }

      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.error('Project not found');
            router.push('/projects');
            return;
          }
          throw new Error(`Failed to fetch project: ${response.statusText}`);
        }
        const data = await response.json();
        // console.log('API Response data:', data);
        // console.log('API Response costIndex:', data.costIndex);
        setProject(data);
        setProposal(prev => {
          const updatedProposal = {
            ...prev,
            projectNumber: data.number,
            projectName: data.name,
            company: data.company,
            costIndex: data.costIndex,
          };
          // console.log('Updated proposal state:', updatedProposal);
          return updatedProposal;
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        router.push('/projects');
      }
    };

    fetchProject();
  }, [id, router]);

  // Update the fetchNextProposalNumber to use new format
  useEffect(() => {
    const fetchNextProposalNumber = async () => {
      if (proposalId === 'new' && !isProposalLoaded && !proposalLoadAttempted.current) {
        try {
          const response = await fetch('/api/proposal-number');
          if (!response.ok) {
            throw new Error('Failed to fetch next proposal number');
          }
          const data = await response.json();
          
          setProposal(prev => ({
            ...prev,
            number: data.next_number,  // Keep original number for calculations
            displayNumber: formatProposalDisplay(data.next_number, 1) // Use new format for display
          }));
        } catch (error) {
          console.error('Error fetching next proposal number:', error);
        }
      }
    };

    fetchNextProposalNumber();
  }, [proposalId, isProposalLoaded]);

  useEffect(() => {
    // console.log('Project cost index:', project?.costIndex);
    // console.log('Proposal cost index:', proposal.costIndex);
  }, [project?.costIndex, proposal?.costIndex]);

  // Remove or consolidate these logs in fetchEngineeringAdditionalServices
  const fetchEngineeringAdditionalServices = async () => {
    try {
      setIsLoadingAdditionalServices(true);
      // console.log('Fetching engineering additional services...');
      const response = await fetch('/api/fee-additional-items', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error fetching additional services:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.error || `Failed to fetch additional services: ${response.status} ${response.statusText}`);
      }
      
      const rawData = await response.json();
      // console.log('Raw additional services data:', rawData);
      
      const normalizedItems = rawData.map((item: any) => ({
        ...item,
        phase: item.phase || 'design',
        is_active: item.is_active ?? true
      }));

      // console.log('Normalized additional services:', normalizedItems);
      setEngineeringAdditionalServices(normalizedItems);
    } catch (error) {
      console.error('Error in fetchEngineeringAdditionalServices:', error);
      setEngineeringAdditionalServices([]); // Reset to empty array on error
    } finally {
      setIsLoadingAdditionalServices(false);
    }
  };

  // Remove redundant state logging in useEffect
  useEffect(() => {
    if (engineeringAdditionalServices.length > 0) {
      // Only log state changes when items are actually added/removed
      const designCount = engineeringAdditionalServices.filter(item => item.phase === 'design').length;
      const constructionCount = engineeringAdditionalServices.filter(item => item.phase === 'construction').length;
      const activeCount = engineeringAdditionalServices.filter(item => item.is_active).length;
      const inactiveCount = engineeringAdditionalServices.filter(item => !item.is_active).length;

      console.log('Engineering Additional Services updated:', {
        total: engineeringAdditionalServices.length,
        design: designCount,
        construction: constructionCount,
        active: activeCount,
        inactive: inactiveCount
      });
    }
  }, [engineeringAdditionalServices]);

  // Add a debug log when rendering the items
  // console.log('Current EngineeringAdditionalServices state:', engineeringAdditionalServices);
  // console.log('Total items count:', engineeringAdditionalServices.length);
  // console.log('Design phase items count:', engineeringAdditionalServices.filter((item: EngineeringAdditionalServices) => item.phase === 'design').length);
  // console.log('Construction phase items count:', engineeringAdditionalServices.filter((item: EngineeringAdditionalServices) => item.phase === 'construction').length);
  // console.log('Active items count:', engineeringAdditionalServices.filter((item: EngineeringAdditionalServices) => item.is_active).length);
  // console.log('Inactive items count:', engineeringAdditionalServices.filter((item: EngineeringAdditionalServices) => !item.is_active).length);

  // Add logging to track feeItems state
  // useEffect(() => {
  //   console.log('Current feeItems state:', {
  //     totalItems: proposal.feeItems.length,
  //     items: proposal.feeItems.map(item => ({
  //       id: item.id,
  //       name: item.name,
  //       type: item.type,
  //       discipline: item.discipline,
  //       parentDiscipline: item.parentDiscipline
  //     })),
  //     byType: {
  //       nested: proposal.feeItems.filter(item => item.type === 'nested').length,
  //       multi: proposal.feeItems.filter(item => item.type === 'multi').length,
  //       rescheck: proposal.feeItems.filter(item => item.type === 'rescheck').length,
  //       discipline: proposal.feeItems.filter(item => item.type === 'discipline').length
  //     }
  //   });
  // }, [proposal.feeItems]);

  // Add useEffect to fetch duplicate structure rates
  useEffect(() => {
    const fetchDuplicateStructureRates = async () => {
      try {
        // console.log('=== Fetching duplicate structure rates ===');
        // console.log('Making API request to /api/fee-duplicate-structures...');
        
        const response = await fetch('/api/fee-duplicate-structures');
        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API request failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to fetch duplicate structure rates: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', {
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'not an array',
          data: data
        });
        
        if (!Array.isArray(data)) {
          console.error('Invalid data format received:', data);
          throw new Error('Invalid data format received from API');
        }
        
        console.log('Setting duplicate structure rates in state:', {
          count: data.length,
          rates: data.map(r => ({ id: r.id, rate: r.rate }))
        });
        
        setDuplicateStructureRates(data);
        
        // Verify state was updated
        console.log('State after update:', {
          ratesLength: data.length,
          rates: data
        });
      } catch (error) {
        console.error('Error in fetchDuplicateStructureRates:', error);
      }
    };

    fetchDuplicateStructureRates();
  }, []);

  // Add useEffect to fetch engineering standard services
  useEffect(() => {
    const loadServices = async () => {
      setIsLoadingStandardServices(true);
      try {
        const response = await fetch('/api/engineering-services');
        if (!response.ok) throw new Error('Failed to fetch engineering services');
        const data = await response.json();
        console.log('API response:', data); // Add logging to see the response format
        if (!data.services || !Array.isArray(data.services)) {
          throw new Error('Invalid response format from API');
        }
        setEngineeringStandardServices(data.services);
        // Update proposal state immediately after loading services
        setProposal(prev => ({
          ...prev,
          dbEngineeringServices: data.services
        }));
      } catch (error) {
        console.error('Error loading engineering services:', error);
        // Set empty arrays on error to prevent undefined values
        setEngineeringStandardServices([]);
        setProposal(prev => ({
          ...prev,
          dbEngineeringServices: []
        }));
      } finally {
        setIsLoadingStandardServices(false);
      }
    };

    if (engineeringStandardServices.length === 0) {
      loadServices();
    }
  }, []);

  // Update the proposal state when services are loaded
  useEffect(() => {
    if (!isLoadingStandardServices && engineeringStandardServices.length > 0) {
      setProposal(prev => ({
        ...prev,
        dbEngineeringServices: engineeringStandardServices
      }));
    }
  }, [isLoadingStandardServices, engineeringStandardServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      router.push(`/projects/${id}`);
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (proposalId === 'new') {
      router.push('/projects');
      return;
    }

    try {
    setIsDeleting(true);
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete proposal');
      }

      router.push('/projects');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: string | number | undefined | null): string => {
    // Handle undefined or null values
    if (value === undefined || value === null) return '$0';
    
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(value));
    }
    
    // Remove any non-digit characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (!numericValue) return '$0';
    
    // Convert to number, round it, and format
    const number = Math.round(parseFloat(numericValue));
    if (isNaN(number)) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const getStatusColor = (status: ProposalFormData['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-primary text-primary-foreground';
      case 'Pending':
        return 'bg-secondary text-secondary-foreground';
      case 'On Hold':
        return 'bg-muted text-muted-foreground';
      case 'Cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  // Add a new useEffect to handle service updates when structures change
  useEffect(() => {
    // Only proceed if we have loaded engineering services
    if (!isLoadingStandardServices && engineeringStandardServices.length > 0) {
      // Find services that are included and have non-null min_fee, including construction admin services
      const servicesWithFees = engineeringStandardServices.filter(service => 
        service.isIncludedInFee &&  // Changed from isDefaultIncluded to isIncludedInFee
        (service.min_fee !== null || service.isConstructionAdmin)
      );

      if (servicesWithFees.length > 0) {
        const updatedTrackedServices: TrackedService[] = servicesWithFees.map(service => ({
          id: service.id,
          serviceId: service.id,
          service_name: service.service_name,
          name: service.service_name,
          discipline: service.discipline,
          isDefaultIncluded: service.isDefaultIncluded,
          min_fee: service.min_fee,
          rate: service.rate,
          fee_increment: service.fee_increment,
          phase: service.phase,
          isConstructionAdmin: service.isConstructionAdmin,
          fee: service.min_fee || 0,
          structureId: '',  // Will be set when service is associated with a structure
          levelId: '',      // Will be set when service is associated with a level
          spaceId: '',      // Will be set when service is associated with a space
          isIncluded: service.isIncludedInFee,  // Changed from isDefaultIncluded to isIncludedInFee
          customFee: undefined
        }));
        
        setTrackedServices(updatedTrackedServices);
      }
    }
  }, [isLoadingStandardServices, engineeringStandardServices]);



  // handleDrop: Handles dropping services onto a structure
  // Uses structure.id to identify the target structure and updates tracked services' structureId
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStructureId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Check if engineering services are loaded
      if (!proposal?.dbEngineeringServices || proposal.dbEngineeringServices.length === 0) {
        console.error('Engineering services not loaded yet');
        throw new Error('Engineering services not loaded yet. Please try again in a moment.');
      }

      const data = e.dataTransfer.getData('application/json');
      if (!data) {
        throw new Error('No data received in drop event');
      }

      const dragData = JSON.parse(data);
      console.log('Parsed drag data:', dragData);

      // Handle structure creation
      if (dragData.type === 'structure') {
        console.log('=== CREATING NEW STRUCTURE ===');
        console.log('Current dbEngineeringServices:', proposal.dbEngineeringServices.map(s => ({
          id: s.id,
          name: s.service_name,
          phase: s.phase,
          isDefaultIncluded: s.isDefaultIncluded
        })));
        
        // Create new structure with required properties and a default level
        const newStructure: Structure = {
          id: dragData.id,
          name: `Structure ${proposal.structures.length + 1}`,
          constructionType: 'Office',
          floorArea: "0",
          description: "New Structure",
          spaceType: "Office",
          discipline: "Mechanical",
          hvacSystem: "VAV System",
          levels: [{
        id: generateUUID(),  // Use the fallback function
        name: "Level 0",
        floorArea: "0",
            description: "Default Level",
        spaceType: "Office",
        discipline: "Mechanical",
        hvacSystem: "VAV System",
        spaces: []
          }],
        designFeeRate: 0,
        constructionSupportEnabled: false,
          designPercentage: 80
        };

        // Create tracked services for the new structure
        const newTrackedServices: TrackedService[] = [];
        
        // Get services from dbEngineeringServices that are included in fee
        const designServices = proposal.dbEngineeringServices.filter(service => 
          service.phase === 'design' && 
          service.isDefaultIncluded
        );
        
        const constructionServices = proposal.dbEngineeringServices.filter(service => 
          service.phase === 'construction' && 
          service.isDefaultIncluded
        );

        console.log('Filtered services for new structure:', {
          designServices: designServices.map(s => ({
            id: s.id,
            name: s.service_name,
            phase: s.phase,
            isDefaultIncluded: s.isDefaultIncluded
          })),
          constructionServices: constructionServices.map(s => ({
            id: s.id,
            name: s.service_name,
            phase: s.phase,
            isDefaultIncluded: s.isDefaultIncluded
          }))
        });

        // Create tracked services for both phases
        for (const service of [...designServices, ...constructionServices]) {
          const newService = {
            id: generateUUID(),  // Use the fallback function
            serviceId: service.id,
            service_name: service.service_name,
            name: service.service_name,
            discipline: service.discipline,
            isDefaultIncluded: service.isDefaultIncluded,
            min_fee: service.min_fee,
            rate: service.rate,
            fee_increment: service.fee_increment,
            phase: service.phase,
            isConstructionAdmin: service.isConstructionAdmin,
            fee: service.min_fee || 0,
            structureId: newStructure.id,
            levelId: newStructure.levels[0].id,
            spaceId: '',
            isIncluded: service.isDefaultIncluded,
            customFee: undefined
          };
          newTrackedServices.push(newService);
          console.log('Created tracked service:', {
            id: newService.id,
            serviceId: newService.serviceId,
            name: newService.service_name,
            phase: newService.phase,
            isDefaultIncluded: newService.isDefaultIncluded,
            isIncluded: newService.isIncluded,
            structureId: newService.structureId,
            levelId: newService.levelId
          });
        }

        console.log('Created new structure with services:', {
          structureId: newStructure.id,
          structureName: newStructure.name,
          defaultLevelId: newStructure.levels[0].id,
          servicesCount: newTrackedServices.length,
        designServicesCount: designServices.length,
        constructionServicesCount: constructionServices.length,
          allServices: newTrackedServices.map(s => ({
            id: s.id,
            name: s.service_name,
            phase: s.phase,
            isDefaultIncluded: s.isDefaultIncluded,
            isIncluded: s.isIncluded
          }))
        });

        // Update the proposal state with both the new structure and its tracked services
      setProposal(prev => {
          const updatedProposal = {
          ...prev,
          structures: [...prev.structures, newStructure],
          trackedServices: [...prev.trackedServices, ...newTrackedServices]
        };
          console.log('Updated proposal state:', {
            structuresCount: updatedProposal.structures.length,
            trackedServicesCount: updatedProposal.trackedServices.length,
            newTrackedServices: newTrackedServices.map(s => ({
              id: s.id,
              name: s.service_name,
              phase: s.phase,
              isDefaultIncluded: s.isDefaultIncluded,
              isIncluded: s.isIncluded
            }))
          });
          return updatedProposal;
        });
      }
      // Handle engineering service updates
      else if (dragData.type === 'engineering_service' && dragData.service && targetStructureId) {
        console.log('Updating engineering service...');
        const service = dragData.service as TrackedService;
        
        // Update the service's structureId and isIncluded status
        setProposal(prev => {
          const existingService = prev.trackedServices.find(ts => 
            ts.serviceId === service.id && 
            ts.structureId === targetStructureId
          );

          if (existingService) {
            // Update existing service
            return {
              ...prev,
              trackedServices: prev.trackedServices.map(ts => 
                ts.id === existingService.id 
                  ? { ...ts, isIncluded: true }
                  : ts
              )
            };
          }

          // Create new tracked service
          const newTrackedService: TrackedService = {
            id: crypto.randomUUID(),
            serviceId: service.id,
            service_name: service.service_name,
            name: service.service_name,
            discipline: service.discipline,
            isDefaultIncluded: service.isDefaultIncluded,
            min_fee: service.min_fee,
            rate: service.rate,
            fee_increment: service.fee_increment,
            phase: service.phase,
            isConstructionAdmin: service.isConstructionAdmin,
            fee: service.min_fee || 0,
            structureId: targetStructureId,
            levelId: '',
            spaceId: '',
            isIncluded: true,
            customFee: undefined
          };

          return {
            ...prev,
            trackedServices: [...prev.trackedServices, newTrackedService]
          };
        });
      }
      else {
        throw new Error('Invalid drag data format');
      }
    } catch (error) {
      console.error('Error in handleDrop:', error);
    }
  };

  // Update any remaining references to engineeringStandardServices to use dbEngineeringServices
  useEffect(() => {
    if (!isLoadingStandardServices && engineeringStandardServices.length > 0) {
      setProposal(prev => ({
        ...prev,
        dbEngineeringServices: engineeringStandardServices
      }));
    }
  }, [isLoadingStandardServices, engineeringStandardServices]);

  const handleAddFiveLevels = (structureId: string) => {
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) return;

    const currentLevelCount = structure.levels.length;
    const newLevels: Level[] = Array.from({ length: 5 }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Level ${currentLevelCount + index + 1}`,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "Mechanical", // Changed from MEP to Mechanical as default
      hvacSystem: "VAV System",
      spaces: []
    }));

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s =>
        s.id === structureId
          ? { ...s, levels: [...s.levels, ...newLevels] }
          : s
      )
    });
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, type: 'structure' | 'level') => {
    console.log('Starting drag of type:', type);
    setIsDragging(true);
    
    // Set the drag data with the correct type
    const dragData = {
      type,
      id: crypto.randomUUID()
    };
    
    console.log('Setting drag data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragData(null); // Clear the drag data when drag ends
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, isStructureContainer: boolean = false) => {
    e.preventDefault();
    
    // Check if the drag data contains our custom type
    const hasJsonData = e.dataTransfer.types.includes('application/json');
    if (!hasJsonData) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // Only allow level drops on structures
    if (!isStructureContainer) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data?.type === 'level') {
          e.dataTransfer.dropEffect = 'none';
          return;
        }
      } catch {
        // If we can't parse the data, don't allow the drop
        e.dataTransfer.dropEffect = 'none';
        return;
      }
    }
    
    e.dataTransfer.dropEffect = 'copy';
  };



  const handleAddSpace = async (space: Omit<Space, 'id'>) => {
    if (!space.structureId || !space.levelId) {
      console.error('No structure or level selected');
      return;
    }

    // Define default disciplines if not present
    const DISCIPLINES = ['Civil', 'Structural', 'Mechanical', 'Plumbing', 'Electrical'];
    const DEFAULT_COST_PER_SQFT = {
      'Civil': 0,
      'Structural': 0,
      'Mechanical': 46.95,
      'Plumbing': 31.3,
      'Electrical': 37.56
    };

    console.log('Page: handleAddSpace called with:', {
      space: {
        ...space,
        totalConstructionCosts: space.totalConstructionCosts.map(f => ({
          ...f,
          isActive: f.isActive
        })),
        totalCost: space.totalCost,
        totalCostPerSqft: space.totalCostPerSqft
      },
      structureId: space.structureId,
      levelId: space.levelId
    });

    // Log current proposal state before update
    console.log('Page: Current proposal state before adding space:', {
      structures: proposal.structures,
      constructionCosts: getConstructionCosts(proposal.structures)
    });

    // Create a new space with a unique ID and ensure all disciplines have construction costs
    const newSpace: Space = {
      id: crypto.randomUUID(),
      ...space,
      // Preserve the totalCost and totalCostPerSqft values
      totalCost: space.totalCost,
      totalCostPerSqft: space.totalCostPerSqft,
      // Initialize construction costs for all disciplines
      totalConstructionCosts: DISCIPLINES.map(discipline => {
        // Find existing fee for this discipline or create a new one
        const existingFee = space.totalConstructionCosts.find(f => f.discipline === discipline);
        const costPerSqft = existingFee?.costPerSqft ?? DEFAULT_COST_PER_SQFT[discipline as keyof typeof DEFAULT_COST_PER_SQFT] ?? 0;
        
        return {
          id: existingFee?.id || crypto.randomUUID(),
          discipline,
          isActive: existingFee?.isActive ?? true,
          costPerSqft,
          totalConstructionCost: costPerSqft * space.floorArea
        };
      })
    };

    // Log the new space being added
    console.log('Page: New space being added:', {
      ...newSpace,
      totalConstructionCosts: newSpace.totalConstructionCosts.map(f => ({
        ...f,
        isActive: f.isActive
      }))
    });

    // If we're editing an existing space, update it instead of creating a new one
    if (editingSpace) {
      setProposal(prev => {
        const updatedStructures = prev.structures.map(structure => {
          if (structure.id === space.structureId) {
            return {
              ...structure,
              levels: structure.levels.map(level => {
                if (level.id === space.levelId) {
                  return {
                    ...level,
                    spaces: level.spaces.map(sp => {
                      if (sp.id === editingSpace.id) {
                        // When editing, preserve existing fee IDs but use new active states and costs
                        return {
                          ...space,
                          id: sp.id,
                          // Preserve totalCost and totalCostPerSqft values
                          totalCost: space.totalCost,
                          totalCostPerSqft: space.totalCostPerSqft,
                          totalConstructionCosts: DISCIPLINES.map(discipline => {
                            const existingFee = space.totalConstructionCosts.find(f => f.discipline === discipline);
                            const costPerSqft = existingFee?.costPerSqft ?? DEFAULT_COST_PER_SQFT[discipline as keyof typeof DEFAULT_COST_PER_SQFT] ?? 0;
                            
                            return {
                              id: existingFee?.id || crypto.randomUUID(),
                              discipline,
                              isActive: existingFee?.isActive ?? true,
                              costPerSqft,
                              totalConstructionCost: costPerSqft * space.floorArea
                            };
                          })
                        };
                      }
                      return sp;
                    })
                  };
                }
                return level;
              })
            };
          }
          return structure;
        });

        // Calculate construction costs before updating proposal
        const updatedConstructionCosts = getConstructionCosts(updatedStructures);

        // Log the construction costs calculation
        console.log('Page: Calculated construction costs:', {
          updatedConstructionCosts,
          structureId: space.structureId,
          levelId: space.levelId,
          spaceId: editingSpace.id,
          defaultCosts: DEFAULT_COST_PER_SQFT
        });

        const updatedProposal = {
          ...prev,
          structures: updatedStructures
        };

        // Then update tracked services if needed
        if (space.engineeringServices?.length) {
          const newTrackedServices = space.engineeringServices.map(service => {
            // Find the original engineering service to get its fee values
            const originalService = engineeringStandardServices.find(s => s.id === service.id);
            return {
              id: crypto.randomUUID(),
              serviceId: service.id,
              service_name: service.service_name,
              name: service.service_name,
              discipline: service.discipline,
              isDefaultIncluded: true,
              min_fee: originalService?.min_fee ?? null,
              rate: originalService?.rate ?? null,
              fee_increment: originalService?.fee_increment ?? null,
              phase: 'design' as const,
              customFee: undefined,
              isConstructionAdmin: false,
              fee: 0,
              structureId: space.structureId,
              levelId: space.levelId,
              spaceId: editingSpace.id,
              isIncluded: service.isActive
            };
          });

          // Add new tracked services to the proposal
          updatedProposal.trackedServices = [
            ...prev.trackedServices.filter(ts => 
              !(ts.structureId === space.structureId && 
                ts.levelId === space.levelId && 
                ts.spaceId === editingSpace.id)
            ),
            ...newTrackedServices
          ];
        }

        // Log the updated proposal state
        console.log('Page: Updated proposal state after editing space:', {
          structures: updatedProposal.structures,
          constructionCosts: updatedConstructionCosts,
          trackedServices: updatedProposal.trackedServices
        });

        return updatedProposal;
      });
    } else {
      // For new spaces, update the proposal state
      setProposal(prev => {
        const updatedStructures = prev.structures.map(structure => {
          if (structure.id === space.structureId) {
            return {
              ...structure,
              levels: structure.levels.map(level => {
                if (level.id === space.levelId) {
                  return {
                    ...level,
                    spaces: [...level.spaces, newSpace]
                  };
                }
                return level;
              })
            };
          }
          return structure;
        });

        // Calculate construction costs before updating proposal
        const updatedConstructionCosts = getConstructionCosts(updatedStructures);

        // Log the construction costs calculation
        console.log('Page: Calculated construction costs:', {
          updatedConstructionCosts,
          structureId: space.structureId,
          levelId: space.levelId,
          spaceId: newSpace.id,
          defaultCosts: DEFAULT_COST_PER_SQFT
        });

        const updatedProposal = {
          ...prev,
          structures: updatedStructures
        };

        // Then update tracked services if needed
        if (space.engineeringServices?.length) {
          const newTrackedServices = space.engineeringServices.map(service => {
            // Find the original engineering service to get its fee values
            const originalService = engineeringStandardServices.find(s => s.id === service.id);
            return {
              id: crypto.randomUUID(),
              serviceId: service.id,
              service_name: service.service_name,
              name: service.service_name,
              discipline: service.discipline,
              isDefaultIncluded: true,
              min_fee: originalService?.min_fee ?? null,
              rate: originalService?.rate ?? null,
              fee_increment: originalService?.fee_increment ?? null,
              phase: 'design' as const,
              customFee: undefined,
              isConstructionAdmin: false,
              fee: 0,
              structureId: space.structureId,
              levelId: space.levelId,
              spaceId: newSpace.id,
              isIncluded: service.isActive
            };
          });

          // Add new tracked services to the proposal
          updatedProposal.trackedServices = [
            ...prev.trackedServices,
            ...newTrackedServices
          ];
        }

        // Log the updated proposal state
        console.log('Page: Updated proposal state after adding space:', {
          structures: updatedProposal.structures,
          constructionCosts: updatedConstructionCosts,
          trackedServices: updatedProposal.trackedServices
        });

        return updatedProposal;
      });
    }

    // Reset editing state
    setEditingSpace(null);
  };

  const handleAddLowerLevel = (structureId: string) => {
    const parentStructure = proposal.structures.find(s => s.id === structureId);
    if (!parentStructure) return;

    // Find the lowest level number
    const lowestLevel = parentStructure.levels.reduce((lowest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? lowest : Math.min(lowest, levelNum);
    }, 0);

    const newLevelName = `Level ${lowestLevel - 1}`;
    const newLevelId = crypto.randomUUID();
    const newLevel: Level = {
      id: newLevelId,
      name: newLevelName,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "Mechanical", // Changed from MEP to Mechanical as default
      hvacSystem: "VAV System",
      spaces: []
    };

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...parentStructure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(structure => {
        // If this is the parent structure
        if (structure.id === structureId) {
          return { ...structure, levels: updatedLevels };
        }
        // If this is a duplicate structure
        if (structure.parentId === structureId) {
          const duplicateNewLevel = {
            ...newLevel,
            id: crypto.randomUUID(),
            spaces: []
          };
          const duplicateUpdatedLevels = [...structure.levels, duplicateNewLevel].sort((a, b) => {
            const aNum = parseInt(a.name.split(' ')[1]);
            const bNum = parseInt(b.name.split(' ')[1]);
            return bNum - aNum;
          });
          return { ...structure, levels: duplicateUpdatedLevels };
        }
        return structure;
      })
    });
  };

  const handleAddUpperLevel = (structureId: string) => {
    // console.log('=== Adding Upper Level ===');
    // console.log('Structure ID:', structureId);
    
    const parentStructure = proposal.structures.find(s => s.id === structureId);
    if (!parentStructure) {
      console.log('Parent structure not found:', structureId);
      return;
    }
    console.log('Found parent structure:', {
      id: parentStructure.id,
      description: parentStructure.description,
      levels: parentStructure.levels.length
    });

    // Find the highest level number
    const highestLevel = parentStructure.levels.reduce((highest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
    }, -1);
    // console.log('Current highest level:', highestLevel);

    const newLevelName = `Level ${highestLevel + 1}`;
    const newLevelId = crypto.randomUUID();
    const newLevel: Level = {
      id: newLevelId,
      name: newLevelName,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "Mechanical", // Changed from MEP to Mechanical as default
      hvacSystem: "VAV System",
      spaces: []
    };

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...parentStructure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(structure => {
        // If this is the parent structure
        if (structure.id === structureId) {
          return { ...structure, levels: updatedLevels };
        }
        // If this is a duplicate structure
        if (structure.parentId === structureId) {
          const duplicateNewLevel = {
            ...newLevel,
            id: crypto.randomUUID(),
            spaces: []
          };
          const duplicateUpdatedLevels = [...structure.levels, duplicateNewLevel].sort((a, b) => {
            const aNum = parseInt(a.name.split(' ')[1]);
            const bNum = parseInt(b.name.split(' ')[1]);
            return bNum - aNum;
          });
          return { ...structure, levels: duplicateUpdatedLevels };
        }
        return structure;
      })
    });
  };

  const handleAddFiveUpperLevels = (structureId: string) => {
    const parentStructure = proposal.structures.find(s => s.id === structureId);
    if (!parentStructure) return;

    // Find the highest level number
    const highestLevel = parentStructure.levels.reduce((highest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
    }, -1);

    // Create new levels for parent
    const newLevels: Level[] = Array.from({ length: 5 }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Level ${highestLevel + index + 1}`,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "Mechanical", // Changed from MEP to Mechanical as default
      hvacSystem: "VAV System",
      spaces: []
    }));

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...parentStructure.levels, ...newLevels].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(structure => {
        // If this is the parent structure
        if (structure.id === structureId) {
          return { ...structure, levels: updatedLevels };
        }
        // If this is a duplicate structure
        if (structure.parentId === structureId) {
          // Create new levels for duplicate with new IDs
          const duplicateNewLevels = newLevels.map(level => ({
            ...level,
            id: crypto.randomUUID(),
            spaces: []
          }));
          const duplicateUpdatedLevels = [...structure.levels, ...duplicateNewLevels].sort((a, b) => {
            const aNum = parseInt(a.name.split(' ')[1]);
            const bNum = parseInt(b.name.split(' ')[1]);
            return bNum - aNum;
          });
          return { ...structure, levels: duplicateUpdatedLevels };
        }
        return structure;
      })
    });
  };

  const handleDuplicateLevel = (structureId: string, levelId: string) => {
    // console.log('=== Duplicating Level ===');
    // console.log('Structure ID:', structureId);
    // console.log('Level ID:', levelId);
    
    // Log current state of structures
    console.log('Current structures state:', proposal.structures.map(s => ({
      id: s.id,
      parentId: s.parentId,
      description: s.description,
      levels: s.levels.map(l => ({
        id: l.id,
        name: l.name,
        spaces: l.spaces.length
      }))
    })));

    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) {
      console.log('Structure not found:', structureId);
      return;
    }
    console.log('Found structure:', {
      id: structure.id,
      description: structure.description,
      parentId: structure.parentId,
      levels: structure.levels.length
    });

    const levelToDuplicate = structure.levels.find(l => l.id === levelId);
    if (!levelToDuplicate) {
      console.log('Level not found:', levelId);
      return;
    }
    console.log('Found level to duplicate:', {
      id: levelToDuplicate.id,
      name: levelToDuplicate.name,
      spaces: levelToDuplicate.spaces.length
    });

    // Get the level number from the name
    const levelNum = parseInt(levelToDuplicate.name.split(' ')[1]);
    if (isNaN(levelNum)) {
      console.log('Invalid level number in name:', levelToDuplicate.name);
      return;
    }
    console.log('Current level number:', levelNum);

    // Create a new level with duplicated spaces
    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${levelNum >= 0 ? levelNum + 1 : levelNum - 1}`,
      floorArea: levelToDuplicate.floorArea,
      description: levelToDuplicate.description,
      spaceType: levelToDuplicate.spaceType,
      discipline: "Mechanical", // Changed from MEP to Mechanical as default
      hvacSystem: levelToDuplicate.hvacSystem,
      spaces: levelToDuplicate.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID()
      }))
    };
    console.log('Created new level:', {
      id: newLevel.id,
      name: newLevel.name,
      spaces: newLevel.spaces.length
    });

    // Add the new level and sort
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });
    console.log('Updated levels array:', updatedLevels.map(l => ({
      id: l.id,
      name: l.name,
      spaces: l.spaces.length
    })));

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s => {
        if (s.id === structureId) {
          console.log('Updating parent structure:', s.id);
          return { ...s, levels: updatedLevels };
        }
        if (s.parentId === structureId) {
          console.log('Found duplicate structure:', {
            id: s.id,
            parentId: s.parentId,
            levels: s.levels.length
          });
          // Create a duplicate of the new level for the duplicate structure
          const duplicateNewLevel = {
            ...newLevel,
            id: crypto.randomUUID(),
            spaces: newLevel.spaces.map(space => ({
              ...space,
              id: crypto.randomUUID()
            }))
          };
          console.log('Created duplicate level:', {
            id: duplicateNewLevel.id,
            name: duplicateNewLevel.name,
            spaces: duplicateNewLevel.spaces.length
          });
          const duplicateUpdatedLevels = [...s.levels, duplicateNewLevel].sort((a, b) => {
            const aNum = parseInt(a.name.split(' ')[1]);
            const bNum = parseInt(b.name.split(' ')[1]);
            return bNum - aNum;
          });
          console.log('Updated duplicate levels:', duplicateUpdatedLevels.map(l => ({
            id: l.id,
            name: l.name,
            spaces: l.spaces.length
          })));
          return { ...s, levels: duplicateUpdatedLevels };
        }
        return s;
      })
    });

    // Log final state after update
    console.log('Final structures state:', proposal.structures.map(s => ({
      id: s.id,
      parentId: s.parentId,
      description: s.description,
      levels: s.levels.map(l => ({
        id: l.id,
        name: l.name,
        spaces: l.spaces.length
      }))
    })));
  };

  const handleDuplicateLevelUp = (structureId: string, levelId: string) => {
    console.log('=== Duplicating Level Up ===');
    console.log('Structure ID:', structureId);
    console.log('Level ID:', levelId);
    
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) {
      console.log('Structure not found:', structureId);
      return;
    }

    const levelToDuplicate = structure.levels.find(l => l.id === levelId);
    if (!levelToDuplicate) {
      console.log('Level not found:', levelId);
      return;
    }

    // Get the level number from the name
    const levelNum = parseInt(levelToDuplicate.name.split(' ')[1]);
    if (isNaN(levelNum)) {
      console.log('Invalid level number in name:', levelToDuplicate.name);
      return;
    }

    // Create a new level with duplicated spaces, one level up
    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${levelNum + 1}`,
      floorArea: levelToDuplicate.floorArea,
      description: levelToDuplicate.description,
      spaceType: levelToDuplicate.spaceType,
      discipline: "Mechanical", // Changed from MEP to Mechanical as default
      hvacSystem: levelToDuplicate.hvacSystem,
      spaces: levelToDuplicate.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID()
      }))
    };

    // Add the new level and sort
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s => {
        if (s.id === structureId) {
          return { ...s, levels: updatedLevels };
        }
        if (s.parentId === structureId) {
          const duplicateNewLevel = {
            ...newLevel,
            id: crypto.randomUUID(),
            spaces: newLevel.spaces.map(space => ({
              ...space,
              id: crypto.randomUUID()
            }))
          };
          const duplicateUpdatedLevels = [...s.levels, duplicateNewLevel].sort((a, b) => {
            const aNum = parseInt(a.name.split(' ')[1]);
            const bNum = parseInt(b.name.split(' ')[1]);
            return bNum - aNum;
          });
          return { ...s, levels: duplicateUpdatedLevels };
        }
        return s;
      })
    });
  };

  const handleDuplicateLevelDown = (structureId: string, levelId: string) => {
    console.log('=== Duplicating Level Down ===');
    console.log('Structure ID:', structureId);
    console.log('Level ID:', levelId);
    
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) {
      console.log('Structure not found:', structureId);
      return;
    }

    const levelToDuplicate = structure.levels.find(l => l.id === levelId);
    if (!levelToDuplicate) {
      console.log('Level not found:', levelId);
      return;
    }

    // Get the level number from the name
    const levelNum = parseInt(levelToDuplicate.name.split(' ')[1]);
    if (isNaN(levelNum)) {
      console.log('Invalid level number in name:', levelToDuplicate.name);
      return;
    }

    // Create a new level with duplicated spaces, one level down
    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${levelNum - 1}`,
      floorArea: levelToDuplicate.floorArea,
      description: levelToDuplicate.description,
      spaceType: levelToDuplicate.spaceType,
      discipline: "Mechanical", // Changed from MEP to Mechanical as default
      hvacSystem: levelToDuplicate.hvacSystem,
      spaces: levelToDuplicate.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID()
      }))
    };

    // Add the new level and sort
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s => {
        if (s.id === structureId) {
          return { ...s, levels: updatedLevels };
        }
        if (s.parentId === structureId) {
          const duplicateNewLevel = {
            ...newLevel,
            id: crypto.randomUUID(),
            spaces: newLevel.spaces.map(space => ({
              ...space,
              id: crypto.randomUUID()
            }))
          };
          const duplicateUpdatedLevels = [...s.levels, duplicateNewLevel].sort((a, b) => {
            const aNum = parseInt(a.name.split(' ')[1]);
            const bNum = parseInt(b.name.split(' ')[1]);
            return bNum - aNum;
          });
          return { ...s, levels: duplicateUpdatedLevels };
        }
        return s;
      })
    });
  };

  const getDuplicateNumber = (structures: Structure[], structure: Structure): number => {
    if (!structure.parentId) {
      return 0; // Parent structure is not a duplicate
    }

    // Count the total number of existing duplicates of this parent
    const totalDuplicates = structures.filter(s => s.parentId === structure.parentId).length;
    
    // If this is a new duplicate being created, add 1 to the total
    // If this is an existing duplicate, use its position in the array
    const duplicateIndex = structures.findIndex(s => s.id === structure.id);
    if (duplicateIndex === -1) {
      // This is a new duplicate being created
      return totalDuplicates + 1;
    } else {
      // This is an existing duplicate, count how many came before it
      const parentIndex = structures.findIndex(s => s.id === structure.parentId);
      const duplicatesBefore = structures
        .slice(parentIndex + 1, duplicateIndex)
        .filter(s => s.parentId === structure.parentId)
        .length;
      return duplicatesBefore + 1;
    }
  };

  const handleDuplicateStructure = (structureId: string) => {
    const structureToDuplicate = proposal.structures.find(s => s.id === structureId);
    if (!structureToDuplicate) return;

    // Count existing duplicates to get the next number
    const existingDuplicates = proposal.structures.filter(s => s.parentId === structureId).length;
    const duplicateNumber = existingDuplicates + 1;  // Add 1 to get the next number

    const newStructure: Structure = {
      id: crypto.randomUUID(),
      name: `${structureToDuplicate.name} (Duplicate ${duplicateNumber})`,
      constructionType: structureToDuplicate.constructionType,
      floorArea: structureToDuplicate.floorArea,
      description: structureToDuplicate.description,
      spaceType: structureToDuplicate.spaceType,
      discipline: structureToDuplicate.discipline,
      hvacSystem: structureToDuplicate.hvacSystem,
      levels: structureToDuplicate.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID(),
          totalConstructionCosts: space.totalConstructionCosts.map(fee => ({
            ...fee,
            id: crypto.randomUUID()
          }))
        }))
      })),
      parentId: structureId,
      designFeeRate: structureToDuplicate.designFeeRate,
      constructionSupportEnabled: structureToDuplicate.constructionSupportEnabled,
      designPercentage: structureToDuplicate.designPercentage
    };

    // Find all tracked services for the original structure
    const originalServices = proposal.trackedServices.filter(s => s.structureId === structureId);
    
    // Create new tracked services for the duplicate structure
    const newTrackedServices = originalServices.map(service => ({
      ...service,
      id: crypto.randomUUID(),
      structureId: newStructure.id,
      levelId: newStructure.levels[0].id, // Set to first level's ID
      spaceId: '', // Reset space ID as it's not associated with any space yet
    }));

    console.log('Duplicating structure and services:', {
      originalStructureId: structureId,
      newStructureId: newStructure.id,
      originalServicesCount: originalServices.length,
      newServicesCount: newTrackedServices.length,
      services: newTrackedServices.map(s => ({
        id: s.id,
        name: s.service_name,
        phase: s.phase,
        isIncluded: s.isIncluded,
        structureId: s.structureId
      }))
    });

    setProposal(prev => ({
      ...prev,
      structures: [...prev.structures, newStructure],
      trackedServices: [...prev.trackedServices, ...newTrackedServices]
    }));
  };

  const handleCopyStructure = (structureId: string) => {
    const structureToCopy = proposal.structures.find(s => s.id === structureId);
    if (!structureToCopy) return;

    const newStructure: Structure = {
      id: crypto.randomUUID(),
      name: `${structureToCopy.name} (Copy)`,  // Add "Copy" to name
      constructionType: structureToCopy.constructionType,
      floorArea: structureToCopy.floorArea,
      description: structureToCopy.description,
      spaceType: structureToCopy.spaceType,
      discipline: structureToCopy.discipline,
      hvacSystem: structureToCopy.hvacSystem,
      levels: structureToCopy.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID(),
          totalConstructionCosts: space.totalConstructionCosts.map(fee => ({
            ...fee,
            id: crypto.randomUUID()
          }))
        }))
      })),
      designFeeRate: structureToCopy.designFeeRate,
      constructionSupportEnabled: structureToCopy.constructionSupportEnabled,
      designPercentage: structureToCopy.designPercentage
    };

    setProposal(prev => ({
      ...prev,
      structures: [...prev.structures, newStructure]
    }));
  };

  const handleStructureNameUpdate = (structureId: string) => {
    console.log('=== Updating Structure Name ===');
    console.log('Structure ID:', structureId);
    console.log('New name:', editingStructureName);

    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) {
      console.log('Structure not found:', structureId);
      return;
    }

    // If this is a duplicate structure, don't allow editing
    if (structure.parentId) {
      console.log('Cannot edit duplicate structure name directly');
      setEditingStructureId(null);
      return;
    }

    // Find all duplicates of this structure
    const duplicates = proposal.structures.filter(s => s.parentId === structureId);
    console.log('Found duplicates:', duplicates.length);

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s => {
        // Update parent structure - don't add duplicate number to parent
        if (s.id === structureId) {
          console.log('Updating parent structure:', s.id);
          return { ...s, name: editingStructureName };
        }
        // Update duplicate structures
        if (s.parentId === structureId) {
          // Get the duplicate number from the existing name
          const match = s.name.match(/\(Duplicate (\d+)\)$/);
          const duplicateNumber = match ? parseInt(match[1]) : getDuplicateNumber(proposal.structures, s);
          console.log('Updating duplicate structure:', {
            id: s.id,
            duplicateNumber,
            newName: `${editingStructureName} (Duplicate ${duplicateNumber})`
          });
          return {
            ...s,
            name: `${editingStructureName} (Duplicate ${duplicateNumber})`
          };
        }
        return s;
      })
    });

    setEditingStructureId(null);
  };

  const calculateTotalSquareFootage = (structure: Structure): number => {
    return structure.levels.reduce((total, level) => {
      const levelTotal = level.spaces.reduce((levelSum, space) => {
        return levelSum + (space.floorArea || 0);
      }, 0);
      return total + levelTotal;
    }, 0);
  };

  const calculateTotalConstructionCost = (structure: Structure): number => {
    return structure.levels.reduce((total, level) => {
      const levelTotal = level.spaces.reduce((levelSum, space) => {
        // Use the totalCost value that was calculated and saved in space-dialog.tsx
        return levelSum + (space.totalCost || 0);
      }, 0);
      return total + levelTotal;
    }, 0);
  };

  // Add helper function to get duplicate rate
  const getDuplicateRate = (structure: Structure): number => {
    console.log('Getting duplicate rate for structure:', {
      id: structure.id,
      parentId: structure.parentId,
      description: structure.description,
      availableRates: duplicateStructureRates,
      ratesLength: duplicateStructureRates.length
    });

    if (!structure.parentId) {
      // Parent building always uses rate from id=1
      const parentRate = duplicateStructureRates.find(r => r.id === 1)?.rate ?? 1.0;
      console.log('Parent structure rate:', { rateId: 1, rate: parentRate, availableRates: duplicateStructureRates });
      return parentRate;
    }

    // For duplicate buildings, find the appropriate rate
    const duplicateNumber = getDuplicateNumber(proposal.structures, structure);
    const rateId = Math.min(duplicateNumber + 1, 10); // Cap at id=10
    const rate = duplicateStructureRates.find(r => r.id === rateId)?.rate ?? 1.0;
    
    console.log('Duplicate rate calculation:', {
      structureId: structure.id,
      parentId: structure.parentId,
      duplicateNumber,
      rateId,
      rate,
      availableRates: duplicateStructureRates,
      foundRate: duplicateStructureRates.find(r => r.id === rateId)
    });
    
    return rate;
  };

  const handleDesignFeeRateChange = (structureId: string, rate: number) => {
    setProposal({
      ...proposal,
      structures: proposal.structures.map(s => {
        if (s.id === structureId) {
          return { ...s, designFeeRate: rate };
        }
        if (s.parentId === structureId) {
          return { ...s, designFeeRate: rate };
        }
        return s;
      })
    });
  };

  // Add drag handlers for additional items
  const handleAdditionalItemDragStart = (e: DragEvent<HTMLDivElement>, item: EngineeringAdditionalServices) => {
    console.log('Starting drag of item:', {
      name: item.name,
      phase: item.phase,
      discipline: item.discipline
    });
    
    // Set the phase in the drag data so we can validate it on drop
    const dragData = {
      type: 'additional_item',
      item: {
        ...item,
        id: crypto.randomUUID(), // Generate new ID for the dropped item
      },
      phase: item.phase // Include the phase in the drag data
    };
    console.log('Setting drag data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    // Store the drag data in state
    setDragData(dragData);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Add helper function to determine if an item should be nested
  const shouldNestUnderDiscipline = (itemName: string, discipline: string, itemDiscipline?: string): boolean => {
    // If the item has a discipline field that matches the target discipline, it should nest
    if (itemDiscipline && itemDiscipline === discipline) return true;

    // Otherwise check the explicit nesting rules
    const nestingRules: { [key: string]: string[] } = {
      'Electrical': ['Site Photometry', 'Electrical Testing', 'Electrical Commissioning'],
      'Plumbing': ['Plumbing Testing', 'Plumbing Commissioning', 'Backflow Testing', 'Site/Oil Grease Interceptor'],
      'Mechanical': ['Mechanical Testing', 'Mechanical Commissioning', 'Air Balancing', 'Building Commissioning']
    };
    return nestingRules[discipline]?.includes(itemName) || false;
  };

  // Helper function to determine item type and handling
  const getItemType = (itemName: string, discipline: string | undefined, itemDiscipline?: string): FeeItem['type'] => {
    if (itemName === 'ResCheck') return 'rescheck';
    
    // If the item has a discipline field that matches the target discipline, it should be nested
    if (discipline && itemDiscipline && itemDiscipline === discipline) return 'nested';
    
    const nestedItems: { [key: string]: string[] } = {
      'Electrical': ['Site Photometry', 'Electrical Testing', 'Electrical Commissioning'],
      'Plumbing': ['Plumbing Testing', 'Plumbing Commissioning', 'Backflow Testing', 'Site/Oil Grease Interceptor'],
      'Mechanical': ['Mechanical Testing', 'Mechanical Commissioning', 'Air Balancing', 'Building Commissioning']
    };
    
    // If discipline is provided and item is in its nested items list
    if (discipline && nestedItems[discipline]?.includes(itemName)) return 'nested';
    
    // If the item name itself is a discipline
    if (['Electrical', 'Plumbing', 'Mechanical'].includes(itemName)) return 'discipline';
    
    // Default to multi for all other items
    return 'multi';
  };

  const updateFeesForService = (
    structureId: string,
    levelId: string,
    spaceId: string,
    service: TrackedService
  ) => {
    // Only proceed if the service has a non-null min_fee
    if (service.min_fee === null) {
      console.log('Service has no min_fee, skipping fee update');
      return;
    }

    // Since we've checked min_fee is not null, we can safely use it
    const minFee = service.min_fee;

    setProposal(prev => ({
      ...prev,
      structures: prev.structures.map(s => {
        if (s.id === structureId) {
          return {
            ...s,
            levels: s.levels.map(l => {
              if (l.id === levelId) {
                return {
                  ...l,
                  spaces: l.spaces.map(sp => {
                    if (sp.id === spaceId) {
                      // Find or create the fee for this discipline
                      const existingFee = sp.totalConstructionCosts.find(f => f.discipline === service.discipline);
                      if (existingFee) {
                        // Accumulate the fee instead of replacing it
                        return {
                          ...sp,
                          totalConstructionCosts: sp.totalConstructionCosts.map(f => 
                            f.id === existingFee.id 
                              ? { ...f, totalConstructionCost: (f.totalConstructionCost || 0) + minFee }
                              : f
                          )
                        };
                      } else {
                        // Add new fee
                        return {
                          ...sp,
                          totalConstructionCosts: [
                            ...sp.totalConstructionCosts,
                            {
                              id: crypto.randomUUID(),
                              discipline: service.discipline,
                              totalConstructionCost: minFee,
                              isActive: true,
                              costPerSqft: 0
                            }
                          ]
                        };
                      }
                    }
                    return sp;
                  })
                };
              }
              return l;
            })
          };
        }
        return s;
      })
    }));

    console.log('Updated fees for service:', service.service_name);
  };

  // Add a helper function to determine if a drop is allowed
  const isDropAllowed = (e: DragEvent<HTMLDivElement>, targetPhase: 'design' | 'construction'): boolean => {
    if (!dragData) return false;
    return dragData.type === 'additional_item' && dragData.phase === targetPhase;
  };

  // Add handler for editing space
  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setIsSpaceDialogOpen(true);
  };

  // Update SpaceDialog to handle edit mode
  const handleSpaceDialogClose = () => {
    setIsSpaceDialogOpen(false);
    setEditingSpace(null);
  };

  const calculateLevelArea = (level: Level): number => {
    return level.spaces.reduce((total, space) => {
      return total + (space.floorArea || 0);
    }, 0);
  };

  // Add a handler for toggling construction support
  const handleConstructionSupportToggle = (structureId: string, enabled: boolean) => {
    setProposal({
      ...proposal,
      structures: proposal.structures.map(s => {
        if (s.id === structureId) {
          return { ...s, constructionSupportEnabled: enabled };
        }
        if (s.parentId === structureId) {
          return { ...s, constructionSupportEnabled: enabled };
        }
        return s;
      })
    });
  };

  // Add this helper function to renumber duplicates
  const renumberDuplicates = (structures: Structure[], parentId: string): Structure[] => {
    // Get all duplicates of this parent
    const duplicates = structures.filter(s => s.parentId === parentId);
    
    // Create a map of old to new numbers
    const duplicateMap = new Map();
    duplicates.forEach((dup, index) => {
      duplicateMap.set(dup.id, index + 1);
    });

    // Update the descriptions of all duplicates
    return structures.map(s => {
      if (s.parentId === parentId) {
        const newNumber = duplicateMap.get(s.id);
        const baseName = s.description.replace(/ \(Duplicate \d+\)$/, '');
        return {
          ...s,
          description: `${baseName} (Duplicate ${newNumber})`
        };
      }
      return s;
    });
  };

  // Add a helper function to toggle collapse state
  const toggleDuplicateCollapse = (structureId: string) => {
    setCollapsedDuplicates(prev => {
      const next = new Set(prev);
      if (next.has(structureId)) {
        next.delete(structureId);
      } else {
        next.add(structureId);
      }
      return next;
    });
  };

  // Add helper function to handle fee updates
  const handleFeeUpdate = (structureId: string, levelId: string, spaceId: string, feeId: string, updates: Partial<Fee>, feePhase: 'design' | 'construction') => {
    console.log('handleFeeUpdate called with:', { structureId, levelId, spaceId, feeId, updates, feePhase });
    
    setProposal((prev: ProposalFormData) => {
      const structure = prev.structures.find(s => s.id === structureId);
      if (!structure) return prev;

      const level = structure.levels.find(l => l.id === levelId);
      if (!level) return prev;

      const space = level.spaces.find(s => s.id === spaceId);
      if (!space) return prev;

      const feeIndex = space.totalConstructionCosts.findIndex(f => f.id === feeId);
      if (feeIndex === -1) return prev;

      // Create a new array with the updated fee
      const updatedFees = [...space.totalConstructionCosts];
      updatedFees[feeIndex] = { 
        ...updatedFees[feeIndex],
        ...updates  // This will update any fee properties (isActive, designFee, constructionFee)
      };

      // Create new arrays with minimal updates
      const updatedSpaces = [...level.spaces];
      updatedSpaces[level.spaces.findIndex(s => s.id === spaceId)] = {
        ...space,
        totalConstructionCosts: updatedFees
      };

      const updatedLevels = [...structure.levels];
      updatedLevels[structure.levels.findIndex(l => l.id === levelId)] = {
        ...level,
        spaces: updatedSpaces
      };

      const updatedStructures = [...prev.structures];
      updatedStructures[prev.structures.findIndex(s => s.id === structureId)] = {
        ...structure,
        levels: updatedLevels
      };

      return {
        ...prev,
        structures: updatedStructures
      };
    });
  };

  // Add helper function to reset fees
  const handleResetFees = (structureId: string, discipline: string, spaceId?: string) => {
    // Remove manual override reset logic
    console.log('Resetting fees for:', { structureId, discipline, spaceId });
  };

  // Add helper function to format input value
  const formatInputValue = (value: number | null): string => {
    if (value === null) return '';
    return value.toString();
  };

  const parseInputValue = (value: string): number | null => {
    if (!value.trim()) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  // Add a handler for toggling discipline fees that will be passed to SpaceDialog
  const handleDisciplineFeeToggle = useCallback((structureId: string, levelId: string, spaceId: string, feeId: string, isActive: boolean): void => {
    // Skip fee updates if we're opening the dialog
    if (isOpeningDialog.current) return;

    console.log('Page: handleDisciplineFeeToggle called with:', {
      structureId,
      levelId,
      spaceId,
      feeId,
      isActive,
      currentProposalState: proposal // Log current state
    });

    setProposal((prev: ProposalFormData): ProposalFormData => {
      const newStructures = prev.structures.map((structure: Structure) => {
        if (structure.id !== structureId) return structure;
        
        return {
          ...structure,
          levels: structure.levels.map((level: Level) => {
            if (level.id !== levelId) return level;
            
            return {
              ...level,
              spaces: level.spaces.map((space: Space) => {
                if (space.id !== spaceId) return space;
                
                const updatedSpace = {
                  ...space,
                  totalConstructionCosts: space.totalConstructionCosts.map((fee: Fee) => {
                    if (fee.id !== feeId) return fee;
                    console.log('Page: Updating fee state:', {
                      feeId,
                      oldState: fee.isActive,
                      newState: isActive,
                      spaceName: space.name,
                      discipline: fee.discipline
                    });
                    return { ...fee, isActive };
                  })
                };
                console.log('Page: Updated space fees:', {
                  spaceName: space.name,
                  totalConstructionCosts: updatedSpace.totalConstructionCosts,
                  structureId,
                  levelId,
                  spaceId
                });
                return updatedSpace;
              })
            };
          })
        };
      });

      const newState = {
        ...prev,
        structures: newStructures
      };
      
      console.log('Page: New proposal state after toggle:', {
        structureId,
        levelId,
        spaceId,
        feeId,
        isActive,
        updatedStructures: newStructures
      });
      
      return newState;
    });
  }, [proposal]); // Add proposal to dependencies

  // Update the fee table toggle handler to properly update space fees
  const handleFeeTableToggle = (structureId: string, discipline: string, isActive: boolean) => {
    setProposal((prev: ProposalFormData): ProposalFormData => {
      const structure = prev.structures.find(s => s.id === structureId);
      if (!structure) return prev;

      // Get all spaces under this discipline
      const spacesWithDiscipline = structure.levels.flatMap(level =>
        level.spaces.filter(space => 
          space.totalConstructionCosts.some(fee => fee.discipline === discipline)
        )
      );

      // If we're enabling the discipline, enable all spaces
      // If we're disabling the discipline, disable all spaces
      const updatedStructures = prev.structures.map((s: Structure): Structure => {
        if (s.id === structureId) {
          const updatedLevels = s.levels.map((l: Level): Level => ({
            ...l,
            spaces: l.spaces.map((sp: Space): Space => ({
              ...sp,
              totalConstructionCosts: sp.totalConstructionCosts.map((f: Fee): Fee => {
                if (f.discipline === discipline) {
                  // Preserve all fee values when toggling active state
                  const updatedFee: Fee = { 
                    id: f.id,
                    discipline: f.discipline,
                    totalConstructionCost: f.totalConstructionCost,
                    isActive,
                    costPerSqft: f.costPerSqft
                  };
                  return updatedFee;
                }
                return f;
              })
            }))
          }));

          return {
            ...s,
            levels: updatedLevels
          };
        }
        return s;
      });

      return {
        ...prev,
        structures: updatedStructures
      };
    });
  };

  // Add useEffect to fetch engineering additional services
  useEffect(() => {
    fetchEngineeringAdditionalServices();
  }, []);

  // Update the handleDisciplineFeeToggle to match the expected signature
  const handleServiceToggle = (serviceId: string, isActive: boolean) => {
    // Implementation will be added later
    console.log('Service toggle:', serviceId, isActive);
  };

  // Update the handleDragStart for services
  const handleServiceDragStart = (e: DragEvent<HTMLDivElement>, service: EngineeringService) => {
    console.log('Starting service drag:', service.service_name);
    const dragData = {
      type: 'engineering_service',
      service: {
        ...service,
        isIncluded: service.isDefaultIncluded
      }
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Update the handleDragOver for the space container
  const handleSpaceDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('=== SPACE DRAG OVER ===');
    
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      console.log('Space drag over data:', jsonData);
      
      if (jsonData) {
        const data = JSON.parse(jsonData);
        console.log('Parsed space drag data:', data);
        
        if (data.type === 'engineering_service' || data.type === 'additional_service') {
          e.dataTransfer.dropEffect = 'move';
          console.log('Setting drop effect to move for space');
          return;
        }
      }
    } catch (error) {
      console.error('Error in space drag over:', error);
    }
    
    e.dataTransfer.dropEffect = 'none';
    console.log('Setting drop effect to none for space');
  };

  // Update the service update handler in the main component
  const handleServiceUpdate = async (serviceId: string, updates: Partial<EngineeringService>) => {
    console.log('Updating service state:', serviceId, updates);
    
    try {
      // Find the current service data
      const currentService = engineeringStandardServices.find(s => s.id === serviceId);
      if (!currentService) {
        throw new Error('Service not found');
      }

      // Combine current service data with updates
      const updatedServiceData = {
        ...currentService,
        ...updates
      };

      // Make API call to update the service
      const response = await fetch(`/api/engineering-services?id=${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedServiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update service');
      }

      const updatedService = await response.json();
      console.log('Service updated successfully:', updatedService);

      // Update the local state with the response from the server
      setEngineeringStandardServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId ? { ...service, ...updatedService } : service
        )
      );
    } catch (error) {
      console.error('Error updating service:', error);
      // Revert the local state if the API call fails
      setEngineeringStandardServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId ? { ...service, isDefaultIncluded: !updates.isDefaultIncluded } : service
        )
      );
    }
  };

  // Add logging for trackedServices changes
  useEffect(() => {
    // Remove console.clear() to preserve our logs
    console.group('=== TrackedServices Updated ===');
    console.log('Total services:', trackedServices.length);
    console.log('Services:', trackedServices.map(service => ({
      id: service.id,
      name: service.service_name,
      discipline: service.discipline,
      isDefaultIncluded: service.isDefaultIncluded,
      min_fee: service.min_fee,
      rate: service.rate,
      fee_increment: service.fee_increment,
      phase: service.phase
    })));
    console.groupEnd();
  }, [trackedServices]);

  // Add handler for services change
  const handleServicesChange = (structureId: string, services: TrackedService[]) => {
    // Update the tracked services for this structure
    const updatedServices = proposal.trackedServices.filter(service => service.structureId !== structureId);
    updateProposal({
      ...proposal,
      trackedServices: [...updatedServices, ...services]
    });
  };

  // Add handler for service fee updates
  const handleServiceFeeUpdate = (serviceId: string, discipline: string, fee: number, phase: 'design' | 'construction' | null) => {
    console.group('Service Fee Update');
    console.log('Updating service:', { serviceId, discipline, fee, phase });
    
    setProposal(prev => {
      const updatedServices = prev.trackedServices.map(service => {
        if (service.id === serviceId) {
          // Calculate the default fee for comparison
          const calculatedFee = service.min_fee ?? 0;
          const hasCustomFee = fee !== calculatedFee;
          
          console.log('Service update:', {
            service: service.service_name,
            discipline,
            oldFee: service.customFee,
            newFee: fee,
            calculatedFee,
            hasCustomFee
          });
          
          return {
            ...service,
            customFee: hasCustomFee ? fee : undefined,
            isIncluded: true
          };
        }
        return service;
      });
      
      console.log('Updated services:', updatedServices);
      console.groupEnd();
      
      return {
        ...prev,
        trackedServices: updatedServices
      };
    });
  };

  // Add handleDeleteSpace function before the return statement
  const handleDeleteSpace = (structureId: string, levelId: string, spaceId: string) => {
    // Update proposal state to remove the space
    setProposal(prev => {
      const updatedStructures = prev.structures.map(s => {
        if (s.id === structureId) {
          return {
            ...s,
            levels: s.levels.map(l => {
              if (l.id === levelId) {
                return {
                  ...l,
                  spaces: l.spaces.filter(sp => sp.id !== spaceId)
                };
              }
              return l;
            })
          };
        }
        return s;
      });

      // Clean up tracked services for the deleted space
      const updatedTrackedServices = prev.trackedServices.filter(
        service => !(service.structureId === structureId && 
                    service.levelId === levelId && 
                    service.spaceId === spaceId)
      );

      return {
        ...prev,
        structures: updatedStructures,
        trackedServices: updatedTrackedServices
      };
    });
  };

  // --- Add construction cost calculation ---
  const getConstructionCosts = (structures: Structure[]): Record<string, Record<string, number>> => {
    const costs: Record<string, Record<string, number>> = {};
    
    // Define which disciplines should have fees
    const DISCIPLINES_WITH_FEES = ['Mechanical', 'Plumbing', 'Electrical'];
    const ALL_DISCIPLINES = ['Civil', 'Structural', ...DISCIPLINES_WITH_FEES];

    for (const structure of structures) {
      // Initialize costs object for this structure with all disciplines and total
      costs[structure.id] = {
        ...Object.fromEntries(ALL_DISCIPLINES.map(d => [d, 0])),
        'Total': 0  // Add Total to store the total construction cost
      };

      for (const level of structure.levels) {
        for (const space of level.spaces) {
          // Add the total construction cost from the space (this comes from the "Total" cost type in construction_costs table)
          costs[structure.id]['Total'] += space.totalCost || 0;

          // Add costs for each discipline fee (these are used for fee calculations only)
          for (const fee of space.totalConstructionCosts) {
            // Skip if the fee is not active
            if (!fee.isActive) continue;

            // Calculate the cost for this fee
            const cost = fee.costPerSqft * space.floorArea;
            costs[structure.id][fee.discipline] += cost;
            
            // Only log fee calculations for disciplines that should have fees
            if (DISCIPLINES_WITH_FEES.includes(fee.discipline)) {
              console.log('getConstructionCosts: Fee calculation:', {
                structureId: structure.id,
                structureName: structure.name,
                levelId: level.id,
                spaceId: space.id,
                spaceName: space.name,
                discipline: fee.discipline,
                costPerSqft: fee.costPerSqft,
                floorArea: space.floorArea,
                calculatedCost: cost,
                isActive: fee.isActive,
                runningTotal: costs[structure.id][fee.discipline],
                spaceTotalCost: space.totalCost  // Log the total cost from the space
              });
            }
          }
        }
      }

      // Log the total construction cost for the structure
      console.log('getConstructionCosts: Structure total:', {
        structureId: structure.id,
        structureName: structure.name,
        totalCost: costs[structure.id]['Total']
      });
    }

    return costs;
  };

  const handleConstructionCostUpdate = (structureId: string, levelId: string, spaceId: string, feeId: string, updates: Partial<Fee>, feePhase: 'design' | 'construction') => {
    // This function updates construction costs for a space, which are then used to calculate fees
    setProposal(prev => {
      const structure = prev.structures.find(s => s.id === structureId);
      if (!structure) return prev;

      const level = structure.levels.find(l => l.id === levelId);
      if (!level) return prev;

      const space = level.spaces.find(s => s.id === spaceId);
      if (!space) return prev;

      const feeIndex = space.totalConstructionCosts.findIndex(f => f.id === feeId);
      if (feeIndex === -1) return prev;

      // Create a new array with just the updated construction cost
      const updatedConstructionCosts = [...space.totalConstructionCosts];
      updatedConstructionCosts[feeIndex] = { ...updatedConstructionCosts[feeIndex], isActive: updates.isActive! };

      // Update the space with the new construction costs
      const updatedSpaces = [...level.spaces];
      updatedSpaces[level.spaces.findIndex(s => s.id === spaceId)] = {
        ...space,
        totalConstructionCosts: updatedConstructionCosts
      };

      // Update the level with the new spaces
      const updatedLevels = structure.levels.map(l =>
        l.id === levelId
          ? { ...l, spaces: updatedSpaces }
          : l
      );

      // Update the structure with the new levels
      const updatedStructures = prev.structures.map(s =>
        s.id === structureId
          ? { ...s, levels: updatedLevels }
          : s
      );

      return {
        ...prev,
        structures: updatedStructures
      };
    });

    setProposal(prev => {
      const updated = {
        ...prev,
        structures: prev.structures.map(s => {
          if (s.id === structureId) {
            return {
              ...s,
              levels: s.levels.map(l => {
                if (l.id === levelId) {
                  return {
                    ...l,
                    spaces: l.spaces.map(sp => {
                      if (sp.id === spaceId) {
                        return {
                          ...sp,
                          totalConstructionCosts: sp.totalConstructionCosts.map(f => {
                            if (f.id === feeId) {
                              // When toggling active state, only update isActive
                              if ('isActive' in updates) {
                                return { ...f, isActive: updates.isActive ?? f.isActive };
                              }
                            }
                            return f;
                          })
                        };
                      }
                      return sp;
                    })
                  };
                }
                return l;
              })
            };
          }
          return s;
        }),
        designFeeScale: prev.designFeeScale,
        duplicateStructureRates: prev.duplicateStructureRates,
        trackedServices: prev.trackedServices,
      };
      console.log('[handleConstructionCostUpdate] Updated proposal:', {
        structures: updated.structures,
        designFeeScale: updated.designFeeScale,
        duplicateStructureRates: updated.duplicateStructureRates,
        trackedServices: updated.trackedServices,
        constructionCosts: getConstructionCosts(updated.structures)
      });
      return updated;
    });
  };

  const handleDeleteLevel = (structureId: string, levelId: string) => {
    setProposal(prev => ({
      ...prev,
      structures: prev.structures.map(s => {
        if (s.id === structureId) {
          return {
            ...s,
            levels: s.levels.filter(l => l.id !== levelId)
          };
        }
        if (s.parentId === structureId) {
          return {
            ...s,
            levels: s.levels.filter(l => l.name !== prev.structures.find(s => s.id === structureId)?.levels.find(l => l.id === levelId)?.name)
          };
        }
        return s;
      })
    }));
  };

  // Update the useEffect that initializes tracked services
  useEffect(() => {
    // Only run if services have just loaded and there are structures but no tracked services
    if (!isLoadingStandardServices && 
        engineeringStandardServices.length > 0 && 
        proposal.structures.length > 0 && 
        proposal.trackedServices.length === 0) {  // Only run if there are no tracked services
      
      console.log('Initializing tracked services for structures:', {
        structuresCount: proposal.structures.length,
        existingTrackedServices: proposal.trackedServices.length
      });

      // For each structure, create tracked services for both phases
      let newTrackedServices: TrackedService[] = [];
      for (const structure of proposal.structures) {
        for (const phase of ['design', 'construction'] as const) {
          const defaultServices = engineeringStandardServices.filter((service: EngineeringService) =>
            service.phase === phase &&
            service.isDefaultIncluded
          );
          const servicesForPhase: TrackedService[] = defaultServices.map((service: EngineeringService): TrackedService => ({
            id: crypto.randomUUID(),
            serviceId: service.id,
            service_name: service.service_name,
            name: service.service_name,
            discipline: service.discipline,
            isDefaultIncluded: service.isDefaultIncluded,
            min_fee: service.min_fee,
            rate: service.rate,
            fee_increment: service.fee_increment,
            phase: service.phase || 'design',
            isConstructionAdmin: service.isConstructionAdmin,
            fee: service.min_fee || 0,
            structureId: structure.id,
            levelId: '',
            spaceId: '',
            isIncluded: service.isDefaultIncluded, // Use isDefaultIncluded instead of isIncludedInFee
            customFee: undefined
          }));
          newTrackedServices = newTrackedServices.concat(servicesForPhase);
        }
      }

      console.log('Created new tracked services:', {
        structuresCount: proposal.structures.length,
        servicesCount: newTrackedServices.length,
        services: newTrackedServices.map(s => ({
          id: s.id,
          name: s.service_name,
          phase: s.phase,
          isDefaultIncluded: s.isDefaultIncluded,
          structureId: s.structureId,
          levelId: s.levelId
        }))
      });

      setProposal(prev => ({
        ...prev,
        trackedServices: newTrackedServices  // Replace instead of append
      }));
    }
  }, [isLoadingStandardServices, engineeringStandardServices, proposal.structures, proposal.trackedServices.length]);

  // Update handleDeleteStructure to properly clean up state
  const handleDeleteStructure = (structureId: string) => {
    setProposal(prev => ({
      ...prev,
      structures: prev.structures.filter(s => s.id !== structureId && s.parentId !== structureId)
    }));
  };


  // Remove the useEffect that was creating trackedServices on load
  // (Remove the useEffect that was watching engineeringStandardServices and proposal.structures.length)

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Add your publish logic here
      // For example:
      // await supabase.from('proposals').update({ status: 'Active' }).eq('id', proposalId);
      toast.success('Proposal published successfully');
    } catch (error) {
      console.error('Error publishing proposal:', error);
      toast.error('Failed to publish proposal');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReview = async () => {
    setIsReviewing(true);
    try {
      // Update proposal status to Review
      await fetch(`/api/proposals/${proposalId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setProposal(prev => ({ ...prev, status: 'Review' }));
      toast.success('Proposal submitted for review');
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error('Failed to submit proposal for review');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Update proposal status to Approved
      await fetch(`/api/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setProposal(prev => ({ ...prev, status: 'Approved' }));
      toast.success('Proposal approved');
    } catch (error) {
      console.error('Error approving proposal:', error);
      toast.error('Failed to approve proposal');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (feedback: string) => {
    setIsRejecting(true);
    try {
      // Update proposal status to Edit with feedback
      await fetch(`/api/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      setProposal(prev => ({ ...prev, status: 'Edit' }));
      toast.success('Proposal rejected');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Failed to reject proposal');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClientApprove = async () => {
    try {
      // Update proposal status to Active
      await fetch(`/api/proposals/${proposalId}/client-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setProposal(prev => ({ ...prev, status: 'Active' }));
      toast.success('Client approval recorded');
    } catch (error) {
      console.error('Error recording client approval:', error);
      toast.error('Failed to record client approval');
    }
  };

  const handleClientReject = async () => {
    try {
      // Update proposal status to Edit
      await fetch(`/api/proposals/${proposalId}/client-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setProposal(prev => ({ ...prev, status: 'Edit' }));
      toast.success('Client rejection recorded');
    } catch (error) {
      console.error('Error recording client rejection:', error);
      toast.error('Failed to record client rejection');
    }
  };

  const handleHold = async () => {
    try {
      // Update proposal status to On Hold
      await fetch(`/api/proposals/${proposalId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setProposal(prev => ({ ...prev, status: 'On Hold' }));
      toast.success('Proposal placed on hold');
    } catch (error) {
      console.error('Error placing proposal on hold:', error);
      toast.error('Failed to place proposal on hold');
    }
  };

  const handleCancel = async () => {
    try {
      // Update proposal status to Cancelled
      await fetch(`/api/proposals/${proposalId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setProposal(prev => ({ ...prev, status: 'Cancelled' }));
      toast.success('Proposal cancelled');
    } catch (error) {
      console.error('Error cancelling proposal:', error);
      toast.error('Failed to cancel proposal');
    }
  };

  // Add handler for proposal data
  const handleProposalLoad = (proposalData: any) => {
    if (proposalLoadAttempted.current) {
      console.log('Skipping duplicate proposal load');
      return;
    }

    console.log('Page received proposal data:', proposalData);
    proposalLoadAttempted.current = true;
    
    // Update ProposalData directly through its ref
    if (proposalDataRef.current) {
      proposalDataRef.current.updateData(proposalData);
    }

    setIsProposalLoaded(true);
  };

  // Reset the load attempt when proposalId changes
  useEffect(() => {
    proposalLoadAttempted.current = false;
    setIsProposalLoaded(false);
  }, [proposalId]);

  const handleStructuresChange = (updatedStructures: Structure[]) => {
    // Update both proposal and displayData states
    setProposal(prev => ({
      ...prev,
      structures: updatedStructures
    }));
    setDisplayData(prev => ({
      ...prev,
      structures: updatedStructures
    }));
  };

  // Add a memoized function to organize tracked services by structure ID
  const trackedServicesByStructure = useMemo(() => {
    return proposal.trackedServices.reduce((acc, service) => {
      const structureId = service.structureId;
      if (!acc[structureId]) {
        acc[structureId] = [];
      }
      acc[structureId].push(service);
      return acc;
    }, {} as Record<string, TrackedService[]>);
  }, [proposal.trackedServices]);

  // Update state setters to handle the full proposal object
  const updateProposal = (updates: Partial<ProposalFormData>) => {
    console.log('Page: updateProposal called with updates:', updates);
    setProposal(prev => {
      const updated = { ...prev, ...updates };
      console.log('Page: Proposal state updated:', {
        previous: prev,
        updates,
        updated
      });
      return updated;
    });
  };

  // Only update the page's state when we need to display data
  const [displayData, setDisplayData] = useState<ProposalFormData>({
    number: 0,
    displayNumber: '',
    projectNumber: '',
    projectName: '',
    company: '',
    clientContacts: [],
    overview: '',
    designBudget: '',
    constructionSupportBudget: '',
    status: 'Pending',
    is_temporary_revision: false,
    structures: [],
    costIndex: null,
    resCheckItems: [],
    nestedFeeItems: [],
    designFeeScale: [],
    duplicateStructureRates: [],
    trackedServices: [],
    dbEngineeringServices: [],
    engineeringAdditionalServices: [],
    phase: 'design'
  });

  // Update display data when ProposalData changes
  const handleDataChange = useCallback((newData: {
    id: string;
    project_id: string;
    proposal_number: number;
    revision_number: number;
    is_temporary_revision: boolean;
    status_id: string;
    contacts: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      role?: string;
      company?: string;
      is_primary: boolean;
      details: {
        [key: string]: string | number | boolean;
      };
    }>;
    description: string | null;
    project_data: {
      structures: Array<{
        id: string;
        name: string;
        type: string;
        levels: Array<{
          id: string;
          name: string;
          floorArea: number;
          spaces: Array<{
            id: string;
            name: string;
            floorArea: number;
            type: string;
            parameters: {
              [key: string]: number | string | boolean | undefined;
            };
          }>;
          parameters: {
            [key: string]: number | string | boolean;
          };
        }>;
        totalFloorArea: number;
        constructionType: string;
        buildingType: string;
        parameters: {
          [key: string]: number | string | boolean;
        };
      }>;
      tracked_services: Array<{
        id: string;
        serviceId: string;
        service_name: string;
        name: string;
        discipline: string;
        isDefaultIncluded: boolean;
        min_fee: number | null;
        rate: number | null;
        fee_increment: number | null;
        phase: 'design' | 'construction' | null;
        customFee?: number;
        isConstructionAdmin: boolean;
        fee: number;
        structureId: string;
        levelId: string;
        spaceId: string;
        isIncluded: boolean;
      }>;
      additional_services: Array<{
        id: string;
        name: string;
        description: string;
        phase: 'design' | 'construction';
        default_min_value: number;
        is_active: boolean;
        discipline?: string;
      }>;
      fee_scale: Array<{
        id: number;
        construction_cost: number;
        prime_consultant_rate: number;
        fraction_of_prime_rate_mechanical: number;
        fraction_of_prime_rate_plumbing: number;
        fraction_of_prime_rate_electrical: number;
        fraction_of_prime_rate_structural: number;
      }>;
      duplicate_rates: Array<{
        id: number;
        rate: number;
      }>;
      rescheck_items: Array<{
        id: string;
        name: string;
        description: string;
        default_min_value: number;
        isActive: boolean;
      }>;
      nested_items: Array<{
        id: string;
        name: string;
        description: string;
        default_min_value: number;
        isActive: boolean;
        discipline: string;
        parentDiscipline?: string;
      }>;
      phase: 'design' | 'construction';
      services: Array<{
        id: string;
        discipline_id: string;
        name: string;
        type: 'design' | 'construction';
      }>;
    };
  }) => {
    // Transform the data to match ProposalFormData type
    const transformedData: ProposalFormData = {
      number: newData.proposal_number,
      displayNumber: formatProposalDisplay(newData.proposal_number, newData.revision_number),
      projectNumber: '',
      projectName: '',
      company: '',
      clientContacts: newData.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        role: contact.role || '',
        company: contact.company || '',
        is_primary: contact.is_primary,
        details: {
          first_name: (contact.details.first_name as string) || '',
          last_name: (contact.details.last_name as string) || '',
          role_id: (contact.details.role_id as string) || null,
          location_id: (contact.details.location_id as string) || null,
          company_id: (contact.details.company_id as string) || null,
          status: (contact.details.status as string) || 'active'
        }
      })),
      overview: newData.description || '',
      designBudget: '',
      constructionSupportBudget: '',
      status: newData.status_id ? 'Active' : 'Pending',
      is_temporary_revision: newData.is_temporary_revision,
      structures: newData.project_data?.structures?.map((structure) => ({
        id: structure.id,
        name: structure.name,
        constructionType: structure.type || '',
        floorArea: '0',
        description: '',
        spaceType: '',
        discipline: '',
        hvacSystem: '',
        levels: structure.levels?.map((level) => ({
          id: level.id,
          name: level.name,
          floorArea: '0',
          description: '',
          spaceType: '',
          discipline: '',
          hvacSystem: '',
          spaces: level.spaces?.map((space) => ({
            id: space.id,
            name: space.name,
            description: '',
            floorArea: space.floorArea || 0,
            buildingType: space.type || '',
            buildingTypeId: space.type || '',
            spaceType: '',
            discipline: '',
            hvacSystem: '',
            projectConstructionType: '',
            projectConstructionTypeId: 0,
            structureId: structure.id,
            levelId: level.id,
            totalConstructionCosts: [],
            totalCost: 0,
            totalCostPerSqft: 0,
            splitConstructionCosts: false
          })) || []
        })) || []
      })) || [],
      costIndex: null,
      resCheckItems: newData.project_data.rescheck_items?.map(item => ({
        ...item,
        isActive: true // Default to true for existing items
      })) || [],
      nestedFeeItems: newData.project_data.nested_items?.map(item => ({
        ...item,
        isActive: true // Default to true for existing items
      })) || [],
      designFeeScale: newData.project_data.fee_scale || [],
      duplicateStructureRates: newData.project_data.duplicate_rates || [],
      trackedServices: newData.project_data.tracked_services || [],
      dbEngineeringServices: newData.project_data.services?.map(service => ({
        id: service.id,
        discipline: service.discipline_id,
        service_name: service.name,
        description: '',
        isIncludedInFee: false,
        isDefaultIncluded: false,
        phase: service.type,
        min_fee: null,
        rate: null,
        fee_increment: null,
        isConstructionAdmin: false
      })) || [],
      engineeringAdditionalServices: newData.project_data.additional_services || [],
      phase: newData.project_data.phase || 'design'
    };
    setDisplayData(transformedData);
  }, []);

  return (
    <>
      <ProposalData
        ref={proposalDataRef}
        proposalId={proposalId}
        projectId={params.id as string}
        isNewProposal={proposalId === 'new'}
        onDataChange={handleDataChange}
      />
      <div className="container mx-auto py-6 pt-24 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-48 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded mt-2"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{project?.number}</span>
                    <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{project?.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <ProposalActions />

        <form onSubmit={handleSubmit} className="max-w-[1600px] space-y-6">
          <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-4 border border-[#4DB6AC] dark:border-[#4DB6AC] mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-primary"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-[#9CA3AF]">Cost Index</div>
                <div className="text-lg font-semibold text-primary">
                  {isLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    project?.costIndex != null ? project.costIndex.toFixed(2) : 'Not set'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{displayData.displayNumber}</span>
                </div>
              </div>

              <div>
                <ContactSearch
                  selectedCompany={displayData.company}
                  onContactSelect={(contact: CompanyContact) => {
                    console.log('Page: Contact selected from ContactSearch:', contact);
                    // Use ProposalData's addContact function
                    const newContact = {
                      name: `${contact.first_name} ${contact.last_name}`,
                      email: contact.email || '',
                      phone: contact.mobile || contact.direct_phone || '',
                      role: contact.role?.name || '',
                      company: contact.location?.company?.name || '',
                      is_primary: false,
                      details: {
                        first_name: contact.first_name,
                        last_name: contact.last_name,
                        role_id: contact.role_id || '',
                        location_id: contact.location_id || '',
                        company_id: contact.company_id || '',
                        status: contact.status || 'Active'
                      }
                    };
                    proposalDataRef.current?.addContact(newContact);
                  }}
                  selectedContacts={displayData.clientContacts.map((contact: ProposalContact) => ({
                    id: contact.id,
                    first_name: contact.details.first_name,
                    last_name: contact.details.last_name,
                    email: contact.email,
                    mobile: contact.phone || null,
                    direct_phone: contact.phone || null,
                    role_id: contact.details.role_id,
                    location_id: contact.details.location_id,
                    status: contact.details.status,
                    company_id: contact.details.company_id,
                    role: contact.role ? { id: '', name: contact.role } : undefined,
                    location: contact.company ? {
                      id: '',
                      name: '',
                      address_line1: '',
                      address_line2: null,
                      city: '',
                      state: '',
                      zip: '',
                      company_id: '',
                      company: { id: '', name: contact.company }
                    } : undefined
                  }))}
                  onContactRemove={(contactId: string) => {
                    console.log('Page: Removing contact:', contactId);
                    // Use ProposalData's removeContact function
                    proposalDataRef.current?.removeContact(contactId);
                  }}
                  className="mb-4"
                />
              </div>

              <div className="space-y-4">
                <RichTextEditor
                  value={displayData.overview}
                  onChange={(e) => updateProposal({ ...displayData, overview: e.target.value })}
                  placeholder="Enter proposal overview with formatting..."
                  className="border-[#4DB6AC] dark:border-[#4DB6AC] focus-within:ring-2 focus-within:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
            <ProposalStructures
              structures={displayData.structures}
              costIndex={displayData.costIndex}
              isLoadingStandardServices={isLoadingStandardServices}
              dbEngineeringServices={displayData.dbEngineeringServices}
              onStructuresChange={handleStructuresChange}
              onConstructionCostUpdate={handleConstructionCostUpdate}
              onAddSpace={handleAddSpace}
              proposalId={params.proposalId as string}
              onServicesChange={handleServicesChange}
              trackedServices={trackedServicesByStructure}
            />
          </div>

          <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold mb-4 dark:text-[#E5E7EB]">Fixed Fees</h2>
                {/* Before rendering FixedFees in the main render/return block:
                console.log('Rendering FixedFees with trackedServices:', proposal.trackedServices); */}
                <FixedFees
                  structures={displayData.structures}
                  phase={displayData.phase}
                  onFeeUpdate={handleFeeUpdate}
                  duplicateStructureRates={displayData.duplicateStructureRates}
                  trackedServices={displayData.trackedServices}
                  onServiceFeeUpdate={handleServiceFeeUpdate}
                  constructionCosts={getConstructionCosts(displayData.structures)}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <FlexFees />
          </div>
        </form>

        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="p-0">
            <Command>
              <CommandInput placeholder="Search contacts..." />
              <CommandList>
                <CommandEmpty>No contacts found.</CommandEmpty>
                <CommandGroup>
                  {contacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      onSelect={() => {
                        updateProposal({ ...displayData, clientContacts: [...displayData.clientContacts, contact] });
                        setIsContactDialogOpen(false);
                      }}
                      className="flex flex-col items-start py-2"
                    >
                      <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                      <div className="text-sm text-gray-500">{contact.email || 'No email'}</div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        <SpaceDialog
          open={isSpaceDialogOpen}
          onOpenChange={() => setIsSpaceDialogOpen(false)}
          onSave={handleAddSpace}
          initialSpace={editingSpace}
          structureId={selectedStructureId || ''}
          levelId={selectedLevelId || ''}
          costIndex={displayData.costIndex}
        />
      </div>
    </>
  );
}