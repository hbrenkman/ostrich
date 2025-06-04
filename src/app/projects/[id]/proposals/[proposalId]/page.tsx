// --- IMPORTANT: Construction Cost vs. Fee Calculation ---
// A structure represents a building or a portion of a building or similar.
// A level represents a floor of a structure.
// A space represents a room or area within a level.
// A fee represents a fee for a discipline for a space to perform engineering services.
// In this file (page.tsx), we ONLY calculate construction costs (costPerSqft * floorArea).  For each discipline asscociated with each space.
// We then sum all the construction costs for each discipline and spaces asscociated with a structure to get the total construction cost for the structure.
// All fee calculations are handled in FixedFees.tsx, using the totalConstructionCosts prop.
// When adding/updating/deleting a space or fee, calculate the construction cost, and trigger a caclculation in FixedFees.tsx.
// --------------------------------------------------------

"use client";

import React, { useState, useEffect, DragEvent, useRef, useCallback } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search, Building2, Layers, Building, Home, Pencil, SplitSquareVertical, GripVertical, ChevronDown } from 'lucide-react';
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
import { SpaceDialog } from './space-dialog';
import { createClient } from '@supabase/supabase-js'
import FixedFees from './components/FixedFees';
import { Space, Level, Structure, ManualFeeOverride, EngineeringService, EngineeringServiceLink, FeeTableProps } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Contact {
  id: string;
  name: string;
  email: string;
  mobile: string;
  direct_phone: string;
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

interface ProposalFormData {
  number: string;
  projectNumber: string;
  projectName: string;
  company: string;
  clientContact: Contact | null;
  overview: string;
  designBudget: string;
  constructionSupportBudget: string;
  status: 'Pending' | 'Active' | 'On Hold' | 'Cancelled';
  structures: Structure[];
  costIndex: number | null;
  resCheckItems: ResCheckItem[];
  nestedFeeItems: NestedFeeItem[];  // For items like Site Photometry
  designFeeScale: FeeScale[];
  duplicateStructureRates: FeeDuplicateStructure[];
  trackedServices: TrackedService[];
  manualFeeOverrides: ManualFeeOverride[];
  engineeringStandardServices: EngineeringStandardService[];
  engineeringAdditionalServices: EngineeringAdditionalServices[];
  phase: 'design' | 'construction';
}

interface FeeScale {
  construction_cost: number;
  prime_consultant_fee: number;
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
  onDisciplineFeeToggle: (structureId: string, levelId: string, spaceId: string, feeId: string, isActive: boolean) => void;
}

interface FeeDuplicateStructure {
  id: number;
  rate: number;
}

// Add new interfaces for manual fee overrides
interface ManualFeeOverride {
  id: string;
  structureId: string;
  levelId: string;
  spaceId: string;
  discipline: string;
}

interface EngineeringStandardService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  included_in_fee: boolean;
  default_included: boolean;
  phase: 'design' | 'construction';
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  construction_admin: boolean;
}

// Add interface for tracked services
interface TrackedService {
  id: string;
  serviceId: string;
  service_name: string;
  name: string;
  discipline: string;
  default_included: boolean;
  min_fee: number | null;
  rate: number | null;  // percentage rate
  fee_increment: number | null;  // fee increment value
  phase: 'design' | 'construction';
  customFee?: number;
  construction_admin: boolean;
  fee: number;
  structureId: string;
  levelId: string;
  spaceId: string;
  isActive: boolean;
}

// Update EngineeringServicesDisplay props
interface EngineeringServicesDisplayProps {
  services: EngineeringStandardService[];
  isLoading: boolean;
  onServiceUpdate: (serviceId: string, updates: Partial<EngineeringStandardService>) => void;
  proposal: ProposalFormData;
  setProposal: (proposal: ProposalFormData) => void;
  onServicesChange: (services: TrackedService[]) => void;
}

