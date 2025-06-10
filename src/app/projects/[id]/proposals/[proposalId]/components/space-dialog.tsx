"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { Space } from '../types';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

interface BuildingType {
  id: string;
  name: string;
  description: string | null;
  space_type: string | null;
  discipline: string | null;
  hvac_system: string | null;
  default_construction_cost: number | null;
  default_area: number | null;
}

interface ProjectConstructionType {
  id: number;
  project_type: string;
  definition: string;
  description: string;
  relative_cost_index: number;
  created_at: string;
}

interface ConstructionCost {
  id: string;
  building_type_id: string;
  cost_type: string;
  year: number;
  cost_per_sqft: number;
  percentage: number | null;
  discipline: string;
}

interface DisciplineConstructionCost {
  id: string;
  discipline: string;
  isActive: boolean;
  costPerSqft: number;
  totalConstructionCost: number;
}

interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (space: Omit<Space, 'id'>) => void;
  defaultValues?: Partial<Space>;
  costIndex: number | null;
  initialSpace: Space | null;
  structureId: string;
  levelId: string;
}

// NOTE: Engineering services are NOT handled in this dialog.
// They are managed separately in a different component.
// DO NOT add engineering services functionality here.

export function SpaceDialog({ open, onOpenChange, onSave, defaultValues, costIndex, initialSpace, structureId, levelId }: SpaceDialogProps) {
  const { user } = useAuth();
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [projectConstructionTypes, setProjectConstructionTypes] = useState<ProjectConstructionType[]>([]);
  const [constructionCosts, setConstructionCosts] = useState<ConstructionCost[]>([]);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  const [selectedProjectConstructionType, setSelectedProjectConstructionType] = useState<ProjectConstructionType | null>(null);
  const [disciplineConstructionCosts, setDisciplineConstructionCosts] = useState<DisciplineConstructionCost[]>(() => {
    const disciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'];
    return disciplines.map(discipline => ({
      id: crypto.randomUUID(),
      discipline,
      isActive: discipline !== 'Civil' && discipline !== 'Structural',
      costPerSqft: 0,
      totalConstructionCost: 0
    }));
  });
  const [isLoading, setIsLoading] = useState(true);
  const [openBuildingType, setOpenBuildingType] = useState(false);
  const [openProjectConstructionType, setOpenProjectConstructionType] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [constructionTypeSearchQuery, setConstructionTypeSearchQuery] = useState('');
  const [totalConstructionCost, setTotalConstructionCost] = useState<number>(0);
  const [totalCostPerSqFt, setTotalCostPerSqFt] = useState<number>(0);
  const isInitializing = useRef(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  // Initialize space state with initialSpace or defaultValues
  const [space, setSpace] = useState<Omit<Space, 'id'>>(() => {
    const defaultSpace = {
      name: '',
      description: '',
      floorArea: 0,
      buildingType: '',
      buildingTypeId: '',
      spaceType: '',
      discipline: '',
      hvacSystem: '',
      projectConstructionType: 'New Construction',
      projectConstructionTypeId: 1,
      structureId: structureId,
      levelId: levelId,
      totalConstructionCosts: [],
      totalCost: 0,
      totalCostPerSqft: 0,
      splitConstructionCosts: false,
      engineeringServices: []
    };

    if (initialSpace) {
      return {
        ...defaultSpace,
        ...initialSpace,
        projectConstructionType: initialSpace.projectConstructionType || 'New Construction',
        projectConstructionTypeId: initialSpace.projectConstructionTypeId || 1
      };
    }

    if (defaultValues) {
      return {
        ...defaultSpace,
        ...defaultValues,
        projectConstructionType: defaultValues.projectConstructionType || 'New Construction',
        projectConstructionTypeId: defaultValues.projectConstructionTypeId || 1
      };
    }

    return defaultSpace;
  });

  // Check session when dialog opens
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!user) {
          console.error('No user found in auth context');
          toast.error('Please sign in to continue');
          onOpenChange(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Current session:', {
          hasSession: !!session,
          userId: session?.user?.id,
          role: session?.user?.app_metadata?.role,
          error: error?.message,
          authUser: user
        });

        if (error) {
          console.error('Session error:', error);
          toast.error('Authentication error. Please try again.');
          onOpenChange(false);
          return;
        }

        if (!session) {
          console.error('No active session found');
          toast.error('Please sign in to continue');
          onOpenChange(false);
          return;
        }

        setHasValidSession(true);
      } catch (error) {
        console.error('Error checking session:', error);
        toast.error('Failed to verify authentication');
        onOpenChange(false);
      }
    };

    if (open) {
      checkSession();
    } else {
      setHasValidSession(false);
    }
  }, [open, onOpenChange, user]);

  // Fetch project construction types and building types on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project construction types
        const response = await fetch('/api/project-construction-types');
        if (!response.ok) {
          throw new Error('Failed to fetch project construction types');
        }
        const data = await response.json();
        setProjectConstructionTypes(data);

        // Always set the default construction type first
        const defaultType = data.find((type: ProjectConstructionType) => type.project_type === 'New Construction');
        if (defaultType) {
          console.log('Setting default construction type:', defaultType);
          setSelectedProjectConstructionType(defaultType);
          // Update space state with the default type
          setSpace(prev => ({
            ...prev,
            projectConstructionType: defaultType.project_type,
            projectConstructionTypeId: defaultType.id
          }));
        }

        // If we are editing an existing space, find and set the matching construction type
        if (initialSpace) {
          const matchingType = data.find((type: ProjectConstructionType) => type.id === initialSpace.projectConstructionTypeId);
          if (matchingType) {
            console.log('Setting existing construction type:', matchingType);
            setSelectedProjectConstructionType(matchingType);
          }
        }

        // Fetch building types
        const buildingTypesResponse = await fetch('/api/construction-costs/building-types');
        if (!buildingTypesResponse.ok) {
          throw new Error('Failed to fetch building types');
        }
        const buildingTypesData = await buildingTypesResponse.json();
        setBuildingTypes(buildingTypesData);

        // Set default building type for new spaces
        if (!initialSpace) {
          const defaultBuildingType = buildingTypesData.find((type: BuildingType) => type.space_type === 'Office');
          if (defaultBuildingType) {
            console.log('Setting default building type:', defaultBuildingType);
            setSelectedBuildingType(defaultBuildingType);
            // Update space state with the default building type
            setSpace(prev => ({
              ...prev,
              buildingType: defaultBuildingType.space_type || '',
              buildingTypeId: defaultBuildingType.id,
              discipline: defaultBuildingType.discipline || '',
              hvacSystem: defaultBuildingType.hvac_system || '',
              defaultConstructionCost: defaultBuildingType.default_construction_cost || 0,
              defaultArea: defaultBuildingType.default_area || 0
            }));
          }
        } else {
          // If we are editing an existing space, find and set the matching building type
          const matchingBuildingType = buildingTypesData.find((type: BuildingType) => type.id === initialSpace.buildingTypeId);
          if (matchingBuildingType) {
            console.log('Setting existing building type:', matchingBuildingType);
            setSelectedBuildingType(matchingBuildingType);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [initialSpace]); // Add initialSpace to dependencies

  // Add logging for construction types state changes
  useEffect(() => {
    console.log('Project construction types updated:', projectConstructionTypes);
    console.log('Selected project construction type:', selectedProjectConstructionType);
  }, [projectConstructionTypes, selectedProjectConstructionType]);

  // Update the useEffect that handles initial space
  useEffect(() => {
    if (open) {
      if (initialSpace) {
        console.log('Dialog opened with initial space:', initialSpace);
        // Update the space state with the latest data from initialSpace
        setSpace({
          ...initialSpace,
          totalConstructionCosts: initialSpace.totalConstructionCosts.map(cost => ({
            ...cost,
            isActive: cost.discipline === 'Civil' || cost.discipline === 'Structural' ? false : cost.isActive
          }))
        });

        // Find and set the selected building type
        const matchingBuildingType = buildingTypes.find(
          type => type.id === initialSpace.buildingTypeId
        );
        if (matchingBuildingType) {
          setSelectedBuildingType(matchingBuildingType);
        }

        // Find and set the selected construction type
        const matchingConstructionType = projectConstructionTypes.find(
          type => type.id === initialSpace.projectConstructionTypeId
        );
        if (matchingConstructionType) {
          setSelectedProjectConstructionType(matchingConstructionType);
        }
      } else {
        // For new spaces, always set the default construction type
        const defaultType = projectConstructionTypes.find(
          (type: ProjectConstructionType) => type.project_type === 'New Construction'
        );
        if (defaultType) {
          console.log('Setting default construction type for new space:', defaultType);
          setSelectedProjectConstructionType(defaultType);
          setSpace(prev => ({
            ...prev,
            projectConstructionType: defaultType.project_type,
            projectConstructionTypeId: defaultType.id
          }));
        }

        // Also set default building type for new spaces
        const defaultBuildingType = buildingTypes.find(
          (type: BuildingType) => type.space_type === 'Office'
        );
        if (defaultBuildingType) {
          console.log('Setting default building type for new space:', defaultBuildingType);
          setSelectedBuildingType(defaultBuildingType);
          setSpace(prev => ({
            ...prev,
            buildingType: defaultBuildingType.space_type || '',
            buildingTypeId: defaultBuildingType.id,
            discipline: defaultBuildingType.discipline || '',
            hvacSystem: defaultBuildingType.hvac_system || '',
            defaultConstructionCost: defaultBuildingType.default_construction_cost || 0,
            defaultArea: defaultBuildingType.default_area || 0
          }));
        }
      }

      // Set initializing to false after a short delay to allow state updates
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    } else {
      // Reset initializing when dialog closes
      isInitializing.current = true;
    }
  }, [open, initialSpace, buildingTypes, projectConstructionTypes]);

  // Remove project construction types fetching from the main data fetching effect
  useEffect(() => {
    if (!hasValidSession) return;

    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');
        const [buildingTypesResponse, constructionCostsResponse] = await Promise.all([
          supabase.from('building_types').select('*').order('name'),
          supabase.from('construction_costs').select('*').order('year', { ascending: false })
        ]);

        if (buildingTypesResponse.error) {
          console.error('Error fetching building types:', buildingTypesResponse.error);
          toast.error('Failed to load building types');
          return;
        }

        if (constructionCostsResponse.error) {
          console.error('Error fetching construction costs:', constructionCostsResponse.error);
          toast.error('Failed to load construction costs');
          return;
        }

        console.log('Building types fetch response:', { count: buildingTypesResponse.data?.length, firstItem: buildingTypesResponse.data?.[0] });
        console.log('Construction costs fetch response:', { count: constructionCostsResponse.data?.length, firstItem: constructionCostsResponse.data?.[0] });

        setBuildingTypes(buildingTypesResponse.data || []);
        setConstructionCosts(constructionCostsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, hasValidSession, supabase]);

  // Calculate discipline construction costs
  const calculateDisciplineConstructionCosts = (buildingTypeId: string, floorArea: number) => {
    console.log('Calculating costs for:', { buildingTypeId, floorArea });
    
    // Get all construction costs for this building type
    const buildingTypeCosts = constructionCosts.filter(cost => 
      cost.building_type_id === buildingTypeId
    );
    console.log('All construction costs for building type:', buildingTypeCosts.map(cost => ({
      id: cost.id,
      cost_type: cost.cost_type,
      cost_per_sqft: cost.cost_per_sqft,
      year: cost.year
    })));
    
    // Filter to include all disciplines
    const disciplineCosts = buildingTypeCosts.filter(cost => {
      const costType = cost.cost_type.toLowerCase();
      const isDiscipline = ['mechanical', 'plumbing', 'electrical', 'civil', 'structural'].includes(costType);
      console.log('Checking cost type:', { costType, isDiscipline });
      return isDiscipline;
    });

    // If no discipline costs found, try to map available cost types
    if (disciplineCosts.length === 0) {
      console.log('No discipline construction costs found for building type');
      const availableCostTypes = Array.from(new Set(buildingTypeCosts.map(cost => cost.cost_type)));
      console.log('Available cost types:', availableCostTypes);
      
      // Map the available cost types to disciplines if they match
      const mappedCosts = buildingTypeCosts.map(cost => {
        const costType = cost.cost_type.toLowerCase();
        let mappedDiscipline: string | null = null;
        
        if (costType.includes('mech')) mappedDiscipline = 'Mechanical';
        else if (costType.includes('plumb')) mappedDiscipline = 'Plumbing';
        else if (costType.includes('elec')) mappedDiscipline = 'Electrical';
        else if (costType.includes('civ')) mappedDiscipline = 'Civil';
        else if (costType.includes('struc')) mappedDiscipline = 'Structural';
        
        if (mappedDiscipline) {
          console.log('Mapped cost type to discipline:', { costType, mappedDiscipline });
          return {
            ...cost,
            discipline: mappedDiscipline
          };
        }
        return null;
      }).filter((cost): cost is NonNullable<typeof cost> => cost !== null);

      if (mappedCosts.length > 0) {
        console.log('Mapped construction costs:', mappedCosts);
        const mostRecentYear = Math.max(...mappedCosts.map(cost => cost.year));
        const recentCosts = mappedCosts.filter(cost => cost.year === mostRecentYear);
        
        return ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].map(discipline => {
          const matchingCost = recentCosts.find(c => c.discipline === discipline);
          let costPerSqft = matchingCost?.cost_per_sqft || 0;
          
          if (costIndex !== null) {
            costPerSqft = costPerSqft * (costIndex / 100);
          }
          
          const projectTypeIndex = (selectedProjectConstructionType?.relative_cost_index ?? 100) / 100;
          costPerSqft = costPerSqft * projectTypeIndex;
          
          const totalConstructionCost = costPerSqft * floorArea;
          
          return {
            id: crypto.randomUUID(),
            discipline,
            isActive: discipline === 'Civil' || discipline === 'Structural' ? false : true,
            costPerSqft,
            totalConstructionCost
          };
        });
      }
      
      return disciplineConstructionCosts.map(cost => ({
        ...cost,
        costPerSqft: 0,
        totalConstructionCost: 0
      }));
    }

    // Get the most recent year's costs
    const mostRecentYear = Math.max(...disciplineCosts.map(cost => cost.year));
    const recentCosts = disciplineCosts.filter(cost => cost.year === mostRecentYear);
    console.log('Most recent discipline costs:', { year: mostRecentYear, costs: recentCosts });

    // Get project type index
    const projectTypeIndex = (selectedProjectConstructionType?.relative_cost_index ?? 100) / 100;
    console.log('Project type index:', projectTypeIndex);

    // Calculate costs for each discipline
    const calculatedCosts = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].map(discipline => {
      const cost = recentCosts.find(c => c.cost_type.toLowerCase() === discipline.toLowerCase());
      let costPerSqft = cost?.cost_per_sqft || 0;
      
      // Apply cost index adjustment
      if (costIndex !== null) {
        costPerSqft = costPerSqft * (costIndex / 100);
      }

      // Apply project type index
      costPerSqft = costPerSqft * projectTypeIndex;
      
      const totalConstructionCost = costPerSqft * floorArea;

      console.log('Cost calculation for discipline:', {
        discipline,
        baseCostPerSqft: cost?.cost_per_sqft,
        costIndex,
        projectTypeIndex,
        adjustedCostPerSqft: costPerSqft,
        floorArea,
        totalConstructionCost
      });

      return {
        id: crypto.randomUUID(),
        discipline,
        isActive: discipline === 'Civil' || discipline === 'Structural' ? false : true,
        costPerSqft,
        totalConstructionCost
      };
    });

    console.log('Final calculated costs:', calculatedCosts);
    return calculatedCosts;
  };

  // Update the useEffect that handles total cost calculations
  useEffect(() => {
    if (!selectedBuildingType) {
      setTotalConstructionCost(0);
      setTotalCostPerSqFt(0);
      return;
    }

    const calculateTotalCost = () => {
      const totalCost = constructionCosts.find(cost => 
        cost.building_type_id === selectedBuildingType.id && 
        cost.cost_type.toLowerCase() === 'total'
      );

      if (totalCost) {
        let adjustedCostPerSqft = totalCost.cost_per_sqft;
        
        // Apply cost index adjustment
        if (costIndex !== null) {
          adjustedCostPerSqft = adjustedCostPerSqft * (costIndex / 100);
        }
        
        // Apply project type index
        const projectTypeIndex = (selectedProjectConstructionType?.relative_cost_index ?? 100) / 100;
        adjustedCostPerSqft = adjustedCostPerSqft * projectTypeIndex;
        
        // Always set the cost per sq ft, even if floor area is 0
        setTotalCostPerSqFt(adjustedCostPerSqft);
        
        // Calculate total cost (will be 0 if floor area is 0)
        const totalCostValue = adjustedCostPerSqft * (space.floorArea || 0);
        console.log('Total construction cost calculation:', {
          baseCostPerSqft: totalCost.cost_per_sqft,
          costIndex,
          projectTypeIndex,
          adjustedCostPerSqft,
          floorArea: space.floorArea || 0,
          totalCostValue
        });
        setTotalConstructionCost(totalCostValue);
      } else {
        console.log('No total cost found in construction costs');
        setTotalCostPerSqFt(0);
        setTotalConstructionCost(0);
      }
    };

    calculateTotalCost();
  }, [selectedBuildingType, space.floorArea, constructionCosts, costIndex, selectedProjectConstructionType]);

  // Update costs when building type or floor area changes
  useEffect(() => {
    if (!isInitializing.current && selectedBuildingType && space.floorArea) {
      const calculatedCosts = calculateDisciplineConstructionCosts(selectedBuildingType.id, space.floorArea);
      setDisciplineConstructionCosts(calculatedCosts);
      
      // Calculate total cost
      const totalCost = calculatedCosts.reduce((sum, cost) => sum + cost.totalConstructionCost, 0);
      const totalCostPerSqft = totalCost / space.floorArea;
      
      setTotalConstructionCost(totalCost);
      setTotalCostPerSqFt(totalCostPerSqft);
    }
  }, [selectedBuildingType, space.floorArea, constructionCosts, costIndex, selectedProjectConstructionType]);

  // Handle building type selection
  const handleBuildingTypeSelect = (type: BuildingType) => {
    console.log('Building type selected:', type);
    setSelectedBuildingType(type);
    setOpenBuildingType(false);
    setSearchQuery('');
    
    // Calculate construction costs immediately when building type is selected
    const floorArea = space.floorArea || (type.default_area || 0);
    
    setSpace(prev => ({
      ...prev,
      buildingTypeId: type.id,
      buildingType: type.name || '',
      name: type.name || '',
      description: type.description || '',
      spaceType: type.space_type || '',
      discipline: type.discipline || '',
      hvacSystem: type.hvac_system || '',
      floorArea: floorArea,
      splitConstructionCosts: prev.splitConstructionCosts
    }));
  };

  // Filter construction types based on search
  const filteredConstructionTypes = projectConstructionTypes.filter(type => {
    const searchLower = constructionTypeSearchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    const typeMatch = type.project_type.toLowerCase().includes(searchLower);
    const definitionMatch = type.definition.toLowerCase().includes(searchLower);
    const descriptionMatch = type.description.toLowerCase().includes(searchLower);
    
    return typeMatch || definitionMatch || descriptionMatch;
  });

  // Handle project construction type selection
  const handleProjectConstructionTypeSelect = (type: ProjectConstructionType) => {
    setSelectedProjectConstructionType(type);
    setOpenProjectConstructionType(false);
    setConstructionTypeSearchQuery('');
    
    setSpace(prev => ({
      ...prev,
      projectConstructionType: type.project_type,
      projectConstructionTypeId: type.id
    }));
  };

  // Handle save
  const handleSave = () => {
    if (!selectedBuildingType || !selectedProjectConstructionType) {
      toast.error('Please select both building type and construction type');
      return;
    }

    if (!space.floorArea || space.floorArea <= 0) {
      toast.error('Please enter a valid floor area');
      return;
    }

    const spaceToSave: Omit<Space, 'id'> = {
      ...space,
      buildingType: selectedBuildingType.name,
      buildingTypeId: selectedBuildingType.id,
      projectConstructionType: selectedProjectConstructionType.project_type,
      projectConstructionTypeId: selectedProjectConstructionType.id,
      totalConstructionCosts: disciplineConstructionCosts,
      totalCostPerSqft: totalCostPerSqFt,
      totalCost: totalConstructionCost,
      engineeringServices: [], // Engineering services are handled separately
      structureId: structureId,
      levelId: levelId
    };

    onSave(spaceToSave);
    onOpenChange(false);
  };

  // Add wheel event handler to prevent propagation
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const container = e.currentTarget;
    container.scrollTop += e.deltaY;
  };

  // Filter building types based on search
  const filteredBuildingTypes = buildingTypes.filter(type => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    const nameMatch = (type.name || '').toLowerCase().includes(searchLower);
    const descriptionMatch = (type.description || '').toLowerCase().includes(searchLower);
    
    return nameMatch || descriptionMatch;
  });

  // Handle floor area changes
  const handleFloorAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setSpace(prev => ({ ...prev, floorArea: value }));
  };

  // Get display construction costs
  const getDisplayConstructionCosts = () => {
    if (!selectedBuildingType || !space.floorArea) {
      return disciplineConstructionCosts;
    }
    
    const calculatedCosts = calculateDisciplineConstructionCosts(selectedBuildingType.id, space.floorArea);
    const existingDisciplines = calculatedCosts.map(cost => cost.discipline);
    const missingDisciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].filter(
      discipline => !existingDisciplines.includes(discipline)
    );
    
    return [
      ...calculatedCosts,
      ...missingDisciplines.map(discipline => ({
        id: crypto.randomUUID(),
        discipline,
        isActive: true,
        costPerSqft: 0,
        totalConstructionCost: 0
      }))
    ];
  };

  const handleDisciplineToggle = (type: string) => {
    setDisciplineConstructionCosts(prev => 
      prev.map(d => {
        if (d.discipline === type) {
          // Don't allow toggling for Civil and Structural
          if (type === 'Civil' || type === 'Structural') {
            return d;
          }
          return { ...d, isActive: !d.isActive };
        }
        return d;
      })
    );
  };

  // Update the space state when project construction type changes
  const handleProjectConstructionTypeChange = (value: string) => {
    const type = projectConstructionTypes.find(t => t.id.toString() === value);
    if (type) {
    setSelectedProjectConstructionType(type);
      setSpace(prev => ({
        ...prev,
        projectConstructionType: type.project_type,
        projectConstructionTypeId: type.id  // This is now a number
      }));
    }
  };

  // Update the space state when building type changes
  const handleBuildingTypeChange = (value: string) => {
    const type = buildingTypes.find(t => t.id === value);
    if (type) {
      setSelectedBuildingType(type);
      setSpace(prev => ({
        ...prev,
        buildingType: type.name,
        buildingTypeId: type.id,
        spaceType: type.space_type || '',
        discipline: type.discipline || '',
        hvacSystem: type.hvac_system || '',
        floorArea: type.default_area || 0
      }));
    }
  };

  // Reset all state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset all state to initial values
      setSelectedBuildingType(null);
      setSelectedProjectConstructionType(null);
      setSearchQuery('');
      setConstructionTypeSearchQuery('');
      setTotalConstructionCost(0);
      setTotalCostPerSqFt(0);
      setDisciplineConstructionCosts(() => {
        const disciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'];
        return disciplines.map(discipline => ({
          id: crypto.randomUUID(),
          discipline,
          isActive: discipline !== 'Civil' && discipline !== 'Structural',
          costPerSqft: 0,
          totalConstructionCost: 0
        }));
      });
      setSpace({
        name: '',
        description: '',
        floorArea: 0,
        buildingType: '',
        buildingTypeId: '',
        spaceType: '',
        discipline: '',
        hvacSystem: '',
        projectConstructionType: 'New Construction',
        projectConstructionTypeId: 1,
        structureId: structureId,
        levelId: levelId,
        totalConstructionCosts: [],
        totalCost: 0,
        totalCostPerSqft: 0,
        splitConstructionCosts: false,
        engineeringServices: []
      });
      isInitializing.current = true;
    }
  }, [open, structureId, levelId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialSpace ? 'Update Space' : 'Add Space'}</DialogTitle>
          <DialogDescription>
            {initialSpace ? 'Update the space details below.' : 'Fill in the space details below.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Space Details */}
          <div className="grid gap-2">
            <Label htmlFor="buildingType">Building Type</Label>
              <Popover open={openBuildingType} onOpenChange={setOpenBuildingType}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openBuildingType}
                    className="w-full justify-between"
                  >
                  {selectedBuildingType
                    ? selectedBuildingType.name
                    : "Select a building type..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                <Command shouldFilter={false} className="w-full">
                  <CommandInput 
                    placeholder="Search by name or description..." 
                    value={searchQuery}
                    onValueChange={(value) => {
                      setSearchQuery(value);
                      setOpenBuildingType(true);
                    }}
                  />
                  <div className="relative">
                    <CommandList 
                      className="max-h-[300px] overflow-y-auto"
                      style={{ 
                        scrollbarWidth: 'thin',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onWheel={handleWheel}
                    >
                      <CommandEmpty>No building types found.</CommandEmpty>
                    <CommandGroup>
                        {filteredBuildingTypes.map((type) => (
                        <CommandItem
                          key={type.id}
                            value={type.id}
                          onSelect={() => handleBuildingTypeSelect(type)}
                            className="flex flex-col items-start py-2 px-3 cursor-pointer hover:bg-accent"
                        >
                            <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                                  "h-4 w-4",
                              selectedBuildingType?.id === type.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                              <span className="font-medium">{type.name}</span>
                            </div>
                            {type.description && (
                              <span className="text-sm text-muted-foreground ml-6 mt-0.5">
                                {type.description}
                              </span>
                            )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    </CommandList>
                  </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

          {space.description && (
            <div className="text-sm text-muted-foreground mt-1">
              {space.description}
          </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="projectConstructionType">Project Construction Type</Label>
              <Popover open={openProjectConstructionType} onOpenChange={setOpenProjectConstructionType}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProjectConstructionType}
                    className="w-full justify-between"
                  >
                  {selectedProjectConstructionType
                    ? selectedProjectConstructionType.project_type
                    : "Select a construction type..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                <Command shouldFilter={false} className="w-full">
                  <CommandInput 
                    placeholder="Search by type, definition, or description..." 
                    value={constructionTypeSearchQuery}
                    onValueChange={(value) => {
                      setConstructionTypeSearchQuery(value);
                      setOpenProjectConstructionType(true);
                    }}
                  />
                  <div className="relative">
                    <CommandList 
                      className="max-h-[300px] overflow-y-auto"
                      style={{ 
                        scrollbarWidth: 'thin',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onWheel={handleWheel}
                    >
                      <CommandEmpty>No construction types found.</CommandEmpty>
                    <CommandGroup>
                        {filteredConstructionTypes.map((type) => (
                        <CommandItem
                          key={type.id}
                            value={type.id.toString()}
                          onSelect={() => handleProjectConstructionTypeSelect(type)}
                            className="flex flex-col items-start py-2 px-3 cursor-pointer hover:bg-accent"
                        >
                            <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                                  "h-4 w-4",
                              selectedProjectConstructionType?.id === type.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                              <span className="font-medium">{type.project_type}</span>
                            </div>
                            <div className="text-sm text-muted-foreground ml-6 mt-0.5">
                              <div>{type.definition}</div>
                              <div className="mt-1">Cost Index: {type.relative_cost_index}</div>
                            </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    </CommandList>
                  </div>
                  </Command>
                </PopoverContent>
              </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="floorArea">Floor Area (sq ft)</Label>
            <Input
              id="floorArea"
              type="number"
              min="0"
              step="1"
              value={space.floorArea}
              onChange={handleFloorAreaChange}
              className="w-full"
            />
          </div>

          {/* Construction Costs */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Construction Costs</h3>
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="font-medium text-muted-foreground">Discipline</div>
                <div className="font-medium text-right text-muted-foreground">Cost per sq ft</div>
                <div className="font-medium text-right text-muted-foreground">Total Cost</div>
              </div>
              <div className="space-y-1">
                {getDisplayConstructionCosts()
                  .filter(cost => ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].includes(cost.discipline))
                  .map((cost) => (
                    <div key={cost.id} className="grid grid-cols-3 gap-4 py-1">
                      <div className="font-medium">{cost.discipline}</div>
                      <div className="text-right">{formatCurrency(cost.costPerSqft)}</div>
                      <div className="text-right">{formatCurrency(cost.totalConstructionCost)}</div>
            </div>
                  ))}
              </div>
              <div className="border-t mt-2 pt-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">Total Cost</div>
                  <div className="text-right">{formatCurrency(totalCostPerSqFt)}</div>
                  <div className="text-right">{formatCurrency(totalConstructionCost)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedBuildingType || !selectedProjectConstructionType || space.floorArea <= 0}
          >
            {initialSpace ? 'Update Space' : 'Add Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}