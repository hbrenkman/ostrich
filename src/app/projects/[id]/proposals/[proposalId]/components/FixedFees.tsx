import { FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Building2, Layers, Home, ChevronDown, ChevronRight, Check, RotateCcw, ChevronUp, ChevronDown as ChevronDownIcon, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
  included_in_fee: boolean;
  phase: 'design' | 'construction';
  min_fee: number | null;
  rate: number | null;
}

interface TrackedService {
  id: string;
  serviceId: string;
  service_name: string;
  name: string;
  discipline: string;
  default_included: boolean;
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  phase: 'design' | 'construction';
  customFee?: number;
  construction_admin: boolean;
  fee: number;
  structureId: string;
  levelId: string;
  spaceId: string;
  isActive: boolean;
}

interface FeeScale {
  construction_cost: number;
  prime_consultant_rate: number;
  fraction_of_prime_rate_mechanical: number;
  fraction_of_prime_rate_plumbing: number;
  fraction_of_prime_rate_electrical: number;
  fraction_of_prime_rate_structural: number;
}

interface FeeCalculationProps {
  structures: Structure[];
  phase: 'design' | 'construction';
  onFeeUpdate: (structureId: string, levelId: string, spaceId: string, feeId: string, updates: Partial<Fee>, phase: 'design' | 'construction') => void;
  designFeeScale: FeeScale[];
  duplicateStructureRates: Array<{ id: number; rate: number }>;
  trackedServices?: TrackedService[];
  onServiceFeeUpdate?: (serviceId: string, discipline: string, fee: number | undefined, phase: 'design' | 'construction') => void;
  onDisciplineFeeToggle?: (structureId: string, levelId: string, spaceId: string, feeId: string, isActive: boolean) => void;
  constructionCosts: Record<string, Record<string, number>>;
  manualFeeOverrides: ManualFeeOverride[];
  setManualFeeOverrides: React.Dispatch<React.SetStateAction<ManualFeeOverride[]>>;
}

interface ProjectSummary {
  designTotals: Record<string, number>;
  constructionTotals: Record<string, number>;
  grandTotals: Record<string, number>;
  projectTotal: number;
}

interface ManualFeeOverride {
  structureId: string;
  discipline: string;
  spaceId?: string;
}

