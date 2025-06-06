"use client";

import { useState, useEffect, DragEvent, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Plus, Trash2, Link2, Unlink, GripVertical, PlusCircle, Pencil } from 'lucide-react';
import { AddStandardServiceDialog } from '@/components/dialogs/add-standard-service-dialog';
import { AddAdditionalServiceDialog } from '@/components/dialogs/add-additional-service-dialog';

interface EngineeringStandardService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  isIncludedInFee: boolean;
  isDefaultIncluded: boolean;
  phase: 'design' | 'construction' | null;
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  isConstructionAdmin: boolean;
}

interface EngineeringAdditionalService {
  id: string;
  name: string;
  description: string;
  discipline: string | null;
  phase: 'design' | 'construction' | null;
  default_min_value: number;
  rate: number;
  is_active: boolean;
}

interface ServiceLink {
  id: string;
  engineering_service_id: string;
  additional_item_id: string;
  link_type: 'engineering_service' | 'fee_additional_item';
}

export function EngineeringServicesTable() {
  const [standardServices, setStandardServices] = useState<EngineeringStandardService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [showAddStandardDialog, setShowAddStandardDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editService, setEditService] = useState<EngineeringStandardService | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch data...');

      // Fetch standard services
      console.log('Fetching standard services...');
      const standardResponse = await fetch('/api/engineering-services', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!standardResponse.ok) {
        const errorData = await standardResponse.json().catch(() => null);
        console.error('Standard services error:', {
          status: standardResponse.status,
          statusText: standardResponse.statusText,
          errorData
        });
        throw new Error(errorData?.error || `Failed to fetch standard services: ${standardResponse.status} ${standardResponse.statusText}`);
      }

      const standardData = await standardResponse.json();
      console.log('Standard services data:', standardData);
      setStandardServices(standardData.services || []);
      console.log('All data fetched successfully');
    } catch (err) {
      console.error('Error in fetchData:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStandardService = async (service: {
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee?: 'included' | 'additional_service';
    default_setting?: boolean;
    phase?: 'design' | 'construction';
  }) => {
    try {
      console.log('Attempting to add standard service:', service);
      const response = await fetch('/api/engineering-services', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...service,
          phase: service.phase || 'design',
          default_setting: service.default_setting ?? false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.error || `Failed to add standard service: ${response.status} ${response.statusText}`);
      }

      const newService = await response.json();
      console.log('Successfully added service:', newService);
      setStandardServices(prev => [...prev, newService]);
    } catch (err) {
      console.error('Error in handleAddStandardService:', err);
      setError(err instanceof Error ? err.message : 'Failed to add standard service');
      throw err;
    }
  };

  const handleEditStandardService = (service: EngineeringStandardService) => {
    console.log('=== Edit Standard Service Dialog Data ===');
    console.log('Service being edited:', {
      id: service.id,
      discipline: service.discipline,
      service_name: service.service_name,
      description: service.description,
      isIncludedInFee: service.isIncludedInFee,
      phase: service.phase,
      min_fee: service.min_fee,
      rate: service.rate
    });
    setEditService(service);
    setShowAddStandardDialog(true);
  };

  const handleUpdateStandardService = async (serviceId: string, serviceData: {
    discipline: string;
    service_name: string;
    description: string;
    isIncludedInFee?: boolean;
    isDefaultIncluded?: boolean;
    phase?: 'design' | 'construction';
    min_fee?: number | null;
    rate?: number | null;
    fee_increment?: number | null;
    isConstructionAdmin?: boolean;
  }) => {
    try {
      console.log('Updating standard service:', { serviceId, serviceData });
      
      const response = await fetch(`/api/engineering-services?id=${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...serviceData,
          isIncludedInFee: serviceData.isIncludedInFee ?? false,
          isDefaultIncluded: serviceData.isDefaultIncluded ?? false,
          phase: serviceData.phase || 'design',
          min_fee: serviceData.min_fee || null,
          rate: serviceData.rate || null,
          fee_increment: serviceData.fee_increment || null,
          isConstructionAdmin: serviceData.isConstructionAdmin ?? false
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update service');
      }

      const updatedService = await response.json();
      console.log('Service updated successfully:', updatedService);

      // Update the local state with the complete updated service
      setStandardServices(prevServices => {
        const updatedServices = prevServices.map(service => 
          service.id === serviceId ? { ...service, ...updatedService } : service
        );
        
        // If the discipline filter is set to the old discipline and there are no more services with that discipline,
        // reset it to 'all'
        const oldService = prevServices.find(s => s.id === serviceId);
        if (oldService && selectedDiscipline === oldService.discipline) {
          const hasOldDiscipline = updatedServices.some(s => s.discipline === oldService.discipline);
          if (!hasOldDiscipline) {
            setSelectedDiscipline('all');
          }
        }
        
        return updatedServices;
      });

      // Reset edit state
      setEditService(null);
      setShowAddStandardDialog(false);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  };

  const handleDeleteStandardService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const response = await fetch(`/api/engineering-services?id=${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to delete service: ${response.status} ${response.statusText}`);
      }

      setStandardServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleOpenStandardServiceDialog = () => {
    setEditService(null);
    setShowAddStandardDialog(true);
  };

  const handleToggleDefaultIncluded = async (serviceId: string, currentValue: boolean) => {
    try {
      const service = standardServices.find(s => s.id === serviceId);
      if (!service) return;

      await handleUpdateStandardService(serviceId, {
        discipline: service.discipline,
        service_name: service.service_name,
        description: service.description,
        isIncludedInFee: service.isIncludedInFee,
        isDefaultIncluded: !currentValue,
        phase: service.phase || 'design',
        min_fee: service.min_fee,
        rate: service.rate
      });
    } catch (error) {
      console.error('Error toggling default included:', error);
      setError(error instanceof Error ? error.message : 'Failed to update service');
    }
  };

  const handleToggleConstructionAdmin = async (serviceId: string, currentValue: boolean) => {
    try {
      const service = standardServices.find(s => s.id === serviceId);
      if (!service) return;

      await handleUpdateStandardService(serviceId, {
        discipline: service.discipline,
        service_name: service.service_name,
        description: service.description,
        isIncludedInFee: service.isIncludedInFee,
        isDefaultIncluded: service.isDefaultIncluded,
        phase: service.phase || 'design',
        min_fee: service.min_fee,
        rate: service.rate,
        fee_increment: service.fee_increment,
        isConstructionAdmin: !currentValue
      });
    } catch (error) {
      console.error('Error toggling construction admin:', error);
      setError(error instanceof Error ? error.message : 'Failed to update service');
    }
  };

  // Filter and group services based on search query and selected discipline
  const filteredServices = useMemo(() => {
    return standardServices.filter(service => {
      const matchesSearch = searchQuery === '' || 
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDiscipline = selectedDiscipline === 'all' || 
        service.discipline === selectedDiscipline;

      return matchesSearch && matchesDiscipline;
    });
  }, [standardServices, searchQuery, selectedDiscipline]);

  const groupedServices = useMemo(() => {
    const groups: { [key: string]: EngineeringStandardService[] } = {};
    filteredServices.forEach(service => {
      if (!groups[service.discipline]) {
        groups[service.discipline] = [];
      }
      groups[service.discipline].push(service);
    });
    return groups;
  }, [filteredServices]);

  const disciplines = useMemo(() => {
    const uniqueDisciplines = new Set(standardServices.map(service => service.discipline));
    return ['all', ...Array.from(uniqueDisciplines).sort()];
  }, [standardServices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    <div className="flex flex-col h-full">
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-none space-y-4 sticky top-0 bg-pure-white border-b z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Engineering Services</CardTitle>
              <button
                type="button"
                onClick={handleOpenStandardServiceDialog}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <PlusCircle
                  className="h-5 w-5 text-muted-foreground hover:text-primary"
                />
              </button>
            </div>
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
          <div className="relative">
            <Input
              type="search"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-6">
            {Object.entries(groupedServices).map(([discipline, services]) => (
              <div key={discipline} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground bg-background py-1">
                  {discipline}
                </h3>
                <div className="space-y-2">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{service.service_name}</h4>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant={service.isIncludedInFee ? "default" : "secondary"}>
                                    {service.phase || 'No phase'}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Phase: {service.phase || 'Not set'}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {service.isIncludedInFee 
                                      ? "Blue badge indicates this service is included in project scope"
                                      : "Gray badge indicates this service is an additional service"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {service.isConstructionAdmin && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Construction Admin
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This service affects construction administration fee calculations</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Discipline</p>
                              <p>{service.discipline}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Fee Type</p>
                              <p>{service.isIncludedInFee ? 'Included in Project Scope' : 'Additional Service'}</p>
                            </div>
                            {!service.isIncludedInFee && (
                              <>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Minimum Fee</p>
                                  <p>{service.min_fee ? `$${service.min_fee.toLocaleString()}` : 'Not set'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Rate</p>
                                  <p>{service.rate ? `${service.rate.toFixed(2)}% of construction cost` : 'Not set'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Fee Increment</p>
                                  <p>{service.fee_increment ? `$${service.fee_increment.toLocaleString()}` : 'Not set'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={service.isConstructionAdmin}
                                      onCheckedChange={() => handleToggleConstructionAdmin(service.id, service.isConstructionAdmin)}
                                      className="data-[state=checked]:bg-yellow-500"
                                    />
                                    <span className="text-xs text-muted-foreground">Construction Admin</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="font-medium">Construction Administration</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {service.isConstructionAdmin 
                                      ? "This service will affect construction administration fee calculations"
                                      : "This service will not affect construction administration fee calculations"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Click to {service.isConstructionAdmin ? "disable" : "enable"} construction admin fee calculation
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={service.isDefaultIncluded}
                                      onCheckedChange={() => handleToggleDefaultIncluded(service.id, service.isDefaultIncluded)}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                    <span className="text-xs text-muted-foreground">Default</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="font-medium">Default Service Setting</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {service.isDefaultIncluded 
                                      ? "This service will be automatically included in new proposals"
                                      : "This service will not be included by default in new proposals"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Click to {service.isDefaultIncluded ? "disable" : "enable"} automatic inclusion
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditStandardService(service)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteStandardService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedServices).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery 
                  ? "No services found matching your search."
                  : "No services found for the selected discipline."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddStandardServiceDialog
        open={showAddStandardDialog}
        onOpenChange={setShowAddStandardDialog}
        onAdd={handleAddStandardService}
        onEdit={editService ? (id, data) => handleUpdateStandardService(id, data) : undefined}
        editMode={!!editService}
        serviceData={editService || undefined}
      />
    </div>
  );
} 