function EngineeringServicesDisplay({ 
  services, 
  isLoading, 
  onServiceUpdate,
  proposal,
  setProposal,
  onServicesChange 
}: EngineeringServicesDisplayProps) {
  const [draggedService, setDraggedService] = useState<EngineeringStandardService | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use default_included from services directly
  const includedServices = services.filter(service => service.default_included);
  const excludedServices = services.filter(service => !service.default_included);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, service: EngineeringStandardService) => {
    // console.log('Drag start:', service.service_name);
    setIsDragging(true);
    setDraggedService(service);
    const dragData = {
      type: 'engineering_service',
      serviceId: service.id,
      serviceName: service.service_name
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // console.log('Drag end');
    setIsDragging(false);
    setDraggedService(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, isIncluded: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIncluded: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    const data = e.dataTransfer.getData('application/json');
    if (!data) {
      console.error('No data received in drop event');
      return;
    }

    try {
      const { serviceId, serviceName } = JSON.parse(data);
      // console.log('Drop event data:', { serviceId, serviceName, targetIncluded });
      
      // Find the service in the services array
      const serviceIndex = services.findIndex(s => s.id === serviceId);
      if (serviceIndex === -1) {
        console.error('Service not found:', serviceId);
        return;
      }

      const service = services[serviceIndex];
      console.log('Service being updated:', {
        id: service.id,
        name: service.service_name,
        default_included: service.default_included,
        min_fee: service.min_fee,
        phase: service.phase,
        discipline: service.discipline
      });

      // Only update if the inclusion status is actually changing
      if (service.default_included !== targetIncluded) {
        onServiceUpdate(serviceId, { default_included: targetIncluded });
        
        // Convert EngineeringStandardService to TrackedService
        const updatedServices = services.map(s => ({
          id: s.id,
          service_name: s.service_name,
          discipline: s.discipline,
          default_included: s.id === serviceId ? targetIncluded : s.default_included,
          min_fee: s.min_fee,
          rate: s.rate,
          fee_increment: s.fee_increment,
          phase: s.phase,
          construction_admin: s.construction_admin
        }));
        
        console.log('Services being passed to onServicesChange:', updatedServices.map(s => ({
          id: s.id,
          name: s.service_name,
          default_included: s.default_included,
          min_fee: s.min_fee,
          phase: s.phase
        })));
        
        onServicesChange(updatedServices);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const groupServicesByDiscipline = (services: EngineeringStandardService[]): Record<string, EngineeringStandardService[]> => {
    return services.reduce((acc, service) => {
      const discipline = service.discipline;
      if (!acc[discipline]) {
        acc[discipline] = [];
      }
        acc[discipline].push(service);
        return acc;
    }, {} as Record<string, EngineeringStandardService[]>);
  };

  const renderServiceItem = (service: EngineeringStandardService) => (
    <div
      key={service.id}
      draggable
      onDragStart={(e) => handleDragStart(e, service)}
      onDragEnd={handleDragEnd}
      className={`flex items-center justify-between p-2 rounded-md cursor-move hover:bg-gray-100 dark:hover:bg-gray-800 ${
        isDragging && draggedService?.id === service.id ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div>
          <div className="text-sm font-medium">{service.service_name}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {/* Included Services */}
      <div
        className={`border border-green-500/20 rounded-md overflow-hidden ${
          isDragging && draggedService && !draggedService.default_included ? 'border-green-500/50 bg-green-500/5' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // console.log('Drag over included');
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // console.log('Drop on included');
          handleDrop(e, true);
        }}
      >
        <div className="bg-green-500/10 px-2 py-1">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Included Services</h3>
        </div>
        {includedServices.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">No included services</div>
        ) : (
          <div className="p-1 space-y-1">
            {Object.entries(groupServicesByDiscipline(includedServices)).map(([discipline, services]) => (
              <div key={discipline} className="border-b border-green-500/10 last:border-0">
                <div className="px-2 py-1 bg-green-500/5">
                  <h4 className="text-xs font-medium text-green-600 dark:text-green-400">{discipline}</h4>
                </div>
                <div className="px-2 py-1">
                  {services.map(service => renderServiceItem(service))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Excluded Services */}
      <div
        className={`border border-red-500/20 rounded-md overflow-hidden ${
          isDragging && draggedService && draggedService.default_included ? 'border-red-500/50 bg-red-500/5' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // console.log('Drag over excluded');
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // console.log('Drop on excluded');
          handleDrop(e, false);
        }}
      >
        <div className="bg-red-500/10 px-2 py-1">
          <h3 className="text-sm font-medium text-red-700 dark:text-red-400">Excluded Services</h3>
        </div>
        {excludedServices.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">No excluded services</div>
        ) : (
          <div className="p-1 space-y-1">
            {Object.entries(groupServicesByDiscipline(excludedServices)).map(([discipline, services]) => (
              <div key={discipline} className="border-b border-red-500/10 last:border-0">
                <div className="px-2 py-1 bg-red-500/5">
                  <h4 className="text-xs font-medium text-red-600 dark:text-red-400">{discipline}</h4>
                </div>
                <div className="px-2 py-1">
                  {services.map(service => renderServiceItem(service))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const contacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    mobile: '+1 (555) 123-4567',
    direct_phone: '+1 (555) 123-4567',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    mobile: '+1 (555) 234-5678',
    direct_phone: '+1 (555) 234-5678',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    mobile: '+1 (555) 345-6789',
    direct_phone: '+1 (555) 345-6789',
  },
];

interface Fee {
  id: string;
  discipline: string;
  totalConstructionCost: number;
  isActive: boolean;
  costPerSqft: number;
}

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
  const [manualFeeOverrides, setManualFeeOverrides] = useState<ManualFeeOverride[]>([]);
  const [engineeringStandardServices, setEngineeringStandardServices] = useState<EngineeringStandardService[]>([]);
  const [isLoadingStandardServices, setIsLoadingStandardServices] = useState(true);
  const [isLoadingAdditionalServices, setIsLoadingAdditionalServices] = useState(true);
  const [phase, setPhase] = useState<'design' | 'construction'>('design');
  const [designFeeScale, setDesignFeeScale] = useState<FeeScale[]>([]);
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);  // Restore this state
  const [trackedServices, setTrackedServices] = useState<TrackedService[]>([]);
  const [collapsedServices, setCollapsedServices] = useState<Set<string>>(new Set());

  const [proposal, setProposal] = useState<ProposalFormData>({
    number: '',
    projectNumber: '',
    projectName: '',
    company: '',
    clientContact: null,
    overview: '',
    designBudget: '',
    constructionSupportBudget: '',
    status: 'Pending',
    structures: [],
    costIndex: null,
    resCheckItems: [],
    nestedFeeItems: [],
    designFeeScale: [],
    duplicateStructureRates: [],
    trackedServices: [],
    manualFeeOverrides: [],
    engineeringStandardServices: [],
    engineeringAdditionalServices: [],
    phase: 'design'
  });

  // Add a ref to track if we're opening the dialog
  const isOpeningDialog = useRef(false);

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

  useEffect(() => {
    const fetchNextProposalNumber = async () => {
      if (proposalId === 'new' && id) {
        try {
          const response = await fetch(`/api/proposal-number?project_id=${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch next proposal number');
          }
          const data = await response.json();
          setProposal(prev => ({
            ...prev,
            number: data.next_number
          }));
        } catch (error) {
          console.error('Error fetching next proposal number:', error);
        }
      }
    };

    fetchNextProposalNumber();
  }, [id, proposalId]);

  useEffect(() => {
    // console.log('Project cost index:', project?.costIndex);
    // console.log('Proposal cost index:', proposal.costIndex);
  }, [project?.costIndex, proposal.costIndex]);

  useEffect(() => {
    const fetchDesignFeeScale = async () => {
      try {
        // console.log('Fetching design fee scale from frontend...');
        const response = await fetch('/api/design-fee-scale');
        if (!response.ok) {
          console.error('Failed to fetch design fee scale:', response.status, response.statusText);
          throw new Error('Failed to fetch design fee scale');
        }
        const data = await response.json();
        // console.log('Received design fee scale data:', data);
        if (!data || data.length === 0) {
          console.warn('No design fee scale data received from API');
        }
        setDesignFeeScale(data);
      } catch (error) {
        console.error('Error fetching design fee scale:', error);
      }
    };

    fetchDesignFeeScale();
  }, []);

  // Add useEffect to update proposal state when designFeeScale changes
  useEffect(() => {
    if (designFeeScale.length > 0) {
      console.log('Updating proposal state with design fee scale data:', designFeeScale);
      setProposal(prev => ({
        ...prev,
        designFeeScale
      }));
    }
  }, [designFeeScale]);

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
    const fetchEngineeringStandardServices = async () => {
      try {
        console.log('Fetching engineering standard services...');
        const response = await fetch('/api/engineering-services');
        if (!response.ok) {
          throw new Error(`Failed to fetch engineering standard services: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Engineering standard services data:', data);
        if (data.services) {
          setEngineeringStandardServices(data.services);
          console.log("fetchEngineeringStandardServices: loaded services:", data.services);
        } else {
          console.error('No services array in response:', data);
          setEngineeringStandardServices([]);
        }
      } catch (error) {
        console.error('Error fetching engineering standard services:', error);
        setEngineeringStandardServices([]);
      } finally {
        setIsLoadingStandardServices(false);
      }
    };

    fetchEngineeringStandardServices();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/projects/${id}`);
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
        service.default_included && 
        (service.min_fee !== null || service.construction_admin)
      );

      if (servicesWithFees.length > 0) {
        const updatedTrackedServices: TrackedService[] = servicesWithFees.map(service => ({
          id: service.id,
          serviceId: service.id,
          service_name: service.service_name,
          name: service.service_name,
          discipline: service.discipline,
          default_included: service.default_included,
          min_fee: service.min_fee,
          rate: service.rate,
          fee_increment: service.fee_increment,
          phase: service.phase,
          construction_admin: service.construction_admin,
          fee: service.min_fee || 0,
          structureId: '',  // Will be set when service is associated with a structure
          levelId: '',      // Will be set when service is associated with a level
          spaceId: '',      // Will be set when service is associated with a space
          isActive: service.default_included,
          customFee: undefined
        }));
        
        setTrackedServices(updatedTrackedServices);
      }
    }
  }, [isLoadingStandardServices, engineeringStandardServices]);

  const handleAddStructure = async (structure: Omit<Structure, 'id'>) => {
    // First ensure we have engineering standard services loaded
    if (!proposal.engineeringStandardServices.length) {
      try {
        const { data: services, error } = await supabase
          .from('engineering_standard_services')
          .select('*')
          .order('discipline', { ascending: true });

        if (error) throw error;
        if (services) {
          setProposal(prev => ({
            ...prev,
            engineeringStandardServices: services
          }));
        }
      } catch (error) {
        console.error('Error fetching engineering standard services:', error);
        return;
      }
    }

    // Add default Level 0
    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: "Level 0",
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "Mechanical",
      hvacSystem: "VAV System",
      spaces: []
    };

    const newStructure: Structure = {
      id: crypto.randomUUID(),
      name: structure.name || "New Structure",
      constructionType: structure.constructionType,
      floorArea: structure.floorArea,
      description: structure.description,
      spaceType: structure.spaceType,
      discipline: structure.discipline,
      hvacSystem: structure.hvacSystem,
      levels: [newLevel], // <-- Add Level 0 by default
      designFeeRate: 0,
      constructionSupportEnabled: false,
      designPercentage: 80,
      constructionCosts: []
    };

    // Get default design phase services
    const defaultServices = proposal.engineeringStandardServices.filter(service => 
      service.phase === 'design' && 
      service.default_included &&
      (service.min_fee !== null || service.rate !== null || service.fee_increment !== null)
    );

    // Create tracked services for the new structure
    const newTrackedServices = defaultServices.map(service => ({
      id: crypto.randomUUID(),
      serviceId: service.id,
      service_name: service.service_name,
      name: service.service_name,
      discipline: service.discipline,
      default_included: true,
      min_fee: service.min_fee,
      rate: service.rate,
      fee_increment: service.fee_increment,
      phase: 'design' as const,
      construction_admin: service.construction_admin,
      fee: 0,
      structureId: newStructure.id,
      levelId: '',
      spaceId: '',
      isActive: true
    }));

    // Update proposal with new structure and tracked services
    setProposal(prev => {
      const updated = {
        ...prev,
        structures: [...prev.structures, newStructure],
        trackedServices: [...prev.trackedServices, ...newTrackedServices]
      };
      console.log('setProposal: trackedServices after update:', updated.trackedServices);
      return updated;
    });

    // Log the addition of new services
    console.log('Added new structure with services:', {
      structureId: newStructure.id,
      structureName: newStructure.name,
      services: newTrackedServices.map(s => ({
        service_name: s.service_name,
        discipline: s.discipline,
        min_fee: s.min_fee,
        rate: s.rate,
        fee_increment: s.fee_increment,
        structureId: s.structureId
      }))
    });

    // In handleAddStructure, after filtering defaultServices:
    console.log('handleAddStructure: defaultServices (filtered from engineeringStandardServices):', defaultServices);
    // In handleAddStructure, before filtering defaultServices:
    console.log('handleAddStructure: engineeringStandardServices (raw) before filtering:', proposal.engineeringStandardServices);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStructureId?: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    
    if (data.type === 'structure') {
      // First ensure we have engineering standard services loaded
      let engineeringServices = proposal.engineeringStandardServices;
      if (!engineeringServices.length) {
        try {
          console.log('handleDrop: Fetching engineering standard services...');
          const { data: services, error } = await supabase
            .from('engineering_standard_services')
            .select('*')
            .order('discipline', { ascending: true });

          if (error) throw error;
          if (services) {
            engineeringServices = services;
            console.log('handleDrop: Successfully loaded engineering standard services:', services.length);
          }
        } catch (error) {
          console.error('Error fetching engineering standard services:', error);
          return;
        }
      }

      // Generate a new UUID for the structure
      const newStructureId = crypto.randomUUID();
      console.log('handleDrop: Creating new structure with ID:', newStructureId);

      // Create new structure with all required properties
      const defaultLevel: Level = {
        id: crypto.randomUUID(),
        name: "Level 0",
        floorArea: "0",
        description: "New Level",
        spaceType: "Office",
        discipline: "Mechanical",
        hvacSystem: "VAV System",
        spaces: []
      };
      const newStructure: Structure = {
        id: newStructureId,
        name: 'New Structure',
        constructionType: 'Type I',
        floorArea: '0',
        description: 'New Structure',
        spaceType: 'Office',
        discipline: 'Mechanical',
        hvacSystem: 'VAV System',
        levels: [defaultLevel], // <-- Add Level 0 by default
        isDuplicate: false,
        duplicateNumber: 0,
        duplicateParentId: null,
        isDuplicateCollapsed: false,
        constructionSupportEnabled: false
      };

      // Create services for both design and construction phases
      const createServicesForPhase = (phase: 'design' | 'construction') => {
        return engineeringServices
          .filter(service => 
            service.phase === phase && 
            !service.construction_admin
          )
          .map(service => ({
            id: crypto.randomUUID(),
            serviceId: service.id,
            service_name: service.service_name,
            name: service.service_name,
            discipline: service.discipline,
            default_included: service.default_included,
            min_fee: service.min_fee,
            rate: service.rate,
            fee_increment: service.fee_increment,
            phase: phase,
            customFee: undefined,
            construction_admin: service.construction_admin,
            fee: service.min_fee || 0,
            structureId: newStructureId,
            levelId: '',
            spaceId: '',
            isActive: true
          }));
      };

      // Create services for both phases
      const designServices = createServicesForPhase('design');
      const constructionServices = createServicesForPhase('construction');
      const newTrackedServices = [...designServices, ...constructionServices];

      console.log('handleDrop: Creating new services for structure:', {
        structureId: newStructureId,
        designServicesCount: designServices.length,
        constructionServicesCount: constructionServices.length,
        totalServicesCount: newTrackedServices.length,
        engineeringServicesCount: engineeringServices.length
      });

      // Update the proposal state with both the new structure and services
      setProposal(prev => {
        // First update the engineering services if they were just loaded
        const updatedEngineeringServices = engineeringServices.length > 0 ? engineeringServices : prev.engineeringStandardServices;
        
        // Then create the new state with the updated services
        const updated = {
          ...prev,
          engineeringStandardServices: updatedEngineeringServices,
          structures: [...prev.structures, newStructure],
          trackedServices: [...prev.trackedServices, ...newTrackedServices]
        };

        console.log('handleDrop: Updated proposal state:', {
          newStructureId,
          structureName: newStructure.name,
          designServicesCount: designServices.length,
          constructionServicesCount: constructionServices.length,
          totalServicesCount: updated.trackedServices.length,
          servicesWithNewStructureId: updated.trackedServices.filter(s => s.structureId === newStructureId).length,
          servicesByPhase: {
            design: updated.trackedServices.filter(s => s.structureId === newStructureId && s.phase === 'design').length,
            construction: updated.trackedServices.filter(s => s.structureId === newStructureId && s.phase === 'construction').length
          },
          engineeringServicesCount: updated.engineeringStandardServices.length
        });

        return updated;
      });
    } else if (data.type === 'level' && targetStructureId) {
      const structure = proposal.structures.find(s => s.id === targetStructureId);
      if (!structure) return;

      // Find the highest level number
      const highestLevel = structure.levels.reduce((highest, level) => {
        const levelNum = parseInt(level.name.split(' ')[1]);
        return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
      }, -1);

      const newLevel: Level = {
        id: data.id,
        name: `Level ${highestLevel + 1}`,
        floorArea: "0",
        description: "New Level",
        spaceType: "Office",
        discipline: "Mechanical", // Changed from MEP to Mechanical as default
        hvacSystem: "VAV System",
        spaces: []
      };

      // Sort levels in reverse order (higher numbers first)
      const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
        const aNum = parseInt(a.name.split(' ')[1]);
        const bNum = parseInt(b.name.split(' ')[1]);
        return bNum - aNum; // Reversed order
      });
      
      setProposal({
        ...proposal,
        structures: proposal.structures.map(s =>
          s.id === targetStructureId
            ? { ...s, levels: updatedLevels }
            : s
        )
      });
    }
  };

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
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type,
      id: crypto.randomUUID()
    }));
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
    if (!selectedStructureId || !selectedLevelId) {
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
        }))
      },
      selectedStructureId,
      selectedLevelId
    });

    // Log current proposal state before update
    console.log('Page: Current proposal state before adding space:', {
      structures: proposal.structures,
      constructionCosts: getConstructionCosts(proposal.structures),
      manualFeeOverrides
    });

    // Create a new space with a unique ID and ensure all disciplines have construction costs
    const newSpace: Space = {
      id: crypto.randomUUID(),
      ...space,
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

    // If we're editing an existing space, update it instead of creating a new one
    if (editingSpace) {
      setProposal(prev => {
        const updatedStructures = prev.structures.map(structure => {
          if (structure.id === selectedStructureId) {
            return {
              ...structure,
              levels: structure.levels.map(level => {
                if (level.id === selectedLevelId) {
                  return {
                    ...level,
                    spaces: level.spaces.map(sp => {
                      if (sp.id === editingSpace.id) {
                        // When editing, preserve existing fee IDs but use new active states and costs
                        return {
                          ...space,
                          id: sp.id,
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
          structureId: selectedStructureId,
          levelId: selectedLevelId,
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
              default_included: true,
              min_fee: originalService?.min_fee ?? null,
              rate: originalService?.rate ?? null,
              fee_increment: originalService?.fee_increment ?? null,
              phase: 'design' as const,
              customFee: undefined,
              construction_admin: false,
              fee: 0,
              structureId: selectedStructureId,
              levelId: selectedLevelId,
              spaceId: editingSpace.id,
              isActive: service.isActive
            };
          });

          // Add new tracked services to the proposal
          updatedProposal.trackedServices = [
            ...prev.trackedServices.filter(ts => 
              !(ts.structureId === selectedStructureId && 
                ts.levelId === selectedLevelId && 
                ts.spaceId === editingSpace.id)
            ),
            ...newTrackedServices
          ];
        }

        // Log the updated proposal state
        console.log('Page: Updated proposal state after editing space:', {
          structures: updatedProposal.structures,
          constructionCosts: updatedConstructionCosts,
          manualFeeOverrides,
          trackedServices: updatedProposal.trackedServices
        });

        return updatedProposal;
      });
    } else {
      // For new spaces, update the proposal state
      setProposal(prev => {
        const updatedStructures = prev.structures.map(structure => {
          if (structure.id === selectedStructureId) {
            return {
              ...structure,
              levels: structure.levels.map(level => {
                if (level.id === selectedLevelId) {
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
          structureId: selectedStructureId,
          levelId: selectedLevelId,
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
              default_included: true,
              min_fee: originalService?.min_fee ?? null,
              rate: originalService?.rate ?? null,
              fee_increment: originalService?.fee_increment ?? null,
              phase: 'design' as const,
              customFee: undefined,
              construction_admin: false,
              fee: 0,
              structureId: selectedStructureId,
              levelId: selectedLevelId,
              spaceId: newSpace.id,
              isActive: service.isActive
            };
          });

          // Add new tracked services to the proposal
          updatedProposal.trackedServices = [
            ...prev.trackedServices,
            ...newTrackedServices
          ];
        }

        // Log the updated proposal state
        console.log('Page: Updated proposal state after adding new space:', {
          structures: updatedProposal.structures,
          constructionCosts: updatedConstructionCosts,
          manualFeeOverrides,
          trackedServices: updatedProposal.trackedServices
        });

        return updatedProposal;
      });
    }

    // Close the dialog after updating
    setEditingSpace(null);
    setIsSpaceDialogOpen(false);
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
      name: `${structureToDuplicate.name} (Duplicate ${duplicateNumber})`,  // Add "Duplicate" text and correct numbering
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

    setProposal(prev => ({
      ...prev,
      structures: [...prev.structures, newStructure]
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
        const spaceCost = space.totalConstructionCosts.reduce((feeSum, fee) => 
          feeSum + (fee.isActive ? fee.totalConstructionCost : 0), 0);
        return levelSum + spaceCost;
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

  /**
   * Calculates the fee scale rate for a given structure and discipline.
   * IMPORTANT: Construction cost calculation notes:
   * 1. Construction cost is NOT calculated from fees.totalFee
   * 2. Instead, it is calculated as: costPerSqft * floorArea for each space
   * 3. This is done per discipline, so we only look at fees matching the target discipline
   * 4. Only active fees are included in the calculation
   * 5. The total construction cost is used to determine which fee scale row to use
   * 
   * Multi-discipline calculation process:
   * 1. For each discipline (Mechanical, Electrical, Plumbing, etc.):
   *    - Calculate discipline-specific construction cost = sum(costPerSqft * floorArea) for all spaces
   *    - This gives us the construction cost for that discipline
   * 2. The total construction cost for a space is the sum of all discipline-specific costs
   * 
   * Example calculation for a space with multiple disciplines:
   * Space A (1000 sqft):
   * - Mechanical: $50/sqft = $50,000
   * - Electrical: $40/sqft = $40,000
   * - Plumbing: $30/sqft = $30,000
   * Total construction cost for Space A = $120,000
   * 
   * Space B (2000 sqft):
   * - Mechanical: $45/sqft = $90,000
   * - Electrical: $35/sqft = $70,000
   * - Plumbing: $25/sqft = $50,000
   * Total construction cost for Space B = $210,000
   * 
   * Total construction cost for structure = $330,000
   * This total is then used to find the appropriate fee scale row
   * 
   * Note: Each discipline's fee scale is calculated independently using its own
   * discipline-specific construction cost. This ensures accurate fee rates for
   * each discipline based on their respective construction costs.
   */
  const getFeeScale = (structure: Structure, discipline: string): { adjustedRate: number } => {
    // Calculate total construction cost for this structure using costPerSqft * floorArea for each discipline
    // Note: This calculation is specific to the given discipline
    const constructionCost = structure.levels.reduce((total, level) =>
      level.spaces.reduce((levelTotal, space) => {
        // Find the fee for this discipline
        const fee = space.totalConstructionCosts.find(f => f.discipline === discipline);
        if (fee && fee.isActive) {
          // Calculate construction cost for this space using costPerSqft * floorArea
          // This is the correct way to calculate construction cost, NOT using fee.totalFee
          const spaceConstructionCost = fee.costPerSqft * space.floorArea;
          console.log('Adding construction cost for space:', {
            level: level.name,
            space: space.name,
            discipline: fee.discipline,
            costPerSqft: fee.costPerSqft,
            floorArea: space.floorArea,
            constructionCost: spaceConstructionCost,
            note: 'Construction cost = costPerSqft * floorArea (discipline-specific)'
          });
          return levelTotal + spaceConstructionCost;
        }
        return levelTotal;
      }, 0), 0);

    console.log('Total construction cost for fee scale:', {
      structure: structure.name,
      discipline,
      constructionCost,
      note: 'This is the discipline-specific construction cost used to determine the fee scale row. ' +
            'Each discipline has its own construction cost calculation and fee scale determination.'
    });

    // Get the current fee scale from state
    const currentFeeScale = designFeeScale;
    if (!currentFeeScale || currentFeeScale.length === 0) {
      console.warn('No fee scale data available');
      return { adjustedRate: 0 };
    }

    // Find the appropriate fee scale row
    // If construction cost is higher than all rows, use the last row
    let scale: FeeScale | undefined;
    if (constructionCost > currentFeeScale[currentFeeScale.length - 1].construction_cost) {
      scale = currentFeeScale[currentFeeScale.length - 1];
    } else {
      scale = currentFeeScale.find((row: FeeScale, index: number) => {
        const nextRow = currentFeeScale[index + 1];
        return !nextRow || constructionCost <= nextRow.construction_cost;
      });
    }

    if (!scale) {
      console.warn('No matching fee scale found for construction cost:', constructionCost);
      return { adjustedRate: 0 };
    }

    // Get the base rate (prime consultant fee)
    const baseRate = scale.prime_consultant_fee;

    // Get the fraction rate for the discipline
    let fractionRate: number;
    const disciplineLower = discipline.toLowerCase();
    switch (disciplineLower) {
      case 'mechanical':
        fractionRate = scale.fraction_of_prime_rate_mechanical;
        break;
      case 'plumbing':
        fractionRate = scale.fraction_of_prime_rate_plumbing;
        break;
      case 'electrical':
        fractionRate = scale.fraction_of_prime_rate_electrical;
        break;
      case 'structural':
        fractionRate = scale.fraction_of_prime_rate_structural;
        break;
      default:
        fractionRate = 1;
    }

    // Calculate the fee using the discipline's fraction of the prime consultant fee
    // Note: fractionRate is already in decimal form (e.g., 0.85 for mechanical)
    const disciplineRate = baseRate * fractionRate;

    // Get and apply the duplicate rate
    const duplicateRate = getDuplicateRate(structure);
    console.log('Fee scale calculation:', {
      structure: structure.name,
      discipline,
      constructionCost,
      baseRate,
      fractionRate,
      disciplineRate,
      duplicateRate,
      finalRate: disciplineRate * duplicateRate
    });

    return { adjustedRate: disciplineRate * duplicateRate };
  };

  const calculateDisciplineFee = (structure: Structure, discipline: string, phase: 'design' | 'construction'): { fee: number } => {
    const { adjustedRate } = getFeeScale(structure, discipline);
    const totalConstructionCost = calculateTotalConstructionCost(structure);
    const fee = totalConstructionCost * (adjustedRate / 100);
    return { fee };
  };

  const calculateTotalDesignFee = (structure: Structure): number => {
    console.log('=== Calculating Total Design Fee ===');
    let total = 0;

    // Calculate fees for each space
    structure.levels.forEach(level => {
      level.spaces.forEach(space => {
        console.log(`\nSpace: ${space.name}`);
        
        // Calculate fees for each active discipline
        space.totalConstructionCosts.forEach(fee => {
          if (!fee.isActive) {
            console.log(`Skipping inactive fee for ${fee.discipline}`);
            return;
          }

          const { fee: disciplineFee } = calculateDisciplineFee(structure, fee.discipline, 'design');
          console.log(`${fee.discipline} Fee:`, {
            constructionCost: fee.totalConstructionCost,
            designFee: disciplineFee
          });
          
          total += disciplineFee;
        });

        // Add any engineering services fees
        if (space.engineeringServices) {
          space.engineeringServices.forEach(service => {
            if (service.isActive && service.estimated_fee) {
              total += Number(service.estimated_fee) || 0;
            }
          });
        }
      });
    });

    console.log('\nFinal Total:', {
      total
    });

    return total;
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
    service: EngineeringStandardService
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

  const handleFeeTableDrop = (
    e: DragEvent<HTMLDivElement> | Event,
    structureId: string,
    levelId: string,
    spaceId: string,
    discipline: string,
    phase: 'design' | 'construction',
    dragDataOverride?: any
  ) => {
    // Only call preventDefault if it's a React DragEvent
    if ('preventDefault' in e) {
      e.preventDefault();
    }
    
    console.log('=== FEE TABLE DROP ===');
    console.log('Drop target:', { structureId, levelId, spaceId, discipline, phase });
    
    let dragData;
    if (dragDataOverride) {
      dragData = dragDataOverride;
    } else if ('dataTransfer' in e) {
      try {
        const jsonData = e.dataTransfer?.getData('application/json');
        if (jsonData) {
          dragData = JSON.parse(jsonData);
        }
      } catch (error) {
        console.error('Error parsing drag data:', error);
        return;
      }
    }

    console.log('Retrieved drag data:', dragData);

    if (!dragData) {
      console.log('No drag data found');
      return;
    }

    if (dragData.type === 'engineering_service') {
      const service = dragData.service as EngineeringStandardService;
      updateFeesForService(structureId, levelId, spaceId, service);
    }
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
    
    // If we're only updating isActive, we can do a simpler update
    if (Object.keys(updates).length === 1 && 'isActive' in updates) {
      setProposal((prev: ProposalFormData) => {
        const structure = prev.structures.find(s => s.id === structureId);
        if (!structure) return prev;

        const level = structure.levels.find(l => l.id === levelId);
        if (!level) return prev;

        const space = level.spaces.find(s => s.id === spaceId);
        if (!space) return prev;

        const feeIndex = space.totalConstructionCosts.findIndex(f => f.id === feeId);
        if (feeIndex === -1) return prev;

        // Create a new array with just the updated fee
        const updatedFees = [...space.totalConstructionCosts];
        updatedFees[feeIndex] = { ...updatedFees[feeIndex], isActive: updates.isActive! };

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
      return;
    }

    // For other updates (like fee values), use the existing complex update logic
    setProposal((prev: ProposalFormData) => {
      const updatedStructures = prev.structures.map(s =>
        s.id === structureId
          ? {
              ...s,
              levels: s.levels.map(l =>
                l.id === levelId
                  ? {
                      ...l,
                      spaces: l.spaces.map(sp =>
                        sp.id === spaceId
                          ? {
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
                            }
                          : sp
                      )
                    }
                  : l
              )
            }
          : s
      );

      const newState = {
        ...prev,
        structures: updatedStructures
      };
      
      console.log('handleFeeUpdate new state:', {
        feeId,
        isActive: updates.isActive,
      });
      
      return newState;
    });
  };

  // Add helper function to reset fees
  const handleResetFees = (structureId: string, discipline: string, spaceId?: string) => {
    setManualFeeOverrides((prev: ManualFeeOverride[]) => 
      prev.filter(o => !(o.structureId === structureId && o.discipline === discipline && (!spaceId || o.spaceId === spaceId)))
    );
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
  const handleServiceDragStart = (e: DragEvent<HTMLDivElement>, service: EngineeringStandardService) => {
    console.log('Starting service drag:', service.service_name);
    const dragData = {
      type: 'engineering_service',
      service: service
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move'; // Changed from 'copy' to 'move'
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
  const handleServiceUpdate = async (serviceId: string, updates: Partial<EngineeringStandardService>) => {
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
          service.id === serviceId ? { ...service, default_included: !updates.default_included } : service
        )
      );
    }
  };

  // Add logging for trackedServices changes
  useEffect(() => {
    console.log('=== TrackedServices Updated ===');
    console.log('Total services:', trackedServices.length);
    console.log('Services:', trackedServices.map(service => ({
      id: service.id,
      name: service.service_name,
      discipline: service.discipline,
      default_included: service.default_included,
      min_fee: service.min_fee,
      rate: service.rate,
      fee_increment: service.fee_increment,
      phase: service.phase
    })));
  }, [trackedServices]);

  // Add handler for services change
  const handleServicesChange = (services: Array<{
    id: string;
    service_name: string;
    discipline: string;
    default_included: boolean;
    min_fee: number | null;
    rate: number | null;
    fee_increment: number | null;
    phase: 'design' | 'construction';
    construction_admin: boolean;
  }>) => {
    try {
      // Get the current structure ID from the proposal
      const currentStructureId = proposal.structures[0]?.id;
      if (!currentStructureId) {
        console.warn('No structure ID available for services');
        return;
      }

      // Map the services to include all required TrackedService properties
      const updatedServices: TrackedService[] = services.map(service => {
        // Find existing service to preserve structure ID
        const existingService = proposal.trackedServices.find(ts => ts.serviceId === service.id);
        
        // If we have an existing service, use its structure ID
        // Otherwise, use the current structure ID
        const structureId = existingService?.structureId || currentStructureId;
        
        console.log('Service update:', {
          serviceId: service.id,
          serviceName: service.service_name,
          existingStructureId: existingService?.structureId,
          newStructureId: structureId
        });

        return {
          id: existingService?.id || crypto.randomUUID(),
          serviceId: service.id,
          service_name: service.service_name,
          name: service.service_name,
          discipline: service.discipline,
          default_included: service.default_included,
          min_fee: service.min_fee,
          rate: service.rate,
          fee_increment: service.fee_increment,
          phase: service.phase,
          construction_admin: service.construction_admin,
          fee: existingService?.fee || 0,
          structureId: structureId, // Use the determined structure ID
          levelId: existingService?.levelId || '',
          spaceId: existingService?.spaceId || '',
          isActive: existingService?.isActive || service.default_included,
          customFee: existingService?.customFee
        };
      });
      
      setProposal(prev => ({
        ...prev,
        trackedServices: updatedServices
      }));

      // Log the updated services
      console.log('Updated tracked services:', updatedServices.map(s => ({
        id: s.id,
        name: s.service_name,
        structureId: s.structureId,
        default_included: s.default_included,
        isActive: s.isActive
      })));
    } catch (error) {
      console.error('Error updating services:', error);
    }
  };

  // Add handler for service fee updates
  const handleServiceFeeUpdate = (serviceId: string, discipline: string, fee: number | undefined, phase: 'design' | 'construction') => {
    console.log('Updating service:', { serviceId, discipline, fee, phase });
    
    setTrackedServices(prevServices => 
      prevServices.map(prevService => {
        if (prevService.id === serviceId) {
          const isDisabling = fee === undefined && prevService.default_included;
          const isEnabling = fee !== undefined && !prevService.default_included;
          
          return {
            ...prevService,
            default_included: isEnabling ? true : (isDisabling ? false : prevService.default_included),
            fee: fee !== undefined ? fee : prevService.fee,
            isActive: isEnabling ? true : (isDisabling ? false : prevService.isActive)
          };
        }
        return prevService;
      })
    );
  };

  // Add handleDeleteSpace function before the return statement
  const handleDeleteSpace = (structureId: string, levelId: string, spaceId: string) => {
    // Update proposal state to remove the space
    setProposal(prevProposal => ({
      ...prevProposal,
      structures: prevProposal.structures.map(s => {
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
      })
    }));

    // Clean up tracked services associated with the deleted space
    setTrackedServices(prevServices => 
      prevServices.filter(service => 
        !(service.structureId === structureId && 
          service.levelId === levelId && 
          service.spaceId === spaceId)
      )
    );

    // Clean up manual fee overrides associated with the deleted space
    setManualFeeOverrides(prevOverrides => 
      prevOverrides.filter(override => 
        !(override.structureId === structureId && 
          override.levelId === levelId && 
          override.spaceId === spaceId)
      )
    );

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
                    spaces: l.spaces.filter(sp => sp.id !== spaceId)
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
      console.log('[handleDeleteSpace] Updated proposal:', {
        structures: updated.structures,
        designFeeScale: updated.designFeeScale,
        duplicateStructureRates: updated.duplicateStructureRates,
        trackedServices: updated.trackedServices,
        constructionCosts: getConstructionCosts(updated.structures)
      });
      return updated;
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
          // Add the total construction cost from the space
          costs[structure.id]['Total'] += space.totalCost || 0;

          // Add costs for each discipline fee
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

  useEffect(() => {
    // Only run if services have just loaded and there are structures but no tracked services
    if (
      engineeringStandardServices.length > 0 &&
      proposal.structures.length > 0 &&
      proposal.trackedServices.length === 0
    ) {
      // For each structure, create tracked services for both phases
      let newTrackedServices: TrackedService[] = [];
      for (const structure of proposal.structures) {
        for (const phase of ['design', 'construction'] as const) {
          const defaultServices = engineeringStandardServices.filter((service: EngineeringStandardService) =>
            service.phase === phase &&
            service.default_included &&
            (service.min_fee !== null || service.rate !== null || service.fee_increment !== null)
          );
          const servicesForPhase: TrackedService[] = defaultServices.map((service: EngineeringStandardService): TrackedService => ({
            id: crypto.randomUUID(),
            serviceId: service.id,
            service_name: service.service_name,
            name: service.service_name,
            discipline: service.discipline,
            default_included: true,
            min_fee: service.min_fee,
            rate: service.rate,
            fee_increment: service.fee_increment,
            phase,
            construction_admin: service.construction_admin,
            fee: 0,
            structureId: structure.id,
            levelId: '',
            spaceId: '',
            isActive: true
          }));
          newTrackedServices = newTrackedServices.concat(servicesForPhase);
        }
      }
      setProposal((prev: ProposalFormData): ProposalFormData => ({
        ...prev,
        trackedServices: [...prev.trackedServices, ...newTrackedServices]
      }));
    }
  }, [engineeringStandardServices, proposal.structures.length]);

  const handleDeleteStructure = (structureId: string) => {
    const structureToDelete = proposal.structures.find(s => s.id === structureId);
    if (!structureToDelete) return;

    // If this is a duplicate, we need to renumber the remaining duplicates
    if (structureToDelete.parentId) {
      setProposal(prev => {
        // First remove the structure
        const updatedStructures = renumberDuplicates(
          prev.structures.filter(s => s.id !== structureId),
          structureToDelete.parentId!
        );

        // Then clean up tracked services and manual fee overrides
        const updatedTrackedServices = prev.trackedServices.filter(
          service => service.structureId !== structureId
        );

        const updatedManualFeeOverrides = prev.manualFeeOverrides.filter(
          override => override.structureId !== structureId
        );

        return {
          ...prev,
          structures: updatedStructures,
          trackedServices: updatedTrackedServices,
          manualFeeOverrides: updatedManualFeeOverrides
        };
      });
    } else {
      // If this is a parent structure, delete it and all its duplicates
      setProposal(prev => {
        // Get all structure IDs to delete (parent and duplicates)
        const structureIdsToDelete = [
          structureId,
          ...prev.structures
            .filter(s => s.parentId === structureId)
            .map(s => s.id)
        ];

        // Remove structures
        const updatedStructures = prev.structures.filter(
          s => !structureIdsToDelete.includes(s.id)
        );

        // Clean up tracked services
        const updatedTrackedServices = prev.trackedServices.filter(
          service => !structureIdsToDelete.includes(service.structureId)
        );

        // Clean up manual fee overrides
        const updatedManualFeeOverrides = prev.manualFeeOverrides.filter(
          override => !structureIdsToDelete.includes(override.structureId)
        );

        return {
          ...prev,
          structures: updatedStructures,
          trackedServices: updatedTrackedServices,
          manualFeeOverrides: updatedManualFeeOverrides
        };
      });
    }
  };

  return (
    <div className="container mx-auto py-6 pt-24 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${id}`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex flex-col">
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
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{proposal.number}</span>
                <select
                  value={proposal.status}
                  onChange={(e) => setProposal({ ...proposal, status: e.target.value as ProposalFormData['status'] })}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Client Contact
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsContactDialogOpen(true)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md text-left hover:bg-muted/5 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className={proposal.clientContact ? "text-gray-900 dark:text-[#E5E7EB]" : "text-gray-400"}>
                    {proposal.clientContact ? proposal.clientContact.name : "Search contacts..."}
                  </span>
                </button>
                {proposal.clientContact && (
                  <button
                    type="button"
                    onClick={() => setProposal({ ...proposal, clientContact: null })}
                    className="p-2 text-gray-500 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <RichTextEditor
                value={proposal.overview}
                onChange={(e) => setProposal({ ...proposal, overview: e.target.value })}
                placeholder="Enter proposal overview with formatting..."
                className="border-[#4DB6AC] dark:border-[#4DB6AC] focus-within:ring-2 focus-within:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-[#E5E7EB]">Structures</h2>
            <div className="flex items-center gap-2">
            <button
              type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, 'structure')}
                onDragEnd={handleDragEnd}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors ${isDragging ? 'opacity-50' : ''}`}
                title="Drag to add structure"
              >
                <Building2 className="w-4 h-4" />
                <span>Add Structure</span>
            </button>
            </div>
          </div>
          <div 
            className={`space-y-2 min-h-[200px] ${isDragging ? 'border-2 border-dashed border-primary/50 rounded-lg' : ''}`}
            onDragOver={(e) => handleDragOver(e, true)}
            onDrop={(e) => handleDrop(e)}
          >
            {proposal.structures.map((structure) => (
              <div 
                key={structure.id} 
                className={`border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md overflow-hidden ${
                  structure.parentId ? 'ml-16 relative' : ''
                }`}
              >
                <div
                  className={`p-4 bg-muted/5 hover:bg-muted/10 cursor-pointer flex items-start gap-4 border-b border-[#4DB6AC]/50 dark:border-[#4DB6AC]/50 ${
                    structure.parentId ? 'bg-muted/10' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e, structure.id)}
                >
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingStructureId === structure.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingStructureName}
                          onChange={(e) => setEditingStructureName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleStructureNameUpdate(structure.id);
                            } else if (e.key === 'Escape') {
                              setEditingStructureId(null);
                            }
                          }}
                          className="flex-1 px-2 py-1 border border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleStructureNameUpdate(structure.id)}
                          className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStructureId(null)}
                          className="p-1 text-gray-500 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {structure.parentId && (
                          <button
                            type="button"
                            onClick={() => toggleDuplicateCollapse(structure.id)}
                            className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                            title={collapsedDuplicates.has(structure.id) ? "Expand" : "Collapse"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`w-4 h-4 transition-transform ${
                                collapsedDuplicates.has(structure.id) ? 'rotate-90' : ''
                              }`}
                            >
                              <path d="m9 18 6-6-6-6"/>
                            </svg>
                          </button>
                        )}
                        <div className="font-medium dark:text-[#E5E7EB]">{structure.name}</div>
                        {!structure.parentId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStructureId(structure.id);
                              setEditingStructureName(structure.name);
                            }}
                            className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                            title="Edit Structure Name"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-[#9CA3AF] mt-1">
                      {structure.constructionType} • {calculateTotalSquareFootage(structure).toLocaleString()} sq ft • {formatCurrency(calculateTotalConstructionCost(structure))}
                    </div>
                    {!structure.parentId && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const isCollapsed = collapsedServices.has(structure.id);
                              if (isCollapsed) {
                                setCollapsedServices(prev => {
                                  const next = new Set(prev);
                                  next.delete(structure.id);
                                  return next;
                                });
                              } else {
                                setCollapsedServices(prev => new Set(prev).add(structure.id));
                              }
                            }}
                            className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                            title={collapsedServices.has(structure.id) ? "Show Engineering Services" : "Hide Engineering Services"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`w-4 h-4 transition-transform ${collapsedServices.has(structure.id) ? '' : 'rotate-90'}`}
                            >
                              <path d="m9 18 6-6-6-6"/>
                            </svg>
                          </button>
                          <span className="text-sm font-medium text-gray-500">Engineering Services</span>
                        </div>
                        
                        {!collapsedServices.has(structure.id) && (
                          <div className="mt-2">
                            <EngineeringServicesDisplay
                              services={engineeringStandardServices}
                              isLoading={isLoadingStandardServices}
                              onServiceUpdate={handleServiceUpdate}
                              proposal={proposal}
                              setProposal={setProposal}
                              onServicesChange={handleServicesChange}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    {!structure.parentId && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDuplicateStructure(structure.id)}
                          className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                          title="Duplicate Structure"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <rect width="14" height="14" x="8" y="2" rx="2" ry="2" />
                            <path d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyStructure(structure.id)}
                          className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                          title="Copy Structure (Independent)"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <rect width="14" height="14" x="8" y="2" rx="2" ry="2" />
                            <path d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            <path d="M8 2v14" />
                            <path d="M2 8h14" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddLowerLevel(structure.id)}
                          className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                          title="Add Lower Level"
                        >
                          <Layers className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddUpperLevel(structure.id)}
                          className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                          title="Add Upper Level"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddFiveUpperLevels(structure.id)}
                          className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                          title="Add 5 Upper Levels"
                        >
                          <Building className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteStructure(structure.id)}
                      className="p-2 text-gray-500 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {(!structure.parentId || !collapsedDuplicates.has(structure.id)) && structure.levels.length > 0 && (
                  <div className="bg-muted/5 divide-y divide-[#4DB6AC]/20 dark:divide-[#4DB6AC]/20">
                    {structure.levels.map((level) => (
                      <div
                        key={level.id}
                        className="border-t border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20"
                      >
                        <div className="p-3 flex items-center gap-3 hover:bg-muted/10 cursor-pointer">
                          <div className="p-1.5 bg-primary/5 rounded-md">
                            <Layers className="w-4 h-4 text-primary/70" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium dark:text-[#E5E7EB]">{level.name}</div>
                            <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                              {level.spaceType} • {calculateLevelArea(level).toLocaleString()} sq ft
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!structure.parentId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStructureId(structure.id);
                                    setSelectedLevelId(level.id);
                                    setEditingSpace(null);
                                    setIsSpaceDialogOpen(true);
                                  }}
                                  className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                  title="Add space"
                                >
                                  <Home className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateLevelUp(structure.id, level.id)}
                                  className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                  title="Duplicate Level Up"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5"
                                  >
                                    <path d="M12 5v14" />
                                    <path d="m5 12 7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateLevelDown(structure.id, level.id)}
                                  className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                  title="Duplicate Level Down"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5"
                                  >
                                    <path d="M12 5v14" />
                                    <path d="m19 12-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateLevel(structure.id, level.id)}
                                  className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                  title="Duplicate Level (Same Level)"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5"
                                  >
                                    <rect width="14" height="14" x="8" y="2" rx="2" ry="2" />
                                    <path d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLevel(structure.id, level.id)}
                                  className={`p-1.5 text-gray-500 hover:text-destructive ${structure.parentId ? 'hidden' : ''}`}
                                  title="Delete level"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {level.spaces && level.spaces.length > 0 && (
                          <div className="bg-muted/5 divide-y divide-[#4DB6AC]/10 dark:divide-[#4DB6AC]/10">
                            {level.spaces.map((space) => (
                              <div 
                                key={space.id} 
                                className="p-3 pl-12"
                                onDragOver={handleSpaceDragOver}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleFeeTableDrop(
                                    e,
                                    structure.id,
                                    level.id,
                                    space.id,
                                    space.discipline,
                                    'design',
                                    dragData
                                  );
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-1.5 bg-primary/5 rounded-md">
                                    <Home className="w-4 h-4 text-primary/70" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium dark:text-[#E5E7EB]">{space.name}</div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setProposal(prev => ({
                                            ...prev,
                                            structures: prev.structures.map(s => {
                                              if (s.id === structure.id) {
                                                return {
                                                  ...s,
                                                  levels: s.levels.map(l => {
                                                    if (l.id === level.id) {
                                                      return {
                                                        ...l,
                                                        spaces: l.spaces.map(sp => {
                                                          if (sp.id === space.id) {
                                                            return { ...sp, splitFees: !sp.splitFees };
                                                          }
                                                          return sp;
                                                        })
                                                      };
                                                    }
                                                    return l;
                                                  })
                                                };
                                              }
                                              if (s.parentId === structure.id) {
                                                return {
                                                  ...s,
                                                  levels: s.levels.map(l => {
                                                    if (l.name === level.name) {
                                                      return {
                                                        ...l,
                                                        spaces: l.spaces.map(sp => {
                                                          if (sp.name === space.name) {
                                                            return { ...sp, splitFees: !sp.splitFees };
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
                                        }}
                                        className={`p-1 rounded-md transition-colors ${
                                          space.splitFees 
                                            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                        title={space.splitFees ? 'Split fees enabled' : 'Split fees disabled'}
                                      >
                                        <SplitSquareVertical className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSpace(structure.id, level.id, space.id)}
                                        className={`p-1.5 text-gray-500 hover:text-destructive ${structure.parentId ? 'hidden' : ''}`}
                                        title="Delete space"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                      {space.description}
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <div className="text-gray-500 dark:text-[#9CA3AF]">
                                        Building Type: {space.buildingType}
                                      </div>
                                      <div className="text-gray-500 dark:text-[#9CA3AF]">
                                        Space Type: {space.spaceType}
                                      </div>
                                      <div className="text-gray-500 dark:text-[#9CA3AF]">
                                        Project Construction Type: {space.projectConstructionType}
                                      </div>
                                      <div className="mt-1">
                                        <div className="text-gray-500 dark:text-[#9CA3AF] mb-1">Disciplines:</div>
                                        <div className="flex flex-wrap gap-2">
                                          {space.totalConstructionCosts.map((fee) => (
                                            <button
                                              key={fee.id}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                try {
                                                  handleDisciplineFeeToggle(structure.id, level.id, space.id, fee.id, !fee.isActive);
                                                } catch (error) {
                                                  console.error('Error toggling discipline:', error);
                                                }
                                              }}
                                              className={`px-2 py-1 rounded-md text-sm transition-colors ${
                                                fee.isActive
                                                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                              }`}
                                              title={fee.isActive ? 'Disable discipline' : 'Enable discipline'}
                                            >
                                              {fee.discipline}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="mt-1 font-medium text-primary">
                                        Construction Cost: {formatCurrency(space.totalCost)}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedStructureId(structure.id);
                                      setSelectedLevelId(level.id);
                                      handleEditSpace(space);
                                    }}
                                    className={`p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors ${structure.parentId ? 'hidden' : ''}`}
                                    title="Edit space"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parentStructure = proposal.structures.find(s => s.id === structure.id);
                                      if (!parentStructure) return;

                                      const parentLevel = parentStructure.levels.find(l => l.id === level.id);
                                      if (!parentLevel) return;

                                      const spaceToDelete = parentLevel.spaces.find(sp => sp.id === space.id);
                                      if (!spaceToDelete) return;

                                      setProposal({
                                        ...proposal,
                                        structures: proposal.structures.map(s => {
                                          // If this is the parent structure
                                          if (s.id === structure.id) {
                                            return {
                                              ...s,
                                              levels: s.levels.map(l =>
                                                l.id === level.id
                                                  ? { ...l, spaces: l.spaces.filter(sp => sp.id !== space.id) }
                                                  : l
                                              )
                                            };
                                          }
                                          // If this is a duplicate structure
                                          if (s.parentId === structure.id) {
                                            return {
                                              ...s,
                                              levels: s.levels.map(l =>
                                                l.name === parentLevel.name
                                                  ? { ...l, spaces: l.spaces.filter(sp => sp.name !== spaceToDelete.name) }
                                                  : l
                                              )
                                            };
                                          }
                                          return s;
                                        })
                                      });
                                    }}
                                    className={`p-1.5 text-gray-500 hover:text-destructive ${structure.parentId ? 'hidden' : ''}`}
                                    title="Delete space"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* ... existing buttons ... */}
                                </div>
                  </div>
                            ))}
                  </div>
                        )}
                  </div>
                    ))}
                  </div>
                )}
                {(!structure.parentId || !collapsedDuplicates.has(structure.id)) && structure.levels.length === 0 && (
                  <div 
                    className="p-4 text-center text-gray-400 border-t border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20 cursor-pointer hover:bg-muted/5"
                    onDragOver={(e) => handleDragOver(e)}
                    onDrop={(e) => handleDrop(e, structure.id)}
                  >
                    <Layers className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <p className="text-sm">Drop a level here</p>
                  </div>
                )}
                  </div>
            ))}
            {proposal.structures.length === 0 && (
              <div className="flex items-center justify-center h-[200px] text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Drag and drop a structure here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-4 dark:text-[#E5E7EB]">Fixed Fees</h2>
              {/* Before rendering FixedFees in the main render/return block:
              console.log('Rendering FixedFees with trackedServices:', proposal.trackedServices); */}
              <FixedFees
                key={proposal.structures.map(s => s.id).join('-') + '-' + trackedServices.map(s => s.id).join('-')}
                structures={proposal.structures}
                phase={proposal.phase}
                onFeeUpdate={handleFeeUpdate}
                designFeeScale={proposal.designFeeScale}
                duplicateStructureRates={proposal.duplicateStructureRates}
                trackedServices={proposal.trackedServices}
                onServiceFeeUpdate={handleServiceFeeUpdate}
                onDisciplineFeeToggle={handleDisciplineFeeToggle}
                constructionCosts={getConstructionCosts(proposal.structures)}
                manualFeeOverrides={manualFeeOverrides}
                setManualFeeOverrides={setManualFeeOverrides}
              />
                          </div>
                        </div>
                      </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Proposal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this proposal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
                                              <button
                                                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                              >
                Cancel
                                              </button>
                                              <button
                                                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
                                              </button>
                                          </div>
          </DialogContent>
        </Dialog>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Proposal</span>
          </button>
          <div className="flex gap-3">
            <Link
              href={`/projects/${id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Proposal</span>
            </button>
          </div>
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
                      setProposal({ ...proposal, clientContact: contact });
                      setIsContactDialogOpen(false);
                    }}
                    className="flex flex-col items-start py-2"
                  >
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <SpaceDialog
        open={isSpaceDialogOpen}
        onOpenChange={handleSpaceDialogClose}
        onSave={handleAddSpace}
        costIndex={proposal.costIndex}
        initialSpace={editingSpace}
        onDisciplineFeeToggle={handleDisciplineFeeToggle}
      />
    </div>
  );
}