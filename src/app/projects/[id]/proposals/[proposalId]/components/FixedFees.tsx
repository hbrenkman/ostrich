import { FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Building2, Layers, Home, ChevronDown, ChevronRight, Check, RotateCcw, ChevronUp, ChevronDown as ChevronDownIcon, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrackedService, FeeScale } from '../types';

interface DesignFeeScale {
  id: number;
  construction_cost: number;
  prime_consultant_rate: number;
  fraction_of_prime_rate_mechanical: number;
  fraction_of_prime_rate_plumbing: number;
  fraction_of_prime_rate_electrical: number;
  fraction_of_prime_rate_structural: number;
}

interface FeeItem {
  id: string;
  name: string;
  description: string;
  default_min_value: number;
  isActive: boolean;
  discipline?: string;
  parentDiscipline?: string;
  type: 'rescheck' | 'nested' | 'multi' | 'discipline' | 'additional_service';
  phase: 'design' | 'construction';
  service_name?: string;
  estimated_fee?: string | null;
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
  totalConstructionCosts: Array<{
    id: string;
    discipline: string;
    totalConstructionCost: number;
    isActive: boolean;
    costPerSqft: number;
    designFee?: number;
    constructionFee?: number;
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

interface Fee {
  id: string;
  discipline: string;
  costPerSqft: number;
  totalConstructionCost: number;
  isActive: boolean;
  designPercentage?: number;
  designFee?: number;
  constructionFee?: number;
}

interface Structure {
  id: string;
  name: string;
  constructionType: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  levels: Level[];
  parentId?: string;
  designFeeRate?: number;
  constructionSupportEnabled?: boolean;
  designPercentage?: number;
}

interface EngineeringStandardService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  isIncludedInFee: boolean;
  phase: 'design' | 'construction';
  min_fee: number | null;
  rate: number | null;
}

interface FeeCalculationProps {
  structures: Structure[];
  phase: 'design' | 'construction';
  onFeeUpdate: (structureId: string, levelId: string, spaceId: string, feeId: string, updates: Partial<Fee>, phase: 'design' | 'construction') => void;
  duplicateStructureRates: Array<{ id: number; rate: number }>;
  trackedServices?: TrackedService[];
  onServiceFeeUpdate?: (serviceId: string, discipline: string, fee: number, phase: 'design' | 'construction' | null) => void;
  onDisciplineFeeToggle?: (structureId: string, levelId: string, spaceId: string, feeId: string, isActive: boolean) => void;
  constructionCosts: Record<string, Record<string, number>>;
}

interface ProjectSummary {
  designTotals: Record<string, number>;
  constructionTotals: Record<string, number>;
  grandTotals: Record<string, number>;
  projectTotal: number;
}

// Fee Calculation Types
interface FeeCalculationResult {
  fee: number;
  rate?: number;
  isCustom?: boolean;
}

interface ServiceFeeCalculation {
  calculatedFee: number;
  customFee?: number;
  displayFee: number;
  isCustom: boolean;
}

export default function FixedFees({ 
  structures, 
  phase, 
  onFeeUpdate, 
  duplicateStructureRates,
  trackedServices = [],
  onServiceFeeUpdate,
  onDisciplineFeeToggle,
  constructionCosts
}: FeeCalculationProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [feeScale, setFeeScale] = useState<FeeScale[]>([]);
  const isInitializing = useRef(true);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isInitializing.current) {
      const timer = setTimeout(() => {
        isInitializing.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [structures]);

  useEffect(() => {
    const fetchFeeScale = async () => {
      try {
        const response = await fetch('/api/design-fee-scale');
        if (!response.ok) {
          console.error('Failed to fetch design fee scale:', response.status, response.statusText);
          throw new Error('Failed to fetch design fee scale');
        }
        const data = await response.json();
        if (!data || data.length === 0) {
          console.warn('No design fee scale data received from API');
        }
        setFeeScale(data);
      } catch (error) {
        console.error('Error fetching design fee scale:', error);
      }
    };

    fetchFeeScale();
  }, []);

  const DISCIPLINES = useMemo(() => [
    'Civil',
    'Electrical',
    'Mechanical',
    'Plumbing',
    'Structural'
  ], []);

  const hasConstructionAdminServices = useMemo(() => 
    trackedServices.some(service => service.isConstructionAdmin && service.isIncluded),
    [trackedServices]
  );

  const formatCurrency = useCallback((value: number | null | undefined): string => {
    if (typeof value === 'number' && isNaN(value)) {
      return '$0';
    }
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const getDuplicateRate = (structure: Structure, duplicateStructureRates: Array<{ id: number; rate: number }>): number => {
    if (!structure.parentId) {
      return duplicateStructureRates.find(r => r.id === 1)?.rate ?? 1.0;
    }

    const duplicateNumber = getDuplicateNumber(structure);
    const rateId = Math.min(duplicateNumber + 1, 10);
    return duplicateStructureRates.find(r => r.id === rateId)?.rate ?? 1.0;
  };

  const getDuplicateNumber = (structure: Structure): number => {
    if (!structure.parentId) return 0;
    return parseInt(structure.name.match(/\(Duplicate (\d+)\)$/)?.[1] ?? '1');
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
  const getFeeScale = (
    structure: Structure, 
    discipline: string, 
    duplicateStructureRates: Array<{ id: number; rate: number }>
  ): { adjustedRate: number } => {
    if (!feeScale || feeScale.length === 0) {
      console.warn('No fee scale data available for:', { 
        structure: structure.name, 
        discipline,
        totalConstructionCost: constructionCosts[structure.id]?.['Total'],
        disciplineConstructionCost: constructionCosts[structure.id]?.[discipline]
      });
      return { adjustedRate: 0.05 };
    }

    // Get the discipline-specific construction cost
    const disciplineConstructionCost = constructionCosts[structure.id]?.[discipline] || 0;
    const totalConstructionCost = constructionCosts[structure.id]?.['Total'] || 0;

    // If no construction cost, use the first fee scale row
    if (totalConstructionCost === 0) {
      const firstScale = feeScale[0];
      if (!firstScale) {
        console.warn('No fee scale rows available');
        return { adjustedRate: 0.05 };
      }

      const baseRate = firstScale.prime_consultant_rate;
      let fractionRate: number;
      const disciplineLower = discipline.toLowerCase();
      switch (disciplineLower) {
        case 'mechanical':
          fractionRate = firstScale.fraction_of_prime_rate_mechanical;
          break;
        case 'plumbing':
          fractionRate = firstScale.fraction_of_prime_rate_plumbing;
          break;
        case 'electrical':
          fractionRate = firstScale.fraction_of_prime_rate_electrical;
          break;
        case 'structural':
          fractionRate = firstScale.fraction_of_prime_rate_structural;
          break;
        default:
          fractionRate = 1;
      }

      const disciplineRate = baseRate * (fractionRate / 100);
      const duplicateRate = getDuplicateRate(structure, duplicateStructureRates);

      return { adjustedRate: disciplineRate * duplicateRate };
    }

    // Find the appropriate fee scale row based on total construction cost
    let scale = feeScale.find((row: FeeScale, index: number) => {
      const nextRow = feeScale[index + 1];
      if (!nextRow) {
        return totalConstructionCost >= row.construction_cost;
      }
      return totalConstructionCost >= row.construction_cost && totalConstructionCost < nextRow.construction_cost;
    });

    if (!scale) {
      if (totalConstructionCost >= feeScale[feeScale.length - 1].construction_cost) {
        scale = feeScale[feeScale.length - 1];
      } else {
        console.warn('No matching fee scale found for total construction cost:', {
          totalConstructionCost,
          discipline,
          structure: structure.name,
          availableScales: feeScale.map(s => s.construction_cost)
        });
        return { adjustedRate: 0.05 };
      }
    }

    // Calculate the discipline-specific rate
    const baseRate = scale.prime_consultant_rate;
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

    const disciplineRate = baseRate * (fractionRate / 100);
    const duplicateRate = getDuplicateRate(structure, duplicateStructureRates);

    return { adjustedRate: disciplineRate * duplicateRate };
  };

  const memoizedFeeScales = useMemo(() => {
    const scales: Record<string, Record<string, { adjustedRate: number }>> = {};
    
    structures.forEach(structure => {
      scales[structure.id] = {};
      DISCIPLINES.forEach(discipline => {
        if (feeScale && feeScale.length > 0) {
          const result = getFeeScale(structure, discipline, duplicateStructureRates);
          scales[structure.id][discipline] = result;
        }
      });
    });
    
    return scales;
  }, [structures, DISCIPLINES, feeScale, duplicateStructureRates, constructionCosts]);

  const calculateDisciplineFee = useCallback((
    structure: Structure,
    discipline: string,
    phase: 'design' | 'construction',
    returnRawCost: boolean = false
  ): { fee: number; rate: number } => {
    const feeScale = memoizedFeeScales[structure.id]?.[discipline];
    
    if (!feeScale || feeScale.adjustedRate === 0) {
      console.warn('No fee scale data or zero rate:', { structure: structure.name, discipline, feeScale });
      return { fee: 0, rate: 0 };
    }

    const percentage = phase === 'design' 
      ? (structure.designPercentage ?? 80) / 100 
      : (100 - (structure.designPercentage ?? 80)) / 100;
    
    const totalConstructionCost = structure.levels.reduce((total, level) =>
      level.spaces.reduce((levelTotal, space) => {
        const fee = space.totalConstructionCosts.find(f => f.discipline === discipline);
        if (fee) {
          const spaceConstructionCost = fee.costPerSqft * space.floorArea;
          if (isNaN(spaceConstructionCost)) {
            console.error('NaN construction cost calculated:', {
              structure: structure.name,
              level: level.name,
              space: space.name,
              discipline,
              fee,
              floorArea: space.floorArea,
              costPerSqft: fee.costPerSqft
            });
          }
          return levelTotal + (fee.isActive ? spaceConstructionCost : 0);
        }
        return levelTotal;
      }, 0), 0);

    if (returnRawCost) {
      return { fee: totalConstructionCost, rate: 0 };
    }
    
    const calculatedFee = totalConstructionCost * (feeScale.adjustedRate / 100) * percentage;
    
    if (isNaN(calculatedFee)) {
      console.error('NaN fee calculated:', {
        structure: structure.name,
        discipline,
        phase,
        totalConstructionCost,
        adjustedRate: feeScale.adjustedRate,
        percentage,
        calculatedFee
      });
    }

    return { fee: calculatedFee, rate: feeScale.adjustedRate };
  }, [memoizedFeeScales, constructionCosts]);

  const calculateTotalDesignFee = useCallback((structure: Structure): number => {
    let total = 0;

    structure.levels.forEach(level => {
      level.spaces.forEach(space => {
        // Calculate fees for each discipline in the space
        space.totalConstructionCosts.forEach(fee => {
          if (!fee.isActive) {
            return;
          }

          const { fee: disciplineFee } = calculateDisciplineFee(structure, fee.discipline, 'design');
          
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

    return total;
  }, [calculateDisciplineFee]);

  const memoizedCalculateFee = useCallback((
    structure: Structure,
    discipline: string,
    feePhase: 'design' | 'construction'
  ): { fee: number; rate: number } => {
    return calculateDisciplineFee(
      structure,
      discipline,
      feePhase,
      false
    );
  }, [calculateDisciplineFee]);

  const getTotalDesignFeesForDiscipline = useCallback((structure: Structure, discipline: string): number => {
    return structure.levels.reduce((total, level) => {
      return level.spaces.reduce((levelSum, space) => {
        const fee = space.totalConstructionCosts.find(f => f.discipline === discipline);
        if (!fee) return levelSum;

        const { fee: calculatedFee } = memoizedCalculateFee(structure, discipline, 'design');
        return levelSum + (fee.isActive ? calculatedFee : 0);
      }, 0);
    }, 0);
  }, [memoizedCalculateFee]);

  // Fee Calculation Functions
  const calculateServiceFee = useCallback((
    service: TrackedService, 
    discipline: string, 
    structureId: string
  ): ServiceFeeCalculation => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) {
      return { calculatedFee: 0, displayFee: 0, isCustom: false };
    }

    // Always calculate the base fee, even if there's a custom fee
    let calculatedFee = service.min_fee ?? 0;

    // If there's a rate, calculate based on total design fees
    if (service.rate !== null && service.rate !== undefined) {
      const totalDesignFees = structure.levels.reduce((total, level) => {
        return total + level.spaces.reduce((spaceTotal, space) => {
          const fee = space.totalConstructionCosts.find(f => f.discipline === discipline);
          if (!fee || !fee.isActive) return spaceTotal;

          const tempStructure: Structure = {
            ...structure,
            levels: [{
              ...level,
              spaces: [space]
            }]
          };
          const { fee: calculatedFee } = calculateDisciplineFee(tempStructure, discipline, 'design');
          return spaceTotal + calculatedFee;
        }, 0);
      }, 0);

      calculatedFee = totalDesignFees * (service.rate / 100);
    }

    // Apply fee increment if specified
    if (service.fee_increment) {
      const remainder = calculatedFee % service.fee_increment;
      if (remainder > 0) {
        calculatedFee = calculatedFee + (service.fee_increment - remainder);
      }
    }

    // Ensure fee is not below minimum
    if (service.min_fee && calculatedFee < service.min_fee) {
      calculatedFee = service.min_fee;
    }

    // If there's a custom fee override, use it for display but keep the calculated fee
    if (service.customFee !== undefined) {
      return {
        calculatedFee,  // Keep the actual calculated fee
        customFee: service.customFee,
        displayFee: service.customFee,
        isCustom: true
      };
    }

    return {
      calculatedFee,
      displayFee: calculatedFee,
      isCustom: false
    };
  }, [structures, calculateDisciplineFee]);

  const calculateDisciplineTotal = useCallback((
    structure: Structure,
    discipline: string,
    phase: 'design' | 'construction'
  ): Record<string, number> => {
    const spaceFeesTotal = structure.levels.length > 0 ? structure.levels.reduce((levelTotal, level) => {
      return levelTotal + level.spaces.reduce((spaceTotal, space) => {
        const constructionCost = constructionCosts[structure.id]?.[discipline] ?? 0;
        
        if (phase === 'construction' && !hasConstructionAdminServices) return spaceTotal;
        
        const tempStructure: Structure = {
          ...structure,
          levels: [{
            ...level,
            spaces: [{
              ...space,
              totalConstructionCosts: [{
                id: crypto.randomUUID(),
                discipline,
                totalConstructionCost: constructionCost,
                isActive: true,
                costPerSqft: space.floorArea ? constructionCost / space.floorArea : 0
              }]
            }]
          }]
        };

        const { fee: calculatedFee } = calculateDisciplineFee(tempStructure, discipline, phase);
        
        return spaceTotal + calculatedFee;
      }, 0);
    }, 0) : 0;

    // Only include services for the current structure
    const serviceFeesTotal = trackedServices
      .filter(service => 
        service.discipline === discipline && 
        service.phase === phase && 
        service.isIncluded && 
        service.min_fee !== null &&
        !service.isConstructionAdmin &&
        service.structureId === structure.id
      )
      .reduce((total, service) => {
        const { displayFee } = calculateServiceFee(service, discipline, structure.id);  // Use displayFee to include manual overrides
        return total + displayFee;
      }, 0);

    const total = spaceFeesTotal + serviceFeesTotal;

    return {
      spaceFees: spaceFeesTotal,
      serviceFees: serviceFeesTotal,
      total: total
    };
  }, [hasConstructionAdminServices, trackedServices, calculateServiceFee, calculateDisciplineFee, constructionCosts]);

  const memoizedDisciplineTotals = useMemo(() => {
    const totals: Record<string, Record<string, Record<string, Record<string, number>>>> = {};
    
    structures.forEach(structure => {
      totals[structure.id] = {};
      DISCIPLINES.forEach(discipline => {
        totals[structure.id][discipline] = {
          design: calculateDisciplineTotal(structure, discipline, 'design'),
          construction: calculateDisciplineTotal(structure, discipline, 'construction')
        };
      });
    });
    
    return totals;
  }, [structures, DISCIPLINES, calculateDisciplineTotal]);

  const calculateProjectSummary = useCallback((): ProjectSummary => {
    const designTotals = DISCIPLINES.reduce((acc, discipline) => {
      acc[discipline] = structures.reduce((sum, structure) => {
        const totals = calculateDisciplineTotal(structure, discipline, 'design');
        return sum + (totals.total ?? 0);
      }, 0);
      return acc;
    }, {} as Record<string, number>);

    const constructionTotals = DISCIPLINES.reduce((acc, discipline) => {
      acc[discipline] = structures.reduce((sum, structure) => {
        const totals = calculateDisciplineTotal(structure, discipline, 'construction');
        return sum + (totals.total ?? 0);
      }, 0);
      return acc;
    }, {} as Record<string, number>);

    const grandTotals = DISCIPLINES.reduce((acc, discipline) => {
      acc[discipline] = (designTotals[discipline] || 0) + (constructionTotals[discipline] || 0);
      return acc;
    }, {} as Record<string, number>);

    const projectTotal = Object.values(grandTotals).reduce((sum: number, value: number) => sum + value, 0);

    return {
      designTotals,
      constructionTotals,
      grandTotals,
      projectTotal
    };
  }, [DISCIPLINES, structures, calculateDisciplineTotal]);

  const handleDesignPercentageUpdate = useCallback((structureId: string, newPercentage: number) => {
    onFeeUpdate(structureId, '', '', '', { designPercentage: newPercentage } as Partial<Fee>, phase);
  }, [onFeeUpdate, phase]);

  const renderGrandTotals = useCallback((structure: Structure) => {
    const grandTotals = DISCIPLINES.reduce((acc, discipline) => {
      const designTotal = memoizedDisciplineTotals[structure.id]?.[discipline]?.design?.total ?? 0;
      const constructionTotal = memoizedDisciplineTotals[structure.id]?.[discipline]?.construction?.total ?? 0;
      acc[discipline] = designTotal + constructionTotal;
      return acc;
    }, {} as Record<string, number>);

    const totalSum = Object.values(grandTotals).reduce((sum: number, value: number) => sum + value, 0);
    
    return (
      <>
        <div className="mt-4 border-t-2 border-gray-300 pt-4">
          <div className="grid grid-cols-6 gap-2 px-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
              <span className="text-sm">{structure.name} Grand Total Fees</span>
            </div>
            {DISCIPLINES.map(discipline => (
              <div key={discipline} className="flex items-center gap-2">
                <div className="flex-1 text-right font-medium">
                  {formatCurrency(grandTotals[discipline])}
                </div>
                <div className="w-8" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 px-4">
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{structure.name} Grand Total Fee:</span>
              <span className="text-right font-medium">
                {formatCurrency(totalSum)}
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }, [memoizedDisciplineTotals, formatCurrency, DISCIPLINES]);

  const renderTrackedServices = useCallback((structureId: string, phase: 'design' | 'construction') => {
    // First, group all services by name
    const servicesByName = trackedServices.reduce((acc, service) => {
      if (service.phase === phase && service.structureId === structureId) {
        if (!acc[service.service_name]) {
          acc[service.service_name] = [];
        }
        acc[service.service_name].push(service);
      }
      return acc;
    }, {} as Record<string, TrackedService[]>);

    // Then filter the groups - a group should be displayed if at least one service in it meets the criteria
    const filteredGroups = Object.entries(servicesByName).filter(([_, services]) => {
      return services.some(service => {
        const isIncluded = service.isIncluded;
        const isConstructionAdmin = service.isConstructionAdmin;
        const hasFeeValues = service.min_fee !== null || service.rate !== null || service.fee_increment !== null;
        return isIncluded && (isConstructionAdmin || hasFeeValues);
      });
    });

    if (filteredGroups.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-2">
        {filteredGroups.map(([serviceName, services]) => (
          <div key={serviceName} className="grid grid-cols-6 gap-2 px-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 ml-4">
              <Home className="w-3.5 h-3.5 text-primary/50" />
              <span className="text-sm">{serviceName}</span>
            </div>
            
            {DISCIPLINES.map((discipline: string) => {
              const service = services.find(s => s.discipline === discipline);
              
              if (!service) {
                return <div key={discipline} className="h-10" />;
              }

              const isIncluded = service.isIncluded;
              const isConstructionAdmin = service.isConstructionAdmin;
              const hasFeeValues = service.min_fee !== null || service.rate !== null || service.fee_increment !== null;
              const shouldDisplay = isIncluded && (isConstructionAdmin || hasFeeValues);

              if (!shouldDisplay) {
                return <div key={discipline} className="h-10" />;
              }

              const { displayFee, isCustom } = calculateServiceFee(service, discipline, structureId);

              const handleFeeChange = (value: string) => {
                const cleanValue = value.replace(/[$,]/g, '');
                
                if (cleanValue === '') {
                  onServiceFeeUpdate?.(service.id, discipline, 0, service.phase);
                  setInputValues(prev => ({ ...prev, [service.id]: '' }));
                  return;
                }

                const numericValue = parseFloat(cleanValue);
                if (!isNaN(numericValue)) {
                  onServiceFeeUpdate?.(service.id, discipline, numericValue, service.phase);
                  setInputValues(prev => ({ ...prev, [service.id]: formatCurrency(numericValue) }));
                }
              };

              const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Calculate the fee that this service should have by default
                const { calculatedFee } = calculateServiceFee(service, discipline, structureId);
                
                console.log('Revert clicked:', {
                  serviceName: service.service_name,
                  serviceId: service.id,
                  discipline,
                  min_fee: service.min_fee,
                  calculatedFee,
                  customFee: service.customFee,
                  phase: service.phase
                });
                
                // Pass the calculated fee to trigger clearing of customFee
                // The parent will compare this with min_fee and clear customFee if they match
                const feeToPass = service.min_fee ?? calculatedFee;
                console.log('Passing fee to parent:', feeToPass);
                
                onServiceFeeUpdate?.(service.id, discipline, feeToPass, service.phase);
                
                // Update the input value to show the calculated fee
                setInputValues(prev => ({ 
                  ...prev, 
                  [service.id]: formatCurrency(calculatedFee) 
                }));
              };

              return (
                <div key={discipline} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    {isCustom && (
                      <button
                        type="button"
                        onClick={handleClick}
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-primary"
                        title="Revert to calculated fee"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <Input
                      type="text"
                      value={inputValues[service.id] ?? formatCurrency(displayFee)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[$]?\d*\.?\d*$/.test(value)) {
                          setInputValues(prev => ({ ...prev, [service.id]: value }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFeeChange(e.currentTarget.value);
                        }
                      }}
                      onBlur={(e) => handleFeeChange(e.target.value)}
                      className={`text-right pr-2 bg-transparent ${!isIncluded ? 'text-gray-400' : isCustom ? 'text-primary' : ''}`}
                      disabled={!isIncluded}
                    />
                  </div>
                  <div className="w-8 flex items-center justify-center" />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }, [trackedServices, DISCIPLINES, calculateServiceFee, formatCurrency, onServiceFeeUpdate, inputValues]);

  const renderTotalsRow = useCallback((structure: Structure, phase: 'design' | 'construction') => {
    const totals = DISCIPLINES.reduce((acc, discipline) => {
      const disciplineTotals = memoizedDisciplineTotals[structure.id]?.[discipline]?.[phase];
      acc[discipline] = disciplineTotals?.total ?? 0;
      return acc;
    }, {} as Record<string, number>);
    
    return (
      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="grid grid-cols-6 gap-2 px-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
            <span className="text-sm">Total {phase === 'design' ? 'Design' : 'Construction'} Fees</span>
          </div>
          {DISCIPLINES.map(discipline => (
            <div key={discipline} className="flex items-center gap-2">
              <div className="flex-1 text-right font-medium">
                {formatCurrency(totals[discipline])}
              </div>
              <div className="w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }, [memoizedDisciplineTotals, formatCurrency, DISCIPLINES]);

  const renderSummaryPanel = useCallback(() => {
    const summary = calculateProjectSummary();
    const designTotal = Object.values(summary.designTotals).reduce((sum, val) => sum + val, 0);
    const constructionTotal = Object.values(summary.constructionTotals).reduce((sum, val) => sum + val, 0);

    const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsSummaryOpen(prev => !prev);
    };

    return (
      <div className="mb-8">
        <div 
          role="button"
          tabIndex={0}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSummaryOpen(prev => !prev);
            }
          }}
          className="w-full"
        >
          <div className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
            <span className="font-medium">Project Summary</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        {isSummaryOpen && (
          <div className="mt-4">
            <Card className="p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Project Design Phase Totals</h3>
                  <div className="space-y-2">
                    {DISCIPLINES.map(discipline => (
                      <div key={discipline} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{discipline}</span>
                        <span className="font-medium">{formatCurrency(summary.designTotals[discipline])}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center font-medium">
                        <span>Project Design Total</span>
                        <span>{formatCurrency(designTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Project Construction Phase Totals</h3>
                  <div className="space-y-2">
                    {DISCIPLINES.map(discipline => (
                      <div key={discipline} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{discipline}</span>
                        <span className="font-medium">{formatCurrency(summary.constructionTotals[discipline])}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center font-medium">
                        <span>Project Construction Total</span>
                        <span>{formatCurrency(constructionTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Project Grand Total</span>
                    <span className="font-medium text-lg">{formatCurrency(summary.projectTotal)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const summary = calculateProjectSummary();
                      const text = `Project Summary
────────────────
Design Phase Totals
${DISCIPLINES.map(d => `${d.padEnd(12)}: ${formatCurrency(summary.designTotals[d])}`).join('\n')}
Design Total: ${formatCurrency(Object.values(summary.designTotals).reduce((sum, val) => sum + val, 0))}

Construction Phase Totals
${DISCIPLINES.map(d => `${d.padEnd(12)}: ${formatCurrency(summary.constructionTotals[d])}`).join('\n')}
Construction Total: ${formatCurrency(Object.values(summary.constructionTotals).reduce((sum, val) => sum + val, 0))}

Project Grand Total: ${formatCurrency(summary.projectTotal)}`;

                      navigator.clipboard.writeText(text).then(() => {
                        console.log('Summary copied to clipboard');
                      }).catch(() => {
                        console.error('Failed to copy summary');
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Summary
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }, [calculateProjectSummary, formatCurrency, DISCIPLINES, isSummaryOpen]);

  const renderPhasePercentages = (structure: Structure) => {
    const designPercentage = structure.designPercentage ?? 80;
    const constructionPercentage = 100 - designPercentage;

    return (
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Design:</span>
          <Input
            type="number"
            min="0"
            max="100"
            value={designPercentage}
            onChange={(e) => {
              const newPercentage = Math.min(100, Math.max(0, Number(e.target.value)));
              handleDesignPercentageUpdate(structure.id, newPercentage);
            }}
            className="w-20 text-right"
          />
          <span className="text-sm text-primary">%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Construction:</span>
          <span className="text-sm text-primary">{constructionPercentage}%</span>
        </div>
      </div>
    );
  };

  const getServiceFeesForDiscipline = (structureId: string, discipline: string): number => {
    const fees = trackedServices
      .filter((service): service is TrackedService & { min_fee: number } => 
        service.isIncluded &&
        service.min_fee !== null && 
        service.discipline === discipline
      )
      .reduce((sum, service) => sum + service.min_fee, 0);
    
    return fees;
  };

  const shouldShowSpacesForDiscipline = (discipline: string): boolean => {
    if (phase === 'design') return true;
    
    return hasConstructionAdminServices;
  };

  const renderSpacesForDiscipline = (structure: Structure, discipline: string): JSX.Element[] => {
    if (!shouldShowSpacesForDiscipline(discipline)) return [];

    return structure.levels.flatMap(level => 
      level.spaces.map((space: Space): JSX.Element | null => {
        const fee = space.totalConstructionCosts.find((f: Fee) => f.discipline === discipline);
        if (!fee) return null;

        const tempStructure: Structure = {
          ...structure,
          levels: [{
            ...level,
            spaces: [space]
          }]
        };
        const { fee: calculatedFee } = memoizedCalculateFee(tempStructure, discipline, phase);
        const displayFee = fee?.isActive && fee.designFee !== undefined 
          ? fee.designFee 
          : calculatedFee;
        const hasCustomFee = fee?.designFee !== undefined && 
                            fee.designFee !== calculatedFee && 
                            fee.isActive;
        
        return (
          <div key={space.id} className="pl-4 mt-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{space.name}</span>
              <span className={`font-medium ${!fee.isActive ? 'text-gray-400' : ''}`}>
                {formatCurrency(displayFee)}
              </span>
            </div>
          </div>
        );
      }).filter((element): element is JSX.Element => element !== null)
    );
  };

  const handleFeeToggle = useCallback((
    structureId: string,
    levelId: string,
    spaceId: string,
    feeId: string,
    isActive: boolean,
    feePhase: 'design' | 'construction'
  ) => {
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    const level = structure.levels.find(l => l.id === levelId);
    if (!level) return;

    const space = level.spaces.find(s => s.id === spaceId);
    if (!space) return;

    const fee = space.totalConstructionCosts.find(f => f.id === feeId);
    if (!fee) return;

    if (onDisciplineFeeToggle) {
      onDisciplineFeeToggle(structureId, levelId, spaceId, feeId, isActive);
    } else {
      onFeeUpdate(structureId, levelId, spaceId, feeId, { isActive }, feePhase);
    }
  }, [structures, onDisciplineFeeToggle, onFeeUpdate]);

  return (
    <div className="space-y-8">
      {renderSummaryPanel()}

      {structures.map(structure => (
        <Card key={structure.id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{structure.name}</h2>
            {renderPhasePercentages(structure)}
          </div>

          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">Design Phase</h3>
            
            <div className="grid grid-cols-6 gap-2 mb-4 px-4 border-b border-gray-200 pb-2">
              <div className="text-sm font-medium">Description</div>
              {DISCIPLINES.map(discipline => (
                <div key={discipline} className="text-sm font-medium text-center">
                  {discipline}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              {structure.levels.map(level => (
                <div key={`design-${level.id}`} className="space-y-2">
                  <div className="grid grid-cols-6 gap-2 px-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Building2 className="w-3.5 h-3.5 text-primary/50" />
                      <span className="text-sm font-medium">{level.name}</span>
                    </div>
                    {DISCIPLINES.map(discipline => (
                      <div key={discipline} className="h-10" />
                    ))}
                  </div>
                  {level.spaces.map((space: Space) => (
                    <div key={`design-${space.id}`} className="grid grid-cols-6 gap-2 px-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Home className="w-3.5 h-3.5 text-primary/50" />
                        <span className="text-sm font-medium">{space.name}</span>
                      </div>
                      {DISCIPLINES.map(discipline => {
                        const fee = space.totalConstructionCosts.find((f: Fee) => f.discipline === discipline);
                        const tempStructure: Structure = {
                          ...structure,
                          levels: [{
                            ...level,
                            spaces: [space]
                          }]
                        };
                        const { fee: calculatedDesignFee } = memoizedCalculateFee(tempStructure, discipline, 'design');
                        const displayFee = fee?.isActive && fee.designFee !== undefined 
                          ? fee.designFee 
                          : calculatedDesignFee;
                        const hasCustomFee = fee?.designFee !== undefined && 
                                            fee.designFee !== calculatedDesignFee && 
                                            fee.isActive;
                        
                        return (
                          <div key={discipline} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2">
                              {hasCustomFee && (
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-primary"
                                  title="Revert to calculated fee"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onFeeUpdate) {
                                      onFeeUpdate(structure.id, level.id, space.id, fee.id, { designFee: undefined }, 'design');
                                    }
                                  }}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <Input
                                type="text"
                                value={formatCurrency(displayFee)}
                                onChange={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onFeeUpdate && fee) {
                                    const value = e.target.value.replace(/[^0-9.-]+/g, '');
                                    const numericValue = parseFloat(value) || 0;
                                    onFeeUpdate(structure.id, level.id, space.id, fee.id, { designFee: numericValue }, 'design');
                                  }
                                }}
                                className={`text-right pr-2 bg-transparent ${!fee?.isActive ? 'text-gray-400' : ''}`}
                                disabled={!fee?.isActive}
                              />
                            </div>
                            <div className="w-8 flex items-center justify-center">
                              {fee && (
                                <button
                                  type="button"
                                  className={`p-1.5 rounded-md transition-colors ${fee.isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-400 hover:bg-gray-100'}`}
                                  title={fee.isActive ? "Disable discipline" : "Enable discipline"}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFeeToggle(structure.id, level.id, space.id, fee.id, !fee.isActive, 'design');
                                  }}
                                >
                                  {fee.isActive ? (
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
                                    >
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                  ) : (
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
                                    >
                                      <path d="M5 12h14" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Design Phase Services</h4>
              {renderTrackedServices(structure.id, 'design')}
            </div>

            {renderTotalsRow(structure, 'design')}
          </div>

          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">Construction Phase</h3>
            
            <div className="grid grid-cols-6 gap-2 mb-4 px-4 border-b border-gray-200 pb-2">
              <div className="text-sm font-medium">Description</div>
              {DISCIPLINES.map(discipline => (
                <div key={discipline} className="text-sm font-medium text-center">
                  {discipline}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              {hasConstructionAdminServices && structure.levels.map(level => (
                <div key={`construction-${level.id}`} className="space-y-2">
                  <div className="grid grid-cols-6 gap-2 px-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Building2 className="w-3.5 h-3.5 text-primary/50" />
                      <span className="text-sm font-medium">{level.name}</span>
                    </div>
                    {DISCIPLINES.map(discipline => (
                      <div key={discipline} className="h-10" />
                    ))}
                  </div>
                  {level.spaces.map((space: Space) => (
                    <div key={`construction-${space.id}`} className="grid grid-cols-6 gap-2 px-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Home className="w-3.5 h-3.5 text-primary/50" />
                        <span className="text-sm font-medium">{space.name}</span>
                      </div>
                      {DISCIPLINES.map(discipline => {
                        const fee = space.totalConstructionCosts.find((f: Fee) => f.discipline === discipline);
                        const tempStructure: Structure = {
                          ...structure,
                          levels: [{
                            ...level,
                            spaces: [space]
                          }]
                        };
                        const { fee: calculatedConstructionFee } = memoizedCalculateFee(tempStructure, discipline, 'construction');
                        const displayFee = fee?.isActive && fee?.constructionFee !== undefined 
                          ? fee.constructionFee 
                          : calculatedConstructionFee;
                        const hasCustomFee = fee?.constructionFee !== undefined && 
                                            fee?.constructionFee !== calculatedConstructionFee && 
                                            fee?.isActive;
                        
                        return (
                          <div key={`${space.id}-${discipline}`} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2">
                              {hasCustomFee && (
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-primary"
                                  title="Revert to calculated fee"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onFeeUpdate && fee) {
                                      onFeeUpdate(structure.id, level.id, space.id, fee.id, { constructionFee: undefined }, 'construction');
                                    }
                                  }}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <Input
                                type="text"
                                value={formatCurrency(displayFee)}
                                onChange={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onFeeUpdate && fee) {
                                    const value = e.target.value.replace(/[^0-9.-]+/g, '');
                                    const numericValue = parseFloat(value) || 0;
                                    onFeeUpdate(structure.id, level.id, space.id, fee.id, { constructionFee: numericValue }, 'construction');
                                  }
                                }}
                                className={`text-right pr-2 bg-transparent ${!fee?.isActive ? 'text-gray-400' : ''}`}
                                disabled={!fee?.isActive}
                              />
                            </div>
                            <div className="w-8 flex items-center justify-center">
                              {fee && (
                                <button
                                  type="button"
                                  className={`p-1.5 rounded-md transition-colors ${fee.isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-400 hover:bg-gray-100'}`}
                                  title={fee.isActive ? "Disable discipline" : "Enable discipline"}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFeeToggle(structure.id, level.id, space.id, fee.id, !fee.isActive, 'construction');
                                  }}
                                >
                                  {fee.isActive ? (
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
                                    >
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                  ) : (
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
                                    >
                                      <path d="M5 12h14" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Construction Phase Services</h4>
              {renderTrackedServices(structure.id, 'construction')}
            </div>

            {renderTotalsRow(structure, 'construction')}
          </div>

          {renderGrandTotals(structure)}
        </Card>
      ))}
    </div>
  );
}