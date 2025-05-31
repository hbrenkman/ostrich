import { FC, useState, useEffect } from 'react';
import { Building2, Layers, Home, ChevronDown, ChevronRight, Check, RotateCcw } from 'lucide-react';
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
  service_name: string;
  discipline: string;
  default_included: boolean;
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  phase: 'design' | 'construction';
  customFee?: number;
}

interface FixedFeesProps {
  structures: Structure[];
  phase: 'design' | 'construction';
  onFeeUpdate: (structureId: string, levelId: string, spaceId: string, feeId: string, updates: Partial<Fee>, feePhase: 'design' | 'construction') => void;
  onCalculateFee: (structure: Structure, discipline: string, phase: 'design' | 'construction', returnRawCost?: boolean) => { fee: number; rate: number };
  onDesignPercentageChange?: (structureId: string, percentage: number) => void;
  trackedServices?: TrackedService[];
  onServiceFeeUpdate?: (serviceId: string, discipline: string, fee: number | undefined, phase: 'design' | 'construction') => void;
}

export default function FixedFees({ 
  structures, 
  phase, 
  onFeeUpdate, 
  onCalculateFee, 
  onDesignPercentageChange, 
  trackedServices = [],
  onServiceFeeUpdate 
}: FixedFeesProps) {
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

  const renderTrackedServices = (structureId: string, phase: 'design' | 'construction') => {
    // Filter services for this phase and structure
    const services = trackedServices.filter(service => 
      service.phase === phase && 
      service.default_included && 
      service.min_fee !== null
    );

    if (services.length === 0) return null;

    // Group services by name
    const servicesByName = services.reduce((acc, service) => {
      if (!acc[service.service_name]) {
        acc[service.service_name] = [];
      }
      acc[service.service_name].push(service);
      return acc;
    }, {} as Record<string, TrackedService[]>);

    // Helper function to calculate total design fees for a discipline
    const getTotalDesignFeesForDiscipline = (structure: Structure, discipline: string): number => {
      console.log('\n=== Calculating Total Design Fees ===');
      console.log('Structure:', structure.name);
      console.log('Discipline:', discipline);

      const totalDesignFees = structure.levels.reduce((total, level) => {
        const levelTotal = level.spaces.reduce((levelSum, space) => {
          // Get the fee for this discipline in this space
          const fee = space.fees.find(f => f.discipline === discipline && f.isActive);
          if (!fee) {
            console.log('No active fee found for space:', {
              space: space.name,
              discipline
            });
            return levelSum;
          }

          // Calculate design fee for this space
          const { fee: designFee } = onCalculateFee(structure, discipline, 'design');
          console.log('Space design fee calculation:', {
            space: space.name,
            discipline,
            designFee
          });

          return levelSum + designFee;
        }, 0);

        console.log('Level total:', {
          level: level.name,
          total: levelTotal
        });

        return total + levelTotal;
      }, 0);

      console.log('Final total design fees:', {
        structure: structure.name,
        discipline,
        totalDesignFees
      });

      return totalDesignFees;
    };

    // Helper function to calculate service fee
    const calculateServiceFee = (service: TrackedService, discipline: string): number => {
      console.log('\n=== Calculating Service Fee ===');
      console.log('Service:', {
        name: service.service_name,
        discipline: service.discipline,
        min_fee: service.min_fee,
        rate: service.rate,
        fee_increment: service.fee_increment,
        phase: service.phase
      });

      // Get the structure for this service
      const structure = structures.find(s => s.id === structureId);
      if (!structure) {
        console.error('Structure not found:', structureId);
        return 0;
      }

      // Get total design fees for this discipline
      const totalDesignFees = getTotalDesignFeesForDiscipline(structure, discipline);
      console.log('Total design fees:', {
        discipline,
        totalDesignFees
      });

      // If no rate, use min_fee
      if (!service.rate) {
        console.log('Using min_fee due to missing rate:', {
          rate: service.rate,
          min_fee: service.min_fee
        });
        return service.min_fee || 0;
      }

      // Calculate fee based on rate applied to total design fees
      let calculatedFee = totalDesignFees * (service.rate / 100);
      console.log('Initial fee calculation:', {
        totalDesignFees,
        rate: service.rate,
        rateAsDecimal: service.rate / 100,
        calculatedFee
      });

      // Apply fee increment if specified
      if (service.fee_increment) {
        const remainder = calculatedFee % service.fee_increment;
        if (remainder > 0) {
          calculatedFee = calculatedFee + (service.fee_increment - remainder);
        }
        console.log('After fee increment:', {
          fee_increment: service.fee_increment,
          remainder,
          adjustedFee: calculatedFee
        });
      }

      // Use min_fee if calculated fee is less
      if (service.min_fee && calculatedFee < service.min_fee) {
        console.log('Using min_fee as calculated fee is lower:', {
          calculatedFee,
          min_fee: service.min_fee
        });
        calculatedFee = service.min_fee;
      }

      console.log('Final service fee:', {
        service: service.service_name,
        discipline,
        calculatedFee
      });

      return calculatedFee;
    };

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
            {DISCIPLINES.map(discipline => {
              // Find the service for this discipline
              const service = services.find(s => s.discipline === discipline);
              if (!service) {
                return <div key={discipline} className="h-10" />;
              }

              const calculatedFee = calculateServiceFee(service, discipline);
              const displayFee = service.customFee !== undefined ? service.customFee : calculatedFee;

              return (
                <div key={discipline} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    {service.customFee !== undefined && (
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-primary"
                        title="Revert to calculated fee"
                        onClick={() => {
                          if (onServiceFeeUpdate) {
                            onServiceFeeUpdate(service.id, discipline, undefined, phase);
                          }
                        }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Input
                      type="text"
                      value={formatCurrency(displayFee)}
                      onChange={(e) => {
                        if (onServiceFeeUpdate) {
                          const value = e.target.value.replace(/[^0-9.-]+/g, '');
                          const numericValue = parseFloat(value) || 0;
                          onServiceFeeUpdate(service.id, discipline, numericValue, phase);
                        }
                      }}
                      className="text-right pr-2 bg-transparent"
                    />
                  </div>
                  <div className="w-8 flex items-center justify-center">
                    <button
                      type="button"
                      className={`p-1.5 rounded-md transition-colors ${service.default_included ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={service.default_included ? "Disable service" : "Enable service"}
                      onClick={() => {
                        if (onServiceFeeUpdate) {
                          onServiceFeeUpdate(service.id, discipline, service.default_included ? 0 : calculatedFee, phase);
                        }
                      }}
                    >
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
                        className="w-4 h-4"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
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

  return (
    <div className="space-y-8">
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
                  {level.spaces.map(space => (
                    <div key={`design-${space.id}`} className="space-y-2">
                      <div className="grid grid-cols-6 gap-2 px-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Home className="w-3.5 h-3.5 text-primary/50" />
                          <span className="text-sm font-medium">{space.name}</span>
                        </div>
                        {DISCIPLINES.map(discipline => {
                          const fee = space.fees.find(f => f.discipline === discipline);
                          // Create a temporary structure with just this space to calculate its fee
                          const tempStructure: Structure = {
                            ...structure,
                            levels: [{
                              ...level,
                              spaces: [space]
                            }]
                          };
                          // Calculate design fee for this specific space
                          const { fee: calculatedDesignFee } = onCalculateFee(tempStructure, discipline, 'design');
                          const displayFee = fee?.isActive ? (fee.designFee ?? calculatedDesignFee) : 0;
                          
                          return (
                            <div key={discipline} className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2">
                                {fee?.designFee !== undefined && (
                                  <button
                                    type="button"
                                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-primary"
                                    title="Revert to calculated fee"
                                    onClick={() => {
                                      if (onFeeUpdate && fee) {
                                        onFeeUpdate(structure.id, level.id, space.id, fee.id, { designFee: undefined }, 'design');
                                      }
                                    }}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <Input
                                  type="text"
                                  value={formatCurrency(displayFee)}
                                  onChange={(e) => {
                                    if (onFeeUpdate && fee) {
                                      const value = e.target.value.replace(/[^0-9.-]+/g, '');
                                      const numericValue = parseFloat(value) || 0;
                                      onFeeUpdate(structure.id, level.id, space.id, fee.id, { designFee: numericValue }, 'design');
                                    }
                                  }}
                                  className="text-right pr-2 bg-transparent"
                                />
                              </div>
                              <div className="w-8 flex items-center justify-center">
                                {fee && (
                                  <button
                                    type="button"
                                    className={`p-1.5 rounded-md transition-colors ${fee.isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-400 hover:bg-gray-100'}`}
                                    title={fee.isActive ? "Disable discipline" : "Enable discipline"}
                                    onClick={() => {
                                      if (onFeeUpdate) {
                                        onFeeUpdate(structure.id, level.id, space.id, fee.id, { isActive: !fee.isActive }, 'design');
                                      }
                                    }}
                                  >
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
                                      className="w-4 h-4"
                                    >
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
              {structure.levels.map(level => (
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
                  {level.spaces.map(space => (
                    <div key={`construction-${space.id}`} className="space-y-2">
                      <div className="grid grid-cols-6 gap-2 px-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Home className="w-3.5 h-3.5 text-primary/50" />
                          <span className="text-sm font-medium">{space.name}</span>
                        </div>
                        {DISCIPLINES.map(discipline => {
                          const fee = space.fees.find(f => f.discipline === discipline);
                          // Create a temporary structure with just this space to calculate its fee
                          const tempStructure: Structure = {
                            ...structure,
                            levels: [{
                              ...level,
                              spaces: [space]
                            }]
                          };
                          // Calculate construction fee for this specific space
                          const { fee: calculatedConstructionFee } = onCalculateFee(tempStructure, discipline, 'construction');
                          const displayFee = fee?.isActive ? (fee.constructionFee ?? calculatedConstructionFee) : 0;
                          
                          return (
                            <div key={discipline} className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2">
                                {fee?.constructionFee !== undefined && (
                                  <button
                                    type="button"
                                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-primary"
                                    title="Revert to calculated fee"
                                    onClick={() => {
                                      if (onFeeUpdate && fee) {
                                        onFeeUpdate(structure.id, level.id, space.id, fee.id, { constructionFee: undefined }, 'construction');
                                      }
                                    }}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <Input
                                  type="text"
                                  value={formatCurrency(displayFee)}
                                  onChange={(e) => {
                                    if (onFeeUpdate && fee) {
                                      const value = e.target.value.replace(/[^0-9.-]+/g, '');
                                      const numericValue = parseFloat(value) || 0;
                                      onFeeUpdate(structure.id, level.id, space.id, fee.id, { constructionFee: numericValue }, 'construction');
                                    }
                                  }}
                                  className="text-right pr-2 bg-transparent"
                                />
                              </div>
                              <div className="w-8 flex items-center justify-center">
                                {fee && (
                                  <button
                                    type="button"
                                    className={`p-1.5 rounded-md transition-colors ${fee.isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-400 hover:bg-gray-100'}`}
                                    title={fee.isActive ? "Disable discipline" : "Enable discipline"}
                                    onClick={() => {
                                      if (onFeeUpdate) {
                                        onFeeUpdate(structure.id, level.id, space.id, fee.id, { isActive: !fee.isActive }, 'construction');
                                      }
                                    }}
                                  >
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
                                      className="w-4 h-4"
                                    >
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
          </div>
        </Card>
      ))}
    </div>
  );
}