"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";

interface BuildingType {
  id: string;
  name: string;
  description: string | null;
  space_type: string | null;
  discipline: string | null;
  hvac_system: string | null;
  default_constructionCost: number | null;
  default_area: number | null;
}

interface ConstructionCost {
  id: string;
  building_type_id: string;
  cost_type: string;
  year: number;
  cost_per_sqft: number;
  percentage: number | null;
}

interface DisciplineFee {
  id: string;
  discipline: string;
  isActive: boolean;
  costPerSqft: number;
  totalConstructionCost: number;
}

interface ProjectConstructionType {
  id: number;
  project_type: string;
  definition: string;
  description: string;
  relative_cost_index: number;
  created_at: string;
}

interface Space {
  id: string;
  name: string;
  floorArea: number;
  description: string;
  buildingType: string;
  buildingTypeId: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  projectConstructionType: string;
  projectConstructionTypeId: number;
  structureId: string;
  levelId: string;
  totalConstructionCosts: {
    id: string;
    discipline: string;
    totalConstructionCost: number;
    isActive: boolean;
    costPerSqft: number;
  }[];
  splitConstructionCosts: boolean;
}

interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (space: Omit<Space, 'id'>) => void;
  defaultValues?: Partial<Space>;
  costIndex: number | null;
  initialSpace: Space | null;
  onDisciplineConstructionCostToggle: (structureId: string, levelId: string, spaceId: string, constructionCostId: string, isActive: boolean) => void;
}

