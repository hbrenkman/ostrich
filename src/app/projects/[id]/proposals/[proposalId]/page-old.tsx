"use client";

import React, { useState, useEffect, DragEvent } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search, Building2, Layers, Building, Home, Pencil, SplitSquareVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StructureDialog } from './structure-dialog';
import { SpaceDialog } from './space-dialog';
import { createClient } from '@supabase/supabase-js'

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

interface Space {
  id: string;
  name: string;
  description: string;
  floorArea: number;
  buildingType: string;
  buildingTypeId: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  projectConstructionType: string;
  projectConstructionTypeId: number;
  fees: Array<{
    id: string;
    discipline: string;
    totalFee: number;
    isActive: boolean;
    costPerSqft: number;
  }>;
  splitFees: boolean;
  engineeringServices?: Array<{
    id: string;
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee: string | null;
    isActive: boolean;
  }>;
}

interface Level {
  id: string;
  name: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  spaces: Space[];
}

interface Structure {
  id: string;
  constructionType: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  levels: Level[];
  parentId?: string;
  designFeeRate?: number; // Add this new field
  constructionSupportEnabled?: boolean; // Add this new field
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
  feeItems: FeeItem[];  // Replace separate arrays with a single array
}

interface StructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (structure: Omit<Structure, 'id' | 'levels'>) => void;
}

interface DesignFeeScale {
  id: number;
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
  onDisciplineFeeToggle: (structureId: string, discipline: string, isActive: boolean) => void;
}

interface FeeDuplicateStructure {
  id: number;
  rate: number;
}

// Add new interfaces for manual fee overrides
interface ManualFeeOverride {
  structureId: string;
  discipline: string;
  designFee?: number;
  constructionSupportFee?: number;
  spaceId?: string;
}

interface EngineeringStandardService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  estimated_fee: string | null;
  default_setting: boolean;
  phase: 'design' | 'construction' | null;
}

interface EngineeringServicesDisplayProps {
  services: EngineeringStandardService[];
  isLoading: boolean;
}

