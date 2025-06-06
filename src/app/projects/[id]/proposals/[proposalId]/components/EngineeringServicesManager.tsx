"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { TrackedService } from '../types';

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

  // Debug state for tracking drag and drop operations
  const [debugState, setDebugState] = useState<{
    lastAction: string;
    serviceId: string | null;
    oldIncluded: boolean | null;
    newIncluded: boolean | null;
    timestamp: number | null;
    error?: string;
  }>({
    lastAction: 'initialized',
    serviceId: null,
    oldIncluded: null,
    newIncluded: null,
    timestamp: null
  });

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
        ts.phase === service.phase &&
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
        phase: service.phase || 'design',
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

  // Filter services into included and excluded
  const includedServices = trackedServices.filter(service => service.isIncluded);
  const excludedServices = trackedServices.filter(service => !service.isIncluded);

  // Debug state update helper
  const updateDebugState = (action: string, service: TrackedService | null, oldIncluded: boolean | null, newIncluded: boolean | null, error?: string) => {
    console.log('Debug State Update:', { action, serviceId: service?.id, oldIncluded, newIncluded, error });
    setDebugState({
      lastAction: action,
      serviceId: service?.id || null,
      oldIncluded,
      newIncluded,
      timestamp: Date.now(),
      error
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, service: TrackedService) => {
    console.log('Drag Start:', service);
    updateDebugState('drag_start', service, service.isIncluded, null);
    setIsDragging(true);
    setDraggedService(service);
    
    const dragData = {
      type: 'engineering_service',
      service: {
        ...service,
        isIncluded: service.isIncluded
      }
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag End:', draggedService);
    if (draggedService) {
      updateDebugState('drag_end', draggedService, draggedService.isIncluded, null);
    }
    setIsDragging(false);
    setDraggedService(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, isIncluded: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    console.log('Drag Over:', { isIncluded, draggedService });
    updateDebugState('drag_over', draggedService, draggedService?.isIncluded || null, isIncluded);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetIncluded: boolean) => {
    console.log('=== DROP EVENT START ===');
    console.log('Target Included:', targetIncluded);
    
    if (!draggedService) {
      console.error('No dragged service in state');
      updateDebugState('drop_error', null, null, null, 'No dragged service in state');
      return;
    }

    updateDebugState('drop_start', draggedService, draggedService.isIncluded, targetIncluded);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      console.log('Drop Data:', data);
      
      if (!data) {
        throw new Error('No data received in drop event');
      }

      const dragData = JSON.parse(data);
      console.log('Parsed Drag Data:', dragData);
      
      if (dragData.type !== 'engineering_service' || !dragData.service) {
        throw new Error('Invalid drag data format');
      }

      const draggedService = dragData.service as TrackedService;
      const oldIncluded = draggedService.isIncluded;

      const existingService = trackedServices.find(s => s.id === draggedService.id);
      if (!existingService) {
        throw new Error('Service not found in tracked services');
      }

      console.log('Existing Service Found:', {
        id: existingService.id,
        name: existingService.service_name,
        currentIsIncluded: existingService.isIncluded,
        willBeIncluded: targetIncluded,
        structureId
      });

      updateDebugState('drop_processing', draggedService, oldIncluded, targetIncluded);

      const updatedServices = trackedServices.map(s => {
        if (s.id === draggedService.id) {
          console.log('Updating service:', { 
            id: s.id, 
            name: s.service_name,
            oldIncluded: s.isIncluded, 
            newIncluded: targetIncluded,
            phase: s.phase,
            isConstructionAdmin: s.isConstructionAdmin,
            structureId
          });
          return { 
            ...s, 
            isIncluded: targetIncluded,
            structureId
          };
        }
        return s;
      });

      console.log('Updated Services Array:', updatedServices.map(s => ({
        id: s.id,
        name: s.service_name,
        isIncluded: s.isIncluded,
        phase: s.phase,
        isConstructionAdmin: s.isConstructionAdmin,
        structureId: s.structureId
      })));

      await onServicesChange(updatedServices);
      
      console.log('=== DROP EVENT COMPLETE ===');
      updateDebugState('drop_complete', draggedService, oldIncluded, targetIncluded);
      
      setIsDragging(false);
      setDraggedService(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during drop';
      console.error('Drop Error:', error);
      updateDebugState('drop_error', draggedService, draggedService?.isIncluded || null, null, errorMessage);
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
    <div className="space-y-4">
      {/* Debug Display */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg shadow-lg z-50 text-xs font-mono">
        <div>Last Action: {debugState.lastAction}</div>
        {debugState.serviceId && (
          <>
            <div>Service ID: {debugState.serviceId}</div>
            <div>Old Included: {String(debugState.oldIncluded)}</div>
            <div>New Included: {String(debugState.newIncluded)}</div>
          </>
        )}
        {debugState.error && (
          <div className="text-red-400">Error: {debugState.error}</div>
        )}
        {debugState.timestamp && (
          <div>Time: {new Date(debugState.timestamp).toLocaleTimeString()}</div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4">
        {/* Included Services */}
        <div
          ref={includedDropRef}
          className={`p-4 rounded-lg border ${
            isDragging ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drag Enter Included');
          }}
          onDragOver={(e) => handleDragOver(e, true)}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drag Leave Included');
          }}
          onDrop={(e) => handleDrop(e, true)}
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
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drag Enter Excluded');
          }}
          onDragOver={(e) => handleDragOver(e, false)}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drag Leave Excluded');
          }}
          onDrop={(e) => handleDrop(e, false)}
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