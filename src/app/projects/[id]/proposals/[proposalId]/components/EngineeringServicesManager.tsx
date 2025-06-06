"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { TrackedService } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the interface based on the API route
interface EngineeringService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  isIncludedInFee: boolean;
  isDefaultIncluded: boolean;
  phase: 'design' | 'construction';
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  isConstructionAdmin: boolean;
}

interface EngineeringServicesManagerProps {
  proposalId: string;
  structureId: string;
  onServicesChange: (services: TrackedService[]) => void;
  initialTrackedServices?: TrackedService[];
}

export function EngineeringServicesManager({
  proposalId,
  structureId,
  onServicesChange,
  initialTrackedServices = []
}: EngineeringServicesManagerProps) {
  // State for managing services
  const [standardServices, setStandardServices] = useState<EngineeringService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedService, setDraggedService] = useState<TrackedService | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

  // Refs for drop zones
  const includedDropRef = useRef<HTMLDivElement>(null);
  const excludedDropRef = useRef<HTMLDivElement>(null);

  // Fetch standard services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/engineering-services');
        if (!response.ok) {
          throw new Error('Failed to fetch engineering services');
        }
        const data = await response.json();
        setStandardServices(data.services || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load services');
        console.error('Error fetching services:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Convert standard services to tracked services
  const trackedServices = useMemo(() => {
    const result = standardServices.map(service => {
      const existingService = initialTrackedServices.find(ts => 
        ts.serviceId === service.id && 
        (ts.phase === service.phase || (ts.phase === null && service.phase === 'design')) &&
        ts.structureId === structureId
      );

      return {
        id: existingService?.id || crypto.randomUUID(),
        serviceId: service.id,
        service_name: service.service_name,
        name: service.service_name,
        discipline: service.discipline,
        isDefaultIncluded: service.isDefaultIncluded,
        min_fee: service.min_fee,
        rate: service.rate,
        fee_increment: service.fee_increment,
        phase: service.phase,
        isConstructionAdmin: service.isConstructionAdmin,
        fee: service.min_fee || 0,
        structureId: structureId,
        levelId: '',
        spaceId: '',
        isIncluded: existingService ? existingService.isIncluded : service.isDefaultIncluded,
        customFee: existingService?.customFee
      };
    });
    return result;
  }, [standardServices, initialTrackedServices, structureId]);

  // Get unique disciplines from tracked services
  const disciplines = useMemo(() => {
    const uniqueDisciplines = new Set(trackedServices.map(service => service.discipline));
    return ['all', ...Array.from(uniqueDisciplines).sort()];
  }, [trackedServices]);

  // Filter services based on selected discipline only
  const filteredServices = useMemo(() => {
    return trackedServices.filter(service => 
      selectedDiscipline === 'all' || service.discipline === selectedDiscipline
    );
  }, [trackedServices, selectedDiscipline]);

  // Filter services into included and excluded
  const includedServices = filteredServices.filter(service => service.isIncluded);
  const excludedServices = filteredServices.filter(service => !service.isIncluded);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, service: TrackedService) => {
    console.log('Drag Start:', service);
    setIsDragging(true);
    setDraggedService(service);
    
    // Set the full service data with the correct type
    const dragData = {
      type: 'engineering_service',
      service: service
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag End:', draggedService);
    setIsDragging(false);
    setDraggedService(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, isIncluded: boolean) => {
    e.preventDefault();
    
    // Check if we have the correct data type
    const hasJsonData = e.dataTransfer.types.includes('application/json');
    if (!hasJsonData) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    console.log('Drag Over:', { isIncluded, draggedService });
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetIncluded: boolean, structureId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedService) {
      console.error('No dragged service in state');
      return;
    }

    try {
      console.log('=== DROP EVENT START ===');
      console.log('Dragged Service:', {
        id: draggedService.id,
        name: draggedService.service_name,
        currentIsIncluded: draggedService.isIncluded,
        targetIsIncluded: targetIncluded
      });

      // Update the service's isIncluded status
      const updatedServices = trackedServices.map(s => {
        if (s.id === draggedService.id) {
          const updatedService = { 
            ...s, 
            isIncluded: targetIncluded,
            structureId
          };
          console.log('Service Update:', {
            before: {
              id: s.id,
              name: s.service_name,
              isIncluded: s.isIncluded
            },
            after: {
              id: updatedService.id,
              name: updatedService.service_name,
              isIncluded: updatedService.isIncluded
            }
          });
          return updatedService;
        }
        return s;
      });

      // Verify the update
      const updatedService = updatedServices.find(s => s.id === draggedService.id);
      console.log('Verification:', {
        serviceFound: !!updatedService,
        isIncluded: updatedService?.isIncluded,
        expectedIsIncluded: targetIncluded
      });

      console.log('Calling onServicesChange with updated services');
      await onServicesChange(updatedServices);
      
      console.log('=== DROP EVENT COMPLETE ===');
      
      setIsDragging(false);
      setDraggedService(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during drop';
      console.error('Drop Error:', error);
    }
  };

  // Group services by discipline
  const groupServicesByDiscipline = (services: TrackedService[]): Record<string, TrackedService[]> => {
    return services.reduce((acc, service) => {
      const discipline = service.discipline;
      if (!acc[discipline]) {
        acc[discipline] = [];
      }
      acc[discipline].push(service);
      return acc;
    }, {} as Record<string, TrackedService[]>);
  };

  // Render individual service item
  const renderServiceItem = (service: TrackedService) => (
    <div
      key={service.id}
      draggable
      onDragStart={(e) => handleDragStart(e, service)}
      onDragEnd={handleDragEnd}
      className={`flex items-center justify-between p-2 rounded-md cursor-move hover:bg-gray-100 dark:hover:bg-gray-800 ${
        isDragging && draggedService?.id === service.id ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div>
          <div className="text-sm font-medium">{service.service_name}</div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive bg-destructive/10 rounded-md">
        <p className="font-medium">Error loading services</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Engineering Services</h2>
        <Select
          value={selectedDiscipline}
          onValueChange={setSelectedDiscipline}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by discipline" />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map(discipline => (
              <SelectItem 
                key={discipline} 
                value={discipline}
              >
                {discipline === 'all' ? 'All Disciplines' : discipline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4">
        {/* Included Services */}
        <div
          ref={includedDropRef}
          className={`p-4 rounded-lg border ${
            isDragging ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragOver(e, true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drop on Included zone');
            handleDrop(e, true, structureId);
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Included Services</h3>
          {includedServices.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No services included</div>
          ) : (
            <div className="p-1 space-y-1">
              {Object.entries(groupServicesByDiscipline(includedServices)).map(([discipline, services]) => (
                <div key={discipline} className="border-b border-green-500/10 last:border-0">
                  <div className="px-2 py-1 bg-green-500/5">
                    <h4 className="text-xs font-medium text-green-600 dark:text-green-400">{discipline}</h4>
                  </div>
                  {services.map(renderServiceItem)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Excluded Services */}
        <div
          ref={excludedDropRef}
          className={`p-4 rounded-lg border ${
            isDragging ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragOver(e, false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drop on Excluded zone');
            handleDrop(e, false, structureId);
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Excluded Services</h3>
          {excludedServices.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No services excluded</div>
          ) : (
            <div className="p-1 space-y-1">
              {Object.entries(groupServicesByDiscipline(excludedServices)).map(([discipline, services]) => (
                <div key={discipline} className="border-b border-red-500/10 last:border-0">
                  <div className="px-2 py-1 bg-red-500/5">
                    <h4 className="text-xs font-medium text-red-600 dark:text-red-400">{discipline}</h4>
                  </div>
                  {services.map(renderServiceItem)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 