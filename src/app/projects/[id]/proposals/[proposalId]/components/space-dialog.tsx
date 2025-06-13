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
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { Space, ConstructionCostsForSpace, ConstructionCost } from '@/types/proposal/base';
import type { 
  BuildingType,
  ProjectConstructionType,
  SpaceDialogProps
} from '@/types/proposal/shared';

// NOTE: Engineering services are NOT handled in this dialog.
// They are managed separately in a different component.
// DO NOT add engineering services functionality here.

export function SpaceDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  defaultValues, 
  costIndex, 
  initialSpace, 
  structureId, 
  levelId 
}: SpaceDialogProps) {
  const { user } = useAuth();
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [projectConstructionTypes, setProjectConstructionTypes] = useState<ProjectConstructionType[]>([]);
  const [constructionCosts, setConstructionCosts] = useState<ConstructionCost[]>([]);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  const [selected_project_construction_type, setSelectedProjectConstructionType] = useState<ProjectConstructionType | null>(null);
  const [openBuildingType, setOpenBuildingType] = useState(false);
  const [openProjectConstructionType, setOpenProjectConstructionType] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [constructionTypeSearchQuery, setConstructionTypeSearchQuery] = useState('');
  const [totalConstructionCost, setTotalConstructionCost] = useState<number>(0);
  const [totalCostPerSqFt, setTotalCostPerSqFt] = useState<number>(0);
  const isInitializing = useRef(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const defaultSpace: Omit<Space, 'id'> = {
    name: '',
    description: '',
    floor_area: 0,
    building_type: '',
    building_type_id: '',
    space_type: '',
    project_construction_type: 'New Construction',
    project_construction_type_id: 1,
    construction_costs: {},
    discipline_engineering_services: [],
    discipline_engineering_fees: [],
    level_id: levelId || '',
    structure_id: structureId || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Initialize space state with initialSpace or defaultValues
  const [space, setSpace] = useState<Omit<Space, 'id'>>(() => {
    if (initialSpace) {
      return {
        ...defaultSpace,
        ...initialSpace,
        name: initialSpace.name || '',
        description: initialSpace.description || '',
        floor_area: initialSpace.floor_area || 0,
        building_type: initialSpace.building_type || '',
        building_type_id: initialSpace.building_type_id || '',
        space_type: initialSpace.space_type || '',
        project_construction_type: initialSpace.project_construction_type || 'New Construction',
        project_construction_type_id: initialSpace.project_construction_type_id || 1,
        construction_costs: initialSpace.construction_costs || {},
        discipline_engineering_services: initialSpace.discipline_engineering_services || [],
        discipline_engineering_fees: initialSpace.discipline_engineering_fees || [],
        level_id: initialSpace.level_id || '',
        structure_id: initialSpace.structure_id || '',
        created_at: initialSpace.created_at || new Date().toISOString(),
        updated_at: initialSpace.updated_at || new Date().toISOString()
      };
    }

    if (defaultValues) {
      return {
        ...defaultSpace,
        ...defaultValues,
        name: defaultValues.name || '',
        description: defaultValues.description || '',
        floor_area: defaultValues.floor_area || 0,
        building_type: defaultValues.building_type || '',
        building_type_id: defaultValues.building_type_id || '',
        space_type: defaultValues.space_type || '',
        project_construction_type: defaultValues.project_construction_type || 'New Construction',
        project_construction_type_id: defaultValues.project_construction_type_id || 1,
        construction_costs: defaultValues.construction_costs || {},
        discipline_engineering_services: defaultValues.discipline_engineering_services || [],
        discipline_engineering_fees: defaultValues.discipline_engineering_fees || [],
        level_id: defaultValues.level_id || '',
        structure_id: defaultValues.structure_id || '',
        created_at: defaultValues.created_at || new Date().toISOString(),
        updated_at: defaultValues.updated_at || new Date().toISOString()
      };
    }

    return defaultSpace;
  });

  // Check session when dialog opens
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message.includes('refresh_token_already_used')) {
            // Handle invalid refresh token by signing out and redirecting to login
            await supabase.auth.signOut();
            toast.error('Your session has expired. Please sign in again.');
            onOpenChange(false);
            return;
          }
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

        // Only set valid session if we have a session and no errors
        setHasValidSession(true);
      } catch (error) {
        console.error('Error checking session:', error);
        toast.error('Failed to verify authentication');
        onOpenChange(false);
      }
    };

    // Only check session when dialog opens and we haven't already validated the session
    if (open && !hasValidSession) {
      checkSession();
    }
  }, [open, onOpenChange, hasValidSession]);

  // Remove the multiple initialization useEffects and replace with a single one
  useEffect(() => {
    if (!open || !hasValidSession) return;

    const initializeSpace = async () => {
      try {
        console.log('Starting space initialization...');
        
        // 1. Fetch all required data
        const [buildingTypesResponse, constructionTypesResponse, constructionCostsResponse] = await Promise.all([
          supabase.from('building_types').select('*').order('name'),
          fetch('/api/project-construction-types'),
          fetch('/api/construction-costs')
        ]);

        // Parse responses
        const buildingTypes = buildingTypesResponse.data || [];
        const constructionTypes = await constructionTypesResponse.json();
        const constructionCostsData = await constructionCostsResponse.json();

        if (!constructionTypesResponse.ok || !constructionCostsResponse.ok) {
          throw new Error('Failed to fetch construction data');
        }

        // Filter construction costs to current year
        const currentYearCosts = constructionCostsData.filter((cost: ConstructionCost) => cost.year === 2025);
        
        console.log('Fetched data:', {
          buildingTypes: buildingTypes.length,
          constructionTypes: constructionTypes.length,
          constructionCosts: currentYearCosts.length
        });

        // Store fetched data
        setBuildingTypes(buildingTypes);
        setProjectConstructionTypes(constructionTypes);
        setConstructionCosts(currentYearCosts);

        // 2. Initialize space if we're editing
        if (initialSpace) {
          console.log('Initializing space for editing:', initialSpace);

          // Set base space state
          setSpace({
            ...defaultSpace,
            ...initialSpace,
            name: initialSpace.name || '',
            description: initialSpace.description || '',
            floor_area: initialSpace.floor_area || 0,
            building_type: initialSpace.building_type || '',
            building_type_id: initialSpace.building_type_id || '',
            space_type: initialSpace.space_type || '',
            project_construction_type: initialSpace.project_construction_type || 'New Construction',
            project_construction_type_id: initialSpace.project_construction_type_id || 1,
            construction_costs: initialSpace.construction_costs || {},
            discipline_engineering_services: initialSpace.discipline_engineering_services || [],
            discipline_engineering_fees: initialSpace.discipline_engineering_fees || [],
            level_id: initialSpace.level_id || '',
            structure_id: initialSpace.structure_id || '',
            created_at: initialSpace.created_at || new Date().toISOString(),
            updated_at: initialSpace.updated_at || new Date().toISOString()
          });

          // Set building type
          const matchingBuildingType = buildingTypes.find(
            (type: BuildingType) => type.id === initialSpace.building_type_id
          );
          if (matchingBuildingType) {
            console.log('Setting existing building type:', matchingBuildingType);
            setSelectedBuildingType(matchingBuildingType);

            if (initialSpace.construction_costs) {
              // Use saved construction costs when editing
              const savedCosts = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'] as const;
              const mappedCosts = savedCosts.map(discipline => {
                const savedCost = initialSpace.construction_costs[discipline as keyof ConstructionCostsForSpace] as ConstructionCost | undefined;
                return {
                  id: savedCost?.id || crypto.randomUUID(),
                  discipline,
                  cost_type: discipline,
                  year: 2025,
                  building_type_id: initialSpace.building_type_id,
                  is_active: savedCost?.is_active ?? (discipline !== 'Civil' && discipline !== 'Structural'),
                  cost_per_sqft: savedCost?.cost_per_sqft ?? 0
                };
              });

              // Get the saved total cost
              const savedTotalCost = initialSpace.construction_costs.Total as ConstructionCost | undefined;
              if (savedTotalCost) {
                setTotalCostPerSqFt(savedTotalCost.cost_per_sqft || 0);
                setTotalConstructionCost(savedTotalCost.total_construction_cost || 0);
              } else {
                setTotalCostPerSqFt(0);
                setTotalConstructionCost(0);
              }

              // Create construction costs object with discipline costs
              const construction_costs = mappedCosts.reduce((acc, cost) => ({
                ...acc,
                [cost.discipline]: cost
              }), {} as ConstructionCostsForSpace);

              // Add the saved Total cost
              if (savedTotalCost) {
                construction_costs.Total = savedTotalCost;
              }

              console.log('Using saved construction costs:', mappedCosts);
              setSpace(prev => ({
                ...prev,
                construction_costs
              }));
            } else {
              // Calculate new costs for new space
              const costs = calculateDisciplineConstructionCosts(
                matchingBuildingType.id,
                initialSpace.floor_area || 0
              );
              console.log('Calculated new discipline costs:', costs);
              setSpace(prev => ({
                ...prev,
                construction_costs: {
                  ...prev.construction_costs,
                  ...costs.reduce((acc, cost) => ({
                    ...acc,
                    [cost.discipline]: {
                      id: cost.id,
                      discipline: cost.discipline,
                      cost_type: cost.discipline,
                      year: 2025,
                      building_type_id: cost.building_type_id,
                      is_active: cost.is_active,
                      cost_per_sqft: cost.cost_per_sqft
                    }
                  }), {} as ConstructionCostsForSpace)
                }
              }));
            }
          }

          // Set construction type
          const matchingConstructionType = constructionTypes.find(
            (type: ProjectConstructionType) => type.id === initialSpace.project_construction_type_id
          );
          if (matchingConstructionType) {
            console.log('Setting existing construction type:', matchingConstructionType);
            setSelectedProjectConstructionType(matchingConstructionType);
          }
        } else {
          // 3. Set defaults for new space
          console.log('Setting defaults for new space');
          const defaultBuildingType = buildingTypes.find((type: BuildingType) => type.space_type === 'Office');
          const defaultConstructionType = constructionTypes.find(
            (type: ProjectConstructionType) => type.project_type === 'New Construction'
          );

          if (defaultBuildingType) {
            console.log('Setting default building type:', defaultBuildingType);
            setSelectedBuildingType(defaultBuildingType);
            
            // Calculate initial construction costs for the default building type
            const costs = calculateDisciplineConstructionCosts(
              defaultBuildingType.id,
              defaultBuildingType.default_area || 0
            );
            
            setSpace(prev => ({
              ...prev,
              building_type: defaultBuildingType.space_type || '',
              building_type_id: defaultBuildingType.id,
              space_type: defaultBuildingType.space_type || '',
              floor_area: defaultBuildingType.default_area || 0,
              construction_costs: costs.reduce((acc, cost) => ({
                ...acc,
                [cost.discipline]: {
                  id: cost.id,
                  discipline: cost.discipline,
                  cost_type: cost.discipline,
                  year: 2025,
                  building_type_id: defaultBuildingType.id,
                  is_active: cost.is_active,
                  cost_per_sqft: cost.cost_per_sqft
                }
              }), {} as ConstructionCostsForSpace)
            }));

            // Set initial totals
            const totalCostPerSqFt = costs.reduce((sum, cost) => 
              sum + (cost.is_active ? cost.cost_per_sqft : 0), 0);
            setTotalCostPerSqFt(totalCostPerSqFt);
            setTotalConstructionCost(totalCostPerSqFt * (defaultBuildingType.default_area || 0));
          }

          if (defaultConstructionType) {
            console.log('Setting default construction type:', defaultConstructionType);
            setSelectedProjectConstructionType(defaultConstructionType);
            setSpace(prev => ({
              ...prev,
              project_construction_type: defaultConstructionType.project_type,
              project_construction_type_id: defaultConstructionType.id
            }));
          }
        }

        isInitializing.current = false;
      } catch (error) {
        console.error('Error initializing space:', error);
        toast.error('Failed to initialize space data');
        onOpenChange(false);
      }
    };

    initializeSpace();
  }, [open, hasValidSession, initialSpace, onOpenChange, supabase]);

  // Keep the reset effect for when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset all state to initial values
      setSelectedBuildingType(null);
      setSelectedProjectConstructionType(null);
      setSearchQuery('');
      setConstructionTypeSearchQuery('');
      setTotalConstructionCost(0);
      setTotalCostPerSqFt(0);
      setSpace({...defaultSpace});
      isInitializing.current = true;
    }
  }, [open]);

  // Single function to calculate cost using the same math for both total and discipline costs
  const calculateCost = (costPerSqft: number, floorArea: number) => {
    let adjustedCostPerSqft = costPerSqft;
    
    // Apply cost index
    if (costIndex !== null) {
      adjustedCostPerSqft = adjustedCostPerSqft * (costIndex / 100);
    }
    
    // Apply project type index
    const projectTypeIndex = (selected_project_construction_type?.relative_cost_index ?? 100) / 100;
    adjustedCostPerSqft = adjustedCostPerSqft * projectTypeIndex;
    
    // Calculate total cost
    return adjustedCostPerSqft * floorArea;
  };

  // Calculate discipline construction costs
  const calculateDisciplineConstructionCosts = (buildingTypeId: string, floorArea: number) => {
    // Get all construction costs for this building type
    const buildingTypeCosts = constructionCosts.filter(cost => 
      cost.building_type_id === buildingTypeId
    );

    // Find the total cost first - case insensitive comparison
    const totalCost = buildingTypeCosts.find(cost => 
      cost.cost_type.toLowerCase() === 'total'
    );
    
    if (totalCost) {
      // Always calculate cost per sqft, even if floor area is 0
      let adjustedCostPerSqft = totalCost.cost_per_sqft;
      if (costIndex !== null) {
        adjustedCostPerSqft = adjustedCostPerSqft * (costIndex / 100);
      }
      const projectTypeIndex = (selected_project_construction_type?.relative_cost_index ?? 100) / 100;
      adjustedCostPerSqft = adjustedCostPerSqft * projectTypeIndex;
      
      setTotalCostPerSqFt(adjustedCostPerSqft);
      
      // Only calculate total cost if we have a floor area
      if (floorArea) {
        const totalCostValue = calculateCost(totalCost.cost_per_sqft, floorArea);
        setTotalConstructionCost(totalCostValue);
      } else {
        setTotalConstructionCost(0);
      }
    } else {
      setTotalCostPerSqFt(0);
      setTotalConstructionCost(0);
    }
    
    // Get the most recent year's costs
    const mostRecentYear = Math.max(...buildingTypeCosts.map(cost => cost.year));
    const recentCosts = buildingTypeCosts.filter(cost => cost.year === mostRecentYear);

    // Calculate costs for each discipline - case insensitive comparison
    return ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].map(discipline => {
      const cost = recentCosts.find(c => 
        c.cost_type.toLowerCase() === discipline.toLowerCase()
      );
      
      // Use the actual cost from the database, or 0 if not found
      const costPerSqft = cost ? cost.cost_per_sqft : 0;
      
      // Apply cost index and project type adjustments
      let adjustedCostPerSqft = costPerSqft;
      if (costIndex !== null) {
        adjustedCostPerSqft = adjustedCostPerSqft * (costIndex / 100);
      }
      const projectTypeIndex = (selected_project_construction_type?.relative_cost_index ?? 100) / 100;
      adjustedCostPerSqft = adjustedCostPerSqft * projectTypeIndex;
      
      const totalConstructionCost = calculateCost(adjustedCostPerSqft, floorArea);

      return {
        id: cost?.id || crypto.randomUUID(),
        discipline: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural',
        cost_type: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural' | 'Total',
        year: 2025,
        building_type_id: buildingTypeId,
        is_active: discipline !== 'Civil' && discipline !== 'Structural',
        cost_per_sqft: adjustedCostPerSqft,
        total_construction_cost: totalConstructionCost
      } as ConstructionCost;
    });
  };

  // Handle building type selection
  const handleBuildingTypeSelect = (type: BuildingType) => {
    console.log('Building type selected:', {
      type,
      space_type: type.space_type,
      currentSpace: space,
      currentCosts: constructionCosts
    });
    setSelectedBuildingType(type);
    setOpenBuildingType(false);
    setSearchQuery('');
    
    let totalCostPerSqFt = 0;
    
    // Get all construction costs for this building type
    const buildingTypeCosts = constructionCosts.filter(cost => 
      cost.building_type_id === type.id
    );

    // Find the total cost first - case insensitive comparison
    const totalCost = buildingTypeCosts.find(cost => 
      cost.cost_type.toLowerCase() === 'total'
    );

    if (totalCost) {
      // Calculate adjusted total cost per sqft
      let adjustedCostPerSqft = totalCost.cost_per_sqft;
      if (costIndex !== null) {
        adjustedCostPerSqft = adjustedCostPerSqft * (costIndex / 100);
      }
      const projectTypeIndex = (selected_project_construction_type?.relative_cost_index ?? 100) / 100;
      adjustedCostPerSqft = adjustedCostPerSqft * projectTypeIndex;
      totalCostPerSqFt = adjustedCostPerSqft;
    }

    // Add discipline costs
    const disciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'] as const;
    const disciplineCosts = disciplines.map(discipline => {
      const cost = buildingTypeCosts.find(c => 
        c.cost_type.toLowerCase() === discipline.toLowerCase()
      );
      
      if (!cost) {
        return {
          id: crypto.randomUUID(),
          discipline: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural',
          cost_type: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural' | 'Total',
          year: 2025,
          building_type_id: type.id,
          is_active: discipline !== 'Civil' && discipline !== 'Structural',
          cost_per_sqft: 0,
          total_construction_cost: 0
        } as ConstructionCost;
      }

      let adjustedCostPerSqft = cost.cost_per_sqft;
      if (costIndex !== null) {
        adjustedCostPerSqft = adjustedCostPerSqft * (costIndex / 100);
      }
      const projectTypeIndex = (selected_project_construction_type?.relative_cost_index ?? 100) / 100;
      adjustedCostPerSqft = adjustedCostPerSqft * projectTypeIndex;

      console.log(`Final adjusted cost for ${discipline}:`, {
        original: cost.cost_per_sqft,
        adjusted: adjustedCostPerSqft
      });

      return {
        id: cost.id,
        discipline: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural',
        cost_type: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural' | 'Total',
        year: 2025,
        building_type_id: type.id,
        is_active: discipline !== 'Civil' && discipline !== 'Structural',
        cost_per_sqft: adjustedCostPerSqft,
        total_construction_cost: adjustedCostPerSqft * (space.floor_area || 0)
      } as ConstructionCost;
    });

    // Create construction costs object
    const construction_costs = disciplineCosts.reduce((acc, cost) => ({
      ...acc,
      [cost.cost_type]: cost
    }), {} as ConstructionCostsForSpace);

    // Add Total cost using the actual total from the building type
    construction_costs.Total = {
      id: crypto.randomUUID(),
      discipline: 'Total',
      cost_type: 'Total',
      year: 2025,
      building_type_id: type.id,
      is_active: true,
      cost_per_sqft: totalCostPerSqFt,
      total_construction_cost: totalCostPerSqFt * (space.floor_area || 0)
    } as ConstructionCost;

    // Update total costs
    setTotalCostPerSqFt(totalCostPerSqFt);
    setTotalConstructionCost(totalCostPerSqFt * (space.floor_area || 0));
    
    const updatedSpace = {
      ...space,
      building_type_id: type.id,
      building_type: type.name || '',
      name: type.name || '',
      description: type.description || '',
      space_type: type.space_type || '',
      project_construction_type: 'New Construction',
      project_construction_type_id: 1,
      construction_costs
    };
    console.log('Updating space with:', updatedSpace);
    setSpace(updatedSpace);
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
    console.log('Construction type selected:', {
      selectedType: type,
      previousSelected: selected_project_construction_type,
      previousSpace: space
    });

    setSelectedProjectConstructionType(type);
    setOpenProjectConstructionType(false);
    setConstructionTypeSearchQuery('');
    
    // Recalculate costs with new construction type
    if (selectedBuildingType) {
      const costs = calculateDisciplineConstructionCosts(selectedBuildingType.id, space.floor_area || 0);
      setSpace(prev => ({
        ...prev,
        construction_costs: {
          ...prev.construction_costs,
          ...costs.reduce((acc, cost) => ({
            ...acc,
            [cost.discipline]: cost
          }), {} as ConstructionCostsForSpace)
        }
      }));
    }
    
    setSpace(prev => ({
      ...prev,
      project_construction_type: type.project_type,
      project_construction_type_id: type.id
    }));
  };

  // Handle save
  const handleSave = () => {
    if (!selectedBuildingType) {
      toast.error('Please select a building type');
      return;
    }

    if (!selected_project_construction_type) {
      toast.error('Please select a project construction type');
      return;
    }

    if (!space.floor_area || space.floor_area <= 0) {
      toast.error('Please enter a valid floor area');
      return;
    }

    const spaceToSave: Omit<Space, 'id'> = {
      name: space.name || '',
      description: space.description || '',
      floor_area: space.floor_area,
      building_type: selectedBuildingType.name,
      building_type_id: selectedBuildingType.id,
      space_type: selectedBuildingType.space_type || '',
      project_construction_type: selected_project_construction_type.project_type,
      project_construction_type_id: selected_project_construction_type.id,
      construction_costs: space.construction_costs,
      discipline_engineering_services: [],
      discipline_engineering_fees: [],
      level_id: levelId || '',
      structure_id: structureId || '',
      created_at: space.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
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

  // Update getDisplayConstructionCosts to use proper types
  type DisplayConstructionCost = ConstructionCost & {
    total_construction_cost: number;
  };

  const getDisplayConstructionCosts = (): DisplayConstructionCost[] => {
    const disciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'] as const;
    const costs = disciplines.map(discipline => {
      const cost = space.construction_costs[discipline];
      
      // If no cost exists or cost_per_sqft is invalid, create a default cost
      if (!cost || typeof cost.cost_per_sqft !== 'number' || isNaN(cost.cost_per_sqft)) {
        const defaultCost: DisplayConstructionCost = {
          id: crypto.randomUUID(),
          discipline: discipline,
          cost_type: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural' | 'Total',
          cost_per_sqft: 0,
          year: new Date().getFullYear(),
          building_type_id: selectedBuildingType?.id || '',
          is_active: discipline !== 'Civil' && discipline !== 'Structural',
          total_construction_cost: 0
        };
        return defaultCost;
      }
      
      // Calculate total cost using the valid cost_per_sqft
      const total_construction_cost = calculateCost(cost.cost_per_sqft, space.floor_area || 0);
      
      const displayCost: DisplayConstructionCost = {
        ...cost,
        total_construction_cost
      };
      return displayCost;
    });

    return costs;
  };

  // Update handleFloorAreaChange to use proper types
  const handleFloorAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFloorArea = Number(e.target.value);
    
    if (selectedBuildingType) {
      const buildingTypeCosts = constructionCosts.filter(cost => 
        cost.building_type_id === selectedBuildingType.id
      );

      // Find the original total cost first
      const totalCost = buildingTypeCosts.find(cost => 
        cost.cost_type.toLowerCase() === 'total'
      );

      if (!totalCost) {
        console.error('No total cost found for building type:', selectedBuildingType.id);
        return;
      }

      // Calculate the original total cost per sqft
      let originalTotalCostPerSqFt = totalCost.cost_per_sqft;
      if (costIndex !== null) {
        originalTotalCostPerSqFt = originalTotalCostPerSqFt * (costIndex / 100);
      }
      const projectTypeIndex = (selected_project_construction_type?.relative_cost_index ?? 100) / 100;
      originalTotalCostPerSqFt = originalTotalCostPerSqFt * projectTypeIndex;

      const disciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'] as const;
      const disciplineCosts = disciplines.map(discipline => {
        const cost = buildingTypeCosts.find(c => 
          c.cost_type.toLowerCase() === discipline.toLowerCase()
        );
        
        if (!cost) {
          const defaultCost: ConstructionCost = {
            id: crypto.randomUUID(),
            discipline: discipline,
            cost_type: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural' | 'Total',
            cost_per_sqft: 0,
            year: new Date().getFullYear(),
            building_type_id: selectedBuildingType.id,
            is_active: discipline !== 'Civil' && discipline !== 'Structural',
            total_construction_cost: 0
          };
          return defaultCost;
        }

        let adjustedCostPerSqft = cost.cost_per_sqft;
        if (costIndex !== null) {
          adjustedCostPerSqft = adjustedCostPerSqft * (costIndex / 100);
        }
        const projectTypeIndex = (selected_project_construction_type?.relative_cost_index ?? 100) / 100;
        adjustedCostPerSqft = adjustedCostPerSqft * projectTypeIndex;

        const updatedCost: ConstructionCost = {
          id: cost.id,
          discipline: discipline,
          cost_type: discipline as 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural' | 'Total',
          year: new Date().getFullYear(),
          building_type_id: selectedBuildingType.id,
          is_active: discipline !== 'Civil' && discipline !== 'Structural',
          cost_per_sqft: adjustedCostPerSqft,
          total_construction_cost: adjustedCostPerSqft * newFloorArea
        };
        return updatedCost;
      });

      const construction_costs = disciplineCosts.reduce((acc: ConstructionCostsForSpace, cost: ConstructionCost) => ({
        ...acc,
        [cost.cost_type]: cost
      }), {} as ConstructionCostsForSpace);

      // Use the original total cost instead of recalculating
      construction_costs.Total = {
        id: crypto.randomUUID(),
        discipline: 'Total',
        cost_type: 'Total',
        year: new Date().getFullYear(),
        building_type_id: selectedBuildingType.id,
        is_active: true,
        cost_per_sqft: originalTotalCostPerSqFt,
        total_construction_cost: originalTotalCostPerSqFt * newFloorArea
      } as ConstructionCost;

      setSpace((prev: Omit<Space, "id">) => ({
        ...prev,
        floor_area: newFloorArea,
        construction_costs
      }));

      setTotalCostPerSqFt(originalTotalCostPerSqFt);
      setTotalConstructionCost(originalTotalCostPerSqFt * newFloorArea);
    } else {
      setSpace((prev: Omit<Space, "id">) => ({ 
        ...prev, 
        floor_area: newFloorArea
      }));
    }
  };

  const handleDisciplineToggle = (discipline: string) => {
    if (discipline === 'Civil' || discipline === 'Structural') return;
    
    setSpace(prev => {
      const cost = prev.construction_costs[discipline as keyof ConstructionCostsForSpace];
      if (!cost) return prev;

      return {
        ...prev,
        construction_costs: {
          ...prev.construction_costs,
          [discipline]: {
            ...cost,
            is_active: !cost.is_active
          }
        }
      };
    });
  };

  // Update the space state when project construction type changes
  const handleProjectConstructionTypeChange = (value: string) => {
    const type = projectConstructionTypes.find(t => t.id.toString() === value);
    if (type) {
    setSelectedProjectConstructionType(type);
      setSpace(prev => ({
        ...prev,
        project_construction_type: type.project_type,
        project_construction_type_id: type.id  // This is now a number
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
        building_type: type.name,
        building_type_id: type.id,
        space_type: type.space_type || '',
        project_construction_type: 'New Construction',
        project_construction_type_id: 1,
        floor_area: type.default_area || 0
      }));
    }
  };

  // Update the JSX where costs are displayed
  const renderConstructionCosts = () => {
    const displayCosts = getDisplayConstructionCosts();
    return displayCosts.map(cost => (
      <div key={cost.id} className="grid grid-cols-3 gap-4 py-1">
        <div className="text-sm font-medium">
          {cost.cost_type}
        </div>
        <div className="text-right text-sm text-muted-foreground">
          ${cost.cost_per_sqft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-right text-sm font-medium">
          ${(cost.total_construction_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    ));
  };

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
                  {selected_project_construction_type
                    ? selected_project_construction_type.project_type
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
                              selected_project_construction_type?.id === type.id ? "opacity-100" : "opacity-0"
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
              value={space.floor_area}
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
                {(() => {
                  const displayCosts = getDisplayConstructionCosts();
                  console.log('Rendering display costs:', displayCosts);
                  return displayCosts.map(cost => (
                    <div key={cost.id} className="grid grid-cols-3 gap-4 py-1">
                      <div className="text-sm font-medium">
                        {cost.cost_type}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        ${cost.cost_per_sqft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-right text-sm font-medium">
                        ${(cost.total_construction_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ));
                })()}
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
            disabled={!selectedBuildingType || !selected_project_construction_type || space.floor_area <= 0}
          >
            {initialSpace ? 'Update Space' : 'Add Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}