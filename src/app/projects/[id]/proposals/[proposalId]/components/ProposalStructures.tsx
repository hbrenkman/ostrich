"use client";

import { useState } from 'react';
import { Building2, ChevronDown, Layers, Building, Pencil, Save, Trash2, Plus, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SpaceDialog } from './space-dialog';
import { toast } from 'sonner';
import { Structure, Level, Space, EngineeringService, TrackedService } from '../types';
import { EngineeringServicesManager } from './EngineeringServicesManager';

interface ProposalStructuresProps {
  structures: Structure[];
  costIndex: number | null;
  isLoadingStandardServices: boolean;
  dbEngineeringServices: EngineeringService[];
  onStructuresChange: (structures: Structure[]) => void;
  onConstructionCostUpdate: (structureId: string, levelId: string, spaceId: string, feeId: string, updates: Partial<{ totalConstructionCost: number; costPerSqft: number; isActive: boolean }>, feePhase: 'design' | 'construction') => void;
  onAddSpace: (space: Omit<Space, 'id'>) => void;
  proposalId: string;
  onServicesChange: (structureId: string, services: TrackedService[]) => void;
  trackedServices: Record<string, TrackedService[]>;
}

export function ProposalStructures({
  structures,
  costIndex,
  isLoadingStandardServices,
  dbEngineeringServices,
  onStructuresChange,
  onConstructionCostUpdate,
  onAddSpace,
  proposalId,
  onServicesChange,
  trackedServices
}: ProposalStructuresProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [editingStructureName, setEditingStructureName] = useState('');
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [collapsedDuplicates, setCollapsedDuplicates] = useState<Set<string>>(new Set());
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStructureId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) {
        console.error('No data received in drop event');
        return;
      }
      
      const dragData = JSON.parse(data);
      if (dragData.type === 'structure') {
        const newStructure: Structure = {
          id: dragData.id,
          name: `Structure ${structures.length + 1}`,
          constructionType: '',
          floorArea: '0',
          description: '',
          spaceType: '',
          discipline: '',
          hvacSystem: '',
          levels: [{
            id: crypto.randomUUID(),
            name: 'Level 0',
            floorArea: '0',
            description: '',
            spaceType: '',
            discipline: '',
            hvacSystem: '',
            spaces: []
          }]
        };
        
        onStructuresChange([...structures, newStructure]);
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

  const handleStructureNameUpdate = (structureId: string) => {
    if (!editingStructureName.trim()) {
      toast.error('Structure name cannot be empty');
      return;
    }

    const updatedStructures = structures.map(structure => 
      structure.id === structureId 
        ? { ...structure, name: editingStructureName }
        : structure
    );
    
    onStructuresChange(updatedStructures);
    setEditingStructureId(null);
    setEditingStructureName('');
  };

  const handleAddLowerLevel = (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    // Find the lowest level number
    const lowestLevel = structure.levels.reduce((lowest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? lowest : Math.min(lowest, levelNum);
    }, 0);

    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${lowestLevel - 1}`,
      floorArea: '0',
      description: '',
      spaceType: '',
      discipline: '',
      hvacSystem: '',
      spaces: []
    };

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum;
    });

    const updatedStructures = structures.map(s =>
      s.id === structureId
        ? { ...s, levels: updatedLevels }
        : s
    );

    onStructuresChange(updatedStructures);
  };

  const handleAddUpperLevel = (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    // Find the highest level number
    const highestLevel = structure.levels.reduce((highest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
    }, -1);

    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${highestLevel + 1}`,
      floorArea: '0',
      description: '',
      spaceType: '',
      discipline: '',
      hvacSystem: '',
      spaces: []
    };

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum;
    });

    const updatedStructures = structures.map(s =>
      s.id === structureId
        ? { ...s, levels: updatedLevels }
        : s
    );

    onStructuresChange(updatedStructures);
  };

  const handleAddFiveUpperLevels = (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    // Find the highest level number
    const highestLevel = structure.levels.reduce((highest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
    }, -1);

    // Create new levels for parent
    const newLevels: Level[] = Array.from({ length: 5 }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Level ${highestLevel + index + 1}`,
      floorArea: '0',
      description: '',
      spaceType: '',
      discipline: '',
      hvacSystem: '',
      spaces: []
    }));

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...structure.levels, ...newLevels].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum;
    });

    const updatedStructures = structures.map(s =>
      s.id === structureId
        ? { ...s, levels: updatedLevels }
        : s
    );

    onStructuresChange(updatedStructures);
  };

  const handleDuplicateStructure = (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    const duplicateStructure: Structure = {
      ...structure,
      id: crypto.randomUUID(),
      parentId: structureId,
      name: `${structure.name} (Duplicate)`,
      levels: structure.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID(),
          structureId: crypto.randomUUID(),
          levelId: crypto.randomUUID()
        }))
      }))
    };

    onStructuresChange([...structures, duplicateStructure]);
  };

  const handleCopyStructure = (structureId: string) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    const copiedStructure: Structure = {
      ...structure,
      id: crypto.randomUUID(),
      name: `${structure.name} (Copy)`,
      levels: structure.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID(),
          structureId: crypto.randomUUID(),
          levelId: crypto.randomUUID()
        }))
      }))
    };

    onStructuresChange([...structures, copiedStructure]);
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setIsSpaceDialogOpen(true);
  };

  const handleSpaceDialogClose = () => {
    setEditingSpace(null);
    setIsSpaceDialogOpen(false);
    setSelectedStructureId(null);
    setSelectedLevelId(null);
  };

  const handleAddSpace = (space: Omit<Space, 'id'>) => {
    if (!selectedStructureId || !selectedLevelId) {
      console.error('No structure or level selected');
      return;
    }

    if (onAddSpace) {
      onAddSpace({
        ...space,
        structureId: selectedStructureId,
        levelId: selectedLevelId
      });
    }
    setIsSpaceDialogOpen(false);
    setEditingSpace(null);
    setSelectedStructureId(null);
    setSelectedLevelId(null);
  };

  const handleDeleteSpace = (structureId: string, levelId: string, spaceId: string) => {
    const updatedStructures = structures.map(structure => {
      if (structure.id === structureId) {
        return {
          ...structure,
          levels: structure.levels.map(level => {
            if (level.id === levelId) {
              return {
                ...level,
                spaces: level.spaces.filter(space => space.id !== spaceId)
              };
            }
            return level;
          })
        };
      }
      return structure;
    });

    onStructuresChange(updatedStructures);
  };

  const handleDeleteLevel = (structureId: string, levelId: string) => {
    // First, delete all spaces in the level
    const structure = structures.find(s => s.id === structureId);
    if (structure) {
      const level = structure.levels.find(l => l.id === levelId);
      if (level) {
        // Delete each space in the level
        level.spaces.forEach(space => {
          handleDeleteSpace(structureId, levelId, space.id);
        });
      }
    }

    // Then delete the level itself
    const updatedStructures = structures.map(structure => {
      if (structure.id === structureId) {
        return {
          ...structure,
          levels: structure.levels.filter(level => level.id !== levelId)
        };
      }
      return structure;
    });

    onStructuresChange(updatedStructures);
  };

  const handleDeleteStructure = (structureId: string) => {
    // First, delete all levels and their spaces
    const structure = structures.find(s => s.id === structureId);
    if (structure) {
      // Delete each level (which will cascade to delete spaces)
      structure.levels.forEach(level => {
        handleDeleteLevel(structureId, level.id);
      });
    }

    // Then delete the structure itself
    const updatedStructures = structures.filter(structure => structure.id !== structureId);
    onStructuresChange(updatedStructures);
  };

  const handleDuplicateLevelUp = (structureId: string, levelId: string) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    const levelIndex = structure.levels.findIndex(l => l.id === levelId);
    if (levelIndex === -1) return;

    const level = structure.levels[levelIndex];
    const duplicateLevel: Level = {
      ...level,
      id: crypto.randomUUID(),
      name: `${level.name} (Duplicate)`,
      spaces: level.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID(),
        structureId,
        levelId: crypto.randomUUID()
      }))
    };

    const updatedStructures = structures.map(s => {
      if (s.id === structureId) {
        const newLevels = [...s.levels];
        newLevels.splice(levelIndex, 0, duplicateLevel);
        return { ...s, levels: newLevels };
      }
      return s;
    });

    onStructuresChange(updatedStructures);
  };

  const handleDuplicateLevelDown = (structureId: string, levelId: string) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    const levelIndex = structure.levels.findIndex(l => l.id === levelId);
    if (levelIndex === -1) return;

    const level = structure.levels[levelIndex];
    const duplicateLevel: Level = {
      ...level,
      id: crypto.randomUUID(),
      name: `${level.name} (Duplicate)`,
      spaces: level.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID(),
        structureId,
        levelId: crypto.randomUUID()
      }))
    };

    const updatedStructures = structures.map(s => {
      if (s.id === structureId) {
        const newLevels = [...s.levels];
        newLevels.splice(levelIndex + 1, 0, duplicateLevel);
        return { ...s, levels: newLevels };
      }
      return s;
    });

    onStructuresChange(updatedStructures);
  };

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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateTotalConstructionCost = (structure: Structure): number => {
    return structure.levels.reduce((total, level) => {
      return total + level.spaces.reduce((levelTotal, space) => {
        return levelTotal + space.totalConstructionCosts.reduce((spaceTotal, cost) => {
          return spaceTotal + (cost.isActive ? cost.totalConstructionCost : 0);
        }, 0);
      }, 0);
    }, 0);
  };

  const handleDisciplineFeeToggle = (structureId: string, levelId: string, spaceId: string, feeId: string, isActive: boolean) => {
    console.log('ProposalStructures: handleDisciplineFeeToggle called with:', {
      structureId,
      levelId,
      spaceId,
      feeId,
      isActive
    });

    const updatedStructures = structures.map(structure => {
      if (structure.id !== structureId) return structure;
      
      return {
        ...structure,
        levels: structure.levels.map(level => {
          if (level.id !== levelId) return level;
          
          return {
            ...level,
            spaces: level.spaces.map(space => {
              if (space.id !== spaceId) return space;
              
              const updatedSpace = {
                ...space,
                totalConstructionCosts: space.totalConstructionCosts.map(fee => {
                  if (fee.id !== feeId) return fee;
                  console.log('ProposalStructures: Updating fee state:', {
                    feeId,
                    oldState: fee.isActive,
                    newState: isActive,
                    spaceName: space.name,
                    discipline: fee.discipline
                  });
                  return { ...fee, isActive };
                })
              };
              console.log('ProposalStructures: Updated space fees:', {
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

    console.log('ProposalStructures: New structures state after toggle:', {
      structureId,
      levelId,
      spaceId,
      feeId,
      isActive,
      updatedStructures
    });

    onStructuresChange(updatedStructures);
  };

  const handleServicesChange = (structureId: string, services: TrackedService[]) => {
    onServicesChange(structureId, services);
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E5E7EB]">Structures</h2>
        <div className="flex items-center gap-2">
          {isLoadingStandardServices ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-gray-500"></div>
              <span>Loading services...</span>
            </div>
          ) : (
            <div
              draggable
              onDragStart={(e) => {
                const dragData = {
                  type: 'structure',
                  id: crypto.randomUUID()
                };
                e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                e.dataTransfer.effectAllowed = 'copy';
                setIsDragging(true);
              }}
              onDragEnd={() => setIsDragging(false)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[#4DB6AC] hover:text-[#4DB6AC]/90 bg-[#4DB6AC]/10 hover:bg-[#4DB6AC]/20 rounded transition-colors cursor-move ${isDragging ? 'opacity-50' : ''}`}
              title="Drag to add structure"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Add Structure</span>
            </div>
          )}
        </div>
      </div>

      <div 
        className={`space-y-2 min-h-[200px] ${isDragging ? 'border-2 border-dashed border-[#4DB6AC]/50 rounded' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isLoadingStandardServices ? (
          <div className="flex items-center justify-center h-[200px] text-gray-400 border-2 border-dashed border-gray-200 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-400 mx-auto mb-2"></div>
              <p>Loading services...</p>
            </div>
          </div>
        ) : structures.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-400 border-2 border-dashed border-gray-200 rounded">
            <div className="text-center">
              <Building2 className="w-7 h-7 mx-auto mb-2 text-gray-400" />
              <p>Drag and drop a structure here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {structures.map((structure) => (
              <div 
                key={structure.id} 
                className={`border border-[#4DB6AC] dark:border-[#4DB6AC] rounded overflow-hidden ${
                  structure.parentId ? 'ml-12 relative' : ''
                }`}
              >
                <div
                  className={`p-3 bg-gray-50/50 hover:bg-gray-50 cursor-pointer flex items-start gap-3 ${
                    structure.parentId ? 'bg-gray-50' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, structure.id)}
                >
                  <div className="p-1.5 bg-[#4DB6AC]/10 rounded">
                    <Building2 className="w-5 h-5 text-[#4DB6AC]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      {structure.parentId && (
                        <button
                          type="button"
                          onClick={() => toggleDuplicateCollapse(structure.id)}
                          className="p-1 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                          title={collapsedDuplicates.has(structure.id) ? "Expand" : "Collapse"}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                            collapsedDuplicates.has(structure.id) ? 'rotate-180' : ''
                          }`} />
                        </button>
                      )}
                      {editingStructureId === structure.id ? (
                        <div className="flex items-center gap-1.5">
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
                            onClick={() => setEditingStructureId(null)}
                            className="p-1 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">{structure.name}</div>
                          {!structure.parentId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStructureId(structure.id);
                                setEditingStructureName(structure.name);
                              }}
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
                      Construction Cost: {formatCurrency(calculateTotalConstructionCost(structure))}
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 pt-0.5">
                    {!structure.parentId && (
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
                        structure.parentId 
                          ? 'text-gray-400 hover:text-gray-500 hover:bg-gray-50' 
                          : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={structure.parentId ? "Delete Duplicate Structure" : "Delete Structure"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!collapsedDuplicates.has(structure.id) && (
                  <div className="border-t border-[#4DB6AC] dark:border-[#4DB6AC]">
                    <div className="p-4 bg-gray-50/50">
                      <EngineeringServicesManager
                        proposalId={proposalId}
                        structureId={structure.id}
                        onServicesChange={(services) => handleServicesChange(structure.id, services)}
                        initialTrackedServices={trackedServices[structure.id] || []}
                      />
                    </div>
                    {structure.levels.map((level) => (
                      <div key={level.id} className="border-b border-[#4DB6AC] dark:border-[#4DB6AC] last:border-b-0">
                        <div className="p-3 bg-gray-50/50 hover:bg-gray-50 flex items-start gap-3">
                          <div className="p-1.5 bg-[#4DB6AC]/10 rounded">
                            <Layers className="w-5 h-5 text-[#4DB6AC]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">{level.name}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStructureId(structure.id);
                                setSelectedLevelId(level.id);
                                setTimeout(() => {
                                  setIsSpaceDialogOpen(true);
                                }, 0);
                              }}
                              className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
                              title="Add Space"
                            >
                              <Home className="w-3.5 h-3.5" />
                            </button>
                            {!structure.parentId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateLevelUp(structure.id, level.id)}
                                  className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
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
                                  className="p-1.5 text-[#4DB6AC] hover:text-[#4DB6AC]/90 hover:bg-[#4DB6AC]/10 rounded transition-colors"
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
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteLevel(structure.id, level.id)}
                              className={`p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${structure.parentId ? 'hidden' : ''}`}
                              title="Delete level"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {level.spaces && level.spaces.length > 0 && (
                          <div className="bg-muted/5 divide-y divide-[#4DB6AC]/10 dark:divide-[#4DB6AC]/10">
                            {level.spaces.map((space) => (
                              <div
                                key={space.id}
                                className="p-3 pl-12"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-1.5 bg-primary/5 rounded-md">
                                    <Home className="w-4 h-4 text-primary/70" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium dark:text-[#E5E7EB]">{space.name}</div>
                                      {space.floorArea > 0 && (
                                        <span className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                          ({space.floorArea} sq ft)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                      {space.description}
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
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditSpace(space)}
                                      className="p-1.5 text-gray-500 hover:text-primary"
                                      title="Edit space"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
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
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SpaceDialog
        open={isSpaceDialogOpen}
        onOpenChange={handleSpaceDialogClose}
        onSave={handleAddSpace}
        initialSpace={editingSpace}
        structureId={selectedStructureId || ''}
        levelId={selectedLevelId || ''}
        costIndex={costIndex}
        onDisciplineFeeToggle={handleDisciplineFeeToggle}
      />
    </div>
  );
} 