function EngineeringServicesDisplay({ services, isLoading }: EngineeringServicesDisplayProps) {
  if (isLoading) {
    return <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">Loading...</div>;
  }

  const includedServices = services.filter(service => service.default_setting);
  const excludedServices = services.filter(service => !service.default_setting);

  const groupServicesByDiscipline = (services: EngineeringStandardService[]) => {
    return Object.entries(
      services.reduce((acc, service) => {
        const discipline = service.discipline || 'Other';
        if (!acc[discipline]) acc[discipline] = [];
        acc[discipline].push(service);
        return acc;
      }, {} as Record<string, EngineeringStandardService[]>)
    );
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {/* Included Services */}
      <div className="border border-green-500/20 rounded-md overflow-hidden">
        <div className="bg-green-500/10 px-2 py-1">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Included Services</h3>
        </div>
        {includedServices.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">No included services</div>
        ) : (
          <div className="p-1 space-y-1">
            {groupServicesByDiscipline(includedServices).map(([discipline, services]) => (
              <div key={discipline} className="border-b border-green-500/10 last:border-0">
                <div className="px-2 py-1 bg-green-500/5">
                  <h4 className="text-xs font-medium text-green-600 dark:text-green-400">{discipline}</h4>
                </div>
                <div className="px-2 py-1">
                  {services.map(service => (
                    <div key={service.id} className="text-xs text-gray-700 dark:text-gray-300">
                      {service.service_name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Excluded Services */}
      <div className="border border-red-500/20 rounded-md overflow-hidden">
        <div className="bg-red-500/10 px-2 py-1">
          <h3 className="text-sm font-medium text-red-700 dark:text-red-400">Excluded Services</h3>
        </div>
        {excludedServices.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">No excluded services</div>
        ) : (
          <div className="p-1 space-y-1">
            {groupServicesByDiscipline(excludedServices).map(([discipline, services]) => (
              <div key={discipline} className="border-b border-red-500/10 last:border-0">
                <div className="px-2 py-1 bg-red-500/5">
                  <h4 className="text-xs font-medium text-red-600 dark:text-red-400">{discipline}</h4>
                </div>
                <div className="px-2 py-1">
                  {services.map(service => (
                    <div key={service.id} className="text-xs text-gray-700 dark:text-gray-300">
                      {service.service_name}
                    </div>
                  ))}
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

// Add interface for service links
interface EngineeringServiceLink {
  id: string;
  engineering_service_id: string;
  additional_item_id: string;
  link_type: 'engineering_service' | 'fee_additional_item';
  created_at: string;
  updated_at: string;
}

// Add function to fetch service links
const fetchServiceLinks = async (standardServiceIds: string[]): Promise<EngineeringServiceLink[]> => {
  try {
    const response = await fetch('/api/engineering-service-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ standardServiceIds }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error fetching service links:', errorData?.error || 'Failed to fetch service links');
      throw new Error(errorData?.error || 'Failed to fetch service links');
    }
    
    const data = await response.json();
    return data.links || [];
  } catch (error) {
    console.error('Error fetching service links:', error);
    return [];
  }
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
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [editingStructureName, setEditingStructureName] = useState('');
  const [designFeeScale, setDesignFeeScale] = useState<DesignFeeScale[]>([]);
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

  const [proposal, setProposal] = useState<ProposalFormData>({
    number: proposalId === 'new' ? '' : proposalId,
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
    feeItems: [],
  });

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

  // Remove or consolidate these logs in fetchEngineeringAdditionalServices
  const fetchEngineeringAdditionalServices = async () => {
    try {
      setIsLoadingAdditionalServices(true);
      console.log('Fetching engineering additional services...');
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
      console.log('Raw additional services data:', rawData);
      
      const normalizedItems = rawData.map((item: any) => ({
        ...item,
        phase: item.phase || 'design',
        is_active: item.is_active ?? true
      }));

      console.log('Normalized additional services:', normalizedItems);
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
  useEffect(() => {
    console.log('Current feeItems state:', {
      totalItems: proposal.feeItems.length,
      items: proposal.feeItems.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        discipline: item.discipline,
        parentDiscipline: item.parentDiscipline
      })),
      byType: {
        nested: proposal.feeItems.filter(item => item.type === 'nested').length,
        multi: proposal.feeItems.filter(item => item.type === 'multi').length,
        rescheck: proposal.feeItems.filter(item => item.type === 'rescheck').length,
        discipline: proposal.feeItems.filter(item => item.type === 'discipline').length
      }
    });
  }, [proposal.feeItems]);

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
    setIsDeleting(true);
    setTimeout(() => {
      router.push(`/projects/${id}`);
    }, 500);
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

  const handleAddStructure = (structure: Omit<Structure, 'id'>) => {
    setProposal({
      ...proposal,
      structures: [...proposal.structures, { 
        ...structure, 
        id: crypto.randomUUID(),
        description: structure.description || "New Structure", // Use provided description or default
        designFeeRate: 80,
        constructionSupportEnabled: true 
      }]
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStructureId?: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    
    if (data.type === 'structure') {
      const newStructure: Structure = {
        id: data.id,
        constructionType: "New Construction",
        floorArea: "0",
        description: "New Structure",
        spaceType: "Office",
        discipline: "MEP",
        hvacSystem: "VAV System",
        levels: [{
          id: crypto.randomUUID(),
          name: "Level 0",
          floorArea: "0",
          description: "New Level",
          spaceType: "Office",
          discipline: "MEP",
          hvacSystem: "VAV System",
          spaces: []
        }]
      };
      setProposal({
        ...proposal,
        structures: [...proposal.structures, newStructure]
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
        discipline: "MEP",
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
      discipline: "MEP",
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

  const processLinkedServices = async (structureId: string, levelId: string, disciplines: string[]) => {
    console.log('=== Processing Linked Services ===');
    console.log('Structure ID:', structureId);
    console.log('Level ID:', levelId);
    console.log('Disciplines:', disciplines);

    // Get standard services for these disciplines
    const standardServices = engineeringStandardServices.filter(service => 
      disciplines.includes(service.discipline)
    );

    console.log('Found standard services:', standardServices.length);

    // Process each standard service
    for (const service of standardServices) {
      const serviceLinks = await fetchServiceLinks([service.id]);
      console.log(`Processing service: ${service.service_name} with ${serviceLinks.length} links`);

      for (const link of serviceLinks) {
        const additionalService = engineeringAdditionalServices.find(s => s.id === link.additional_item_id);
        if (additionalService) {
          console.log(`Creating fee item for: ${additionalService.name}`);
          // Create a mock drag event for the additional service
          const dragData = {
            type: 'additional_service',
            item: additionalService,
            source: 'engineering_services'
          };

          // Add the fee item directly
          await handleFeeTableDrop(
            {} as DragEvent<HTMLDivElement>,
            structureId,
            levelId,
            '',  // No space ID needed
            service.discipline,
            additionalService.phase || 'design',
            dragData
          );
        }
      }
    }
  };

  // Remove redundant logging in handleAddSpace
  const handleAddSpace = async (space: Omit<Space, 'id'>) => {
    if (!selectedStructureId || !selectedLevelId) {
      console.error('No structure or level selected');
      return;
    }

    // If we're editing an existing space, update it instead of creating a new one
    if (editingSpace) {
      setProposal(prev => ({
        ...prev,
        structures: prev.structures.map(structure => {
          if (structure.id === selectedStructureId) {
            return {
              ...structure,
              levels: structure.levels.map(level => {
                if (level.id === selectedLevelId) {
                  return {
                    ...level,
                    spaces: level.spaces.map(sp => {
                      if (sp.id === editingSpace.id) {
                        return {
                          ...space,
                          id: sp.id, // Keep the original ID
                          fees: space.fees.map(fee => ({
                            ...fee,
                            id: fee.id || crypto.randomUUID() // Keep existing fee IDs or generate new ones
                          }))
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
        })
      }));

      // Process linked services for updated space
      try {
        const activeDisciplines = space.fees
          .filter(fee => fee.isActive)
          .map(fee => fee.discipline);

        const standardServices = engineeringStandardServices.filter(service => 
          activeDisciplines.includes(service.discipline)
        );

        for (const service of standardServices) {
          const serviceLinks = await fetchServiceLinks([service.id]);
          if (serviceLinks.length > 0) {
            console.log(`Processing "${service.service_name}" with ${serviceLinks.length} linked services`);
          }

          for (const link of serviceLinks) {
            const additionalService = engineeringAdditionalServices.find(s => s.id === link.additional_item_id);
            if (additionalService) {
              const dragData = {
                type: 'additional_service',
                item: additionalService,
                source: 'engineering_services'
              };

              await handleFeeTableDrop(
                {} as DragEvent<HTMLDivElement>,
                selectedStructureId,
                selectedLevelId,
                editingSpace.id,
                service.discipline,
                additionalService.phase || 'design',
                dragData
              );
            }
          }
        }
      } catch (error) {
        console.error('Error processing linked services:', error);
      } finally {
        setIsSpaceDialogOpen(false);
        setEditingSpace(null);
      }
      return;
    }

    // Create a new space with a unique ID (original code for adding new spaces)
    const newSpace: Space = {
      ...space,
      id: crypto.randomUUID(),
      fees: space.fees.map(fee => ({
        ...fee,
        id: crypto.randomUUID()
      }))
    };

    // Get active disciplines before updating state
    const activeDisciplines = space.fees
      .filter(fee => fee.isActive)
      .map(fee => fee.discipline);

    // Update the proposal state
    setProposal(prev => ({
      ...prev,
      structures: prev.structures.map(structure => {
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
      })
    }));

    // Process linked services for new space
    try {
      const standardServices = engineeringStandardServices.filter(service => 
        activeDisciplines.includes(service.discipline)
      );

      for (const service of standardServices) {
        const serviceLinks = await fetchServiceLinks([service.id]);
        if (serviceLinks.length > 0) {
          console.log(`Processing "${service.service_name}" with ${serviceLinks.length} linked services`);
        }

        for (const link of serviceLinks) {
          const additionalService = engineeringAdditionalServices.find(s => s.id === link.additional_item_id);
          if (additionalService) {
            const dragData = {
              type: 'additional_service',
              item: additionalService,
              source: 'engineering_services'
            };

            await handleFeeTableDrop(
              {} as DragEvent<HTMLDivElement>,
              selectedStructureId,
              selectedLevelId,
              newSpace.id,
              service.discipline,
              additionalService.phase || 'design',
              dragData
            );
          }
        }
      }
    } catch (error) {
      console.error('Error processing linked services:', error);
    } finally {
      setIsSpaceDialogOpen(false);
      setEditingSpace(null);
    }
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
      discipline: "MEP",
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
      discipline: "MEP",
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
      discipline: "MEP",
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
      discipline: levelToDuplicate.discipline,
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
      discipline: levelToDuplicate.discipline,
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
      discipline: levelToDuplicate.discipline,
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
    console.log('=== Duplicating Structure ===');
    console.log('Structure ID to duplicate:', structureId);
    
    const structureToDuplicate = proposal.structures.find(s => s.id === structureId);
    if (!structureToDuplicate) {
      console.log('Structure not found:', structureId);
      return;
    }

    console.log('Found structure to duplicate:', {
      ...structureToDuplicate,
      designFeeRate: structureToDuplicate.designFeeRate,
      constructionSupportEnabled: structureToDuplicate.constructionSupportEnabled
    });

    // Create a new structure with a unique ID
    const newStructure: Structure = {
      id: crypto.randomUUID(),
      parentId: structureId,
      constructionType: structureToDuplicate.constructionType,
      floorArea: structureToDuplicate.floorArea,
      description: structureToDuplicate.description,
      spaceType: structureToDuplicate.spaceType,
      discipline: structureToDuplicate.discipline,
      hvacSystem: structureToDuplicate.hvacSystem,
      designFeeRate: structureToDuplicate.designFeeRate ?? 80,
      constructionSupportEnabled: structureToDuplicate.constructionSupportEnabled ?? true,
      levels: structureToDuplicate.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID(),
          fees: space.fees.map(fee => ({
            ...fee,
          id: crypto.randomUUID()
        }))
        }))
      }))
    };

    console.log('Created new structure:', {
      ...newStructure,
      designFeeRate: newStructure.designFeeRate,
      constructionSupportEnabled: newStructure.constructionSupportEnabled
    });

    // Find the index of the structure being duplicated
    const originalIndex = proposal.structures.findIndex(s => s.id === structureId);
    
    // Insert the new structure directly after the original
    setProposal(prev => {
      const newStructures = [...prev.structures];
      newStructures.splice(originalIndex + 1, 0, newStructure);
      
      // Renumber any existing duplicates that come after this point
      const updatedStructures = renumberDuplicates(newStructures, structureId);
      
      return {
        ...prev,
        structures: updatedStructures
      };
    });
  };

  const handleCopyStructure = (structureId: string) => {
    console.log('=== Copying Structure ===');
    console.log('Original Structure ID:', structureId);
    
    const structureToCopy = proposal.structures.find(s => s.id === structureId);
    if (!structureToCopy) {
      console.log('Structure not found:', structureId);
      return;
    }
    console.log('Found structure to copy:', {
      id: structureToCopy.id,
      description: structureToCopy.description,
      levels: structureToCopy.levels.length,
      designFeeRate: structureToCopy.designFeeRate,
      constructionSupportEnabled: structureToCopy.constructionSupportEnabled
    });

    // Create a new structure with copied levels and spaces, but without parentId
    const newStructure: Structure = {
      id: crypto.randomUUID(),
      constructionType: structureToCopy.constructionType,
      floorArea: structureToCopy.floorArea,
      description: `${structureToCopy.description} (Copy)`,
      spaceType: structureToCopy.spaceType,
      discipline: structureToCopy.discipline,
      hvacSystem: structureToCopy.hvacSystem,
      designFeeRate: structureToCopy.designFeeRate ?? 80, // Copy design fee rate with default
      constructionSupportEnabled: structureToCopy.constructionSupportEnabled ?? true, // Copy construction support setting with default
      levels: structureToCopy.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID()
        }))
      }))
    };

    console.log('Created new independent structure:', {
      id: newStructure.id,
      description: newStructure.description,
      levels: newStructure.levels.length,
      designFeeRate: newStructure.designFeeRate,
      constructionSupportEnabled: newStructure.constructionSupportEnabled
    });

    // Add the new structure to the end of the array
    setProposal({
      ...proposal,
      structures: [...proposal.structures, newStructure]
    });
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
          return { ...s, description: editingStructureName };
        }
        // Update duplicate structures
        if (s.parentId === structureId) {
          // Use getDuplicateNumber to get the correct duplicate number
          const duplicateNumber = getDuplicateNumber(proposal.structures, s);
          console.log('Updating duplicate structure:', {
            id: s.id,
            duplicateNumber,
            newName: `${editingStructureName} (Duplicate ${duplicateNumber})`
          });
          return {
            ...s,
            description: `${editingStructureName} (Duplicate ${duplicateNumber})`
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
        const spaceCost = space.fees.reduce((feeSum, fee) => 
          feeSum + (fee.isActive ? fee.totalFee : 0), 0);
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

  // Update calculateDisciplineFee to use duplicate rate
  const calculateDisciplineFee = (
    constructionCost: number,
    discipline: string | number,
    structure: Structure
  ): { fee: number; rate: number } => {
    // Remove redundant logging
    const duplicateRate = getDuplicateRate(structure);
    const feeScale = getFeeScale(constructionCost, discipline, duplicateRate);
    
    // Only log the final result
    console.log(`${discipline} Fee Calculation:`, {
      constructionCost,
      rate: feeScale.adjustedRate,
      fee: constructionCost * (feeScale.adjustedRate / 100)
    });

    return {
      fee: constructionCost * (feeScale.adjustedRate / 100),
      rate: feeScale.adjustedRate
    };
  };

  const calculateTotalDesignFee = (structure: Structure): number => {
    console.log('=== Calculating Total Design Fee ===');
    let total = 0;

    // Calculate fees for each space
    structure.levels.forEach(level => {
      level.spaces.forEach(space => {
        console.log(`\nSpace: ${space.name}`);
        
        // Calculate fees for each active discipline
        space.fees.forEach(fee => {
          if (!fee.isActive) {
            console.log(`Skipping inactive fee for ${fee.discipline}`);
            return;
          }

          const { fee: disciplineFee } = calculateDisciplineFee(fee.totalFee, fee.discipline, structure);
          console.log(`${fee.discipline} Fee:`, {
            constructionCost: fee.totalFee,
            designFee: disciplineFee
          });
          
          total += disciplineFee;
        });
      });
    });

    // Add any additional fee items for design phase
    const additionalFees = proposal.feeItems
      .filter(item => item.phase === 'design')
      .reduce((sum, item) => sum + (Number(item.default_min_value) || 0), 0);

    console.log('\nFinal Totals:', {
      disciplineFees: total,
      additionalFees,
      total: total + additionalFees
    });

    return total + additionalFees;
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

  // Add the getFeeScale function
  const getFeeScale = (
    constructionCost: number,
    discipline: string | number,
    duplicateRate: number
  ) => {
    if (!designFeeScale.length) {
      return { adjustedRate: 0 };
    }

    // Find the appropriate fee scale row
    const scale = designFeeScale.find((row, index) => {
      const nextRow = designFeeScale[index + 1];
      return !nextRow || constructionCost <= nextRow.construction_cost;
    });

    if (!scale) {
      return { adjustedRate: 0 };
    }

    // If discipline is a number or 'total', use the prime consultant fee
    if (typeof discipline === 'number' || discipline === 'total') {
      const baseRate = scale.prime_consultant_fee;
      return { adjustedRate: baseRate * duplicateRate };
    }

    // Get the appropriate fraction based on discipline
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
    const baseRate = scale.prime_consultant_fee;
    const disciplineRate = baseRate * (fractionRate / 100);
    return { adjustedRate: disciplineRate * duplicateRate };
  };

  const handleFeeTableDrop = (
    e: DragEvent<HTMLDivElement>,
    structureId: string,
    levelId: string,
    spaceId: string,
    discipline: string,
    phase: 'design' | 'construction',
    dragDataOverride?: any
  ) => {
    // Parse drag data from event or use override
    const parsedDragData = dragDataOverride || (e.dataTransfer?.getData('application/json') ? JSON.parse(e.dataTransfer.getData('application/json')) : null);
    
    if (!parsedDragData) {
      console.error('Invalid drag data');
      return;
    }

    if (parsedDragData.type !== 'fee_item' && parsedDragData.type !== 'additional_service') {
      console.error('Invalid drag data type:', parsedDragData.type);
      return;
    }

    if (parsedDragData.type === 'fee_item') {
      const item = parsedDragData.item as FeeItem;
      const itemPhase = parsedDragData.phase as 'design' | 'construction';

      if (itemPhase !== phase) {
        console.log('Phase mismatch:', { itemPhase, targetPhase: phase });
        return;
      }

      const itemType = getItemType(item.name, discipline, item.discipline);
      console.log('Determined item type:', itemType);

      const newFeeItem: FeeItem = {
        id: crypto.randomUUID(),
        name: item.name,
        description: item.description,
        default_min_value: item.default_min_value,
        isActive: true,
        type: itemType,
        discipline: itemType === 'nested' ? discipline : itemType === 'discipline' ? item.name : item.discipline || discipline,
        parentDiscipline: itemType === 'nested' ? discipline : undefined,
        phase: itemPhase
      };

      // Update the proposal state with the new fee item
      setProposal(prev => {
        const updatedStructures = prev.structures.map(structure => {
          if (structure.id === structureId) {
            return {
              ...structure,
              levels: structure.levels.map(level => {
                if (level.id === levelId) {
                  return {
                    ...level,
                    spaces: level.spaces.map(space => {
                      if (space.id === spaceId) {
                        const updatedServices = [...(space.engineeringServices || [])];
                        // Convert FeeItem to EngineeringService format
                        const engineeringService = {
                          id: newFeeItem.id,
                          discipline: newFeeItem.discipline || '',
                          service_name: newFeeItem.name,
                          description: newFeeItem.description,
                          estimated_fee: null,
                          isActive: newFeeItem.isActive
                        };
                        updatedServices.push(engineeringService);
                        return {
                          ...space,
                          engineeringServices: updatedServices
                        };
                      }
                      return space;
                    })
                  };
                }
                return level;
              })
            };
          }
          return structure;
        });

        return {
          ...prev,
          structures: updatedStructures
        };
      });
    } else if (parsedDragData.type === 'additional_service') {
      const item = parsedDragData.item as EngineeringAdditionalServices;
      const itemPhase = item.phase || 'design';

      if (itemPhase !== phase) {
        console.log('Phase mismatch:', { itemPhase, targetPhase: phase });
        return;
      }

      if (!item.discipline) {
        console.error('Additional service missing discipline');
        return;
      }

      console.log('Processing additional service:', {
        name: item.name,
        phase: itemPhase,
        discipline: item.discipline
      });

      // Convert EngineeringAdditionalService to EngineeringService format
      const engineeringService = {
        id: crypto.randomUUID(),
        discipline: item.discipline,
        service_name: item.name,
        description: item.description,
        estimated_fee: null,
        isActive: true
      };

      // Update the proposal state
      setProposal(prev => {
        const updatedStructures = prev.structures.map(structure => {
          if (structure.id === structureId) {
            return {
              ...structure,
              levels: structure.levels.map(level => {
                if (level.id === levelId) {
                  return {
                    ...level,
                    spaces: level.spaces.map(space => {
                      if (space.id === spaceId) {
                        return {
                          ...space,
                          engineeringServices: [...(space.engineeringServices || []), engineeringService]
                        };
                      }
                      return space;
                    })
                  };
                }
                return level;
              })
            };
          }
          return structure;
        });

        return {
          ...prev,
          structures: updatedStructures
        };
      });
    }
  };

  // Add a helper function to determine if a drop is allowed
  const isDropAllowed = (e: DragEvent<HTMLDivElement>, targetPhase: 'design' | 'construction'): boolean => {
    if (!dragData) return false;
    return dragData.type === 'additional_item' && dragData.phase === targetPhase;
  };

  // Add handler for deleting fee items
  const handleDeleteFeeItem = (itemId: string) => {
    setProposal(prev => ({
      ...prev,
      feeItems: prev.feeItems.filter(item => item.id !== itemId)
    }));
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

  // Add helper function to get manual override
  const getManualOverride = (structureId: string, discipline: string, spaceId?: string): ManualFeeOverride | undefined => {
    return manualFeeOverrides.find(o => 
      o.structureId === structureId && 
      o.discipline === discipline && 
      (!spaceId || o.spaceId === spaceId)
    );
  };

  // Add helper function to handle fee updates
  const handleFeeUpdate = (structureId: string, discipline: string, type: 'design' | 'construction', value: number | null, spaceId?: string) => {
    // Only allow overrides for space-level fees
    if (!spaceId) return;

    // Treat empty/null values as 0 for calculations
    const effectiveValue = value === null ? 0 : value;

    // Update the manual override
    setManualFeeOverrides((prev: ManualFeeOverride[]) => {
      const existing = prev.find(o => 
        o.structureId === structureId && 
        o.discipline === discipline && 
        o.spaceId === spaceId
      );
      if (existing) {
        return prev.map(o => 
          o.structureId === structureId && o.discipline === discipline && o.spaceId === spaceId
            ? { ...o, [type === 'design' ? 'designFee' : 'constructionSupportFee']: effectiveValue }
            : o
        );
      }
      return [...prev, {
        structureId,
        discipline,
        spaceId,
        [type === 'design' ? 'designFee' : 'constructionSupportFee']: effectiveValue
      }];
    });

    // Update the proposal state with new space fee and recalculate discipline total
    setProposal(prev => {
      const structure = prev.structures.find(s => s.id === structureId);
      if (!structure) return prev;

      // First update the space's fee
      const updatedStructures = prev.structures.map(s => {
        if (s.id === structureId) {
          return {
            ...s,
            levels: s.levels.map(l => ({
              ...l,
              spaces: l.spaces.map(sp => {
                if (sp.id === spaceId) {
                  return {
                    ...sp,
                    fees: sp.fees.map(f => {
                      if (f.discipline === discipline) {
                        return { ...f, totalFee: effectiveValue };
                      }
                      return f;
                    })
                  };
                }
                return sp;
              })
            }))
          };
        }
        return s;
      });

      // Then calculate the discipline total by summing all active spaces
      const updatedStructuresWithTotals = updatedStructures.map(s => {
        if (s.id === structureId) {
          // Get all spaces with this discipline
          const spacesWithDiscipline = s.levels.flatMap(level => 
            level.spaces.filter(space => 
              space.fees.some(fee => fee.discipline === discipline && fee.isActive)
            )
          );

          // Calculate total for this discipline by summing all active spaces
          const disciplineTotal = spacesWithDiscipline.reduce((sum, space) => {
            // Get the fee for this discipline in this space
            const spaceFee = space.fees.find(f => f.discipline === discipline);
            // Add the fee to the sum (use 0 if no fee found)
            const feeValue = spaceFee?.totalFee ?? 0;
            console.log(`Space ${space.name} fee: ${feeValue}`); // Debug log
            return sum + feeValue;
          }, 0);

          console.log(`Total for discipline ${discipline}: ${disciplineTotal}`); // Debug log

          // Update the discipline total in all spaces
          return {
            ...s,
            levels: s.levels.map(l => ({
              ...l,
              spaces: l.spaces.map(sp => ({
                ...sp,
                fees: sp.fees.map(f => {
                  if (f.discipline === discipline) {
                    // Update the discipline total in the fee item
                    return { ...f, costPerSqft: disciplineTotal };
                  }
                  return f;
                })
              }))
            }))
          };
        }
        return s;
      });

      return {
        ...prev,
        structures: updatedStructuresWithTotals
      };
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
  const handleDisciplineFeeToggle = (structureId: string, discipline: string, isActive: boolean) => {
    try {
      setProposal((prev: ProposalFormData) => {
        // Find the structure first to validate it exists
        const structure = prev.structures.find((s: Structure) => s.id === structureId);
        if (!structure) {
          console.error('Structure not found:', structureId);
          return prev;
        }

        const updatedStructures = prev.structures.map((s: Structure) => {
          if (s.id === structureId) {
            // Create a new levels array with updated spaces
            const updatedLevels = s.levels.map((l: Level) => {
              // Create a new spaces array with updated fees
              const updatedSpaces = l.spaces.map((sp: Space) => {
                // Create a new fees array with the toggled discipline
                const updatedFees = sp.fees.map((f: { id: string; discipline: string; totalFee: number; isActive: boolean; costPerSqft: number; }) => {
                  if (f.discipline === discipline) {
                    return { ...f, isActive };
                  }
                  return f;
                });

                return {
                  ...sp,
                  fees: updatedFees
                };
              });

              return {
                ...l,
                spaces: updatedSpaces
              };
            });

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
    } catch (error) {
      console.error('Error toggling discipline fee:', error);
    }
  };

  // Update the fee table toggle handler to properly update space fees
  const handleFeeTableToggle = (structureId: string, discipline: string, isActive: boolean) => {
    setProposal(prev => {
      const structure = prev.structures.find(s => s.id === structureId);
      if (!structure) return prev;

      // Get all spaces under this discipline
      const spacesWithDiscipline = structure.levels.flatMap(level =>
        level.spaces.filter(space => 
          space.fees.some(fee => fee.discipline === discipline)
        )
      );

      // If we're enabling the discipline, enable all spaces
      // If we're disabling the discipline, disable all spaces
      const updatedStructures = prev.structures.map(s => {
        if (s.id === structureId) {
          return {
            ...s,
            levels: s.levels.map(l => ({
              ...l,
              spaces: l.spaces.map(sp => ({
                ...sp,
                fees: sp.fees.map(f => {
                  if (f.discipline === discipline) {
                    return { ...f, isActive };
                  }
                  return f;
                })
              }))
            }))
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
                  className={`p-4 bg-muted/5 hover:bg-muted/10 cursor-pointer flex items-center gap-4 border-b border-[#4DB6AC]/50 dark:border-[#4DB6AC]/50 ${
                    structure.parentId ? 'bg-muted/10' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e, structure.id)}
                >
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
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
                        <div className="font-medium dark:text-[#E5E7EB]">{structure.description}</div>
                        {!structure.parentId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStructureId(structure.id);
                              setEditingStructureName(structure.description);
                            }}
                            className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                            title="Edit Structure Name"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                      {structure.constructionType} • {calculateTotalSquareFootage(structure).toLocaleString()} sq ft • {formatCurrency(calculateTotalConstructionCost(structure))}
                    </div>
                    {!structure.parentId && (
                      <EngineeringServicesDisplay
                        services={engineeringStandardServices}
                        isLoading={isLoadingStandardServices}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                      onClick={() => {
                        const structureToDelete = proposal.structures.find(s => s.id === structure.id);
                        if (!structureToDelete) return;

                        // If this is a duplicate, we need to renumber the remaining duplicates
                        if (structureToDelete.parentId) {
                          setProposal(prev => ({
                            ...prev,
                            structures: renumberDuplicates(
                              prev.structures.filter(s => s.id !== structure.id),
                              structureToDelete.parentId!
                            )
                          }));
                        } else {
                          // If this is a parent structure, delete it and all its duplicates
                          setProposal(prev => ({
                            ...prev,
                            structures: prev.structures.filter(s => s.id !== structure.id && s.parentId !== structure.id)
                          }));
                        }
                      }}
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
                                    setIsSpaceDialogOpen(true);
                                  }}
                                  className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                  title="Add Space"
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
                                  onClick={() => {
                                    const parentStructure = proposal.structures.find(s => s.id === structure.id);
                                    if (!parentStructure) return;

                                    const levelToDelete = parentStructure.levels.find(l => l.id === level.id);
                                    if (!levelToDelete) return;

                                    setProposal({
                                      ...proposal,
                                      structures: proposal.structures.map(s => {
                                        if (s.id === structure.id) {
                                          return {
                                            ...s,
                                            levels: s.levels.filter(l => l.id !== level.id)
                                          };
                                        }
                                        if (s.parentId === structure.id) {
                                          return {
                                            ...s,
                                            levels: s.levels.filter(l => l.name !== levelToDelete.name)
                                          };
                                        }
                                        return s;
                                      })
                                    });
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-destructive"
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
                              <div key={space.id} className="p-3 pl-12">
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
                                          {space.fees.map((fee) => (
                                            <button
                                              key={fee.id}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                try {
                                                  handleDisciplineFeeToggle(structure.id, fee.discipline, !fee.isActive);
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
                                        Construction Cost: {formatCurrency(space.fees.reduce((sum, fee) => sum + (fee.isActive ? fee.totalFee : 0), 0))}
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
                                  <button
                                    type="button"
                                    onClick={() => processLinkedServices(structure.id, level.id, [space.discipline])}
                                    className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                    title="Process Linked Services"
                                  >
                                    <SplitSquareVertical className="w-3.5 h-3.5" />
                                  </button>
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
            {/* Fee Table Section - Add overflow-auto to enable scrolling */}
            <div className="flex-1 min-w-0 overflow-auto">
              <h2 className="text-lg font-semibold mb-4 dark:text-[#E5E7EB]">Fee Table</h2>
              <div className="space-y-6">
                {proposal.structures.map((structure, structureIndex) => {
                  // Calculate total structure cost first
                  const totalStructureCost = structure.levels.reduce((total, level) =>
                    level.spaces.reduce((levelTotal, space) =>
                      levelTotal + space.fees.reduce((feeTotal, fee) =>
                        feeTotal + (fee.isActive ? fee.totalFee : 0), 0), 0), 0);

                  // Get the design fee rate and calculate construction support rate
                  const designFeeRate = structure.designFeeRate ?? 80;
                  const constructionSupportRate = 100 - designFeeRate;
                  const { fee: totalDesignFee, rate: designFeeRateFromScale } = calculateDisciplineFee(totalStructureCost, 'total', structure);
                  const totalConstructionSupportFee = totalDesignFee * (constructionSupportRate / 100);

                  // Calculate individual discipline fees based on their proportion of the total cost
                  const structureFees = structure.levels.flatMap(level =>
                    level.spaces.flatMap(space => space.fees)
                  );
                  
                  if (structureFees.length === 0) return null;

                  return (
                    <div key={structure.id} className="border border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20 rounded-lg overflow-hidden">
                      {/* Building Header */}
                      <div className="bg-muted/5 p-4 border-b border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            <span className="text-lg font-medium text-gray-900 dark:text-[#E5E7EB]">
                              {structure.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                Design Fee Percentage:
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={designFeeRate}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 100) {
                                      handleDesignFeeRateChange(structure.id, value);
                                    }
                                  }}
                                  className="w-20 px-2 py-1 text-sm border border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                Construction Support Percentage:
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={constructionSupportRate}
                                  readOnly
                                  className="w-20 px-2 py-1 text-sm border border-[#4DB6AC] rounded-md bg-muted/10 text-gray-500 cursor-not-allowed"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleConstructionSupportToggle(structure.id, !(structure.constructionSupportEnabled ?? true))}
                                className={`p-1.5 rounded-md transition-colors ${
                                  structure.constructionSupportEnabled !== false
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                                title={structure.constructionSupportEnabled !== false ? 'Disable construction support' : 'Enable construction support'}
                              >
                                {structure.constructionSupportEnabled !== false ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M20 6 9 17l-5-5"/>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fee Tables Container */}
                      <div className="divide-y divide-[#4DB6AC]/20 dark:divide-[#4DB6AC]/20">
                        {/* Design Phase Fees */}
                        <div className="p-4">
                          <h3 className="text-md font-medium mb-4 text-gray-700 dark:text-[#E5E7EB]">Design Phase Fees</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20">
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[30%]">Item</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[20%]">Construction Cost</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[15%]">Design Fee Rate</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[20%]">Design Fee</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[15%]">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#4DB6AC]/20 dark:divide-[#4DB6AC]/20">
                                {/* Group fees by discipline */}
                                {Array.from((() => {
                                  // Create a map to store combined fees by discipline
                                  const disciplineFees = new Map<string, {
                                    totalCost: number;
                                    fees: { id: string; spaceId: string; levelId: string; isActive: boolean }[];
                                  }>();

                                  // Collect all fees by discipline
                                  structure.levels.forEach(level => {
                                    level.spaces.forEach(space => {
                                      space.fees.forEach(fee => {
                                        if (!disciplineFees.has(fee.discipline)) {
                                          disciplineFees.set(fee.discipline, {
                                            totalCost: 0,
                                            fees: []
                                          });
                                        }
                                        const disciplineData = disciplineFees.get(fee.discipline)!;
                                        disciplineData.totalCost += fee.totalFee;
                                        disciplineData.fees.push({
                                          id: fee.id,
                                          spaceId: space.id,
                                          levelId: level.id,
                                          isActive: fee.isActive
                                        });
                                      });
                                    });
                                  });

                                  return disciplineFees;
                                })()).map(([discipline, data]) => {
                                  const { fee: disciplineDesignFee, rate: disciplineRate } = calculateDisciplineFee(data.totalCost, discipline as string, structure);
                                  const isActive = data.fees.some(f => f.isActive);
                                  const manualOverride = getManualOverride(structure.id, discipline);
                                  const displayDesignFee = manualOverride?.designFee ?? disciplineDesignFee;

                                      return (
                                    <React.Fragment key={discipline}>
                                      <tr className="hover:bg-muted/5"
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          e.dataTransfer.dropEffect = isDropAllowed(e, 'design') ? 'copy' : 'none';
                                        }}
                                        onDrop={(e) => handleFeeTableDrop(e, structure.id, '', '', discipline, 'design')}
                                      >
                                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-8">
                                          {discipline}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                          {formatCurrency(data.totalCost)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                          {disciplineRate.toFixed(1)}%
                                            </td>
                                        <td className="py-3 px-4 text-sm">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-900 dark:text-[#E5E7EB]">
                                              {formatCurrency(displayDesignFee)}
                                            </span>
                                            {manualOverride?.designFee !== undefined && (
                                              <button
                                                type="button"
                                                onClick={() => handleResetFees(structure.id, discipline)}
                                                className="p-1 text-gray-500 hover:text-primary"
                                                title="Reset to calculated value"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                                  <path d="M3 3v5h5"/>
                                                </svg>
                                              </button>
                                            )}
                                          </div>
                                            </td>
                                            <td className="py-3 px-4">
                                          <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                              onClick={() => {
                                                // Get all spaces under this discipline
                                                const spacesWithDiscipline = structure.levels.flatMap(level =>
                                                  level.spaces.filter(space => 
                                                    space.fees.some(fee => fee.discipline === discipline)
                                                  )
                                                );

                                                // Get all fees for this discipline across all spaces
                                                const disciplineFees = spacesWithDiscipline.flatMap(space =>
                                                  space.fees.filter(fee => fee.discipline === discipline)
                                                );

                                                // If all fees are active, disable all. Otherwise, enable all
                                                const allActive = disciplineFees.every(fee => fee.isActive);
                                                handleFeeTableToggle(structure.id, discipline, !allActive);
                                              }}
                                              className={`p-1.5 rounded-md transition-colors ${
                                                data.fees.some(f => f.isActive)
                                                  ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                              }`}
                                              title={data.fees.some(f => f.isActive) ? 'Disable all spaces for this discipline' : 'Enable all spaces for this discipline'}
                                            >
                                              {data.fees.some(f => f.isActive) ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                  <path d="M20 6 9 17l-5-5"/>
                                                </svg>
                                              ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                  <path d="M18 6 6 18"/>
                                                  <path d="m6 6 12 12"/>
                                                </svg>
                                              )}
                                              </button>
                                          </div>
                                            </td>
                                          </tr>

                                      {/* Show individual space fees only if splitFees is true */}
                                      {structure.levels.flatMap(level =>
                                        level.spaces.filter(space => space.splitFees).flatMap(space =>
                                          space.fees.filter(fee => fee.discipline === discipline).map(fee => {
                                            const { fee: spaceDesignFee, rate: spaceRate } = calculateDisciplineFee(fee.totalFee, fee.discipline, structure);
                                            return (
                                              <tr key={`${fee.id}-${space.id}`} className="hover:bg-muted/5 bg-muted/5">
                                                <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-12">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">└─</span>
                                                    {space.name}
                                                  </div>
                                                </td>
                                                <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                                  {formatCurrency(fee.totalFee)}
                                                </td>
                                                <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                                  {spaceRate.toFixed(1)}%
                                                </td>
                                                <td className="py-2 px-4 text-sm">
                                                  <div className="flex items-center gap-2">
                                                    <input
                                                      type="text"
                                                      defaultValue={getManualOverride(structure.id, fee.discipline, space.id)?.designFee ?? 
                                                        (fee.isActive ? spaceDesignFee : '')}
                                                      onBlur={(e) => {
                                                        const val = e.target.value === '' ? null : Number(e.target.value);
                                                        handleFeeUpdate(structure.id, fee.discipline, 'design', val, space.id);
                                                      }}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                          e.currentTarget.blur(); // This will trigger the onBlur handler
                                                        }
                                                      }}
                                                      className="w-24 px-2 py-1 text-sm border border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                                                    />
                                                    {getManualOverride(structure.id, fee.discipline, space.id)?.designFee !== undefined && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleResetFees(structure.id, fee.discipline, space.id)}
                                                        className="p-1 text-gray-500 hover:text-primary"
                                                        title="Reset to calculated value"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                                          <path d="M3 3v5h5"/>
                                                        </svg>
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="py-2 px-4">
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
                                                                        return {
                                                                          ...sp,
                                                                          fees: sp.fees.map(f => {
                                                                            if (f.id === fee.id) {
                                                                              return { ...f, isActive: !f.isActive };
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
                                                        })
                                                      }));
                                                    }}
                                                    className={`p-1.5 rounded-md transition-colors ${
                                                      fee.isActive 
                                                        ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                                    title={fee.isActive ? 'Disable fee' : 'Enable fee'}
                                                  >
                                                    {fee.isActive ? (
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                        <path d="M20 6 9 17l-5-5"/>
                                                      </svg>
                                                    ) : (
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                        <path d="M18 6 6 18"/>
                                                        <path d="m6 6 12 12"/>
                                                      </svg>
                                                    )}
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })
                                        )
                                      )}

                                      {/* Find nested items for this discipline */}
                                      {proposal.feeItems
                                        .filter(feeItem => feeItem.type === 'nested' && feeItem.parentDiscipline === discipline && feeItem.phase === 'design')
                                        .map(nestedItem => (
                                          <tr key={`nested-${nestedItem.id}-${discipline}`} className="hover:bg-muted/5 bg-muted/5">
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-12">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-gray-500">└─</span>
                                                  {nestedItem.name}
                                                </div>
                                              </td>
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                                -
                                              </td>
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                                -
                                              </td>
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                                {formatCurrency(nestedItem.default_min_value)}
                                              </td>
                                              <td className="py-2 px-4">
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteFeeItem(nestedItem.id)}
                                                  className="p-1.5 text-gray-500 hover:text-destructive"
                                                title="Delete item"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                    </React.Fragment>
                                      );
                                })}

                                {/* Multi-discipline items */}
                                {proposal.feeItems
                                  .filter(item => item.type === 'multi' && item.phase === 'design')
                                  .map(item => (
                                    <tr 
                                      key={item.id} 
                                      className="hover:bg-muted/5"
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'none';
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        console.log('Drop rejected - multi-discipline items section does not accept drops');
                                      }}
                                    >
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-8">
                                        {item.name}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        -
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        -
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        {formatCurrency(item.default_min_value)}
                                      </td>
                                      <td className="py-3 px-4">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFeeItem(item.id)}
                                          className="p-1.5 text-gray-500 hover:text-destructive"
                                          title="Delete item"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}

                                {/* ResCheck items */}
                                {proposal.feeItems
                                  .filter(item => item.type === 'rescheck' && item.phase === 'design')
                                  .map(item => (
                                    <tr 
                                      key={item.id} 
                                      className="hover:bg-muted/5"
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'none';
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        console.log('Drop rejected - rescheck items section does not accept drops');
                                      }}
                                    >
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-8">
                                        {item.name}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        -
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        -
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        {formatCurrency(item.default_min_value)}
                                      </td>
                                      <td className="py-3 px-4">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFeeItem(item.id)}
                                          className="p-1.5 text-gray-500 hover:text-destructive"
                                          title="Delete item"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}

                                {/* Update the Design Phase Total row */}
                                <tr className="bg-muted/5 border-t border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20">
                                  <td className="py-2 px-4 text-sm font-medium text-gray-900 dark:text-[#E5E7EB]">
                                    Design Phase Total
                                  </td>
                                  <td className="py-2 px-4 text-sm font-medium text-primary">
                                    {formatCurrency(totalStructureCost)}
                                  </td>
                                  <td className="py-2 px-4 text-sm font-medium text-gray-900 dark:text-[#E5E7EB]">
                                    {(() => {
                                      const totalFee = structure.levels.reduce((total, level) => 
                                        total + level.spaces.reduce((levelTotal, space) => 
                                          levelTotal + space.fees.reduce((feeTotal, fee) => {
                                            const manualOverride = getManualOverride(structure.id, fee.discipline);
                                            const { fee: disciplineDesignFee } = calculateDisciplineFee(fee.totalFee, fee.discipline, structure);
                                            return feeTotal + (manualOverride?.designFee ?? disciplineDesignFee);
                                          }, 0)
                                        , 0)
                                      , 0);
                                      const effectiveRate = (totalFee / totalStructureCost) * 100;
                                      return isNaN(effectiveRate) ? '0.0' : effectiveRate.toFixed(1);
                                    })()}%
                                  </td>
                                  <td className="py-2 px-4 text-sm font-medium text-primary">
                                    {formatCurrency(structure.levels.reduce((total, level) => 
                                      total + level.spaces.reduce((levelTotal, space) => 
                                        levelTotal + space.fees.reduce((feeTotal, fee) => {
                                          const manualOverride = getManualOverride(structure.id, fee.discipline);
                                          const { fee: disciplineDesignFee } = calculateDisciplineFee(fee.totalFee, fee.discipline, structure);
                                          return feeTotal + (manualOverride?.designFee ?? disciplineDesignFee);
                                        }, 0)
                                      , 0)
                                    , 0))}
                                  </td>
                                  <td className="py-2 px-4"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Construction Phase Fees */}
                        <div className="p-4">
                          <h3 className="text-md font-medium mb-4 text-gray-700 dark:text-[#E5E7EB]">Construction Phase Fees</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20">
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[30%]">Discipline</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[20%]">Construction Cost</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[15%]">Design Fee Rate</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[20%]">Construction Support Fee</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] w-[15%]">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#4DB6AC]/20 dark:divide-[#4DB6AC]/20">
                                {/* Show discipline rows when construction support is enabled */}
                                {structure.constructionSupportEnabled !== false && structure.levels.flatMap(level =>
                                  level.spaces.flatMap(space =>
                                    space.fees.map((fee, index) => {
                                      // Calculate the discipline's design fee first
                                      const { fee: disciplineDesignFee } = calculateDisciplineFee(fee.totalFee, fee.discipline, structure);
                                      
                                      // Calculate construction support fee based on the discipline's design fee and construction support rate
                                      const disciplineConstructionSupportFee = disciplineDesignFee * (constructionSupportRate / 100);
                                      const manualOverride = getManualOverride(structure.id, fee.discipline);
                                      const displayConstructionSupportFee = manualOverride?.constructionSupportFee ?? disciplineConstructionSupportFee;

                                      // Find nested items for this discipline
                                      const nestedItems = proposal.feeItems.filter(
                                        item => item.type === 'nested' && item.parentDiscipline === fee.discipline && item.phase === 'construction'
                                      );

                                      return (
                                        <React.Fragment key={`construction-${fee.id}-${level.id}-${space.id}`}>
                                          <tr className="hover:bg-muted/5"
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                              e.dataTransfer.dropEffect = isDropAllowed(e, 'construction') ? 'copy' : 'none';
                                          }}
                                          onDrop={(e) => handleFeeTableDrop(e, structure.id, level.id, space.id, fee.discipline, 'construction')}
                                        >
                                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-8">
                                            {fee.discipline}
                                          </td>
                                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                            {formatCurrency(fee.totalFee)}
                                          </td>
                                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                              {(() => {
                                                const { rate: disciplineRate } = calculateDisciplineFee(fee.totalFee, fee.discipline, structure);
                                                return disciplineRate.toFixed(1);
                                              })()}%
                                          </td>
                                          <td className="py-3 px-4 text-sm">
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                value={formatInputValue(displayConstructionSupportFee)}
                                                onChange={(e) => {
                                                  const value = parseInputValue(e.target.value);
                                                  handleFeeUpdate(structure.id, fee.discipline, 'construction', value, space.id);
                                                }}
                                                className="w-32 px-2 py-1 text-sm border border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                                                placeholder="0.00"
                                              />
                                              {manualOverride?.constructionSupportFee !== undefined && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleResetFees(structure.id, fee.discipline, space.id)}
                                                  className="p-1 text-gray-500 hover:text-primary"
                                                  title="Reset to calculated value"
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                                    <path d="M3 3v5h5"/>
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-3 px-4">
                                              <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newIsActive = !fee.isActive;
                                                handleFeeTableToggle(structure.id, fee.discipline, newIsActive);
                                              }}
                                              className={`p-1.5 rounded-md transition-colors ${
                                                fee.isActive
                                                  ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                              }`}
                                              title={fee.isActive ? 'Disable discipline' : 'Enable discipline'}
                                            >
                                              {fee.isActive ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                  <path d="M20 6 9 17l-5-5"/>
                                                </svg>
                                              ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                  <path d="M18 6 6 18"/>
                                                  <path d="m6 6 12 12"/>
                                                </svg>
                                              )}
                                            </button>
                                              </div>
                                          </td>
                                        </tr>
                                          {nestedItems.map(nestedItem => (
                                            <tr key={`construction-nested-${nestedItem.id}-${fee.id}`} className="hover:bg-muted/5 bg-muted/5">
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-12">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-gray-500">└─</span>
                                                  {nestedItem.name}
                                                </div>
                                              </td>
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">-</td>
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">-</td>
                                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                                {formatCurrency(nestedItem.default_min_value)}
                                              </td>
                                              <td className="py-2 px-4">
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteFeeItem(nestedItem.id)}
                                                  className="p-1.5 text-gray-500 hover:text-destructive"
                                                  title="Delete item"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </React.Fragment>
                                      );
                                    })
                                  )
                                )}

                                {/* Show placeholder row for dropping items when construction support is disabled */}
                                {structure.constructionSupportEnabled === false && (
                                  <tr 
                                    className="hover:bg-muted/5"
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.dataTransfer.dropEffect = isDropAllowed(e, 'construction') ? 'copy' : 'none';
                                    }}
                                    onDrop={(e) => handleFeeTableDrop(e, structure.id, '', '', 'construction', 'construction')}
                                  >
                                    <td colSpan={5} className="py-8 px-4 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">
                                      <div className="flex flex-col items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                          <polyline points="17 8 12 3 7 8"/>
                                          <line x1="12" x2="12" y1="3" y2="15"/>
                                        </svg>
                                        <span>Drop additional items here</span>
                                        <span className="text-xs">Construction support is disabled</span>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {/* Multi-discipline items for construction phase - always show these */}
                                {proposal.feeItems
                                  .filter((feeItem: FeeItem) => feeItem.type === 'multi' && feeItem.phase === 'construction')
                                  .map((feeItem: FeeItem) => (
                                    <tr 
                                      key={`construction-multi-${feeItem.id}`} 
                                      className="hover:bg-muted/5"
                                    >
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB] pl-8">
                                        {feeItem.name}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        -
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        -
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#E5E7EB]">
                                        {formatCurrency(feeItem.default_min_value)}
                                      </td>
                                      <td className="py-3 px-4">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFeeItem(feeItem.id)}
                                          className="p-1.5 text-gray-500 hover:text-destructive"
                                          title="Delete item"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}

                                {/* Construction Phase Total row */}
                                <tr className="bg-muted/5 border-t border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20">
                                  <td className="py-2 px-4 text-sm font-medium text-gray-900 dark:text-[#E5E7EB]">
                                    Construction Phase Total
                                  </td>
                                  <td className="py-2 px-4 text-sm font-medium text-primary">
                                    {formatCurrency(totalStructureCost)}
                                  </td>
                                  <td className="py-2 px-4 text-sm font-medium text-gray-900 dark:text-[#E5E7EB]">
                                    {(() => {
                                      const totalFee = calculateTotalDesignFee(structure);
                                      const effectiveRate = (totalFee / totalStructureCost) * 100;
                                      return isNaN(effectiveRate) ? '0.0' : effectiveRate.toFixed(1);
                                    })()}%
                                  </td>
                                  <td className="py-2 px-4 text-sm font-medium text-primary">
                                    {formatCurrency(
                                      (() => {
                                        // Calculate discipline-based construction support fees
                                        const disciplineFees = structure.constructionSupportEnabled !== false
                                          ? structure.levels.reduce((total, level) => 
                                              total + level.spaces.reduce((levelTotal, space) => 
                                                levelTotal + space.fees.reduce((feeTotal, fee) => {
                                                  if (!fee.isActive) return feeTotal;
                                                  const { fee: disciplineDesignFee } = calculateDisciplineFee(fee.totalFee, fee.discipline, structure);
                                                  return feeTotal + (disciplineDesignFee * (constructionSupportRate / 100));
                                                }, 0)
                                              , 0)
                                          , 0)
                                          : 0;

                                        // Calculate additional items fees (both multi-discipline and nested items)
                                        const additionalFees = proposal.feeItems
                                          .filter(item => item.phase === 'construction')
                                          .reduce<number>((total, item) => {
                                            // For multi-discipline items, add their default_min_value
                                            if (item.type === 'multi') {
                                              return total + (Number(item.default_min_value) || 0);
                                            }
                                            // For nested items, add their default_min_value
                                            if (item.type === 'nested') {
                                              return total + (Number(item.default_min_value) || 0);
                                            }
                                            return total;
                                          }, 0);

                                        const total = disciplineFees + additionalFees;
                                        return total;
                                      })()
                                    )}
                                  </td>
                                  <td className="py-2 px-4"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {proposal.structures.every(s => 
                  s.levels.every(l => 
                    l.spaces.every(sp => sp.fees.length === 0)
                  )
                ) && (
                  <div className="text-center py-8 text-gray-500 dark:text-[#9CA3AF]">
                    No fees have been added yet. Add spaces to structures to see fee information.
                  </div>
                )}
              </div>
            </div>

            {/* Additional Items Container - Make it sticky */}
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-24 bg-muted/5 rounded-lg border border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20 p-2">
                <h2 className="text-lg font-semibold mb-2 px-2 dark:text-[#E5E7EB]">Additional Engineering Services</h2>
                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Design Phase Items */}
                  <div className="border border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20 rounded-md overflow-hidden">
                    <div className="bg-muted/10 px-2 py-1.5">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">Design Phase</h3>
                    </div>
                    {isLoadingAdditionalServices ? (
                      <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">Loading...</div>
                    ) : engineeringAdditionalServices.filter(item => item.phase === 'design').length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">No design phase items</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1 p-1">
                        {engineeringAdditionalServices
                          .filter(item => item.phase === 'design')
                          .map(item => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleAdditionalItemDragStart(e, item)}
                              className="p-1.5 rounded hover:bg-muted/5 cursor-move border border-transparent hover:border-primary/20 transition-colors text-sm"
                            >
                              <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">{item.name}</div>
                              <div className="text-xs text-gray-500 dark:text-[#9CA3AF]">{item.description}</div>
                              <div className="text-xs font-medium text-primary mt-0.5">Min: {formatCurrency(item.default_min_value)}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Construction Phase Items */}
                  <div className="border border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20 rounded-md overflow-hidden">
                    <div className="bg-muted/10 px-2 py-1.5">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">Construction Phase</h3>
                    </div>
                    {isLoadingAdditionalServices ? (
                      <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">Loading...</div>
                    ) : engineeringAdditionalServices.filter(item => item.phase === 'construction').length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-[#9CA3AF] p-2">No construction phase items</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1 p-1">
                        {engineeringAdditionalServices
                          .filter(item => item.phase === 'construction')
                          .map(item => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleAdditionalItemDragStart(e, item)}
                              className="p-1.5 rounded hover:bg-muted/5 cursor-move border border-transparent hover:border-primary/20 transition-colors text-sm"
                            >
                              <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">{item.name}</div>
                              <div className="text-xs text-gray-500 dark:text-[#9CA3AF]">{item.description}</div>
                              <div className="text-xs font-medium text-primary mt-0.5">Min: {formatCurrency(item.default_min_value)}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

      <StructureDialog
        open={isStructureDialogOpen}
        onOpenChange={setIsStructureDialogOpen}
        onSave={(structure) => handleAddStructure({ ...structure, levels: [] })}
      />

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