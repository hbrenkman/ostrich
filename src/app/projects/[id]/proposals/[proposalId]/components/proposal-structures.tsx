"use client";

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { Building2, ChevronDown, Layers, Building, Pencil, Save, Trash2, Plus, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SpaceDialog } from './space-dialog';
import { toast } from 'sonner';
import { EngineeringServicesManager } from './engineering-services-manager';
import { useProposalStore } from '@/store/proposal';
import type { 
  Space, 
  Structure, 
  Level, 
  ConstructionCost,
  FeeCalculationState,
  FeeScale,
  ConstructionCostsForSpace
} from '@/types/proposal/base';
import type { tracked_service } from '@/types/proposal/service';
import { useParams } from 'next/navigation';

// Define ConstructionCosts type locally
type ConstructionCosts = {
  [phase in 'design' | 'construction']: {
    [structureId: string]: {
      [levelId: string]: {
        [spaceId: string]: {
          [discipline: string]: number;
        };
      };
    };
  };
};

// Helper function to create a new level with all required properties
function createNewLevel(id: string, name: string, level_number: number): Level {
  return {
    id,
    structure_id: '',
    name,
    level_number,
    description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_cost: 0,
    total_area: 0,
    is_active: true,
    is_collapsed: false,
    spaces: []
  };
}

// Helper function to create a new structure with all required properties
function createNewStructure(name: string): Structure {
  const defaultFeeScale: FeeScale = {
    id: 0,
    construction_cost: 0,
    prime_consultant_rate: 0,
    fraction_of_prime_rate_mechanical: 0,
    fraction_of_prime_rate_plumbing: 0,
    fraction_of_prime_rate_electrical: 0,
    fraction_of_prime_rate_structural: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    parent_id: null,
    design_fee_rate: null,
    construction_support_enabled: false,
    design_percentage: null,
    is_duplicate: false,
    duplicate_number: null,
    duplicate_parent_id: null,
    duplicate_rate: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_construction_cost: 0,
    total_floor_area: 0,
    is_active: true,
    is_duplicate_collapsed: false,
    fee_scale: defaultFeeScale,
    levels: [createNewLevel(crypto.randomUUID(), 'Level 0', 0)],
  };
}

// Helper function to transform construction costs into nested structure
const initializeConstructionCosts = (structures: Structure[]): ConstructionCosts => {
  const costs: ConstructionCosts = {
    design: {},
    construction: {}
  };

  structures.forEach(structure => {
    costs.design[structure.id] = {};
    costs.construction[structure.id] = {};
    
    structure.levels.forEach((level: Level) => {
      costs.design[structure.id][level.id] = {};
      costs.construction[structure.id][level.id] = {};
      
      level.spaces.forEach((space: Space) => {
        costs.design[structure.id][level.id][space.id] = {};
        costs.construction[structure.id][level.id][space.id] = {};
        
        if (space.construction_costs) {
          Object.entries(space.construction_costs)
            .filter(([key]) => key !== 'Total')
            .forEach(([discipline, cost]) => {
              if (cost && typeof cost === 'object' && 'cost_per_sqft' in cost) {
                const constructionCost = cost as ConstructionCost;
                if (constructionCost.is_active) {
                  const totalCost = constructionCost.cost_per_sqft * (space.floor_area || 0);
                  costs.design[structure.id][level.id][space.id][discipline] = totalCost;
                  costs.construction[structure.id][level.id][space.id][discipline] = totalCost;
                }
              }
            });
        }
      });
    });
  });

  return costs;
};

// Update the component props to use costIndex instead of cost_index
type ProposalStructuresProps = {
  costIndex: number | null;
  onAddProposal?: () => void;
};

