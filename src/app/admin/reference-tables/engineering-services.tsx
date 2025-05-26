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
  estimated_fee: string | null;
  default_setting: boolean;
  phase: 'design' | 'construction' | null;
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
  const [additionalServices, setAdditionalServices] = useState<EngineeringAdditionalService[]>([]);
  const [serviceLinks, setServiceLinks] = useState<ServiceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStandardService, setSelectedStandardService] = useState<string>('');
  const [selectedAdditionalService, setSelectedAdditionalService] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<'design' | 'construction'>('design');
  const [draggedService, setDraggedService] = useState<EngineeringAdditionalService | null>(null);
  const [hoveredStandardService, setHoveredStandardService] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [showAddStandardDialog, setShowAddStandardDialog] = useState(false);
  const [selectedAdditionalDisciplines, setSelectedAdditionalDisciplines] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editService, setEditService] = useState<{
    id: string;
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee: string | null;
    default_setting: boolean;
    phase: 'design' | 'construction' | null;
  } | null>(null);
  const [showAddAdditionalDialog, setShowAddAdditionalDialog] = useState(false);
  const [editAdditionalService, setEditAdditionalService] = useState<EngineeringAdditionalService | null>(null);

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
      console.log('Standard services response:', {
        status: standardResponse.status,
        statusText: standardResponse.statusText,
        ok: standardResponse.ok
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

      // Fetch additional services
      console.log('Fetching additional services...');
      const additionalResponse = await fetch('/api/fee-additional-items', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      console.log('Additional services response:', {
        status: additionalResponse.status,
        statusText: additionalResponse.statusText,
        ok: additionalResponse.ok
      });

      if (!additionalResponse.ok) {
        const errorData = await additionalResponse.json().catch(() => null);
        console.error('Additional services error:', {
          status: additionalResponse.status,
          statusText: additionalResponse.statusText,
          errorData
        });
        throw new Error(errorData?.error || `Failed to fetch additional services: ${additionalResponse.status} ${additionalResponse.statusText}`);
      }

      const additionalData = await additionalResponse.json();
      console.log('Additional services data:', additionalData);
      setAdditionalServices(additionalData || []);

      // Fetch service links
      console.log('Fetching service links...');
      const linksResponse = await fetch('/api/engineering-service-links', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      console.log('Service links response:', {
        status: linksResponse.status,
        statusText: linksResponse.statusText,
        ok: linksResponse.ok
      });

      if (!linksResponse.ok) {
        const errorData = await linksResponse.json().catch(() => null);
        console.error('Service links error:', {
          status: linksResponse.status,
          statusText: linksResponse.statusText,
          errorData
        });
        throw new Error(errorData?.error || `Failed to fetch service links: ${linksResponse.status} ${linksResponse.statusText}`);
      }

      const linksData = await linksResponse.json();
      console.log('Service links data:', linksData);
      setServiceLinks(linksData.links || []);

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

  const handleCreateLink = async () => {
    if (!selectedStandardService || !selectedAdditionalService) return;

    try {
      const response = await fetch('/api/engineering-service-links', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          engineering_service_id: selectedStandardService,
          additional_item_id: selectedAdditionalService,
          link_type: 'engineering_service'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create link');
      }

      const data = await response.json();
      setServiceLinks([...serviceLinks, data]);
      setSelectedStandardService('');
      setSelectedAdditionalService('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const response = await fetch('/api/engineering-service-links', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ id: linkId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      setServiceLinks(serviceLinks.filter(link => link.id !== linkId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
    }
  };

  const getLinkedServices = (serviceId: string) => {
    return serviceLinks
      .filter(link => link.engineering_service_id === serviceId)
      .map(link => {
        const additionalService = additionalServices.find(s => s.id === link.additional_item_id);
        return additionalService;
      })
      .filter((service): service is EngineeringAdditionalService => service !== undefined);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, service: EngineeringAdditionalService) => {
    setDraggedService(service);
    e.dataTransfer.setData('text/plain', service.id);
    e.dataTransfer.effectAllowed = 'link';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, standardServiceId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    setHoveredStandardService(standardServiceId);
  };

  const handleDragLeave = () => {
    setHoveredStandardService(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, standardServiceId: string) => {
    e.preventDefault();
    setHoveredStandardService(null);
    
    if (!draggedService) return;

    try {
      const response = await fetch('/api/engineering-service-links', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          engineering_service_id: standardServiceId,
          additional_item_id: draggedService.id,
          link_type: 'engineering_service'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create link');
      }

      const data = await response.json();
      setServiceLinks([...serviceLinks, data]);
      setDraggedService(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    }
  };

  // Get unique disciplines from standard services
  const disciplines = useMemo(() => {
    const uniqueDisciplines = new Set(
      standardServices
        .map(service => service.discipline)
        .filter((discipline): discipline is string => !!discipline)
    );
    return ['all', ...Array.from(uniqueDisciplines).sort()];
  }, [standardServices]);

  // Filter standard services based on selected discipline
  const filteredStandardServices = useMemo(() => {
    if (selectedDiscipline === 'all') {
      return standardServices;
    }
    return standardServices.filter(service => service.discipline === selectedDiscipline);
  }, [standardServices, selectedDiscipline]);

  // Add this with other useMemo hooks
  const filteredAndSearchedStandardServices = useMemo(() => {
    let filtered = filteredStandardServices;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.service_name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [filteredStandardServices, searchQuery]);

  // Update the grouped services to use the new filtered list
  const groupedStandardServices = useMemo(() => {
    return filteredAndSearchedStandardServices.reduce((acc, service) => {
      const discipline = service.discipline || 'Other';
      if (!acc[discipline]) {
        acc[discipline] = [];
      }
      acc[discipline].push(service);
      return acc;
    }, {} as Record<string, EngineeringStandardService[]>);
  }, [filteredAndSearchedStandardServices]);

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

  const handleAddAdditionalService = async (service: {
    name: string;
    description: string | null;
    discipline: string | null;
    phase: 'design' | 'construction' | null;
    default_min_value: number;
    rate: number;
    is_active: boolean;
  }) => {
    try {
      console.log('Raw service data received:', service);
      const requestBody = {
        ...service,
        phase: service.phase || 'design'
      };
      console.log('Request body being sent:', requestBody);
      console.log('Rate value type:', typeof requestBody.rate, 'Rate value:', requestBody.rate);
      
      const response = await fetch('/api/fee-additional-items', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestBody // Log the request body that caused the error
        });
        throw new Error(errorData?.error || `Failed to add additional service: ${response.status} ${response.statusText}`);
      }

      const newService = await response.json();
      console.log('Successfully added service:', newService);
      setAdditionalServices(prev => [...prev, newService]);
    } catch (err) {
      console.error('Error in handleAddAdditionalService:', err);
      setError(err instanceof Error ? err.message : 'Failed to add additional service');
      throw err;
    }
  };

  const handleOpenStandardServiceDialog = () => {
    console.log('Opening standard service dialog'); // Debug log
    setShowAddStandardDialog(true);
  };

  const additionalDisciplines = useMemo(() => {
    const uniqueDisciplines = new Set(
      additionalServices
        .map(service => service.discipline)
        .filter((discipline): discipline is string => !!discipline)
    );
    return Array.from(uniqueDisciplines).sort();
  }, [additionalServices]);

  const filteredAdditionalServices = useMemo(() => {
    if (selectedAdditionalDisciplines.length === 0) {
      return additionalServices;
    }
    // Check if 'multi' is selected (NULL disciplines)
    if (selectedAdditionalDisciplines.includes('multi')) {
      return additionalServices.filter(service => 
        !service.discipline || // Include NULL disciplines
        selectedAdditionalDisciplines.includes(service.discipline) // Include other selected disciplines
      );
    }
    // Regular discipline filtering
    return additionalServices.filter(service => 
      service.discipline && selectedAdditionalDisciplines.includes(service.discipline)
    );
  }, [additionalServices, selectedAdditionalDisciplines]);

  const handleDeleteStandardService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This will also remove all linked additional services.')) return;
    
    try {
      // First, get all links for this service
      const serviceLinksToDelete = serviceLinks.filter(link => link.engineering_service_id === serviceId);
      
      // Delete all links first
      for (const link of serviceLinksToDelete) {
        const unlinkResponse = await fetch('/api/engineering-service-links', {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ id: link.id }),
        });

        if (!unlinkResponse.ok) {
          throw new Error(`Failed to unlink service: ${link.id}`);
        }
      }

      // After unlinking, delete the service
      const deleteResponse = await fetch(`/api/engineering-services?id=${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete service');
      }

      // Update both states
      setServiceLinks(prev => prev.filter(link => link.engineering_service_id !== serviceId));
      setStandardServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleEditStandardService = (service: {
    id: string;
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee: string | null;
    default_setting: boolean;
    phase: 'design' | 'construction' | null;
  }) => {
    setEditService(service);
    setShowAddStandardDialog(true);
  };

  const handleUpdateStandardService = async (serviceId: string, serviceData: {
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee?: 'included' | 'additional_service';
    default_setting?: boolean;
    phase?: 'design' | 'construction';
  }) => {
    try {
      console.log('Updating standard service:', { serviceId, serviceData });
      
      const response = await fetch(`/api/engineering-services?id=${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update service');
      }

      const updatedService = await response.json();
      console.log('Service updated successfully:', updatedService);

      // Update the local state
      setStandardServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId ? { ...service, ...updatedService } : service
        )
      );

      // Reset edit state
      setEditService(null);
      setShowAddStandardDialog(false);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  };

  const handleEditAdditionalService = (service: EngineeringAdditionalService) => {
    setEditAdditionalService(service);
    setShowAddAdditionalDialog(true);
  };

  const handleDeleteAdditionalService = async (serviceId: string) => {
    // Get all links for this service first
    const serviceLinksToDelete = serviceLinks.filter(link => link.additional_item_id === serviceId);
    
    // If there are links, show a more detailed confirmation message
    if (serviceLinksToDelete.length > 0) {
      if (!confirm(`This additional service is linked to ${serviceLinksToDelete.length} standard service(s). Deleting it will remove all these links. Are you sure you want to proceed?`)) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to delete this additional service?')) {
        return;
      }
    }
    
    try {
      // Delete all links first
      for (const link of serviceLinksToDelete) {
        console.log('Deleting link:', link.id);
        const unlinkResponse = await fetch('/api/engineering-service-links', {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ id: link.id }),
        });

        if (!unlinkResponse.ok) {
          throw new Error(`Failed to unlink service: ${link.id}`);
        }
      }

      // After unlinking, delete the service
      console.log('Deleting additional service:', serviceId);
      const deleteResponse = await fetch(`/api/fee-additional-items?id=${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete service');
      }

      // Update both states
      setServiceLinks(prev => prev.filter(link => link.additional_item_id !== serviceId));
      setAdditionalServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleUpdateAdditionalService = async (serviceId: string, serviceData: {
    name: string;
    description: string | null;
    discipline: string | null;
    phase: 'design' | 'construction' | null;
    default_min_value: number;
    rate: number;
    is_active: boolean;
  }) => {
    try {
      console.log('Updating additional service:', { serviceId, serviceData });
      
      const response = await fetch(`/api/fee-additional-items?id=${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update service');
      }

      const updatedService = await response.json();
      console.log('Service updated successfully:', updatedService);

      // Update the local state
      setAdditionalServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId ? { ...service, ...updatedService } : service
        )
      );

      // Reset edit state
      setEditAdditionalService(null);
      setShowAddAdditionalDialog(false);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-destructive">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-100px)]">
        {/* Standard Services Panel */}
        <div className="overflow-auto">
          <Card className="flex flex-col h-full border-border">
            <CardHeader className="flex-none space-y-4 sticky top-0 bg-pure-white border-b z-20 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Standard Services</CardTitle>
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
                {Object.entries(groupedStandardServices).map(([discipline, services]) => (
                  <div key={discipline} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground bg-background py-1">
                      {discipline}
                    </h3>
                    <div className="space-y-2">
                      {services.map(service => {
                        const linkedServices = getLinkedServices(service.id);
                        return (
                          <div
                            key={service.id}
                            className={`p-3 rounded-lg border transition-colors flex flex-col ${
                              hoveredStandardService === service.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                            onDragOver={(e) => handleDragOver(e, service.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, service.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{service.service_name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {service.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
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
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant={service.default_setting ? "default" : "secondary"}>
                                        {service.phase || 'No phase'}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Phase: {service.phase || 'Not set'}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {service.default_setting 
                                          ? "Blue badge indicates this service is included by default in projects"
                                          : "Gray badge indicates this service is not included by default"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            {linkedServices.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <div className="text-sm text-muted-foreground mb-2">
                                  Linked Services:
                                </div>
                                <div className="space-y-1">
                                  {linkedServices.map(linkedService => (
                                    <div
                                      key={linkedService.id}
                                      className="flex items-center justify-between p-2 bg-muted/5 rounded-md"
                                    >
                                      <span className="text-sm">{linkedService.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteLink(
                                          serviceLinks.find(
                                            link => link.engineering_service_id === service.id && 
                                                   link.additional_item_id === linkedService.id
                                          )?.id || ''
                                        )}
                                      >
                                        <Unlink className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedStandardServices).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchQuery 
                      ? "No services found matching your search."
                      : "No standard services found for the selected discipline."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Services Panel */}
        <div className="overflow-auto">
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-none space-y-4 sticky top-0 bg-pure-white border-b z-20 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Additional Services</CardTitle>
                  <button
                    type="button"
                    onClick={() => setShowAddAdditionalDialog(true)}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <PlusCircle
                      className="h-5 w-5 text-muted-foreground hover:text-primary"
                    />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedAdditionalDisciplines.includes('multi') ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setSelectedAdditionalDisciplines(prev =>
                      prev.includes('multi')
                        ? prev.filter(d => d !== 'multi')
                        : [...prev, 'multi']
                    );
                  }}
                >
                  Multi
                </Badge>
                {additionalDisciplines.map(discipline => (
                  <Badge
                    key={discipline}
                    variant={selectedAdditionalDisciplines.includes(discipline) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      setSelectedAdditionalDisciplines(prev =>
                        prev.includes(discipline)
                          ? prev.filter(d => d !== discipline)
                          : [...prev, discipline]
                      );
                    }}
                  >
                    {discipline}
                  </Badge>
                ))}
                {selectedAdditionalDisciplines.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setSelectedAdditionalDisciplines([])}
                  >
                    Clear Filters
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAdditionalServices.map(service => (
                  <div
                    key={service.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, service)}
                    className="p-3 rounded-lg border border-border mb-2 last:mb-0 cursor-move hover:bg-muted/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{service.name}</span>
                            {service.phase && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant={service.is_active ? "default" : "secondary"}>
                                      {service.phase.toLowerCase()}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Phase: {service.phase}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {service.is_active 
                                        ? "Blue badge indicates this service is currently active and available for selection"
                                        : "Gray badge indicates this service is currently inactive and not available for selection"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </p>
                          {service.discipline && (
                            <Badge variant="outline" className="mt-2">
                              {service.discipline}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent drag when clicking buttons
                            handleEditAdditionalService(service);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent drag when clicking buttons
                            handleDeleteAdditionalService(service.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAdditionalServices.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No additional services found for the selected disciplines.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AddStandardServiceDialog
        open={showAddStandardDialog}
        onOpenChange={(open) => {
          setShowAddStandardDialog(open);
          if (!open) setEditService(null);
        }}
        onAdd={handleAddStandardService}
        onEdit={handleUpdateStandardService}
        editMode={!!editService}
        serviceData={editService || undefined}
      />
      <AddAdditionalServiceDialog
        open={showAddAdditionalDialog}
        onOpenChange={(open) => {
          setShowAddAdditionalDialog(open);
          if (!open) {
            setEditAdditionalService(null);
          }
        }}
        onAdd={handleAddAdditionalService}
        onEdit={handleUpdateAdditionalService}
        editMode={!!editAdditionalService}
        serviceData={editAdditionalService || undefined}
      />
    </div>
  );
} 