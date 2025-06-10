"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { toast } from 'sonner';

// Types for structures and calculations
interface Structure {
  id: string;
  name: string;
  type: string;
  levels: Level[];
  totalFloorArea: number;
  constructionType: string;
  buildingType: string;
  // Additional structure parameters
  parameters: {
    [key: string]: number | string | boolean;
  };
}

interface Level {
  id: string;
  name: string;
  floorArea: number;
  spaces: Space[];
  // Additional level parameters
  parameters: {
    [key: string]: number | string | boolean;
  };
}

interface Space {
  id: string;
  name: string;
  floorArea: number;
  type: string;
  // Space-specific parameters that affect calculations
  parameters: {
    occupancyType?: string;
    constructionType?: string;
    buildingType?: string;
    // Additional space parameters
    [key: string]: number | string | boolean | undefined;
  };
}

interface CalculationResult {
  structureId?: string;
  levelId?: string;
  spaceId?: string;
  type: 'design' | 'construction';
  category: string;
  value: number;
  parameters: {
    [key: string]: number | string | boolean;
  };
  timestamp: string;
  source: 'fixedfees' | 'manual' | 'formula';
}

// Add Discipline interface
interface Discipline {
  id: string;
  name: string;
  type: 'design' | 'construction';
  is_active: boolean;
  parameters: {
    hourly_rate?: number;
    base_fee?: number;
    additional_fee?: number;
    // Any other discipline-specific parameters
    [key: string]: number | string | boolean | undefined;
  };
  calculations: CalculationResult[];
  last_updated: string;
  updated_by: string;
}

// Add Contact interface
interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  is_primary: boolean;
  // Additional contact details
  details: {
    [key: string]: string | number | boolean;
  };
}

