import { FC, useState, useEffect } from 'react';
import { Building2, Layers, Home, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface DesignFeeScale {
  id: number;
  construction_cost: number;
  prime_consultant_fee: number;
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
  fees: Array<{
    id: string;
    discipline: string;
    totalFee: number;
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
  isActive: boolean;
  totalFee: number;
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
  service_name: string;
  discipline: string;
  included_in_fee: boolean;
  min_fee: number | null;
  rate: number | null;
}

interface FixedFeesProps {
  structures: Structure[];
  phase: 'design' | 'construction';
  onFeeUpdate: (structureId: string, levelId: string, spaceId: string, feeId: string, updates: Partial<Fee>) => void;
  onCalculateFee: (structure: Structure, discipline: string, phase: 'design' | 'construction') => { fee: number; rate: number };
  onDesignPercentageChange?: (structureId: string, percentage: number) => void;
  trackedServices?: TrackedService[];
}

export default function FixedFees({ structures, phase, onFeeUpdate, onCalculateFee, onDesignPercentageChange, trackedServices = [] }: FixedFeesProps) {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
              onDesignPercentageChange?.(structure.id, newPercentage);
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

  const DISCIPLINES = [
    'Civil',
    'Electrical',
    'Mechanical',
    'Plumbing',
    'Structural'
  ];

  const renderTrackedServices = (structureId: string) => {
    // Filter services for this structure's discipline
    const structureServices = trackedServices.filter((service): service is TrackedService & { min_fee: number } => 
      service.included_in_fee && service.min_fee !== null
    );

    if (!structureServices.length) return null;

    // Group services by name and accumulate fees by discipline
    const groupedServices = structureServices.reduce((acc, service) => {
      const existingService = acc.find(s => s.service_name === service.service_name);
      if (existingService) {
        // Add fee to the appropriate discipline
        existingService.fees[service.discipline] = (existingService.fees[service.discipline] || 0) + service.min_fee;
      } else {
        // Create new service entry
        acc.push({
          id: service.id,
          service_name: service.service_name,
          fees: {
            [service.discipline]: service.min_fee
          }
        });
      }
      return acc;
    }, [] as Array<{ id: string; service_name: string; fees: Record<string, number> }>);

    return (
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Included Engineering Services</h3>
        <div className="space-y-2">
          {groupedServices.map(service => (
            <div key={service.id} className="grid grid-cols-6 gap-2 px-4">
              <div className="flex items-center p-2 bg-gray-50 rounded-md">
                <div className="text-sm font-medium">{service.service_name}</div>
              </div>
              {DISCIPLINES.map(discipline => (
                <div key={discipline} className="flex items-center">
                  <div className="flex-1 flex justify-end pr-10">
                    {service.fees[discipline] > 0 && (
                      <div className="text-sm font-medium">
                        {formatCurrency(service.fees[discipline])}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add helper function to get service fees for a discipline
  const getServiceFeesForDiscipline = (structureId: string, discipline: string): number => {
    const fees = trackedServices
      .filter((service): service is TrackedService & { min_fee: number } => 
        service.included_in_fee && 
        service.min_fee !== null && 
        service.discipline === discipline
      )
      .reduce((sum, service) => sum + service.min_fee, 0);
    
    console.log(`Service fees for ${discipline}:`, fees); // Debug log
    return fees;
  };

  return (
    <div className="space-y-4">
      {structures.map(structure => (
        <Card key={structure.id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{structure.name}</h2>
            {renderPhasePercentages(structure)}
          </div>

          {/* Add discipline headers at structure level with Description column */}
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
              <div key={level.id} className="space-y-2">
                <div className="grid grid-cols-6 gap-2 px-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Building2 className="w-3.5 h-3.5 text-primary/50" />
                    <span className="text-sm font-medium">{level.name}</span>
                  </div>
                  {/* Empty cells for discipline columns */}
                  {DISCIPLINES.map(discipline => (
                    <div key={discipline} className="h-10" />
                  ))}
                </div>
                {level.spaces.map(space => (
                  <div key={space.id} className="grid grid-cols-6 gap-2 px-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 ml-4">
                      <Home className="w-3.5 h-3.5 text-primary/50" />
                      <span className="text-sm">{space.name}</span>
                    </div>
                    {DISCIPLINES.map(discipline => {
                      const fee = space.fees.find(f => f.discipline === discipline);
                      if (!fee) return <div key={discipline} className="h-10" />;

                      // Calculate the fee for this discipline and phase
                      const { fee: calculatedFee, rate } = onCalculateFee(
                        structure,
                        discipline,
                        phase
                      );

                      // Calculate the space's portion of the fee based on its area
                      const totalStructureArea = structure.levels.reduce((total, level) => 
                        total + level.spaces.reduce((levelTotal, space) => levelTotal + (space.floorArea || 0), 0), 0);
                      const spacePortion = totalStructureArea > 0 ? (space.floorArea || 0) / totalStructureArea : 0;
                      const spaceFee = calculatedFee * spacePortion;

                      return (
                        <div key={discipline} className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={fee.isActive ? formatCurrency(spaceFee) : ''}
                              className="text-right pr-2 bg-transparent"
                              readOnly
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => onFeeUpdate(structure.id, level.id, space.id, fee.id, { isActive: !fee.isActive })}
                            className={`p-1.5 rounded-md transition-colors ${fee.isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                            title={fee.isActive ? "Disable discipline" : "Enable discipline"}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Add tracked services after the levels and spaces */}
          {renderTrackedServices(structure.id)}
        </Card>
      ))}
    </div>
  );
}
