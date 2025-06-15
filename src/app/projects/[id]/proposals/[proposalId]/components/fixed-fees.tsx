"use client";

import React, { useEffect, useState } from 'react';
import { Building2, Layers, Home } from 'lucide-react';
import { useProposalStore } from '@/store/proposal';
import type { Structure, Level, Space, FeeScale, base_fee } from '@/types/proposal/base';
import { DISCIPLINES, type DisciplineKey } from '@/types/proposal/base';
import type { tracked_service } from '@/types/proposal/service';

// Define TrackedServices type
type TrackedServices = Record<string, tracked_service[]>;

// Define FeeDuplicateStructure type
interface FeeDuplicateStructure {
  structure_id: string;
  duplicate_number: number;
  rate: number;
}

interface FixedFeesProps {
  structures: Structure[];
  phase: 'design' | 'construction';
  on_structures_change: (structures: Structure[]) => void;
  tracked_services: TrackedServices;
  has_construction_admin_services: boolean;
  duplicate_structure_rates: FeeDuplicateStructure[];
  construction_costs: Record<string, Record<string, number>>;
  on_fee_update: (structure_id: string, level_id: string, space_id: string, fee_id: string, updates: Partial<base_fee>, phase: 'design' | 'construction') => void;
  on_service_fee_update?: (service_id: string, discipline: string, fee: number, phase: 'design' | 'construction') => void;
  on_discipline_fee_toggle?: (structure_id: string, level_id: string, space_id: string, discipline: string, is_active: boolean) => void;
}

