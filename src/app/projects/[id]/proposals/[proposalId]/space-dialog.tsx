"use client";

import { useState, useEffect } from 'react';
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

interface BuildingType {
  id: string;
  name: string;
  description: string | null;
  space_type: string | null;
  discipline: string | null;
  hvac_system: string | null;
  default_fee: number | null;
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
  totalFee: number;
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
  fees: {
    id: string;
    discipline: string;
    totalFee: number;
    isActive: boolean;
    costPerSqft: number;
  }[];
  splitFees: boolean;
}

interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (space: Omit<Space, 'id'>) => void;
  defaultValues?: Partial<Space>;
  costIndex: number | null;
  initialSpace: Space | null;
  onDisciplineFeeToggle: (structureId: string, discipline: string, isActive: boolean) => void;
}

export function SpaceDialog({ open, onOpenChange, onSave, defaultValues, costIndex, initialSpace, onDisciplineFeeToggle }: SpaceDialogProps) {
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
  
  // Initialize space state with initialSpace or defaultValues
  const [space, setSpace] = useState<Omit<Space, 'id'>>(() => ({
    name: '',
    buildingTypeId: '',
    buildingType: '',
    floorArea: 0,
    description: '',
    spaceType: '',
    discipline: '',
    hvacSystem: '',
    projectConstructionType: '',
    projectConstructionTypeId: 0,
    fees: [],
    splitFees: false,
    ...(initialSpace || defaultValues)
  }));

  // Initialize disciplineFees state with initialSpace fees or defaults
  const [disciplineFees, setDisciplineFees] = useState<DisciplineFee[]>(() => 
    initialSpace?.fees || [
      { id: crypto.randomUUID(), discipline: 'Mechanical', isActive: true, costPerSqft: 0, totalFee: 0 },
      { id: crypto.randomUUID(), discipline: 'Plumbing', isActive: true, costPerSqft: 0, totalFee: 0 },
      { id: crypto.randomUUID(), discipline: 'Electrical', isActive: true, costPerSqft: 0, totalFee: 0 }
    ]
  );

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
        setBuildingTypes(data || []);
      } catch (error) {
        console.error('Error fetching building types:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchConstructionCosts = async () => {
      try {
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

        if (error) throw error;
        setConstructionCosts(data || []);
      } catch (error) {
        console.error('Error fetching construction costs:', error);
      }
    };

    if (open) {
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

  const calculateDisciplineFees = (buildingTypeId: string, floorArea: number) => {
    const costs = constructionCosts.filter(cost => cost.building_type_id === buildingTypeId);
    if (costs.length === 0) return;

    // Get the most recent year's costs
    const mostRecentYear = Math.max(...costs.map(cost => cost.year));
    const recentCosts = costs.filter(cost => cost.year === mostRecentYear);

    const updatedFees = disciplineFees.map(fee => {
      const cost = recentCosts.find(c => c.cost_type.toLowerCase() === fee.discipline.toLowerCase());
      let costPerSqft = cost?.cost_per_sqft || 0;
      
      // Apply cost index adjustment if available
      if (costIndex !== null) {
        costPerSqft = costPerSqft * (costIndex / 100);
      }
      
      const totalFee = costPerSqft * floorArea;
      return {
        ...fee,
        costPerSqft,
        totalFee
      };
    });

    setDisciplineFees(updatedFees);
  };

  useEffect(() => {
    if (selectedBuildingType && space.floorArea) {
      const floorArea = parseFloat(space.floorArea.toString());
      if (!isNaN(floorArea)) {
        calculateDisciplineFees(selectedBuildingType.id, floorArea);
      }
    }
  }, [selectedBuildingType, space.floorArea, constructionCosts]);

  useEffect(() => {
    if (selectedBuildingType) {
      setSpace(prev => {
        // If we're editing an existing space (initialSpace exists), preserve its values
        if (initialSpace) {
          return {
            ...prev,
            buildingTypeId: selectedBuildingType.id,
            buildingType: selectedBuildingType.name || '',
            name: prev.name || selectedBuildingType.name || '',
            description: prev.description || selectedBuildingType.description || '',
            spaceType: prev.spaceType || selectedBuildingType.space_type || '',
            discipline: prev.discipline || selectedBuildingType.discipline || '',
            hvacSystem: prev.hvacSystem || selectedBuildingType.hvac_system || '',
            fees: prev.fees.length > 0 ? prev.fees : disciplineFees,
            floorArea: prev.floorArea || (selectedBuildingType.default_area || 0),
            splitFees: prev.splitFees
          };
        }
        // For new spaces, use the building type values
        return {
          ...prev,
          buildingTypeId: selectedBuildingType.id,
          buildingType: selectedBuildingType.name || '',
          name: selectedBuildingType.name || '',
          description: selectedBuildingType.description || '',
          spaceType: selectedBuildingType.space_type || '',
          discipline: selectedBuildingType.discipline || '',
          hvacSystem: selectedBuildingType.hvac_system || '',
          fees: disciplineFees,
          floorArea: prev.floorArea || (selectedBuildingType.default_area || 0),
          splitFees: prev.splitFees
        };
      });
    }
  }, [selectedBuildingType, constructionCosts, disciplineFees, initialSpace]);

  // Update useEffect to handle initialSpace and set selected building type
  useEffect(() => {
    if (initialSpace && buildingTypes.length > 0) {
      const matchingBuildingType = buildingTypes.find(type => type.id === initialSpace.buildingTypeId);
      if (matchingBuildingType) {
        setSelectedBuildingType(matchingBuildingType);
        // Set the initial space values
        setSpace({
          ...initialSpace,
          fees: initialSpace.fees || disciplineFees
        });
      }
    }
  }, [initialSpace, buildingTypes]);

  // Update the useEffect that sets initial values
  useEffect(() => {
    if (initialSpace) {
      setSpace({
        ...initialSpace,
        projectConstructionType: initialSpace.projectConstructionType || '',
        projectConstructionTypeId: initialSpace.projectConstructionTypeId || 0
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
        setSelectedConstructionType(matchingConstructionType);
      }
    }
  }, [initialSpace, buildingTypes, projectConstructionTypes]);

  // Add useEffect to update dialog state when opened with initialSpace
  useEffect(() => {
    if (open && initialSpace) {
      console.log('Dialog opened with initial space:', initialSpace);
      // Update the space state with the latest data from initialSpace
      setSpace({
        ...initialSpace,
        fees: initialSpace.fees || disciplineFees
      });

      // Update discipline fees state
      setDisciplineFees(initialSpace.fees || disciplineFees);

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
        setSelectedConstructionType(matchingConstructionType);
      }
    }
  }, [open, initialSpace, buildingTypes, projectConstructionTypes]);

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
    console.log('handleFloorAreaChange - raw input value:', e.target.value);
    const value = e.target.value;
    const formattedValue = formatFloorArea(value);
    console.log('handleFloorAreaChange - formatted value:', formattedValue);
    
    // Log the current state before update
    console.log('Current space state before update:', space);
    
    const numericValue = parseFloat(formattedValue) || 0;
    setSpace(prev => {
      const newState = { ...prev, floorArea: numericValue };
      console.log('New space state:', newState);
      return newState;
    });
    
    // Update fees if we have a valid number
    if (selectedBuildingType && numericValue > 0) {
      console.log('Calculating fees for floor area:', numericValue);
      calculateDisciplineFees(selectedBuildingType.id, numericValue);
    }
  };

  // Add logging to useEffect that watches space.floorArea
  useEffect(() => {
    console.log('space.floorArea changed:', space.floorArea);
  }, [space.floorArea]);

  // Update the handleSave function to handle null checks
  const handleSave = () => {
    if (!selectedBuildingType || !selectedConstructionType) {
      return;
    }

    const spaceToSave = {
      ...space,
      buildingType: selectedBuildingType.name,
      buildingTypeId: selectedBuildingType.id,
      projectConstructionType: selectedConstructionType.project_type,
      projectConstructionTypeId: selectedConstructionType.id
    };

    onSave(spaceToSave);
    onOpenChange(false);
  };

  // Update the discipline fee toggle handler
  const handleDisciplineFeeToggle = (discipline: string, isActive: boolean) => {
    // Update discipline fees state
    const updatedFees = disciplineFees.map(fee => 
      fee.discipline === discipline ? { ...fee, isActive } : fee
    );
    setDisciplineFees(updatedFees);

    // Update space state to keep fees in sync
    setSpace(prev => ({
      ...prev,
      fees: updatedFees
    }));

    // Call the parent component's toggle handler if we have a structure ID
    if (initialSpace?.id) {
      onDisciplineFeeToggle(initialSpace.id, discipline, isActive);
    }
  };

  // Update the fee table toggle handler
  const handleFeeTableToggle = (discipline: string, isActive: boolean) => {
    // Update discipline fees state
    const updatedFees = disciplineFees.map(fee => 
      fee.discipline === discipline ? { ...fee, isActive } : fee
    );
    setDisciplineFees(updatedFees);

    // Update space state to keep fees in sync
    setSpace(prev => ({
      ...prev,
      fees: updatedFees
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialSpace ? 'Update Space' : 'Add Space'}</DialogTitle>
          <DialogDescription>
            {initialSpace ? 'Update the space details.' : 'Select a building type and enter the space details.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
                            onSelect={() => {
                              setSelectedBuildingType(type);
                              setOpenCombobox(false);
                              setSearchQuery('');
                              
                              setSpace(prev => ({
                                ...prev,
                                buildingTypeId: type.id,
                                buildingType: type.name || '',
                                name: type.name || '',
                                description: type.description || '',
                                spaceType: type.space_type || '',
                                discipline: type.discipline || '',
                                hvacSystem: type.hvac_system || '',
                                fees: disciplineFees,
                                floorArea: prev.floorArea || (type.default_area || 0),
                                splitFees: prev.splitFees
                              }));
                            }}
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
            {selectedBuildingType?.description && (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedBuildingType.description}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="floorArea">Floor Area (sq ft)</Label>
            <Input
              id="floorArea"
              value={space.floorArea.toString()}
              onChange={handleFloorAreaChange}
              onFocus={(e) => console.log('Input focused, current value:', e.target.value)}
              onBlur={(e) => console.log('Input blurred, final value:', e.target.value)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter floor area"
              className="flex h-10 w-full rounded-md border border-[#D1D5DB] dark:border-[#4DB6AC] bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted dark:placeholder:text-[#6B7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB6AC] dark:focus-visible:ring-[#4DB6AC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-2">
            <Label>Construction Cost by Discipline</Label>
            <div className="space-y-4">
              {disciplineFees.map((fee, index) => (
                <div key={fee.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{fee.discipline}</div>
                    <button
                      type="button"
                      onClick={() => handleDisciplineFeeToggle(fee.discipline, !fee.isActive)}
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
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cost per sq ft:</span>
                      <div>{formatCurrency(fee.costPerSqft)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <div>{formatCurrency(fee.totalFee)}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="font-medium">Total Cost</div>
                  <div className="font-medium">
                    {formatCurrency(disciplineFees.reduce((sum, fee) => 
                      sum + (fee.isActive ? fee.totalFee : 0), 0
                    ))}
                  </div>
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
            disabled={!selectedBuildingType || !selectedConstructionType}
          >
            {initialSpace ? 'Update Space' : 'Add Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}