// Update the component to use costIndex
export function ProposalStructures({ costIndex, onAddProposal }: ProposalStructuresProps) {
  const params = useParams();
  const proposalId = params?.proposalId as string;
  const store = useProposalStore();
  const structures = store.structures;
  const { trackedServices } = store;

  const [is_adding_space, setIs_adding_space] = useState(false);
  const [selected_structure, setSelected_structure] = useState<Structure | null>(null);
  const [selected_level, setSelected_level] = useState<Level | null>(null);
  const [is_editing_structure, setIs_editing_structure] = useState(false);
  const [editing_structure, setEditing_structure] = useState<Structure | null>(null);
  const [is_editing_level, setIs_editing_level] = useState(false);
  const [editing_level, setEditing_level] = useState<Level | null>(null);
  const [is_level_collapsed, setIs_level_collapsed] = useState<Record<string, boolean>>({});
  const [editing_space, setEditing_space] = useState<Space | null>(null);
  const [engineeringServicesCollapsed, setEngineeringServicesCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    structures.forEach(structure => {
      initial[structure.id] = true;
    });
    return initial;
  });

  useEffect(() => {
    setEngineeringServicesCollapsed(prev => {
      const updated = { ...prev };
      structures.forEach(structure => {
        if (!(structure.id in updated)) {
          updated[structure.id] = true;
        }
      });
      return updated;
    });
  }, [structures]);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, target_structure_id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) {
        console.error('No data received in drop event');
        return;
      }
      
      const drag_data = JSON.parse(data);
      if (drag_data.type === 'structure') {
        const new_structure = createNewStructure(`Structure ${structures.length + 1}`);
        store.addStructure(new_structure);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to add structure');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const hasJsonData = e.dataTransfer.types.includes('application/json');
    if (!hasJsonData) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleEditSpace = (space: Space) => {
    const structure = structures.find(s => s.id === space.structure_id);
    const level = structure?.levels.find(l => l.id === space.level_id);
    
    if (structure && level) {
      setSelected_structure(structure);
      setSelected_level(level);
      setEditing_space(space);
      setIs_adding_space(true);
    } else {
      console.error('Could not find structure or level for space:', space);
      toast.error('Could not find structure or level for this space');
    }
  };

  const handleStructureNameUpdate = (structure_id: string) => {
    if (!editing_structure?.name.trim()) {
      toast.error('Structure name cannot be empty');
      return;
    }

    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    const updated_structure = {
      ...structure,
      name: editing_structure.name
    };
    
    store.updateStructure(structure_id, updated_structure);
    setIs_editing_structure(false);
    setEditing_structure(null);
  };

  const handleEditStructure = (structure: Structure) => {
    setIs_editing_structure(true);
    setEditing_structure({
      ...structure,
      levels: structure.levels || []
    });
  };

  const handleAddLowerLevel = (structure_id: string) => {
    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    // Get the lowest level number from the last level in the array
    const lastLevel = structure.levels[structure.levels.length - 1];
    const newLevelNumber = lastLevel ? lastLevel.level_number - 1 : 0;

    // Create new level with a unique ID
    const levelId = crypto.randomUUID();
    const new_level = {
      ...createNewLevel(levelId, `Level ${newLevelNumber}`, newLevelNumber),
      structure_id: structure_id // Set the correct structure_id
    };

    // Always add to the end of the levels array
    const updated_structure: Structure = {
      ...structure,
      levels: [...structure.levels, new_level]
    };

    // Use updateStructure instead of setStructures to handle duplicates
    store.updateStructure(structure_id, updated_structure);
  };

  const handleAddUpperLevel = (structure_id: string) => {
    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    // Get the highest level number from the first level in the array
    const firstLevel = structure.levels[0];
    const newLevelNumber = firstLevel ? firstLevel.level_number + 1 : 0;

    // Create new level with a unique ID
    const levelId = crypto.randomUUID();
    const new_level = {
      ...createNewLevel(levelId, `Level ${newLevelNumber}`, newLevelNumber),
      structure_id: structure_id // Set the correct structure_id
    };

    // Always add to the beginning of the levels array
    const updated_structure: Structure = {
      ...structure,
      levels: [new_level, ...structure.levels]
    };

    // Use updateStructure instead of setStructures to handle duplicates
    store.updateStructure(structure_id, updated_structure);
  };

  const handleAddFiveUpperLevels = (structure_id: string) => {
    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    // Get the highest level number from the first level in the array
    const firstLevel = structure.levels[0];
    const startLevelNumber = firstLevel ? firstLevel.level_number + 1 : 0;

    // Create five new levels with incrementing numbers and unique IDs
    const new_levels = Array.from({ length: 5 }, (_, i) => {
      const levelId = crypto.randomUUID();
      return {
        ...createNewLevel(levelId, `Level ${startLevelNumber + i}`, startLevelNumber + i),
        structure_id: structure_id // Set the correct structure_id
      };
    }).reverse(); // Reverse the array so highest numbers are first

    // Always add to the beginning of the levels array
    const updated_structure: Structure = {
      ...structure,
      levels: [...new_levels, ...structure.levels]
    };

    // Use updateStructure instead of setStructures to handle duplicates
    store.updateStructure(structure_id, updated_structure);
  };

  const handleDuplicateStructure = (structure_id: string) => {
    // Use the store's duplicateStructure function which handles rates
    store.duplicateStructure(structure_id);
  };

  const handleCopyStructure = (structure_id: string) => {
    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    const copied_structure: Structure = {
      ...structure,
      id: crypto.randomUUID(),
      name: `${structure.name} (Copy)`,
      parent_id: null, // No parent since it's independent
      is_duplicate: false, // Not a duplicate
      duplicate_number: null, // No duplicate number
      duplicate_parent_id: null, // No parent
      duplicate_rate: null, // No duplicate rate for copies
      levels: structure.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID()
        }))
      }))
    };

    store.setStructures([...structures, copied_structure]);
  };

  const handleSpaceDialogClose = () => {
    setSelected_structure(null);
    setSelected_level(null);
    setIs_adding_space(false);
  };

  const handleAddSpace = (space: Omit<Space, 'id'>) => {
    if (!selected_structure || !selected_level) return;
    
    const newSpace: Space = {
      ...space,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create a new structure with only the updated level
    const updatedStructure = {
      ...selected_structure,
      levels: selected_structure.levels.map(level => {
        if (level.id === selected_level.id) {
          return {
            ...level,
            spaces: [...level.spaces, newSpace]
          };
        }
        return level;
      })
    };

    // Use updateStructure to ensure changes propagate to duplicates
    store.updateStructure(selected_structure.id, updatedStructure);
    
    setIs_adding_space(false);
    setSelected_structure(null);
    setSelected_level(null);
    setEditing_space(null);
  };

  const handleUpdateSpace = (space: Omit<Space, 'id'>) => {
    if (!editing_space) return;
    
    const updatedSpace: Space = {
        ...space,
      id: editing_space.id,
      created_at: editing_space.created_at,
      updated_at: new Date().toISOString()
    };

          const updatedStructure = {
      ...selected_structure!,
      levels: selected_structure!.levels.map(level => 
        level.id === selected_level!.id
          ? { 
                  ...level,
              spaces: level.spaces.map(s => 
                s.id === editing_space.id ? updatedSpace : s
              )
            }
          : level
      )
          };

    store.updateStructure(selected_structure!.id, updatedStructure);
    setIs_adding_space(false);
    setSelected_structure(null);
    setSelected_level(null);
    setEditing_space(null);
  };

  const handleDeleteSpace = (structure_id: string, level_id: string, space_id: string) => {
    const updated_structures = structures.map(structure => {
      if (structure.id === structure_id) {
        return {
          ...structure,
          levels: structure.levels.map(level => {
            if (level.id === level_id) {
              return {
                ...level,
                spaces: level.spaces.filter(space => space.id !== space_id)
              };
            }
            return level;
          })
        };
      }
      return structure;
    });

    store.setStructures(updated_structures);
  };

  const handleDeleteLevel = (structure_id: string, level_id: string) => {
    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    // Find the level to delete by its id
    const levelToDelete = structure.levels.find(l => l.id === level_id);
    if (!levelToDelete) return;
    
    // Create new array without the deleted level
    const levelsWithoutDeleted = structure.levels.filter(l => l.id !== level_id);

    let renumberedLevels = [...levelsWithoutDeleted];

    if (levelToDelete.level_number > 0) {
      // If deleted level was positive, decrement all levels with higher numbers
      renumberedLevels = renumberedLevels.map(level => {
        if (level.level_number > levelToDelete.level_number) {
          return { ...level, level_number: level.level_number - 1 };
        }
        return level;
      });
    } else if (levelToDelete.level_number < 0) {
      // If deleted level was negative, increment all levels with lower numbers
      renumberedLevels = renumberedLevels.map(level => {
        if (level.level_number < levelToDelete.level_number) {
          return { ...level, level_number: level.level_number + 1 };
        }
        return level;
      });
    } else {
      // If deleted level was 0:
      
      // Check if there are any negative numbers
      const hasNegativeNumbers = renumberedLevels.some(level => level.level_number < 0);
      
      if (hasNegativeNumbers) {
        // If there are negative numbers, increment them until they reach 0
        renumberedLevels = renumberedLevels.map(level => {
          if (level.level_number < 0) {
            return { ...level, level_number: level.level_number + 1 };
          }
          return level;
        });
      } else {
        // If there are no negative numbers, decrement all positive numbers by 1
        renumberedLevels = renumberedLevels.map(level => {
          if (level.level_number > 0) {
            return { ...level, level_number: level.level_number - 1 };
          }
          return level;
        });
      }
    }

    const updated_structure: Structure = {
          ...structure,
      levels: renumberedLevels
        };

    // Use updateStructure instead of setStructures to handle duplicates
    store.updateStructure(structure_id, updated_structure);
  };

  const handleDeleteStructure = (structure_id: string) => {
    store.removeStructure(structure_id);
  };

  const handleDuplicateLevelUp = (structure_id: string, level_id: string) => {
    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    const level = structure.levels.find(l => l.id === level_id);
    if (!level) return;

    // Get the number from the first level in the array and add 1
    const firstLevel = structure.levels[0];
    const newLevelNumber = firstLevel ? firstLevel.level_number + 1 : 0;
    
    // Create a new level ID first
    const newLevelId = crypto.randomUUID();
    
    // Create a new level with the same spaces but new IDs
    const newLevel = {
      ...level,
      id: newLevelId,
      name: `Level ${newLevelNumber}`,
      level_number: newLevelNumber,
      spaces: level.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID(),
        level_id: newLevelId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    };

    const updated_structures = structures.map(s => {
      if (s.id === structure_id) {
        return {
          ...s,
          levels: [newLevel, ...s.levels]
        };
      }
      return s;
    });

    store.setStructures(updated_structures);
  };

  const handleDuplicateLevelDown = (structure_id: string, level_id: string) => {
    const structure = structures.find(s => s.id === structure_id);
    if (!structure) return;

    const level = structure.levels.find(l => l.id === level_id);
    if (!level) return;

    // Get the number from the last level in the array and subtract 1
    const lastLevel = structure.levels[structure.levels.length - 1];
    const newLevelNumber = lastLevel ? lastLevel.level_number - 1 : 0;
    
    // Create a new level with the same spaces
    const newLevelId = crypto.randomUUID();
    const newLevel = {
      ...level,
      id: newLevelId,
      name: `Level ${newLevelNumber}`,
      level_number: newLevelNumber,
      spaces: level.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID(),
        level_id: newLevelId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    };

    const updated_structures = structures.map(s => {
      if (s.id === structure_id) {
        return {
          ...s,
          levels: [...s.levels, newLevel]
        };
      }
      return s;
    });

    store.setStructures(updated_structures);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateSpaceTotalCost = (space: Space): number => {
    const totalCost = space.construction_costs.Total;
    return totalCost && totalCost.is_active && typeof totalCost.cost_per_sqft === 'number'
      ? totalCost.cost_per_sqft * (space.floor_area || 0)
      : 0;
  };

  const calculateStructureTotal = (structure: Structure): number => {
    return structure.levels.reduce((total, level) => 
      total + level.spaces.reduce((levelTotal, space) => 
        levelTotal + calculateSpaceTotalCost(space), 0), 0);
  };

  const calculateStructureTotalFloorArea = (structure: Structure): number => {
    return structure.levels.reduce((total, level) => {
      return total + level.spaces.reduce((levelTotal, space) => {
        return levelTotal + (space.floor_area || 0);
      }, 0);
    }, 0);
  };

  type Discipline = 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural';

  const handleDisciplineToggle = (space: Space, discipline: Discipline) => {
    if (discipline === 'Civil' || discipline === 'Structural') return;

    const structure = structures.find(s => s.id === space.structure_id);
    if (!structure) return;

    const level = structure.levels.find(l => l.id === space.level_id);
    if (!level) return;

    const spaceIndex = level.spaces.findIndex(s => s.id === space.id);
    if (spaceIndex === -1) return;
              
    const updatedSpace = {
                ...space,
                construction_costs: {
                  ...space.construction_costs,
        [discipline]: {
          ...space.construction_costs[discipline],
          is_active: !space.construction_costs[discipline]?.is_active
                  }
                }
              };

    const updatedStructure = {
      ...structure,
      levels: structure.levels.map(l =>
        l.id === space.level_id
          ? { ...l, spaces: l.spaces.map((s, i) => i === spaceIndex ? updatedSpace : s) }
          : l
      )
    };

    store.updateStructure(space.structure_id, updatedStructure);
  };

  const handleServicesChange = (structureId: string, services: tracked_service[]) => {
    store.setTrackedServices(structureId, services);
  };

  const handleAddLevel = (level: Omit<Level, 'id'>) => {
    if (!selected_structure) return;

    const newLevel: Level = {
      ...level,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      spaces: []
    };

    const updatedStructure = {
      ...selected_structure,
      levels: [...selected_structure.levels, newLevel]
        };

    store.updateStructure(selected_structure.id, updatedStructure);
    setIs_editing_level(false);
    setSelected_structure(null);
  };

  const handleAddStructure = (structure: Omit<Structure, 'id'>) => {
    const newStructure: Structure = {
      ...structure,
      id: crypto.randomUUID(),
      levels: structure.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      }))
    };

    store.addStructure(newStructure);
    // Set the initial collapse state to true (collapsed) for the new structure
    setEngineeringServicesCollapsed(prev => ({
      ...prev,
      [newStructure.id]: true
    }));
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'structure' }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderSpace = (space: Space, structure: Structure, level: Level) => {
    // Get the Total cost from construction_costs
    const totalCost = space.construction_costs.Total;
    const totalConstructionCost = totalCost && totalCost.is_active && typeof totalCost.cost_per_sqft === 'number'
      ? totalCost.cost_per_sqft * (space.floor_area || 0)
      : 0;
    
    return (
      <div key={space.id} className="p-3 pl-12">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-primary/5 rounded-md">
            <Home className="w-4 h-4 text-primary/70" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-medium dark:text-[#E5E7EB]">{space.name}</div>
              {space.floor_area > 0 && (
                <span className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                  ({space.floor_area} sq ft)
                </span>
              )}
            </div>
            <div className="mt-1">
              <div className="text-gray-500 dark:text-[#9CA3AF] mb-1">Disciplines:</div>
              <div className="flex flex-wrap gap-2">
                {(['Mechanical', 'Plumbing', 'Electrical', 'Civil', 'Structural'] as Discipline[]).map((discipline) => {
                  const cost = space.construction_costs[discipline];
                  const isActive = cost?.is_active ?? (discipline !== 'Civil' && discipline !== 'Structural');
                  return (
                <button
                      key={discipline}
                      onClick={() => handleDisciplineToggle(space, discipline)}
                      disabled={discipline === 'Civil' || discipline === 'Structural'}
                      className={`px-2 py-1 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } ${(discipline === 'Civil' || discipline === 'Structural') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isActive ? 'Disable discipline' : 'Enable discipline'}
                    >
                      {discipline}
                </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-1 font-medium text-primary">
              Construction Cost: {formatCurrency(totalConstructionCost)}
            </div>
          </div>
          <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditSpace(space)}
                    className={`p-1.5 text-gray-500 hover:text-primary ${structure.parent_id ? 'hidden' : ''}`}
                    title="Edit space"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSpace(structure.id, level.id, space.id)}
                    className={`p-1.5 text-gray-500 hover:text-destructive ${structure.parent_id ? 'hidden' : ''}`}
                    title="Delete space"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
        </div>
      </div>
    );
  };

  const renderStructure = (structure: Structure) => {
    const totalCost = calculateStructureTotal(structure);
    
    return (
      <div key={structure.id} className={`border border-[#4DB6AC] dark:border-[#4DB6AC] rounded overflow-hidden ${
        structure.parent_id ? 'ml-12 mt-4 relative' : 
        structure.name.includes('(Copy)') ? 'mt-4' : ''
      }`}>
        <div
          className={`p-3 bg-gray-50/50 hover:bg-gray-50 flex items-start gap-3 ${
            structure.parent_id ? 'bg-gray-50' : ''
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, structure.id)}
        >
          <div className="p-1.5 bg-[#4DB6AC]/10 rounded">
            <Building2 className="w-5 h-5 text-[#4DB6AC]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              {editing_structure && editing_structure.id === structure.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editing_structure.name}
                    onChange={(e) => setEditing_structure({ ...editing_structure, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleStructureNameUpdate(structure.id);
                      } else if (e.key === 'Escape') {
                        setIs_editing_structure(false);
                      }
                    }}
                    className="flex-1 px-2 py-1 border border-[#4DB6AC] rounded focus:outline-none focus:ring-1 focus:ring-[#4DB6AC]/20 bg-white text-gray-900 dark:bg-[#374151] dark:text-[#E5E7EB]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleStructureNameUpdate(structure.id)}
                    className="p-1 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIs_editing_structure(false)}
                    className="p-1 text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">{structure.name}</div>
                  {!structure.parent_id && (
                    <button
                      type="button"
                      onClick={() => handleEditStructure(structure)}
                      className="p-1 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                      title="Edit Structure Name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="mt-1 font-medium text-[#4DB6AC]">
              Total Floor Area: <span className="font-bold">{calculateStructureTotalFloorArea(structure).toLocaleString()} sq ft</span> • Construction Cost: <span className="font-bold">{formatCurrency(totalCost)}</span>
            </div>
          </div>
          <div className="flex items-start gap-1.5 pt-0.5">
            {!structure.parent_id && (
              <>
                <button
                  type="button"
                  onClick={() => handleDuplicateStructure(structure.id)}
                  className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                  title="Duplicate Structure (Linked)"
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
                  onClick={() => handleCopyStructure(structure.id)}
                  className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                  title="Copy Structure (Independent)"
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
                    <path d="M8 2v14" />
                    <path d="M2 8h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLowerLevel(structure.id)}
                  className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                  title="Add Lower Level"
                >
                  <Layers className="w-3.5 h-3.5 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddUpperLevel(structure.id)}
                  className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                  title="Add Upper Level"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFiveUpperLevels(structure.id)}
                  className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                  title="Add 5 Upper Levels"
                >
                  <Building className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleDeleteStructure(structure.id)}
              className={`p-1.5 rounded transition-colors ${
                structure.parent_id 
                  ? 'text-gray-400 hover:text-gray-500 hover:bg-gray-50' 
                  : 'text-red-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title={structure.parent_id ? "Delete Duplicate Structure" : "Delete Structure"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!structure.parent_id && (
          <div className="border-t border-[#4DB6AC]/20">
            <div className="p-3">
              <EngineeringServicesManager
                proposalId={proposalId}
                structureId={structure.id}
                onServicesChange={(services) => handleServicesChange(structure.id, services)}
                initialTrackedServices={store.trackedServices[structure.id] || []}
                isCollapsed={engineeringServicesCollapsed[structure.id] ?? true}
                onCollapseChange={(isCollapsed) => {
                  setEngineeringServicesCollapsed(prev => ({
                    ...prev,
                    [structure.id]: isCollapsed
                  }));
                }}
              />
            </div>
          </div>
        )}

        {structure.levels.map((level) => (
          <div key={level.id} className="last:border-b-0">
            <div className="p-3 bg-gray-50/50 hover:bg-gray-50 flex items-start gap-3">
              <div className="p-1.5 bg-[#4DB6AC]/10 rounded">
                <Layers className="w-5 h-5 text-[#4DB6AC]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">Level {level.level_number}</div>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelected_structure(structure);
                    setSelected_level(level);
                      setIs_adding_space(true);
                  }}
                  className={`p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors ${structure.parent_id ? 'hidden' : ''}`}
                  title="Add Space"
                >
                  <Home className="w-3.5 h-3.5" />
                </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateLevelUp(structure.id, level.id)}
                      className={`p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors ${structure.parent_id ? 'hidden' : ''}`}
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
                      className={`p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors ${structure.parent_id ? 'hidden' : ''}`}
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
                  onClick={() => handleDeleteLevel(structure.id, level.id)}
                  className={`p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${structure.parent_id ? 'hidden' : ''}`}
                  title="Delete level"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {level.spaces && level.spaces.length > 0 && (
              <div className="bg-muted/5 divide-y divide-[#4DB6AC]/10 dark:divide-[#4DB6AC]/10">
            {level.spaces.map((space) => renderSpace(space, structure, level))}
                    </div>
              )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
            <button 
              type="button"
              draggable="true" 
              onDragStart={handleDragStart}
              className="draggable-button"
              title="Drag to add structure"
            >
              <Building2 className="w-4 h-4" />
              <span>Add Structure</span>
            </button>
        </div>
      </div>

      <div 
        className={`min-h-[200px] ${is_adding_space ? 'border-2 border-dashed border-[#4DB6AC]/50 rounded' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {structures.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-400 border-2 border-dashed border-gray-200 rounded">
            <div className="text-center">
              <Building2 className="w-7 h-7 mx-auto mb-2 text-gray-400" />
              <div>No structures added yet</div>
              <div className="text-sm text-gray-400 mt-1">Add a structure to get started</div>
            </div>
          </div>
        ) : (
          <div>
            {structures.map((structure) => renderStructure(structure))}
          </div>
        )}
      </div>

      {is_adding_space && selected_structure && selected_level && (
        <SpaceDialog
          open={is_adding_space}
          onOpenChange={setIs_adding_space}
          onSave={editing_space ? handleUpdateSpace : handleAddSpace}
          costIndex={costIndex}
          initialSpace={editing_space || undefined}
          structureId={selected_structure.id}
          levelId={selected_level.id}
        />
      )}
    </div>
  );
} 