export function FixedFees({ phase, on_structures_change, tracked_services, has_construction_admin_services, duplicate_structure_rates, construction_costs, on_fee_update, on_service_fee_update, on_discipline_fee_toggle }: Omit<FixedFeesProps, 'structures'>) {
  console.log('FixedFees: Component mounted');
  const { structures } = useProposalStore();
  const [visibleDisciplines, setVisibleDisciplines] = useState<DisciplineKey[]>(['Architectural', 'Mechanical', 'Plumbing', 'Electrical', 'Structural']);
  const [feeScales, setFeeScales] = useState<FeeScale[]>([]);
  const [isLoadingFeeScales, setIsLoadingFeeScales] = useState(false);
  const [feeScaleError, setFeeScaleError] = useState<string | null>(null);

  // Log component render and props
  useEffect(() => {
    console.log('FixedFees: Component mounted/updated', {
      structuresCount: structures?.length ?? 0,
      visibleDisciplines,
      hasStructures: !!structures,
      isArray: Array.isArray(structures),
      phase
    });
  }, [structures, visibleDisciplines, phase]);

  // Fetch fee scales on component mount
  useEffect(() => {
    const fetchFeeScales = async () => {
      try {
        setIsLoadingFeeScales(true);
        const response = await fetch('/api/design-fee-scale', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch design fee scales');
        }

        const data = await response.json();
        console.log('FixedFees: Fetched fee scales:', data);
        setFeeScales(data);
      } catch (err) {
        console.error('FixedFees: Error fetching fee scales:', err);
        setFeeScaleError(err instanceof Error ? err.message : 'Failed to load fee scales');
      } finally {
        setIsLoadingFeeScales(false);
      }
    };

    fetchFeeScales();
  }, []);

  // Add helper function
  const calculateSpaceTotalCost = (space: Space): number => {
    const totalCost = space.construction_costs.Total;
    return totalCost && totalCost.is_active && typeof totalCost.cost_per_sqft === 'number'
      ? totalCost.cost_per_sqft * (space.floor_area || 0)
      : 0;
  };

  // Helper function to calculate fees for a discipline in a space
  const calculateDisciplineFees = (space: Space, discipline: DisciplineKey): number => {
    console.log('Starting fee calculation for discipline:', {
      discipline,
      spaceId: space.id,
      structureId: space.structure_id
    });

    // Find the structure this space belongs to
    const structure = structures.find(s => s.id === space.structure_id);
    if (!structure) {
      console.warn('FixedFees: Structure not found for space', {
        spaceId: space.id,
        structureId: space.structure_id,
        availableStructureIds: structures.map(s => s.id)
      });
      return 0;
    }

    // Verify we have a valid fee scale
    if (!structure.fee_scale || !structure.fee_scale.id) {
      console.warn('FixedFees: No valid fee scale found for structure', {
        structureId: structure.id,
        structureName: structure.name,
        totalCost: structure.total_construction_cost,
        hasFeeScale: !!structure.fee_scale,
        feeScaleId: structure.fee_scale?.id
      });
      return 0;
    }

    console.log('Found structure with valid fee scale:', {
      structureId: structure.id,
      structureName: structure.name,
      feeScaleId: structure.fee_scale.id,
      totalCost: structure.total_construction_cost
    });

    // Get or initialize discipline fees
    let disciplineFees = space.discipline_engineering_fees.find(df => df.discipline === discipline);
    if (!disciplineFees) {
      console.log('Creating new discipline fees entry for:', discipline);
      disciplineFees = {
        discipline,
        fees: []
      };
      space.discipline_engineering_fees.push(disciplineFees);
    }

    // Calculate fees based on the structure's fee scale
    const totalCost = calculateSpaceTotalCost(space);
    const floorArea = space.floor_area || 0;

    // Get the appropriate rate from the fee scale
    let rate = 0;
    switch (discipline.toLowerCase()) {
      case 'mechanical':
        rate = structure.fee_scale.fraction_of_prime_rate_mechanical;
        break;
      case 'plumbing':
        rate = structure.fee_scale.fraction_of_prime_rate_plumbing;
        break;
      case 'electrical':
        rate = structure.fee_scale.fraction_of_prime_rate_electrical;
        break;
      case 'structural':
        rate = structure.fee_scale.fraction_of_prime_rate_structural;
        break;
      default:
        console.warn('FixedFees: Unknown discipline for fee calculation:', discipline);
        return 0;
    }

    console.log('Calculating fees with fee scale:', {
      discipline,
      spaceId: space.id,
      totalCost,
      floorArea,
      rate,
      feeScaleId: structure.fee_scale.id
    });

    // Calculate the fee based on the discipline's rate from the fee scale
    const fee = totalCost * (rate / 100);
    return fee;
  };

  // Helper function to get discipline rate from fee scale
  const getDisciplineRate = (discipline: DisciplineKey, feeScale: FeeScale): number => {
    switch (discipline) {
      case 'Architectural':
        return feeScale.prime_consultant_rate;
      case 'Mechanical':
        return feeScale.prime_consultant_rate * feeScale.fraction_of_prime_rate_mechanical;
      case 'Plumbing':
        return feeScale.prime_consultant_rate * feeScale.fraction_of_prime_rate_plumbing;
      case 'Electrical':
        return feeScale.prime_consultant_rate * feeScale.fraction_of_prime_rate_electrical;
      case 'Structural':
        return feeScale.prime_consultant_rate * feeScale.fraction_of_prime_rate_structural;
      default:
        return 0;
    }
  };

  // Add logging for component renders and structure data
  useEffect(() => {
    console.log('FixedFees: Component rendered', {
      structuresCount: structures.length,
      visibleDisciplines: visibleDisciplines.map(d => ({
        key: d,
        name: DISCIPLINES[d].name,
        is_active: DISCIPLINES[d].is_active
      })),
      structures: structures.map(s => ({
        id: s.id,
        name: s.name,
        levelsCount: s.levels.length,
        levels: s.levels.map(l => ({
          id: l.id,
          number: l.level_number,
          spacesCount: l.spaces.length
        }))
      }))
    });
  }, [structures, visibleDisciplines]);

  // Add logging for fee scales - only when we have valid structures
  useEffect(() => {
    // Skip logging if structures is not yet available
    if (!structures || !Array.isArray(structures) || structures.length === 0) {
      return;
    }

    console.group('Fee Scale Verification');
    console.log('Verifying fee scales for structures:', {
      totalStructures: structures.length,
      timestamp: new Date().toISOString()
    });

    structures.forEach((structure, index) => {
      if (!structure) {
        console.warn(`Fee Scale Verification: Structure at index ${index} is undefined`);
        return;
      }

      const hasFeeScale = !!structure.fee_scale;
      console.log(`Structure ${index + 1}/${structures.length}: ${structure.name} (${structure.id})`, {
        hasFeeScale,
        fee_scale: hasFeeScale ? {
          id: structure.fee_scale.id,
          construction_cost: structure.fee_scale.construction_cost,
          prime_consultant_rate: structure.fee_scale.prime_consultant_rate,
          mechanical_rate: structure.fee_scale.fraction_of_prime_rate_mechanical,
          plumbing_rate: structure.fee_scale.fraction_of_prime_rate_plumbing,
          electrical_rate: structure.fee_scale.fraction_of_prime_rate_electrical,
          structural_rate: structure.fee_scale.fraction_of_prime_rate_structural,
          last_updated: structure.fee_scale.updated_at
        } : 'No fee scale set',
        total_construction_cost: structure.total_construction_cost,
        is_duplicate: structure.is_duplicate,
        duplicate_number: structure.duplicate_number,
        duplicate_rate: structure.duplicate_rate
      });
    });
    console.groupEnd();
  }, [structures]);

  // Render discipline header
  const renderDisciplineHeader = () => (
    <div className="grid grid-cols-[300px_repeat(auto-fit,minmax(150px,1fr))] gap-4 p-2 bg-gray-50 dark:bg-gray-800/50">
      <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">Structure / Level / Space</div>
      {visibleDisciplines.map(discipline => (
        <div 
          key={discipline}
          className={`font-medium text-center ${
            DISCIPLINES[discipline].is_active 
              ? 'text-gray-900 dark:text-[#E5E7EB]' 
              : 'text-gray-400 dark:text-gray-500 italic'
          }`}
          title={DISCIPLINES[discipline].is_active ? undefined : 'Inactive discipline'}
        >
          {DISCIPLINES[discipline].name}
        </div>
      ))}
    </div>
  );

  // Render a single space
  const renderSpace = (space: Space) => {
    console.log('FixedFees: Rendering space', { 
      spaceId: space.id, 
      spaceName: space.name,
      disciplineFees: space.discipline_engineering_fees,
      floorArea: space.floor_area,
      constructionCosts: space.construction_costs
    });

    // Calculate total construction cost using cost_per_sqft from Total construction cost
    const costPerSqft = space.construction_costs?.Total?.cost_per_sqft ?? 0;
    const totalCost = costPerSqft * space.floor_area;

    return (
      <div key={space.id} className="grid grid-cols-[300px_repeat(auto-fit,minmax(150px,1fr))] gap-4 p-2">
        <div className="pl-12 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/5 rounded-md">
              <Home className="w-4 h-4 text-primary/70" />
            </div>
            <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">
              {space.name}
            </div>
          </div>
          <div className="pl-8 text-xs font-medium text-[#4DB6AC]">
            {space.floor_area > 0 ? (
              <>
                <div>Floor Area: <span className="font-bold">{space.floor_area.toLocaleString()} sq ft</span></div>
                <div>Total Cost: <span className="font-bold">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              </>
            ) : (
              <div>No floor area specified</div>
            )}
          </div>
        </div>
        {visibleDisciplines.map(discipline => {
          const fee = calculateDisciplineFees(space, discipline);
          console.log('FixedFees: Rendering discipline fee', {
            spaceId: space.id,
            discipline: discipline,
            fee,
            isActive: DISCIPLINES[discipline].is_active
          });
          return (
            <div 
              key={discipline}
              className={`text-center ${
                DISCIPLINES[discipline].is_active 
                  ? 'text-gray-900 dark:text-[#E5E7EB]' 
                  : 'text-gray-400 dark:text-gray-500 italic'
              }`}
            >
              <span>${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render a single level
  const renderLevel = (level: Level) => {
    console.log('FixedFees: Rendering level', { levelId: level.id, levelNumber: level.level_number });
    return (
      <div key={level.id}>
        <div className="grid grid-cols-[300px] gap-4 p-2 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="pl-8 flex items-center gap-2">
            <div className="p-1.5 bg-primary/5 rounded-md">
              <Layers className="w-4 h-4 text-primary/70" />
            </div>
            <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">
              Level {level.level_number}
            </div>
          </div>
        </div>
        {level.spaces.map(renderSpace)}
      </div>
    );
  };

  // Render a single structure
  const renderStructure = (structure: Structure) => {
    console.log('FixedFees: Rendering structure', { structureId: structure.id, structureName: structure.name });
    return (
      <div key={structure.id} className="mb-4">
        <div className="grid grid-cols-[300px] gap-4 p-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#4DB6AC]/10 rounded">
              <Building2 className="w-5 h-5 text-[#4DB6AC]" />
            </div>
            <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">
              {structure.name}
            </div>
          </div>
        </div>
        {structure.levels.map(renderLevel)}
      </div>
    );
  };

  console.log('FixedFees: About to render component', { structuresCount: structures.length });

  return (
    <div className="space-y-4">
      {structures.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No structures available
        </div>
      ) : (
        <>
          {renderDisciplineHeader()}
          {structures.map(renderStructure)}
        </>
      )}
    </div>
  );
}