interface ProposalData {
  id: string;
  project_id: string;
  proposal_number: number;
  revision_number: number;
  is_temporary_revision: boolean;
  status_id: string;
  contacts: Contact[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  project_data: {
    // Structures and their hierarchy
    structures: Structure[];
    
    // Fee calculations and results
    calculations: {
      design: {
        structures: CalculationResult[];
        levels: CalculationResult[];
        spaces: CalculationResult[];
        total: number;
        parameters: {
          [key: string]: number | string | boolean;
        };
      };
      construction: {
        structures: CalculationResult[];
        levels: CalculationResult[];
        spaces: CalculationResult[];
        total: number;
        parameters: {
          [key: string]: number | string | boolean;
        };
      };
      total: number;
    };

    // Add disciplines array
    disciplines: Discipline[];

    // Service selections with their parameters
    services: Array<{
      id: string;
      discipline_id: string;
      name: string;
      type: 'design' | 'construction';
      is_active: boolean;
      parameters: {
        [key: string]: number | string | boolean;
      };
      calculations: CalculationResult[];
    }>;

    // Add additional fields for page component
    tracked_services: Array<{
      id: string;
      serviceId: string;
      service_name: string;
      name: string;
      discipline: string;
      isDefaultIncluded: boolean;
      min_fee: number | null;
      rate: number | null;
      fee_increment: number | null;
      phase: 'design' | 'construction' | null;
      customFee?: number;
      isConstructionAdmin: boolean;
      fee: number;
      structureId: string;
      levelId: string;
      spaceId: string;
      isIncluded: boolean;
    }>;

    additional_services: Array<{
      id: string;
      name: string;
      description: string;
      phase: 'design' | 'construction';
      default_min_value: number;
      is_active: boolean;
      discipline?: string;
    }>;

    fee_scale: Array<{
      id: number;
      construction_cost: number;
      prime_consultant_rate: number;
      fraction_of_prime_rate_mechanical: number;
      fraction_of_prime_rate_plumbing: number;
      fraction_of_prime_rate_electrical: number;
      fraction_of_prime_rate_structural: number;
    }>;

    duplicate_rates: Array<{
      id: number;
      rate: number;
    }>;

    rescheck_items: Array<{
      id: string;
      name: string;
      description: string;
      default_min_value: number;
      isActive: boolean;
    }>;

    nested_items: Array<{
      id: string;
      name: string;
      description: string;
      default_min_value: number;
      isActive: boolean;
      discipline: string;
      parentDiscipline?: string;
    }>;

    phase: 'design' | 'construction';

    // Client information
    client: {
      id: string;
      name: string;
      contact: string;
      details: {
        [key: string]: string | number | boolean;
      };
    };

    // Cost breakdowns with detailed tracking
    costs: {
      design: {
        structures: Array<{
          structureId: string;
          calculations: CalculationResult[];
          total: number;
        }>;
        levels: Array<{
          levelId: string;
          calculations: CalculationResult[];
          total: number;
        }>;
        spaces: Array<{
          spaceId: string;
          calculations: CalculationResult[];
          total: number;
        }>;
        hourly_rates: Array<{
          role: string;
          rate: number;
          hours: number;
          total: number;
          parameters: {
            [key: string]: number | string | boolean;
          };
        }>;
        materials: Array<{
          item: string;
          quantity: number;
          unit_cost: number;
          total: number;
          parameters: {
            [key: string]: number | string | boolean;
          };
        }>;
        total: number;
      };
      construction: {
        structures: Array<{
          structureId: string;
          calculations: CalculationResult[];
          total: number;
        }>;
        levels: Array<{
          levelId: string;
          calculations: CalculationResult[];
          total: number;
        }>;
        spaces: Array<{
          spaceId: string;
          calculations: CalculationResult[];
          total: number;
        }>;
        hourly_rates: Array<{
          role: string;
          rate: number;
          hours: number;
          total: number;
          parameters: {
            [key: string]: number | string | boolean;
          };
        }>;
        materials: Array<{
          item: string;
          quantity: number;
          unit_cost: number;
          total: number;
          parameters: {
            [key: string]: number | string | boolean;
          };
        }>;
        total: number;
      };
      total: number;
    };

    // Store calculation history and manual adjustments
    calculation_history: Array<{
      timestamp: string;
      type: 'fixedfees' | 'manual' | 'formula';
      structureId?: string;
      levelId?: string;
      spaceId?: string;
      calculations: CalculationResult[];
      parameters: {
        [key: string]: number | string | boolean;
      };
    }>;
  };
}

// Add type for fixedFees data
interface FixedFeesData {
  type: 'design' | 'construction';
  results: Array<{
    structureId?: string;
    levelId?: string;
    spaceId?: string;
    category: string;
    value: number;
    parameters: {
      [key: string]: number | string | boolean;
    };
  }>;
  parameters: {
    [key: string]: number | string | boolean;
  };
}

// Add type for flexfees data
interface FlexFeesData {
  type: 'design' | 'construction';
  results: Array<{
    structureId?: string;
    levelId?: string;
    spaceId?: string;
    category: string;
    value: number;
    parameters: {
      hours?: number;
      rate?: number;
      multiplier?: number;
      // Any other flexfees-specific parameters
      [key: string]: number | string | boolean | undefined;
    };
  }>;
  parameters: {
    [key: string]: number | string | boolean;
  };
}

// Export the ref type
export type ProposalDataRef = {
  handleFixedFeesData: (data: FixedFeesData) => void;
  handleFlexFeesData: (data: FlexFeesData) => void;
  handleFeeCalculation: (data: FixedFeesData | FlexFeesData) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  removeContact: (contactId: string) => void;
  setPrimaryContact: (contactId: string) => void;
  searchContacts: (query: string) => Contact[];
  updateData: (data: Partial<ProposalData>) => void;
};

interface ProposalDataProps {
  proposalId: string;
  projectId: string;
  isNewProposal?: boolean;
  onDataChange?: (data: ProposalData) => void;
  ref?: React.RefObject<ProposalDataRef>;
  skipInitialLoad?: boolean;
}

export const ProposalData = forwardRef<ProposalDataRef, ProposalDataProps>(({ proposalId, projectId, isNewProposal = false, onDataChange, skipInitialLoad }, ref): JSX.Element => {
  console.log('ProposalData: Component mounted with props:', {
    proposalId,
    projectId,
    isNewProposal
  });

  const [data, setData] = useState<ProposalData>({
    id: '',
    project_id: '',
    proposal_number: 0,
    revision_number: 0,
    is_temporary_revision: false,
    status_id: '',
    contacts: [],
    created_by: '',
    updated_by: '',
    created_at: '',
    updated_at: '',
    description: null,
    project_data: {
      structures: [],
      calculations: {
        design: {
          structures: [],
          levels: [],
          spaces: [],
          total: 0,
          parameters: {}
        },
        construction: {
          structures: [],
          levels: [],
          spaces: [],
          total: 0,
          parameters: {}
        },
        total: 0
      },
      disciplines: [],
      services: [],
      tracked_services: [],
      additional_services: [],
      fee_scale: [],
      duplicate_rates: [],
      rescheck_items: [],
      nested_items: [],
      phase: 'design',
      client: {
        id: '',
        name: '',
        contact: '',
        details: {}
      },
      costs: {
        design: {
          structures: [],
          levels: [],
          spaces: [],
          hourly_rates: [],
          materials: [],
          total: 0
        },
        construction: {
          structures: [],
          levels: [],
          spaces: [],
          hourly_rates: [],
          materials: [],
          total: 0
        },
        total: 0
      },
      calculation_history: []
    }
  });
  const [isLoading, setIsLoading] = useState(!isNewProposal);
  const [isSaving, setIsSaving] = useState(false);

  // Add logging to data changes
  useEffect(() => {
    console.log('ProposalData: Data state updated:', {
      data,
      contacts: data?.contacts || []
    });
  }, [data]);

  // Fetch proposal data
  useEffect(() => {
    console.log('ProposalData useEffect triggered:', {
      proposalId,
      projectId,
      isNewProposal,
      isLoading
    });

    // Skip initial load if skipInitialLoad is true
    if (skipInitialLoad) {
      console.log('ProposalData: Skipping initial load due to skipInitialLoad prop');
      return;
    }

    if (isNewProposal) {
      console.log('Initializing new proposal data');
      // Initialize new proposal data
      setData({
        id: 'new',
        project_id: projectId,
        proposal_number: 0, // Will be generated
        revision_number: 1,
        is_temporary_revision: true,
        status_id: '', // Will be set to initial status
        contacts: [], // Initialize empty contacts array
        created_by: '', // Will be set from auth
        updated_by: '', // Will be set from auth
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: null,
        project_data: {
          structures: [],
          calculations: {
            design: {
              structures: [],
              levels: [],
              spaces: [],
              total: 0,
              parameters: {}
            },
            construction: {
              structures: [],
              levels: [],
              spaces: [],
              total: 0,
              parameters: {}
            },
            total: 0
          },
          disciplines: [], // Initialize empty disciplines array
          services: [], // Initialize empty services array
          client: {
            id: '',
            name: '',
            contact: '',
            details: {}
          },
          costs: {
            design: {
              structures: [],
              levels: [],
              spaces: [],
              hourly_rates: [],
              materials: [],
              total: 0
            },
            construction: {
              structures: [],
              levels: [],
              spaces: [],
              hourly_rates: [],
              materials: [],
              total: 0
            },
            total: 0
          },
          calculation_history: []
        }
      });
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      console.log('Starting to fetch proposal data for ID:', proposalId);
      try {
        const response = await fetch(`/api/proposals/${proposalId}`);
        console.log('Proposal fetch response:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });
        
        if (!response.ok) throw new Error('Failed to fetch proposal data');
        const proposalData = await response.json();
        
        // Add detailed console logging
        console.log('=== Proposal Data Details ===');
        console.log('Basic Info:', {
          id: proposalData.id,
          project_id: proposalData.project_id,
          proposal_number: proposalData.proposal_number,
          revision_number: proposalData.revision_number,
          status_id: proposalData.status_id,
          description: proposalData.description,
          created_at: proposalData.created_at,
          updated_at: proposalData.updated_at
        });
        
        console.log('Contacts:', proposalData.contacts);
        
        console.log('Project Data Summary:', {
          structures: {
            count: proposalData.project_data?.structures?.length || 0,
            items: proposalData.project_data?.structures?.map((s: Structure) => ({
              id: s.id,
              name: s.name,
              type: s.type,
              levels: s.levels?.length || 0
            }))
          },
          disciplines: {
            count: proposalData.project_data?.disciplines?.length || 0,
            items: proposalData.project_data?.disciplines?.map((d: Discipline) => ({
              id: d.id,
              name: d.name,
              type: d.type,
              is_active: d.is_active
            }))
          },
          services: {
            count: proposalData.project_data?.services?.length || 0,
            items: proposalData.project_data?.services?.map((s: ProposalData['project_data']['services'][0]) => ({
              id: s.id,
              name: s.name,
              type: s.type,
              is_active: s.is_active
            }))
          },
          calculations: {
            design: {
              total: proposalData.project_data?.calculations?.design?.total,
              structures: proposalData.project_data?.calculations?.design?.structures?.length || 0,
              levels: proposalData.project_data?.calculations?.design?.levels?.length || 0,
              spaces: proposalData.project_data?.calculations?.design?.spaces?.length || 0
            },
            construction: {
              total: proposalData.project_data?.calculations?.construction?.total,
              structures: proposalData.project_data?.calculations?.construction?.structures?.length || 0,
              levels: proposalData.project_data?.calculations?.construction?.levels?.length || 0,
              spaces: proposalData.project_data?.calculations?.construction?.spaces?.length || 0
            }
          }
        });
        
        setData(proposalData);
        console.log('Proposal data set in state');
      } catch (error) {
        console.error('Error fetching proposal data:', error);
        toast.error('Failed to load proposal data');
      } finally {
        setIsLoading(false);
        console.log('Loading state set to false');
      }
    };

    fetchData();
  }, [proposalId, projectId, isNewProposal, skipInitialLoad]);

  // Save proposal data
  const saveData = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: isNewProposal ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save proposal data');
      const savedData = await response.json();
      setData(savedData);
      onDataChange?.(savedData);
      toast.success('Proposal data saved successfully');
    } catch (error) {
      console.error('Error saving proposal data:', error);
      toast.error('Failed to save proposal data');
    } finally {
      setIsSaving(false);
    }
  };

  // Update specific data fields
  const updateData = useCallback((newData: Partial<ProposalData>) => {
    console.log('ProposalData: updateData called with:', newData);
    setData(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        ...newData,
        project_data: {
          ...prev.project_data,
          ...(newData.project_data || {})
        }
      };
      console.log('ProposalData: Updated data:', updated);
      return updated;
    });
  }, []);

  // Update the handleFixedFeesData function with proper typing
  const handleFixedFeesData = (fixedFeesData: FixedFeesData) => {
    if (!data) return;
    
    // Create calculation results from fixedfees data
    const calculations: CalculationResult[] = fixedFeesData.results.map(result => ({
      ...(result.structureId && { structureId: result.structureId }),
      ...(result.levelId && { levelId: result.levelId }),
      ...(result.spaceId && { spaceId: result.spaceId }),
      type: fixedFeesData.type,
      category: result.category,
      value: result.value,
      parameters: result.parameters,
      timestamp: new Date().toISOString(),
      source: 'fixedfees' as const
    }));

    // Update the data with new calculations
    const updatedData: ProposalData = {
      ...data,
      project_data: {
        ...data.project_data,
        calculations: {
          ...data.project_data.calculations,
          [fixedFeesData.type]: {
            ...data.project_data.calculations[fixedFeesData.type],
            structures: [
              ...data.project_data.calculations[fixedFeesData.type].structures,
              ...calculations.filter(c => c.structureId && !c.levelId && !c.spaceId)
            ],
            levels: [
              ...data.project_data.calculations[fixedFeesData.type].levels,
              ...calculations.filter(c => c.levelId && !c.spaceId)
            ],
            spaces: [
              ...data.project_data.calculations[fixedFeesData.type].spaces,
              ...calculations.filter(c => c.spaceId)
            ]
          }
        },
        calculation_history: [
          ...data.project_data.calculation_history,
          {
            timestamp: new Date().toISOString(),
            type: 'fixedfees' as const,
            calculations,
            parameters: fixedFeesData.parameters
          }
        ]
      }
    };
    
    setData(updatedData);
    onDataChange?.(updatedData);
  };

  // Add function to handle discipline updates
  const updateDisciplineStatus = (disciplineId: string, isActive: boolean) => {
    if (!data) return;
    
    const updatedData = {
      ...data,
      project_data: {
        ...data.project_data,
        disciplines: data.project_data.disciplines.map(discipline => 
          discipline.id === disciplineId 
            ? {
                ...discipline,
                is_active: isActive,
                last_updated: new Date().toISOString(),
                updated_by: 'current_user_id' // This should come from your auth system
              }
            : discipline
        )
      }
    };
    
    setData(updatedData);
    onDataChange?.(updatedData);
  };

  // Add function to handle discipline calculations
  const updateDisciplineCalculations = (disciplineId: string, calculations: CalculationResult[]) => {
    if (!data) return;
    
    const updatedData = {
      ...data,
      project_data: {
        ...data.project_data,
        disciplines: data.project_data.disciplines.map(discipline => 
          discipline.id === disciplineId 
            ? {
                ...discipline,
                calculations: [...discipline.calculations, ...calculations],
                last_updated: new Date().toISOString(),
                updated_by: 'current_user_id' // This should come from your auth system
              }
            : discipline
        )
      }
    };
    
    setData(updatedData);
    onDataChange?.(updatedData);
  };

  // Add handler for flexfees data
  const handleFlexFeesData = (flexFeesData: FlexFeesData) => {
    if (!data) return;
    
    // Create calculation results from flexfees data
    const calculations: CalculationResult[] = flexFeesData.results.map(result => ({
      ...(result.structureId && { structureId: result.structureId }),
      ...(result.levelId && { levelId: result.levelId }),
      ...(result.spaceId && { spaceId: result.spaceId }),
      type: flexFeesData.type,
      category: result.category,
      value: result.value,
      parameters: {
        ...result.parameters,
        calculation_type: 'flexfees'
      },
      timestamp: new Date().toISOString(),
      source: 'formula' as const // Using 'formula' since flexfees uses formulas
    }));

    // Update the data with new calculations
    const updatedData: ProposalData = {
      ...data,
      project_data: {
        ...data.project_data,
        calculations: {
          ...data.project_data.calculations,
          [flexFeesData.type]: {
            ...data.project_data.calculations[flexFeesData.type],
            structures: [
              ...data.project_data.calculations[flexFeesData.type].structures,
              ...calculations.filter(c => c.structureId && !c.levelId && !c.spaceId)
            ],
            levels: [
              ...data.project_data.calculations[flexFeesData.type].levels,
              ...calculations.filter(c => c.levelId && !c.spaceId)
            ],
            spaces: [
              ...data.project_data.calculations[flexFeesData.type].spaces,
              ...calculations.filter(c => c.spaceId)
            ]
          }
        },
        calculation_history: [
          ...data.project_data.calculation_history,
          {
            timestamp: new Date().toISOString(),
            type: 'formula' as const,
            calculations,
            parameters: {
              ...flexFeesData.parameters,
              calculation_type: 'flexfees'
            }
          }
        ]
      }
    };
    
    setData(updatedData);
    onDataChange?.(updatedData);
  };

  // Add a function to handle both fixed and flex fees
  const handleFeeCalculation = (data: FixedFeesData | FlexFeesData) => {
    if ('hours' in data.results[0]?.parameters) {
      // This is flexfees data
      handleFlexFeesData(data as FlexFeesData);
    } else {
      // This is fixedfees data
      handleFixedFeesData(data as FixedFeesData);
    }
  };

  // Add contact management functions
  const addContact = useCallback((contact: Omit<Contact, 'id'>) => {
    console.log('ProposalData: addContact called with:', contact);
    setData(prev => {
      if (!prev) return prev;
      const newContact = { ...contact, id: crypto.randomUUID() };
      const updated = {
        ...prev,
        contacts: [...prev.contacts, newContact]
      };
      console.log('ProposalData: Updated data after adding contact:', {
        previousContacts: prev.contacts,
        newContact,
        updatedContacts: updated.contacts
      });
      return updated;
    });
  }, []);

  const updateContact = useCallback((contactId: string, updates: Partial<Contact>) => {
    console.log('ProposalData: updateContact called with:', { contactId, updates });
    setData(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        contacts: prev.contacts.map(c => 
          c.id === contactId ? { ...c, ...updates } : c
        )
      };
      console.log('ProposalData: Updated data after updating contact:', {
        previousContacts: prev.contacts,
        updatedContact: updated.contacts.find(c => c.id === contactId),
        updatedContacts: updated.contacts
      });
      return updated;
    });
  }, []);

  const removeContact = useCallback((contactId: string) => {
    console.log('ProposalData: removeContact called with:', contactId);
    setData(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        contacts: prev.contacts.filter(c => c.id !== contactId)
      };
      console.log('ProposalData: Updated data after removing contact:', {
        previousContacts: prev.contacts,
        removedContactId: contactId,
        updatedContacts: updated.contacts
      });
      return updated;
    });
  }, []);

  const setPrimaryContact = useCallback((contactId: string) => {
    console.log('ProposalData: setPrimaryContact called with:', contactId);
    setData(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        contacts: prev.contacts.map(c => ({
          ...c,
          is_primary: c.id === contactId
        }))
      };
      console.log('ProposalData: Updated data after setting primary contact:', {
        previousContacts: prev.contacts,
        newPrimaryContactId: contactId,
        updatedContacts: updated.contacts
      });
      return updated;
    });
  }, []);

  // Add contact search function
  const searchContacts = useCallback((query: string) => {
    console.log('ProposalData: searchContacts called with:', query);
    if (!data) return [];
    
    const searchTerms = query.toLowerCase().split(' ');
    
    const results = data.contacts.filter(contact => {
      const searchableText = [
        contact.name,
        contact.email,
        contact.phone,
        contact.role,
        contact.company,
        // Add any other searchable fields
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });

    console.log('ProposalData: Search results:', results);
    return results;
  }, [data]);

  // Add logging to data change handler
  useEffect(() => {
    if (onDataChange && data) {
      console.log('ProposalData: Calling onDataChange with:', {
        data,
        contacts: data.contacts
      });
      onDataChange(data);
    }
  }, [data, onDataChange]);

  // Expose handlers through ref
  useImperativeHandle(ref, () => ({
    handleFixedFeesData,
    handleFlexFeesData,
    handleFeeCalculation,
    addContact,
    updateContact,
    removeContact,
    setPrimaryContact,
    searchContacts,
    updateData
  }), [handleFixedFeesData, handleFlexFeesData, handleFeeCalculation, addContact, updateContact, removeContact, setPrimaryContact, searchContacts, updateData]);

  if (isLoading) {
    return <div>Loading proposal data...</div>;
  }

  if (!data) {
    return <div>No proposal data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Render your data management UI here */}
      {/* This could include forms, tables, or other components to manage the data */}
      {/* Example: */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium">Project Parameters</h3>
          {/* Space management UI */}
        </div>
        <div>
          <h3 className="text-lg font-medium">Fee Calculations</h3>
          {/* Fee calculation UI */}
        </div>
        <div>
          <h3 className="text-lg font-medium">Services</h3>
          {/* Service selection UI */}
        </div>
        <div>
          <h3 className="text-lg font-medium">Cost Breakdown</h3>
          {/* Cost breakdown UI */}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={saveData}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Data'}
        </button>
      </div>
    </div>
  );
});

ProposalData.displayName = 'ProposalData'; 