export default function FixedFees({ 
  structures, 
  phase, 
  onFeeUpdate, 
  designFeeScale,
  duplicateStructureRates,
  trackedServices = [],
  onServiceFeeUpdate,
  onDisciplineFeeToggle,
  constructionCosts,
  manualFeeOverrides,
  setManualFeeOverrides
}: FeeCalculationProps) {
  // Add initial props logging with structure details
  console.log('FixedFees props:', {
    structures: structures.map(s => ({
      id: s.id,
      name: s.name,
      levels: s.levels.length
    })),
    trackedServices: trackedServices.map(s => ({
      id: s.id,
      name: s.service_name,
      structureId: s.structureId,
      phase: s.phase
    })),
    phase
  });

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const isInitializing = useRef(true);

  // Reset initialization flag when structures change
  useEffect(() => {
    // console.log('FixedFees re-rendered. constructionCosts:', constructionCosts);
  }, [constructionCosts]);

  useEffect(() => {
    if (isInitializing.current) {
      // Set a timeout to allow initial render to complete
      const timer = setTimeout(() => {
        isInitializing.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [structures]);

  // Memoize the disciplines array since it never changes
  const DISCIPLINES = useMemo(() => [
    'Civil',
    'Electrical',
    'Mechanical',
    'Plumbing',
    'Structural'
  ], []);

  // Memoize the construction admin services check
  const hasConstructionAdminServices = useMemo(() => 
    trackedServices.some(service => service.construction_admin && service.default_included),
    [trackedServices]
  );

  // Memoize the formatCurrency function
  const formatCurrency = useCallback((value: number | null | undefined): string => {
    // Add logging to catch NaN values
    if (typeof value === 'number' && isNaN(value)) {
      console.error('formatCurrency received NaN value:', {
        value,
        stack: new Error().stack
      });
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

  // Helper functions first
  const getDuplicateRate = (structure: Structure, duplicateStructureRates: Array<{ id: number; rate: number }>): number => {
    if (!structure.parentId) {
      // Parent building always uses rate from id=1
      return duplicateStructureRates.find(r => r.id === 1)?.rate ?? 1.0;
    }

    // For duplicate buildings, find the appropriate rate
    const duplicateNumber = getDuplicateNumber(structure);
    const rateId = Math.min(duplicateNumber + 1, 10); // Cap at id=10
    return duplicateStructureRates.find(r => r.id === rateId)?.rate ?? 1.0;
  };

  const getDuplicateNumber = (structure: Structure): number => {
    if (!structure.parentId) return 0;
    return parseInt(structure.name.match(/\(Duplicate (\d+)\)$/)?.[1] ?? '1');
  };

  // Move getFeeScale function before memoizedFeeScales
  const getFeeScale = (
    structure: Structure, 
    discipline: string, 
    designFeeScale: FeeScale[],
    duplicateStructureRates: Array<{ id: number; rate: number }>
  ): { adjustedRate: number } => {
    // Add detailed fee scale logging
    console.log('getFeeScale called:', {
      structure: structure.name,
      discipline,
      hasFeeScale: !!designFeeScale,
      feeScaleLength: designFeeScale?.length,
      totalConstructionCost: constructionCosts[structure.id]?.['Total'],
      disciplineConstructionCost: constructionCosts[structure.id]?.[discipline],
      duplicateRates: duplicateStructureRates,
      rawFeeScale: designFeeScale
    });

    // Early return if no fee scale data
    if (!designFeeScale || designFeeScale.length === 0) {
      console.warn('No fee scale data available for:', { 
        structure: structure.name, 
        discipline,
        totalConstructionCost: constructionCosts[structure.id]?.['Total'],
        disciplineConstructionCost: constructionCosts[structure.id]?.[discipline]
      });
      // Return a default rate of 0.05 (5%) if no fee scale data
      return { adjustedRate: 0.05 };
    }

    // Get total construction cost for this structure to determine fee scale
    const totalConstructionCost = constructionCosts[structure.id]?.['Total'] || 0;
    // Get discipline's construction cost for final calculation
    const disciplineConstructionCost = constructionCosts[structure.id]?.[discipline] || 0;

    // If no total construction cost found, use the first fee scale row
    if (totalConstructionCost === 0) {
      const firstScale = designFeeScale[0];
      if (!firstScale) {
        console.warn('No fee scale rows available');
        return { adjustedRate: 0.05 }; // Default to 5% if no fee scale
      }

      // Get the base rate (prime consultant rate) from first scale
      const baseRate = firstScale.prime_consultant_rate;

      // Get the fraction rate for the discipline
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

      // Calculate the fee using the discipline's fraction of the prime consultant rate
      const disciplineRate = baseRate * (fractionRate / 100);

      // Get and apply the duplicate rate
      const duplicateRate = getDuplicateRate(structure, duplicateStructureRates);

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using first fee scale row for new space:', {
          structure: structure.name,
          discipline,
          baseRate,
          fractionRate,
          disciplineRate,
          duplicateRate,
          finalRate: disciplineRate * duplicateRate,
          totalConstructionCost,
          disciplineConstructionCost
        });
      }

      // Add logging before returning the final rate
      const finalRate = disciplineRate * duplicateRate;
      console.log('Fee scale calculation result:', {
        structure: structure.name,
        discipline,
        baseRate,
        fractionRate,
        disciplineRate,
        duplicateRate,
        finalRate,
        totalConstructionCost,
        disciplineConstructionCost
      });

      return { adjustedRate: finalRate };
    }

    // Find the appropriate fee scale row using total construction cost
    let scale = designFeeScale.find((row: FeeScale, index: number) => {
      const nextRow = designFeeScale[index + 1];
      // If there's no next row, use this row if the cost is greater than or equal to this row's cost
      if (!nextRow) {
        return totalConstructionCost >= row.construction_cost;
      }
      // Otherwise, use this row if the cost is greater than or equal to this row's cost
      // and less than the next row's cost
      return totalConstructionCost >= row.construction_cost && totalConstructionCost < nextRow.construction_cost;
    });

    if (!scale) {
      // If no scale found, use the last row if the cost is greater than all rows
      if (totalConstructionCost >= designFeeScale[designFeeScale.length - 1].construction_cost) {
        scale = designFeeScale[designFeeScale.length - 1];
      } else {
        console.warn('No matching fee scale found for total construction cost:', {
          totalConstructionCost,
          discipline,
          structure: structure.name,
          availableScales: designFeeScale.map(s => s.construction_cost)
        });
        // Return a default rate of 0.05 (5%) if no matching scale
        return { adjustedRate: 0.05 };
      }
    }

    // Get the base rate (prime consultant rate) from the scale
    const baseRate = scale.prime_consultant_rate;

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

    // Calculate the fee using the discipline's fraction of the prime consultant rate
    const disciplineRate = baseRate * (fractionRate / 100);

    // Get and apply the duplicate rate
    const duplicateRate = getDuplicateRate(structure, duplicateStructureRates);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Calculated fee scale:', {
        structure: structure.name,
        discipline,
        totalConstructionCost,
        disciplineConstructionCost,
        baseRate,
        fractionRate,
        disciplineRate,
        duplicateRate,
        finalRate: disciplineRate * duplicateRate
      });
    }

    // Add logging before returning the final rate
    const finalRate = disciplineRate * duplicateRate;
    console.log('Fee scale calculation result:', {
      structure: structure.name,
      discipline,
      baseRate,
      fractionRate,
      disciplineRate,
      duplicateRate,
      finalRate,
      totalConstructionCost,
      disciplineConstructionCost
    });

    return { adjustedRate: finalRate };
  };

  // Add logging to memoizedFeeScales calculation
  const memoizedFeeScales = useMemo(() => {
    console.log('Calculating memoizedFeeScales with inputs:', {
      structures: structures.map(s => ({
        id: s.id,
        name: s.name,
        designPercentage: s.designPercentage
      })),
      designFeeScale,
      duplicateStructureRates
    });

    const scales: Record<string, Record<string, { adjustedRate: number }>> = {};
    
    structures.forEach(structure => {
      scales[structure.id] = {};
      DISCIPLINES.forEach(discipline => {
        // Only calculate if we have fee scale data
        if (designFeeScale && designFeeScale.length > 0) {
          const result = getFeeScale(structure, discipline, designFeeScale, duplicateStructureRates);
          console.log('Fee scale calculation result:', {
            structure: structure.name,
            discipline,
            result,
            totalConstructionCost: constructionCosts[structure.id]?.['Total'],
            disciplineConstructionCost: constructionCosts[structure.id]?.[discipline]
          });
          scales[structure.id][discipline] = result;
        }
      });
    });
    
    return scales;
  }, [structures, DISCIPLINES, designFeeScale, duplicateStructureRates, constructionCosts]);

  // Update calculateDisciplineFee to handle structure updates
  const calculateDisciplineFee = useCallback((
    structure: Structure,
    discipline: string,
    phase: 'design' | 'construction',
    returnRawCost: boolean = false
  ): { fee: number; rate: number } => {
    // Add logging for fee calculation inputs
    console.log('calculateDisciplineFee inputs:', {
      structure: structure.name,
      discipline,
      phase,
      returnRawCost,
      feeScale: memoizedFeeScales[structure.id]?.[discipline],
      constructionCosts: constructionCosts[structure.id]?.[discipline]
    });

    // Get the memoized fee scale
    const feeScale = memoizedFeeScales[structure.id]?.[discipline];
    
    // Early return if no fee scale data
    if (!feeScale || feeScale.adjustedRate === 0) {
      console.log('No fee scale data or zero rate:', { structure: structure.name, discipline, feeScale });
      return { fee: 0, rate: 0 };
    }

    // Calculate the percentage based on phase
    const percentage = phase === 'design' 
      ? (structure.designPercentage ?? 80) / 100 
      : (100 - (structure.designPercentage ?? 80)) / 100;
    
    // Calculate discipline-specific construction cost for this structure
    const totalConstructionCost = structure.levels.reduce((total, level) =>
      level.spaces.reduce((levelTotal, space) => {
        const fee = space.totalConstructionCosts.find(f => f.discipline === discipline);
        if (fee) {
          const spaceConstructionCost = fee.costPerSqft * space.floorArea;
          // Add logging for construction cost calculation
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

    // If returnRawCost is true, return the raw construction cost
    if (returnRawCost) {
      return { fee: totalConstructionCost, rate: 0 };
    }
    
    // Calculate the fee using the memoized rate
    const calculatedFee = totalConstructionCost * (feeScale.adjustedRate / 100) * percentage;
    
    // Add logging for final fee calculation
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

  // Memoized functions
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
        // Find the fee regardless of active state
        const fee = space.totalConstructionCosts.find(f => f.discipline === discipline);
        if (!fee) return levelSum;

        const { fee: calculatedFee } = memoizedCalculateFee(structure, discipline, 'design');
        // Only add to total if fee is active
        return levelSum + (fee.isActive ? calculatedFee : 0);
      }, 0);
    }, 0);
  }, [memoizedCalculateFee]);

  // Update calculateServiceFee to handle services without spaces
  const calculateServiceFee = useCallback((service: TrackedService, discipline: string, structureId: string): number => {
    // Add service fee calculation logging
    console.log('calculateServiceFee called:', {
      service: service.service_name,
      discipline,
      structureId,
      hasCustomFee: service.customFee !== undefined,
      minFee: service.min_fee,
      rate: service.rate,
      defaultIncluded: service.default_included,
      phase: service.phase
    });

    // Find the structure
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return 0;

    // If service has a custom fee, use that
    if (service.customFee !== undefined) {
      return service.customFee;
    }

    // If service has a min_fee, use that as base
    let calculatedFee = service.min_fee ?? 0;

    // If service has a rate, calculate based on total design fees
    if (service.rate !== null && service.rate !== undefined) {
      // Calculate total design fees for this discipline
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

      // Calculate fee based on rate applied to total design fees
      calculatedFee = totalDesignFees * (service.rate / 100);
    }

    // Apply fee increment if specified
    if (service.fee_increment) {
      const remainder = calculatedFee % service.fee_increment;
      if (remainder > 0) {
        calculatedFee = calculatedFee + (service.fee_increment - remainder);
      }
    }

    // Use min_fee if calculated fee is less
    if (service.min_fee && calculatedFee < service.min_fee) {
      calculatedFee = service.min_fee;
    }

    // Add logging before returning the final fee
    console.log('Service fee calculation result:', {
      service: service.service_name,
      discipline,
      structureId,
      calculatedFee,
      minFee: service.min_fee,
      customFee: service.customFee,
      rate: service.rate
    });

    return calculatedFee;
  }, [structures, calculateDisciplineFee]);

  // Add logging to calculateDisciplineTotal
  const calculateDisciplineTotal = useCallback((
    structure: Structure,
    discipline: string,
    phase: 'design' | 'construction'
  ): Record<string, number> => {
    console.log('calculateDisciplineTotal called with:', {
      structure: structure.name,
      discipline,
      phase,
      constructionCosts: constructionCosts[structure.id],
      levels: structure.levels.map(l => ({
        name: l.name,
        spaces: l.spaces.map(s => ({
          name: s.name,
          floorArea: s.floorArea,
          fees: s.totalConstructionCosts.filter(f => f.discipline === discipline)
        }))
      }))
    });

    // Calculate space fees for this discipline using the constructionCosts prop
    const spaceFeesTotal = structure.levels.length > 0 ? structure.levels.reduce((levelTotal, level) => {
      return levelTotal + level.spaces.reduce((spaceTotal, space) => {
        // Get the construction cost, defaulting to 0 if not found
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
        
        // Add logging for space fee calculation
        console.log('Space fee calculation:', {
          structure: structure.name,
          level: level.name,
          space: space.name,
          discipline,
          phase,
          constructionCost,
          floorArea: space.floorArea,
          calculatedFee,
          isNaN: isNaN(calculatedFee)
        });

        return spaceTotal + calculatedFee;
      }, 0);
    }, 0) : 0;

    // Calculate service fees for this discipline
    const serviceFeesTotal = trackedServices
      .filter(service => 
        service.discipline === discipline && 
        service.phase === phase && 
        service.default_included && 
        service.min_fee !== null &&
        !service.construction_admin
      )
      .reduce((total, service) => {
        const calculatedFee = calculateServiceFee(service, discipline, structure.id);
        
        // Add logging for service fee calculation
        console.log('Service fee calculation:', {
          structure: structure.name,
          service: service.service_name,
          discipline,
          phase,
          calculatedFee,
          isNaN: isNaN(calculatedFee)
        });

        return total + calculatedFee;
      }, 0);

    const total = spaceFeesTotal + serviceFeesTotal;

    // Add logging for final totals
    console.log('Discipline total calculation result:', {
      structure: structure.name,
      discipline,
      phase,
      spaceFeesTotal,
      serviceFeesTotal,
      total,
      isNaN: isNaN(total)
    });

    return {
      spaceFees: spaceFeesTotal,
      serviceFees: serviceFeesTotal,
      total: total
    };
  }, [hasConstructionAdminServices, trackedServices, calculateServiceFee, calculateDisciplineFee, constructionCosts]);

  // Then add the memoized discipline totals calculation
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

  // Memoize the calculateProjectSummary function
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

  // Add the design percentage handler before it's used
  const handleDesignPercentageUpdate = useCallback((structureId: string, newPercentage: number) => {
    // Update the structure's design percentage in the parent component
    onFeeUpdate(structureId, '', '', '', { designPercentage: newPercentage } as Partial<Fee>, phase);
  }, [onFeeUpdate, phase]);

  // Update renderGrandTotals to handle the new totals structure
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
                <div className="w-8" /> {/* Spacer for checkbox column */}
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

  // Memoize the renderTrackedServices function
  const renderTrackedServices = useCallback((structureId: string, phase: 'design' | 'construction') => {
    console.log('=== renderTrackedServices ===');
    console.log('Input:', { structureId, phase });
    console.log('Structure ID comparison:', {
      targetStructureId: structureId,
      targetStructureIdType: typeof structureId,
      trackedServices: trackedServices.map(s => ({
        id: s.id,
        name: s.service_name,
        structureId: s.structureId,
        structureIdType: typeof s.structureId,
        matches: s.structureId === structureId,
        exactComparison: `${s.structureId} === ${structureId}`,
        length: s.structureId?.length,
        targetLength: structureId?.length
      }))
    });

    // Filter services based on phase, structure, and construction admin status
    const filteredServices = trackedServices.filter(service => {
      const matchesPhase = service.phase === phase;
      const matchesStructure = service.structureId === structureId;
      const notConstructionAdmin = !service.construction_admin;
      const hasFeeValues = service.min_fee !== null || service.rate !== null || service.fee_increment !== null;

      return matchesPhase && matchesStructure && notConstructionAdmin && hasFeeValues;
    });

    // If no services to display, return null
    if (filteredServices.length === 0) {
      console.log('No services to display after filtering');
      return null;
    }

    // Group services by name
    const servicesByName = filteredServices.reduce((acc, service) => {
      if (!acc[service.service_name]) {
        acc[service.service_name] = [];
      }
      acc[service.service_name].push(service);
      return acc;
    }, {} as Record<string, TrackedService[]>);

    return (
      <div className="mt-4 space-y-2">
        {Object.entries(servicesByName).map(([serviceName, services]) => (
          <div key={serviceName} className="grid grid-cols-6 gap-2 px-4">
            {/* Description column */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 ml-4">
              <Home className="w-3.5 h-3.5 text-primary/50" />
              <span className="text-sm">{serviceName}</span>
            </div>
            
            {/* Discipline columns */}
            {DISCIPLINES.map((discipline: string) => {
              // Find the service for this discipline
              const service = services.find(s => s.discipline === discipline);
              
              if (!service) {
                return <div key={discipline} className="h-10" />;
              }

              const calculatedFee = calculateServiceFee(service, discipline, structureId);
              const displayFee = service.customFee !== undefined ? service.customFee : calculatedFee;
              const hasCustomFee = service.customFee !== undefined && service.customFee !== calculatedFee;

              return (
                <div key={`${service.id}-${discipline}`} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    {hasCustomFee && service.default_included && (
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-primary"
                        title="Revert to calculated fee"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onServiceFeeUpdate) {
                            onServiceFeeUpdate(service.id, discipline, undefined, phase);
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
                        if (onServiceFeeUpdate && service.default_included) {
                          const value = e.target.value.replace(/[^0-9.-]+/g, '');
                          const numericValue = parseFloat(value) || 0;
                          onServiceFeeUpdate(service.id, discipline, numericValue, phase);
                        }
                      }}
                      className={`text-right pr-2 bg-transparent ${!service.default_included ? 'text-gray-400' : ''}`}
                      disabled={!service.default_included}
                    />
                  </div>
                  <div className="w-8" /> {/* Spacer for alignment with space toggles */}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }, [trackedServices, DISCIPLINES, calculateServiceFee, formatCurrency, onServiceFeeUpdate]);

  // Update renderTotalsRow to use memoized discipline totals
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
              <div className="w-8" /> {/* Spacer for checkbox column */}
            </div>
          ))}
        </div>
      </div>
    );
  }, [memoizedDisciplineTotals, formatCurrency, DISCIPLINES]);

  // Memoize the renderSummaryPanel function
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
                {/* Design Phase Summary */}
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

                {/* Construction Phase Summary */}
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

                {/* Project Grand Total */}
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Project Grand Total</span>
                    <span className="font-medium text-lg">{formatCurrency(summary.projectTotal)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
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

  // Add helper function to get service fees for a discipline
  const getServiceFeesForDiscipline = (structureId: string, discipline: string): number => {
    const fees = trackedServices
      .filter((service): service is TrackedService & { min_fee: number } => 
        service.default_included &&
        service.min_fee !== null && 
        service.discipline === discipline
      )
      .reduce((sum, service) => sum + service.min_fee, 0);
    
    return fees;
  };

  // Add helper function to determine if spaces should be shown for a discipline
  const shouldShowSpacesForDiscipline = (discipline: string): boolean => {
    if (phase === 'design') return true; // Always show spaces in design phase
    
    // In construction phase, only show spaces if there are construction admin services
    return hasConstructionAdminServices;
  };

  // Update the renderSpacesForDiscipline function to properly handle return type
  const renderSpacesForDiscipline = (structure: Structure, discipline: string): JSX.Element[] => {
    if (!shouldShowSpacesForDiscipline(discipline)) return [];

    return structure.levels.flatMap(level => 
      level.spaces.map((space: Space): JSX.Element | null => {
        // Find the fee regardless of active state
        const fee = space.totalConstructionCosts.find((f: Fee) => f.discipline === discipline);
        if (!fee) return null;

        // Calculate the current fee value regardless of active state
        const tempStructure: Structure = {
          ...structure,
          levels: [{
            ...level,
            spaces: [space]
          }]
        };
        const { fee: calculatedFee } = memoizedCalculateFee(tempStructure, discipline, phase);
        // For display, use manual override if it exists and fee is active, otherwise use calculated fee
        const displayFee = fee?.isActive && fee.designFee !== undefined 
          ? fee.designFee 
          : calculatedFee;
        // Only show revert icon if this specific fee has been manually edited and is active
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

  // Update handleFeeToggle to only recalculate affected discipline
  const handleFeeToggle = useCallback((
    structureId: string,
    levelId: string,
    spaceId: string,
    feeId: string,
    isActive: boolean,
    feePhase: 'design' | 'construction'
  ) => {
    // Find the fee to get its discipline
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    const level = structure.levels.find(l => l.id === levelId);
    if (!level) return;

    const space = level.spaces.find(s => s.id === spaceId);
    if (!space) return;

    const fee = space.totalConstructionCosts.find(f => f.id === feeId);
    if (!fee) return;

    console.log('FixedFees: handleFeeToggle called with:', {
      structureId,
      levelId,
      spaceId,
      feeId,
      isActive,
      feePhase,
      currentFee: fee,
      spaceName: space.name,
      discipline: fee.discipline
    });

    // Use the dedicated toggle handler if available
    if (onDisciplineFeeToggle) {
      console.log('FixedFees: Calling onDisciplineFeeToggle');
      onDisciplineFeeToggle(structureId, levelId, spaceId, feeId, isActive);
    } else {
      // Fallback to onFeeUpdate but only update isActive
      console.log('FixedFees: Falling back to onFeeUpdate');
      onFeeUpdate(structureId, levelId, spaceId, feeId, { isActive }, feePhase);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('FixedFees: Toggled fee:', {
        structureId,
        levelId,
        spaceId,
        feeId,
        discipline: fee.discipline,
        isActive,
        phase: feePhase,
        spaceName: space.name
      });
    }
  }, [structures, onDisciplineFeeToggle, onFeeUpdate]);

  // Add effect to log when structures prop changes
  useEffect(() => {
    console.log('FixedFees: structures prop changed:', {
      structures: structures.map(s => ({
        id: s.id,
        name: s.name,
        levels: s.levels.map(l => ({
          id: l.id,
          name: l.name,
          spaces: l.spaces.map(sp => ({
            id: sp.id,
            name: sp.name,
            fees: sp.totalConstructionCosts.map(f => ({
              id: f.id,
              discipline: f.discipline,
              isActive: f.isActive
            }))
          }))
        }))
      }))
    });
  }, [structures]);

  // Helper function to get manual fee override for a given structure, discipline, and optional space
  // Usage: getManualOverride(structureId, discipline, spaceId)
  const getManualOverride = (
    structureId: string,
    discipline: string,
    spaceId?: string
  ): ManualFeeOverride | undefined => {
    return manualFeeOverrides.find(o =>
      o.structureId === structureId &&
      o.discipline === discipline &&
      (!spaceId || o.spaceId === spaceId)
    );
  };

  return (
    <div className="space-y-8">
      {/* Project Summary Panel */}
      {renderSummaryPanel()}

      {structures.map(structure => (
        <Card key={structure.id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{structure.name}</h2>
            {renderPhasePercentages(structure)}
          </div>

          {/* Design Phase Section */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">Design Phase</h3>
            
            {/* Design Phase Headers */}
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
                        // For display, use manual override if it exists and fee is active, otherwise use calculated fee
                        const displayFee = fee?.isActive && fee.designFee !== undefined 
                          ? fee.designFee 
                          : calculatedDesignFee;
                        // Only show revert icon if this specific fee has been manually edited and is active
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

            {/* Design Phase Services */}
            <div className="mt-8 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Design Phase Services</h4>
              {renderTrackedServices(structure.id, 'design')}
            </div>

            {/* Design Phase Totals */}
            {renderTotalsRow(structure, 'design')}
          </div>

          {/* Construction Phase Section */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">Construction Phase</h3>
            
            {/* Construction Phase Headers */}
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
                        // For display, use manual override if it exists and fee is active, otherwise use calculated fee
                        const displayFee = fee?.isActive && fee?.constructionFee !== undefined 
                          ? fee.constructionFee 
                          : calculatedConstructionFee;
                        // Only show revert icon if this specific fee has been manually edited and is active
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

            {/* Construction Phase Services */}
            <div className="mt-8 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Construction Phase Services</h4>
              {renderTrackedServices(structure.id, 'construction')}
            </div>

            {/* Construction Phase Totals */}
            {renderTotalsRow(structure, 'construction')}
          </div>

          {/* Structure Grand Totals */}
          {renderGrandTotals(structure)}
        </Card>
      ))}
    </div>
  );
}