export function SpaceDialog({ open, onOpenChange, onSave, defaultValues, costIndex, initialSpace, onDisciplineConstructionCostToggle }: SpaceDialogProps) {
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [constructionCosts, setConstructionCosts] = useState<ConstructionCost[]>([]);
  const [projectConstructionTypes, setProjectConstructionTypes] = useState<ProjectConstructionType[]>([]);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  const [selectedConstructionType, setSelectedConstructionType] = useState<ProjectConstructionType | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openConstructionTypeCombobox, setOpenConstructionTypeCombobox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [constructionTypeSearchQuery, setConstructionTypeSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [totalConstructionCost, setTotalConstructionCost] = useState<number>(0);
  const [totalCostPerSqFt, setTotalCostPerSqFt] = useState<number>(0);
  
  // Add a ref to track if we're initializing
  const isInitializing = useRef(true);

  // Initialize space state with initialSpace or defaultValues
  const [space, setSpace] = useState<Omit<Space, 'id'>>(() => {
    const initialName = initialSpace?.name || defaultValues?.name || '';
    return {
      name: initialName,
      buildingTypeId: initialSpace?.buildingTypeId || defaultValues?.buildingTypeId || '',
      buildingType: initialSpace?.buildingType || defaultValues?.buildingType || '',
      floorArea: initialSpace?.floorArea || defaultValues?.floorArea || 0,
      description: initialSpace?.description || defaultValues?.description || '',
      spaceType: initialSpace?.spaceType || defaultValues?.spaceType || '',
      discipline: initialSpace?.discipline || defaultValues?.discipline || '',
      hvacSystem: initialSpace?.hvacSystem || defaultValues?.hvacSystem || '',
      projectConstructionType: initialSpace?.projectConstructionType || defaultValues?.projectConstructionType || '',
      projectConstructionTypeId: initialSpace?.projectConstructionTypeId || defaultValues?.projectConstructionTypeId || 0,
      structureId: initialSpace?.structureId || defaultValues?.structureId || '',
      levelId: initialSpace?.levelId || defaultValues?.levelId || '',
      totalConstructionCosts: initialSpace?.totalConstructionCosts || defaultValues?.totalConstructionCosts || [],
      splitConstructionCosts: initialSpace?.splitConstructionCosts || defaultValues?.splitConstructionCosts || false
    };
  });

  // Initialize disciplineConstructionCosts state with initialSpace totalConstructionCosts or defaults
  const [disciplineConstructionCosts, setDisciplineConstructionCosts] = useState<DisciplineFee[]>(() => {
    // If we have initial space data, filter to include all disciplines
    if (initialSpace?.totalConstructionCosts) {
      const allDisciplines = initialSpace.totalConstructionCosts.filter(cost => 
        ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].includes(cost.discipline)
      );
      // If we don't have all disciplines, add the missing ones with new IDs
      const existingDisciplines = allDisciplines.map(cost => cost.discipline);
      const missingDisciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].filter(
        discipline => !existingDisciplines.includes(discipline)
      );
      return [
        ...allDisciplines.map(cost => ({
          ...cost,
          isActive: cost.discipline === 'Civil' || cost.discipline === 'Structural' ? false : cost.isActive
        })),
        ...missingDisciplines.map(discipline => ({
          id: crypto.randomUUID(),
          discipline,
          isActive: discipline === 'Civil' || discipline === 'Structural' ? false : true,
          costPerSqft: 0,
          totalConstructionCost: 0
        }))
      ];
    }
    // For new spaces, generate consistent IDs for all disciplines
    const allDisciplines = ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'];
    return allDisciplines.map(discipline => ({
      id: crypto.randomUUID(),
      discipline,
      isActive: discipline === 'Civil' || discipline === 'Structural' ? false : true,
      costPerSqft: 0,
      totalConstructionCost: 0
    }));
  });

  const supabase = createClientComponentClient();

  // Filter building types based on search query
  const filteredBuildingTypes = buildingTypes.filter(type => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true; // Show all items when search is empty
    
    const nameMatch = (type.name || '').toLowerCase().includes(searchLower);
    const descriptionMatch = (type.description || '').toLowerCase().includes(searchLower);
    
    return nameMatch || descriptionMatch;
  });

  // Add scroll event handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    console.log('Scroll event triggered:', {
      scrollTop: e.currentTarget.scrollTop,
      scrollHeight: e.currentTarget.scrollHeight,
      clientHeight: e.currentTarget.clientHeight,
      target: e.currentTarget.className
    });
  };

  // Update wheel event handler to prevent propagation
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const container = e.currentTarget;
    container.scrollTop += e.deltaY;
    console.log('Wheel event handled:', {
      deltaY: e.deltaY,
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight
    });
  };

  // Log when building types are loaded
  useEffect(() => {
    console.log('Building types loaded:', buildingTypes.length);
  }, [buildingTypes]);

  // Log when dropdown opens/closes
  useEffect(() => {
    console.log('Dropdown state changed:', { openCombobox });
  }, [openCombobox]);

  useEffect(() => {
    const fetchBuildingTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('building_types')
          .select('*')
          .order('name');

        if (error) throw error;
        console.log('Fetched building types:', data);
        setBuildingTypes(data || []);
      } catch (error) {
        console.error('Error fetching building types:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchConstructionCosts = async () => {
      try {
        console.log('Fetching construction costs...');
        const { data, error } = await supabase
          .from('construction_costs')
          .select(`
            id,
            building_type_id,
            cost_type,
            year,
            cost_per_sqft,
            percentage
          `)
          .order('year', { ascending: false });

        if (error) {
          console.error('Error fetching construction costs:', error);
          throw error;
        }
        
        console.log('Fetched construction costs:', data);
        // Filter to only MEP disciplines for logging
        const mepCosts = data?.filter(cost => 
          ['Mechanical', 'Plumbing', 'Electrical'].includes(cost.cost_type)
        );
        console.log('MEP construction costs:', mepCosts);
        
        setConstructionCosts(data || []);
      } catch (error) {
        console.error('Error fetching construction costs:', error);
      }
    };

    if (open) {
      console.log('Dialog opened, fetching data...');
      fetchBuildingTypes();
      fetchConstructionCosts();
    }
  }, [open, supabase]);

  // Add useEffect for fetching project construction types
  useEffect(() => {
    const fetchProjectConstructionTypes = async () => {
      try {
        console.log('Fetching project construction types...');
        const response = await fetch('/api/project-construction-types');
        console.log('Project construction types response:', response);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch project construction types:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to fetch project construction types: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Project construction types data:', data);
        setProjectConstructionTypes(data);

        // Set default construction type to 'New Construction' if not editing an existing space
        if (!initialSpace) {
          const defaultType = data.find((type: ProjectConstructionType) => type.project_type === 'New Construction');
          if (defaultType) {
            console.log('Setting default construction type:', defaultType);
            setSelectedConstructionType(defaultType);
            setSpace(prev => ({
              ...prev,
              projectConstructionType: defaultType.project_type,
              projectConstructionTypeId: defaultType.id
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching project construction types:', error);
      }
    };

    if (open) {
      console.log('Dialog opened, fetching project construction types...');
      fetchProjectConstructionTypes();
    }
  }, [open, initialSpace]);

  // Add logging for construction types state changes
  useEffect(() => {
    console.log('Project construction types updated:', projectConstructionTypes);
  }, [projectConstructionTypes]);

  // Filter construction types based on search query
  const filteredConstructionTypes = projectConstructionTypes.filter(type => {
    const searchLower = constructionTypeSearchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    const typeMatch = type.project_type.toLowerCase().includes(searchLower);
    const definitionMatch = type.definition.toLowerCase().includes(searchLower);
    const descriptionMatch = type.description.toLowerCase().includes(searchLower);
    
    return typeMatch || definitionMatch || descriptionMatch;
  });

  const getConstructionCostsDescription = (buildingTypeId: string): string => {
    const costs = constructionCosts.filter(cost => cost.building_type_id === buildingTypeId);
    if (costs.length === 0) return '';

    // Get the most recent year's costs
    const mostRecentYear = Math.max(...costs.map(cost => cost.year));
    const recentCosts = costs.filter(cost => cost.year === mostRecentYear);

    const costStrings = recentCosts.map((cost: ConstructionCost) => {
      const costStr = formatCurrency(cost.cost_per_sqft);
      const percentageStr = cost.percentage ? ` (${cost.percentage}%)` : '';
      return `• ${cost.cost_type}: ${costStr}${percentageStr}`;
    });

    return `Year ${mostRecentYear}:\n${costStrings.join('\n')}`;
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
        const projectTypeIndex = (selectedConstructionType?.relative_cost_index ?? 100) / 100;
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
  }, [selectedBuildingType, space.floorArea, constructionCosts, costIndex, selectedConstructionType]);

  // Update calculateDisciplineConstructionCosts to remove total cost calculation
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

    // Continue with discipline costs calculation
    if (disciplineCosts.length === 0) {
      console.log('No discipline construction costs found for building type');
      // Instead of returning zeros, let's check what cost types we actually have
      const availableCostTypes = Array.from(new Set(buildingTypeCosts.map(cost => cost.cost_type)));
      console.log('Available cost types:', availableCostTypes);
      
      // Map the available cost types to disciplines if they match
      const mappedCosts = buildingTypeCosts.map(cost => {
        const costType = cost.cost_type.toLowerCase();
        let mappedDiscipline: string | null = null;
        
        // Map the cost types to disciplines
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
        // Use the mapped costs instead of returning zeros
        const mostRecentYear = Math.max(...mappedCosts.map(cost => cost.year));
        const recentCosts = mappedCosts.filter(cost => cost.year === mostRecentYear);
        
        return ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].map(discipline => {
          const matchingCost = recentCosts.find(c => c.discipline === discipline);
          let costPerSqft = matchingCost?.cost_per_sqft || 0;
          
          if (costIndex !== null) {
            costPerSqft = costPerSqft * (costIndex / 100);
          }
          
          const projectTypeIndex = (selectedConstructionType?.relative_cost_index ?? 100) / 100;
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
    const projectTypeIndex = (selectedConstructionType?.relative_cost_index ?? 100) / 100;
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

  // Update the useEffect that handles initial space to preserve inactive state for Civil and Structural
  useEffect(() => {
    if (open && initialSpace) {
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
        // Recalculate construction costs immediately after setting building type
        if (initialSpace.floorArea) {
          const calculatedCosts = calculateDisciplineConstructionCosts(matchingBuildingType.id, initialSpace.floorArea);
          // Preserve both the ID and isActive state from the initial space, but force Civil and Structural to be inactive
          const updatedCosts = calculatedCosts.map(calculatedCost => {
            const existingCost = initialSpace.totalConstructionCosts.find(
              cost => cost.discipline === calculatedCost.discipline
            );
            return {
              ...calculatedCost,
              id: existingCost?.id || crypto.randomUUID(), // Preserve original ID
              isActive: calculatedCost.discipline === 'Civil' || calculatedCost.discipline === 'Structural' 
                ? false 
                : (existingCost?.isActive ?? true)
            };
          });
          setDisciplineConstructionCosts(updatedCosts);
        }
      }

      // Find and set the selected construction type
      const matchingConstructionType = projectConstructionTypes.find(
        type => type.id === initialSpace.projectConstructionTypeId
      );
      if (matchingConstructionType) {
        setSelectedConstructionType(matchingConstructionType);
      }

      // Set initializing to false after a short delay to allow state updates
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    } else if (!open) {
      // Reset initializing when dialog closes
      isInitializing.current = true;
    }
  }, [open, initialSpace, buildingTypes, projectConstructionTypes, constructionCosts, costIndex]);

  // Add a useEffect to recalculate costs when building type or floor area changes
  useEffect(() => {
    if (!isInitializing.current && selectedBuildingType && space.floorArea) {
      const calculatedCosts = calculateDisciplineConstructionCosts(selectedBuildingType.id, space.floorArea);
      // Preserve both the ID and isActive state from the current disciplineConstructionCosts
      const updatedCosts = calculatedCosts.map(calculatedCost => {
        const existingCost = disciplineConstructionCosts.find(
          cost => cost.discipline === calculatedCost.discipline
        );
        return {
          ...calculatedCost,
          id: existingCost?.id || crypto.randomUUID(), // Preserve original ID
          isActive: existingCost?.isActive ?? true
        };
      });
      setDisciplineConstructionCosts(updatedCosts);
    }
  }, [selectedBuildingType, space.floorArea, constructionCosts, costIndex, selectedConstructionType]);

  const formatCurrency = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const number = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(number);
  };

  // Update the formatFloorArea function with logging
  const formatFloorArea = (value: string): string => {
    console.log('formatFloorArea input:', value);
    const formatted = value.replace(/[^\d]/g, '');
    console.log('formatFloorArea output:', formatted);
    return formatted;
  };

  // Update the handleFloorAreaChange function
  const handleFloorAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFloat(value) || 0;
    
    setSpace(prev => ({
      ...prev,
      floorArea: numericValue
    }));
    
    // Update totalConstructionCosts if we have a valid number and building type
    if (selectedBuildingType && numericValue > 0) {
      calculateDisciplineConstructionCosts(selectedBuildingType.id, numericValue);
    }
  };

  // Add logging to useEffect that watches space.floorArea
  useEffect(() => {
    console.log('space.floorArea changed:', space.floorArea);
  }, [space.floorArea]);

  // Update the handleDisciplineToggle function to prevent toggling Civil and Structural
  const handleDisciplineToggle = (discipline: string) => {
    // Prevent toggling Civil and Structural disciplines
    if (discipline === 'Civil' || discipline === 'Structural') {
      return;
    }

    const constructionCost = disciplineConstructionCosts.find(f => f.discipline === discipline);
    if (!constructionCost) return;

    const newIsActive = !constructionCost.isActive;
    console.log('SpaceDialog: Toggling discipline:', {
      discipline,
      constructionCostId: constructionCost.id,
      currentState: constructionCost.isActive,
      newState: newIsActive,
      initialSpace: initialSpace ? {
        id: initialSpace.id,
        structureId: initialSpace.structureId,
        levelId: initialSpace.levelId,
        totalConstructionCosts: initialSpace.totalConstructionCosts
      } : null
    });

    setDisciplineConstructionCosts(prev => {
      const updated = prev.map(f => f.discipline === discipline ? { ...f, isActive: newIsActive } : f);
      console.log('SpaceDialog: Updated disciplineConstructionCosts state:', updated);
      return updated;
    });

    // Only call onDisciplineConstructionCostToggle if we have an initialSpace (editing mode)
    if (initialSpace) {
      const constructionCostToToggle = initialSpace.totalConstructionCosts.find(f => f.discipline === discipline);
      if (constructionCostToToggle) {
        console.log('SpaceDialog: Calling onDisciplineConstructionCostToggle with:', {
          structureId: initialSpace.structureId,
          levelId: initialSpace.levelId,
          spaceId: initialSpace.id,
          constructionCostId: constructionCostToToggle.id,
          isActive: newIsActive
        });
        onDisciplineConstructionCostToggle(
          initialSpace.structureId || '',
          initialSpace.levelId || '',
          initialSpace.id,
          constructionCostToToggle.id,
          newIsActive
        );
      }
    }
  };

  // Update the handleSave function to include total construction cost
  const handleSave = async () => {
    try {
      if (!selectedBuildingType || !selectedConstructionType) {
        toast.error('Please select both building type and construction type');
        return;
      }

      console.log('SpaceDialog: Current disciplineConstructionCosts state before save:', disciplineConstructionCosts);

      // Calculate totalConstructionCosts but preserve isActive state
      const calculatedFees = calculateDisciplineConstructionCosts(selectedBuildingType.id, space.floorArea);
      const updatedFees = calculatedFees.map(calculatedFee => {
        const existingFee = disciplineConstructionCosts.find(f => f.discipline === calculatedFee.discipline);
        // Civil and Structural should be inactive by default, unless explicitly active
        const isActive = calculatedFee.discipline === 'Civil' || calculatedFee.discipline === 'Structural'
          ? existingFee?.isActive ?? false
          : existingFee?.isActive ?? true;
        return { ...calculatedFee, isActive };
      });
      console.log("handleSave: updatedFees (after mapping calculatedFees):", updatedFees);
      console.log('SpaceDialog: Final totalConstructionCosts state being saved:', updatedFees);

      // Get the total cost from construction_costs
      const totalCost = constructionCosts.find(cost => 
        cost.building_type_id === selectedBuildingType.id && 
        cost.cost_type.toLowerCase() === 'total'
      );

      let adjustedTotalCostPerSqft = 0;
      if (totalCost) {
        adjustedTotalCostPerSqft = totalCost.cost_per_sqft;
        
        // Apply cost index adjustment
        if (costIndex !== null) {
          adjustedTotalCostPerSqft = adjustedTotalCostPerSqft * (costIndex / 100);
        }
        
        // Apply project type index
        const projectTypeIndex = (selectedConstructionType.relative_cost_index ?? 100) / 100;
        adjustedTotalCostPerSqft = adjustedTotalCostPerSqft * projectTypeIndex;
      }

      const spaceToSave = {
        ...space,
        buildingType: selectedBuildingType.name,
        buildingTypeId: selectedBuildingType.id,
        projectConstructionType: selectedConstructionType.project_type,
        projectConstructionTypeId: selectedConstructionType.id,
        totalConstructionCosts: updatedFees,
        totalCostPerSqft: adjustedTotalCostPerSqft,  // Add the total cost per sq ft
        totalCost: adjustedTotalCostPerSqft * space.floorArea  // Add the total cost
      };

      console.log('SpaceDialog: Saving space with total cost:', {
        totalCostPerSqft: adjustedTotalCostPerSqft,
        totalCost: adjustedTotalCostPerSqft * space.floorArea,
        floorArea: space.floorArea
      });

      await onSave(spaceToSave);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving space:', error);
      toast.error('Failed to save space');
    }
  };

  // Update the getDisplayConstructionCosts function to include Civil and Structural
  const getDisplayConstructionCosts = () => {
    if (!selectedBuildingType || !space.floorArea) {
      // If we don't have building type or floor area, return the current state
      return disciplineConstructionCosts.filter(cost => 
        ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].includes(cost.discipline)
      );
    }
    // Calculate costs for all disciplines
    const calculatedCosts = calculateDisciplineConstructionCosts(selectedBuildingType.id, space.floorArea);
    // Ensure we have all disciplines
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

  // Update the building type selection handler
  const handleBuildingTypeSelect = (type: BuildingType) => {
    console.log('Building type selected:', type);
    setSelectedBuildingType(type);
    setOpenCombobox(false);
    setSearchQuery('');
    
    // Calculate construction costs immediately when building type is selected
    const floorArea = space.floorArea || (type.default_area || 0);
    console.log('Using floor area:', floorArea);
    
    // Find construction costs for this building type
    const buildingTypeCosts = constructionCosts.filter(cost => 
      cost.building_type_id === type.id && 
      ['Mechanical', 'Plumbing', 'Electrical'].includes(cost.cost_type)
    );
    console.log('Found construction costs for building type:', buildingTypeCosts);
    
    const calculatedCosts = calculateDisciplineConstructionCosts(type.id, floorArea);
    console.log('Calculated costs:', calculatedCosts);
    
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

    // Update discipline construction costs with calculated values
    setDisciplineConstructionCosts(prev => {
      const updatedCosts = calculatedCosts.map(calculatedCost => {
        const existingCost = prev.find(cost => cost.discipline === calculatedCost.discipline);
        const updatedCost = {
          ...calculatedCost,
          id: existingCost?.id || crypto.randomUUID(),
          isActive: existingCost?.isActive ?? true
        };
        console.log('Updated cost for discipline:', calculatedCost.discipline, updatedCost);
        return updatedCost;
      });
      console.log('Final updated discipline costs:', updatedCosts);
      return updatedCosts;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialSpace ? 'Update Space' : 'Add Space'}</DialogTitle>
          <DialogDescription>
            {initialSpace ? 'Update the space details.' : 'Select a building type and enter the space details.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Space Details */}
          <div className="grid gap-2">
            <Label htmlFor="buildingType">Building Type</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {selectedBuildingType
                    ? selectedBuildingType.name
                    : "Select a building type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
                <Command shouldFilter={false} className="w-full">
                  <CommandInput 
                    placeholder="Search by name or description..." 
                    value={searchQuery}
                    onValueChange={(value) => {
                      setSearchQuery(value);
                      setOpenCombobox(true);
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
                                  selectedBuildingType === type ? "opacity-100" : "opacity-0"
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
            <Popover open={openConstructionTypeCombobox} onOpenChange={setOpenConstructionTypeCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openConstructionTypeCombobox}
                  className="w-full justify-between"
                >
                  {selectedConstructionType
                    ? selectedConstructionType.project_type
                    : "Select a construction type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
                <Command shouldFilter={false} className="w-full">
                  <CommandInput 
                    placeholder="Search by type, definition, or description..." 
                    value={constructionTypeSearchQuery}
                    onValueChange={(value) => {
                      setConstructionTypeSearchQuery(value);
                      setOpenConstructionTypeCombobox(true);
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
                            onSelect={() => {
                              setSelectedConstructionType(type);
                              setOpenConstructionTypeCombobox(false);
                              setConstructionTypeSearchQuery('');
                              
                              setSpace(prev => ({
                                ...prev,
                                projectConstructionType: type.project_type,
                                projectConstructionTypeId: type.id
                              }));
                            }}
                            className="flex flex-col items-start py-2 px-3 cursor-pointer hover:bg-accent"
                          >
                            <div className="flex items-center gap-2">
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedConstructionType?.id === type.id ? "opacity-100" : "opacity-0"
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

          {/* Discipline totalConstructionCosts */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Construction Costs</h3>
            <div>
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="font-medium text-muted-foreground">Discipline</div>
                <div className="font-medium text-right text-muted-foreground">Cost per sq ft</div>
                <div className="font-medium text-right text-muted-foreground">Total Cost</div>
              </div>
              <div className="space-y-1">
                {getDisplayConstructionCosts()
                  .filter(constructionCost => ['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'].includes(constructionCost.discipline))
                  .map((constructionCost) => (
                    <div key={constructionCost.id} className="grid grid-cols-3 gap-4 py-1">
                      <div className="font-medium">{constructionCost.discipline}</div>
                      <div className="text-right">{formatCurrency(constructionCost.costPerSqft)}</div>
                      <div className="text-right">{formatCurrency(constructionCost.totalConstructionCost)}</div>
                    </div>
                  ))}
              </div>
              <div className="mt-2 pt-2 border-t">
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
            disabled={!selectedBuildingType || !selectedConstructionType || space.floorArea <= 0}
          >
            {initialSpace ? 'Update Space' : 'Add Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}