"use client";

import { FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Building2, Layers, Home, ChevronDown, ChevronRight, Check, RotateCcw, ChevronUp, ChevronDown as ChevronDownIcon, Copy, Printer, X, Plus, Trash2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { formatCurrency as formatCurrencyUtil } from '@/lib/formatters';
import type { tracked_service as TrackedService } from '@/types/proposal/service';
import type { 
  Structure,
  Level,
  Space,
  ConstructionCost,
  base_fee as Fee,
  FeeScale,
  DisciplineEngineeringFees,
  EngineeringFee,
  ConstructionCostsForSpace
} from '@/types/proposal/base';
import type { ProjectSummary, TrackedServices } from '@/types/proposal/shared';
import { useProposalStore } from "@/store/proposal";
import type { ProposalState } from '@/store/proposal';

// Define the fee scale result type
type FeeScaleResult = {
  type: 'success';
  adjusted_rate: number;
} | {
  type: 'error';
};

interface ManualFeesState {
  [key: string]: boolean;
}

interface EditingFeesState {
  [key: string]: EditingFee;
}

type TrackedServicesMap = Record<string, TrackedService[]>;

// Update EditingFee interface
interface EditingFee {
  original: number;
  current: number;
  is_manual: boolean;
  original_fee: ConstructionCost | EngineeringFee;
}

// Define service_fee_calculation type
type ServiceFeeCalculation = {
  calculated_fee: number;
  custom_fee?: number;
  final_fee: number;
};

// Update FixedFeesProps to only include what's needed from props
interface FixedFeesProps {
  cost_index: number | null;
}

export function FixedFees({ cost_index }: { cost_index?: number }) {
  const store = useProposalStore();
  const structures = store.structures;
  const trackedServices = store.trackedServices;
  const { updateStructure, setTrackedServices } = store;

  console.log('FixedFees: Component rendered with props:', {
    structuresCount: structures?.length,
    structures: structures?.map(s => ({
      id: s.id,
      name: s.name,
      levels: s.levels?.map(l => ({
        id: l.id,
        name: l.name,
        spacesCount: l.spaces?.length,
        spaces: l.spaces?.map(sp => ({
          id: sp.id,
          name: sp.name,
          floor_area: sp.floor_area,
          feesCount: sp.discipline_engineering_fees?.length,
          fees: sp.discipline_engineering_fees?.map(f => ({
            discipline: f.discipline,
            engineering_fees: f.engineering_fees?.length
          }))
        }))
      }))
    })),
    tracked_services: trackedServices
  });

  const [is_summary_open, setIsSummaryOpen] = useState(true);
  const [fee_scale, setFeeScale] = useState<FeeScale[]>([]);
  const is_initializing = useRef(true);
  const [manual_fees, setManualFees] = useState<ManualFeesState>({});
  const [editing_fees, setEditingFees] = useState<EditingFeesState>({});
  const [service_input_values, setServiceInputValues] = useState<Record<string, string>>({});

  // Helper function to check if a fee is a construction cost
  const isConstructionCost = useCallback((fee: ConstructionCost | EngineeringFee): fee is ConstructionCost => {
    return 'cost_per_sqft' in fee;
  }, []);

  // Helper function to check if a fee is an engineering fee
  const isEngineeringFee = useCallback((fee: ConstructionCost | EngineeringFee): fee is EngineeringFee => {
    return 'fee_amount' in fee;
  }, []);

  // Update the component to use DisciplineEngineeringFees
  const getTotalConstructionCostForDiscipline = useCallback((structure: Structure, discipline: string): number => {
    return structure.levels.reduce((total, level) => {
      return total + level.spaces.reduce((spaceTotal, space) => {
        const disciplineCost = space.construction_costs[discipline as keyof ConstructionCostsForSpace];
        if (!disciplineCost) return spaceTotal;
        return spaceTotal + (disciplineCost.is_active ? disciplineCost.cost_per_sqft * space.floor_area : 0);
      }, 0);
    }, 0);
  }, []);

  // Update the component to use EngineeringFee
  const getTotalDesignFeeForDiscipline = useCallback((structure: Structure, discipline: string): number => {
    return structure.levels.reduce((total, level) => {
      return total + level.spaces.reduce((spaceTotal, space) => {
        const disciplineFees = space.discipline_engineering_fees.find(
          (f) => f.discipline === discipline && f.is_active
        );
        if (!disciplineFees) return spaceTotal;

        return spaceTotal + disciplineFees.engineering_fees.reduce((feeTotal, fee) => {
          return feeTotal + (fee.is_active ? fee.fee_amount : 0);
        }, 0);
      }, 0);
    }, 0);
  }, []);

  // Update handleFeeUpdate to use updateStructure
  const handleFeeUpdate = useCallback((structure: Structure, discipline: string, fee: EngineeringFee | ConstructionCost) => {
    console.log('FixedFees: handleFeeUpdate called:', {
      structureId: structure.id,
      discipline,
      fee
    });

    // Create a deep copy of the structure to update
    const updatedStructure = {
      ...structure,
      levels: structure.levels.map(level => ({
        ...level,
        spaces: level.spaces.map(space => {
          if (isConstructionCost(fee)) {
            // Update construction cost
            return {
              ...space,
              construction_costs: {
                ...space.construction_costs,
                [discipline]: {
                  ...space.construction_costs[discipline as keyof ConstructionCostsForSpace],
                  ...fee
                }
              }
            };
          } else {
            // Update engineering fee
            return {
              ...space,
              discipline_engineering_fees: space.discipline_engineering_fees.map(fees => {
                if (fees.discipline !== discipline) return fees;
                return {
                  ...fees,
                  engineering_fees: fees.engineering_fees.map(f => 
                    f.id === fee.id ? { ...f, ...fee } : f
                  )
                };
              })
            };
          }
        })
      }))
    };

    // Use updateStructure instead of setStructures
    updateStructure(structure.id, updatedStructure);
  }, [updateStructure]); // Only depend on updateStructure

  // Then declare handleFeeChange which uses handleFeeUpdate
  const handleFeeChange = useCallback((structureId: string, levelId: string, spaceId: string, feeId: string, discipline: string, value: string) => {
    console.log('FixedFees: handleFeeChange called:', {
      structureId,
      levelId,
      spaceId,
      feeId,
      discipline,
      value
    });

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const structure = structures.find(s => s.id === structureId);
    if (!structure) {
      console.log('FixedFees: Structure not found:', structureId);
      return;
    }

    const level = structure.levels.find(l => l.id === levelId);
    if (!level) {
      console.log('FixedFees: Level not found:', levelId);
      return;
    }

    const space = level.spaces.find(s => s.id === spaceId);
    if (!space) {
      console.log('FixedFees: Space not found:', spaceId);
      return;
    }

    // Check if this is a construction cost
    const disciplineCost = space.construction_costs[discipline as keyof ConstructionCostsForSpace];
    if (disciplineCost && disciplineCost.id === feeId) {
      handleFeeUpdate(structure, discipline, {
        ...disciplineCost,
        cost_per_sqft: numValue
      });
      return;
    }

    // Check if this is an engineering fee
    const disciplineFees = space.discipline_engineering_fees.find(f => f.discipline === discipline);
    if (!disciplineFees) {
      console.log('FixedFees: Discipline fees not found:', discipline);
      return;
    }

    const fee = disciplineFees.engineering_fees.find(f => f.id === feeId);
    if (!fee) {
      console.log('FixedFees: Fee not found:', feeId);
      return;
    }

    handleFeeUpdate(structure, discipline, {
      ...fee,
      fee_amount: numValue
    });
  }, [structures, handleFeeUpdate]);

  // Update handleDisciplineFeeToggle to use updateStructure
  const handleDisciplineFeeToggle = useCallback((structure: Structure, discipline: string, isActive: boolean) => {
    console.log('FixedFees: handleDisciplineFeeToggle called:', {
      structureId: structure.id,
      discipline,
      isActive
    });

    // Create a deep copy of the structure to update
    const updatedStructure = {
      ...structure,
      levels: structure.levels.map(level => ({
        ...level,
        spaces: level.spaces.map(space => {
          // Update discipline engineering fees
          const updatedDisciplineFees = space.discipline_engineering_fees.map(df => {
            if (df.discipline !== discipline) return df;
            return {
              ...df,
              is_active: isActive,
              engineering_fees: df.engineering_fees.map(fee => ({
                ...fee,
                is_active: isActive
              }))
            };
          });

          // Update construction costs
          const updatedConstructionCosts = {
            ...space.construction_costs,
            [discipline]: space.construction_costs[discipline as keyof ConstructionCostsForSpace] ? {
              ...space.construction_costs[discipline as keyof ConstructionCostsForSpace],
              is_active: isActive
            } : undefined
          };

          return {
            ...space,
            discipline_engineering_fees: updatedDisciplineFees,
            construction_costs: updatedConstructionCosts
          };
        })
      }))
    };

    // Use updateStructure instead of setStructures
    updateStructure(structure.id, updatedStructure);
  }, [updateStructure]); // Only depend on updateStructure

  // Update the useEffect for fee scales to only run once
  useEffect(() => {
    const fetchFeeScales = async () => {
      try {
        const response = await fetch('/api/design-fee-scale');
        if (!response.ok) {
          throw new Error('Failed to fetch fee scale data');
        }
        const feeScales: FeeScale[] = await response.json();
        setFeeScale(feeScales);
        is_initializing.current = false;
      } catch (error) {
        console.error('Error fetching fee scales:', error);
      }
    };

    fetchFeeScales();
  }, []); // Empty dependency array means this runs once on mount

  // Add logging to renderStructure
  const renderStructure = (structure: Structure) => {
    console.log('FixedFees: Rendering structure with summary state:', {
      id: structure.id,
      name: structure.name,
      is_summary_open,
      levelsCount: structure.levels?.length
    });

    if (!structure.levels?.length) {
      console.log('FixedFees: Structure has no levels:', structure.id);
      return null;
    }

    return (
      <div key={structure.id} className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{structure.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('FixedFees: Toggling structure visibility:', {
                structureId: structure.id,
                currentState: is_summary_open,
                levelsCount: structure.levels?.length
              });
              setIsSummaryOpen(!is_summary_open);
            }}
          >
            {is_summary_open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        {is_summary_open && structure.levels && (
          <div className="pl-4 space-y-4">
            {structure.levels.map(level => {
              console.log('FixedFees: Attempting to render level:', {
                structureId: structure.id,
                levelId: level.id,
                spacesCount: level.spaces?.length
              });
              return renderLevel(structure, level);
            })}
          </div>
        )}
      </div>
    );
  };

  // Add logging to renderLevel
  const renderLevel = (structure: Structure, level: Level) => {
    console.log('FixedFees: Rendering level:', {
      structureId: structure.id,
      levelId: level.id,
      name: level.name,
      spacesCount: level.spaces?.length,
      spaces: level.spaces?.map(s => ({
        id: s.id,
        name: s.name,
        feesCount: s.discipline_engineering_fees?.length
      }))
    });

    if (!level.spaces?.length) {
      console.log('FixedFees: Level has no spaces:', {
        structureId: structure.id,
        levelId: level.id
      });
      return null;
    }

    return (
      <div key={level.id} className="mb-4">
        <h4 className="text-md font-medium mb-2">{level.name}</h4>
        <div className="pl-4 space-y-4">
          {level.spaces.map(space => {
            console.log('FixedFees: Attempting to render space:', {
              structureId: structure.id,
              levelId: level.id,
              spaceId: space.id,
              name: space.name,
              feesCount: space.discipline_engineering_fees?.length
            });
            return renderSpace(structure, level, space);
          })}
        </div>
      </div>
    );
  };

  const renderSpace = (structure: Structure, level: Level, space: Space) => {
    console.log('FixedFees: Rendering space:', {
      structureId: structure.id,
      levelId: level.id,
      spaceId: space.id,
      name: space.name,
      
    });

    return (
      <div key={space.id} className="mb-4">
        <h5 className="text-sm font-medium mb-2">{space.name}</h5>
        <div className="pl-4 space-y-4">
          {space.discipline_engineering_fees.map(fees => renderDisciplineFees(structure, level, space, fees))}
        </div>
      </div>
    );
  };

  const renderDisciplineFees = (structure: Structure, level: Level, space: Space, disciplineFees: DisciplineEngineeringFees) => {
    const disciplineCost = space.construction_costs[disciplineFees.discipline as keyof ConstructionCostsForSpace];
    
    return (
      <div key={disciplineFees.discipline} className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h6 className="text-sm font-medium">{disciplineFees.discipline}</h6>
          <Switch
            checked={disciplineFees.is_active && (!disciplineCost || disciplineCost.is_active)}
            onCheckedChange={(checked) => handleDisciplineFeeToggle(structure, disciplineFees.discipline, checked)}
          />
        </div>
        {(disciplineFees.is_active || (disciplineCost && disciplineCost.is_active)) && (
          <div className="pl-4 space-y-2">
            {disciplineFees.engineering_fees.map(engineeringFee => (
              <div key={engineeringFee.id} className="flex items-center justify-between">
                <span className="text-sm">{engineeringFee.name}</span>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={engineeringFee.fee_amount}
                    onChange={(e) => handleFeeChange(structure.id, level.id, space.id, engineeringFee.id, disciplineFees.discipline, e.target.value)}
                    className="w-24"
                  />
                  <Switch
                    checked={engineeringFee.is_active}
                    onCheckedChange={(checked) => handleFeeUpdate(structure, disciplineFees.discipline, { ...engineeringFee, is_active: checked })}
                  />
                </div>
              </div>
            ))}
            
            {disciplineCost && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Construction Cost</span>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={disciplineCost.cost_per_sqft}
                    onChange={(e) => handleFeeChange(structure.id, level.id, space.id, disciplineCost.id, disciplineFees.discipline, e.target.value)}
                    className="w-24"
                  />
                  <Switch
                    checked={disciplineCost.is_active}
                    onCheckedChange={(checked) => handleFeeUpdate(structure, disciplineFees.discipline, { ...disciplineCost, is_active: checked })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Update calculateEngineeringFees to use updateStructure
  async function calculateEngineeringFees(structure: Structure) {
    try {
      // Fetch fee scale data
      const response = await fetch('/api/design-fee-scale');
      if (!response.ok) {
        throw new Error('Failed to fetch fee scale data');
      }
      const feeScales: FeeScale[] = await response.json();

      // Sort fee scales by construction cost to ensure we find the correct bracket
      const sortedFeeScales = [...feeScales].sort((a, b) => a.construction_cost - b.construction_cost);

      // Find the appropriate fee scale based on the structure's total construction cost
      const appropriateFeeScale = sortedFeeScales.find((scale, index) => {
        const nextScaleInRange = sortedFeeScales[index + 1];
        if (!nextScaleInRange) return true; // This is the highest bracket
        return structure.total_construction_cost >= scale.construction_cost && 
               structure.total_construction_cost < nextScaleInRange.construction_cost;
      }) || sortedFeeScales[sortedFeeScales.length - 1]; // Use highest bracket if no match found

      if (!appropriateFeeScale) {
        throw new Error('No appropriate fee scale found');
      }

      // Log the found fee scale for debugging
      console.log('Found appropriate fee scale:', {
        structureCost: structure.total_construction_cost,
        feeScale: appropriateFeeScale
      });

      // Update the structure's fee_scale parameter using updateStructure
      updateStructure(structure.id, {
        ...structure,
        fee_scale: appropriateFeeScale
      });

      return appropriateFeeScale;
    } catch (error) {
      console.error('Error calculating engineering fees:', error);
      throw error;
    }
  }

  return (
    <div className="space-y-4">
      {structures.map(structure => renderStructure(structure))}
    </div>
  );
}