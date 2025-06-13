"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GripVertical, ChevronRight, ChevronDown, Building2, Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { EngineeringService, EngineeringServicesManagerProps } from '@/types/proposal/shared';
import type { tracked_service } from '@/types/proposal/service';

export function EngineeringServicesManager({
  proposalId,
  structureId,
  onServicesChange,
  initialTrackedServices = [],
  isCollapsed = true,
  onCollapseChange
}: EngineeringServicesManagerProps) {
  // State for managing services
  const [standardServices, setStandardServices] = useState<EngineeringService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedService, setDraggedService] = useState<tracked_service | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackedServices, setTrackedServices] = useState<tracked_service[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);

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

  // Update tracked services when standard services or initial tracked services change
  useEffect(() => {
    if (!standardServices.length) return;

    const newTrackedServices = standardServices.map(service => {
      const existingService = initialTrackedServices.find(ts => 
        ts.service_id === service.id && 
        (ts.phase === service.phase || (ts.phase === null && service.phase === 'design')) &&
        ts.structure_id === structureId
      );

      return {
        id: existingService?.id || crypto.randomUUID(),
        service_id: service.id,
        service_name: service.service_name,
        name: service.service_name,
        discipline: service.discipline,
        description: service.description,
        is_default_included: service.isDefaultIncluded,
        min_fee: service.min_fee,
        rate: service.rate,
        fee_increment: service.fee_increment,
        phase: service.phase,
        is_construction_admin: service.isConstructionAdmin,
        fee: service.min_fee || 0,
        structure_id: structureId,
        level_id: '',
        space_id: '',
        is_included: existingService ? existingService.is_included : service.isDefaultIncluded,
        custom_fee: existingService?.custom_fee,
        estimated_fee: null,
        is_active: true
      } as tracked_service;
    });

    setTrackedServices(newTrackedServices);
  }, [standardServices, initialTrackedServices, structureId]);

  // Get unique disciplines from tracked services
  const uniqueDisciplines = useMemo(() => {
    const uniqueDisciplines = new Set(trackedServices.map(service => service.discipline));
    return ['all', ...Array.from(uniqueDisciplines).sort()];
  }, [trackedServices]);

  // Update the filtering logic to handle both discipline and search
  const filteredServices = useMemo(() => {
    return trackedServices.filter(service => {
      const matchesDiscipline = selectedDiscipline === 'all' || service.discipline === selectedDiscipline;
      const matchesSearch = searchQuery === '' || 
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDiscipline && matchesSearch;
    });
  }, [trackedServices, selectedDiscipline, searchQuery]);

  // Filter services into included and excluded
  const includedServices = filteredServices.filter(service => service.is_included);
  const excludedServices = filteredServices.filter(service => !service.is_included);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, service: tracked_service) => {
    console.log('Drag start:', service);
    setIsDragging(true);
    setDraggedService(service);
    
    // Use a simpler data transfer method
    e.dataTransfer.setData('text/plain', service.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag end');
    setIsDragging(false);
    setDraggedService(null);
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, isIncluded: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always allow drop if we have a dragged service
    if (draggedService) {
      e.dataTransfer.dropEffect = 'move';
      // Add visual feedback
      const dropZone = e.currentTarget;
      dropZone.classList.add('ring-2', 'ring-offset-2', isIncluded ? 'ring-green-500' : 'ring-red-500');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Remove visual feedback
    const dropZone = e.currentTarget;
    dropZone.classList.remove('ring-2', 'ring-offset-2', 'ring-green-500', 'ring-red-500');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetIncluded: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop event:', { targetIncluded, draggedService });

    // Remove visual feedback
    const dropZone = e.currentTarget;
    dropZone.classList.remove('ring-2', 'ring-offset-2', 'ring-green-500', 'ring-red-500');

    if (!draggedService) {
      console.error('No dragged service in state');
      return;
    }

    try {
      // Update the service's isIncluded status
      const updatedServices = trackedServices.map(s => {
        if (s.id === draggedService.id) {
          console.log('Updating service:', { id: s.id, newStatus: targetIncluded });
          return { 
            ...s, 
            is_included: targetIncluded,
            structure_id: structureId
          };
        }
        return s;
      });

      // Update local state first
      setTrackedServices(updatedServices);
      
      // Then notify parent
      onServicesChange(updatedServices);
      
      setIsDragging(false);
      setDraggedService(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during drop';
      console.error('Drop Error:', error);
      setError(errorMessage);
    }
  };

  // Group services by discipline
  const groupServicesByDiscipline = (services: tracked_service[]): Record<string, tracked_service[]> => {
    return services.reduce((acc, service) => {
      const discipline = service.discipline;
      if (!acc[discipline]) {
        acc[discipline] = [];
      }
      acc[discipline].push(service);
      return acc;
    }, {} as Record<string, tracked_service[]>);
  };

  // Render individual service item
  const renderServiceItem = (service: tracked_service) => (
    <div
      key={service.id}
      draggable
      onDragStart={(e) => handleDragStart(e, service)}
      onDragEnd={handleDragEnd}
      className={`flex items-center justify-between p-2 rounded-md cursor-move transition-colors ${
        isDragging && draggedService?.id === service.id 
          ? 'opacity-50 bg-gray-100 dark:bg-gray-800' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div>
          <div className="text-sm font-medium">{service.service_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{service.description}</div>
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
    <div className="space-y-2">
      <div className="p-3 bg-gray-50/50 hover:bg-gray-50 flex items-start gap-3">
        <button
          type="button"
          onClick={() => onCollapseChange?.(!isCollapsed)}
          className="collapse-button"
          title={isCollapsed ? "Expand Engineering Services" : "Collapse Engineering Services"}
        >
          {isCollapsed ? (
            <ChevronRight className="collapse-button-icon" />
          ) : (
            <ChevronDown className="collapse-button-icon" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">Engineering Services</div>
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="relative w-[200px]">
                  <div className="search-input-wrapper">
                    <Search className="search-input-icon" />
                    <Input
                      type="text"
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <Select
                  value={selectedDiscipline}
                  onValueChange={setSelectedDiscipline}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by discipline" />
                  </SelectTrigger>
                  <SelectContent className="filter-dropdown-content">
                    <div className="filter-dropdown-header">
                      Select Discipline
                    </div>
                    {uniqueDisciplines.map(discipline => (
                      <SelectItem 
                        key={discipline} 
                        value={discipline}
                        className="filter-dropdown-item"
                      >
                        {discipline === 'all' ? (
                          <span className="flex items-center gap-2">
                            <span>All Disciplines</span>
                            <span className="text-xs text-gray-400">({filteredServices.length})</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span>{discipline}</span>
                            <span className="text-xs text-gray-400">
                              ({filteredServices.filter(s => s.discipline === discipline).length})
                            </span>
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="pl-12 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Included Services */}
            <div
              ref={includedDropRef}
              className={`p-4 rounded-lg border transition-colors ${
                isDragging 
                  ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onDragOver={(e) => handleDragOver(e, true)}
              onDragLeave={handleDragLeave}
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
              className={`p-4 rounded-lg border transition-colors ${
                isDragging 
                  ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onDragOver={(e) => handleDragOver(e, false)}
              onDragLeave={handleDragLeave}
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
      )}
    </div>
  );
} 