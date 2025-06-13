import { create, StateCreator } from 'zustand';
import type { 
  Structure,
  Level,
  Space,
  proposal,
  proposal_status,
  proposal_status_code,
  proposal_contact,
  contact_role,
  contact_status,
  base_fee,
  FeeCalculationResult,
  fee_item,
  engineering_standard_service,
  ConstructionCost,
  ConstructionCostsForSpace
} from '@/types/proposal/base';
import type { tracked_service } from '@/types/proposal/service';

export interface FeeCalculationState {
  design: {
    structures: FeeCalculationResult[];
    levels: FeeCalculationResult[];
    spaces: FeeCalculationResult[];
    total: number;
    parameters: {
      cost_index: number | null;
    };
  };
  construction: {
    structures: FeeCalculationResult[];
    levels: FeeCalculationResult[];
    spaces: FeeCalculationResult[];
    total: number;
    parameters: {
      cost_index: number | null;
    };
  };
  total: number;
}

export interface ProposalState {
  proposal: proposal | null;
  project: {
    id: string;
    name: string;
    number: string;
    company: string;
    client_contacts: proposal_contact[];
  } | null;
  structures: Structure[];
  status: proposal_status | null;
  isLoading: boolean;
  error: string | null;
  authError: boolean;
  statuses: proposal_status[];
  calculations: FeeCalculationState;
  disciplines: string[];
  services: engineering_standard_service[];
  trackedServices: Record<string, tracked_service[]>;
  contacts: proposal_contact[];
  isDeleting: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isReviewing: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isDeleteDialogOpen: boolean;
  isRejectDialogOpen: boolean;
  rejectFeedback: string;
  canEdit: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  canClientApprove: boolean;
  canClientReject: boolean;
  canHold: boolean;
  canCancel: boolean;
  loadingStates: {
    proposal: boolean;
    structures: boolean;
    services: boolean;
    calculations: boolean;
  };
  setProposal: (proposal: proposal) => void;
  updateStatus: (newStatus: proposal_status_code) => Promise<void>;
  fetchStatuses: () => Promise<void>;
  setStructures: (structures: Structure[]) => void;
  updateStructure: (structureId: string, updates: Partial<Structure>) => void;
  addStructure: (structure: Omit<Structure, 'id'>) => void;
  removeStructure: (structureId: string) => void;
  duplicateStructure: (structureId: string) => void;
  setTrackedServices: (structureId: string, services: tracked_service[]) => void;
  updateTrackedService: (structureId: string, serviceId: string, updates: Partial<tracked_service>) => void;
  addContact: (contact: proposal_contact) => void;
  removeContact: (contactId: string) => void;
  loadProposal: (proposalId: string) => Promise<void>;
  setProject: (project: {
    id: string;
    name: string;
    number: string;
    cost_index: number | null;
    company: string;
    created_at: string;
    updated_at: string;
  }) => void;
}

type ProposalStore = StateCreator<ProposalState>;

const defaultProjectData = {
  structures: [],
  calculations: {
    design: { 
      structures: [], 
      levels: [], 
      spaces: [], 
      total: 0, 
      parameters: { cost_index: null } 
    },
    construction: { 
      structures: [], 
      levels: [], 
      spaces: [], 
      total: 0, 
      parameters: { cost_index: null } 
    },
    total: 0
  },
  disciplines: [],
  services: [],
  tracked_services: []
};

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposal: null,
  project: null,
  status: null,
  isLoading: false,
  error: null,
  authError: false,
  statuses: [],
  structures: [],
  calculations: {
    design: {
      structures: [],
      levels: [],
      spaces: [],
      total: 0,
      parameters: {
        cost_index: null
      }
    },
    construction: {
      structures: [],
      levels: [],
      spaces: [],
      total: 0,
      parameters: {
        cost_index: null
      }
    },
    total: 0
  },
  trackedServices: {},
  disciplines: [],
  services: [],
  contacts: [],
  isDeleteDialogOpen: false,
  isRejectDialogOpen: false,
  rejectFeedback: '',
  isDeleting: false,
  isSaving: false,
  isPublishing: false,
  isReviewing: false,
  isApproving: false,
  isRejecting: false,
  canEdit: false,
  canReview: false,
  canApprove: false,
  canPublish: false,
  canClientApprove: false,
  canClientReject: false,
  canHold: false,
  canCancel: false,
  loadingStates: {
    proposal: false,
    structures: false,
    services: false,
    calculations: false
  },
  setProposal: (proposal: proposal) => {
    set(state => ({ 
      loadingStates: {
        ...state.loadingStates,
        proposal: true,
        structures: true,
        services: true,
        calculations: true
      }
    }));

    try {
      const projectData = proposal.project_data || defaultProjectData;

      const structures = Array.isArray(projectData.structures) 
        ? projectData.structures.map(structure => ({
            ...structure,
            levels: Array.isArray(structure.levels) ? structure.levels : [],
            is_duplicate: !!structure.is_duplicate,
            duplicate_number: structure.duplicate_number || null,
            duplicate_parent_id: structure.duplicate_parent_id || null,
            duplicate_rate: structure.duplicate_rate || 1
          }))
        : [];

      const trackedServices = (projectData.tracked_services || []).reduce((acc: Record<string, tracked_service[]>, service: tracked_service) => {
        const structureId = service.structure_id || 'unassigned';
        if (!acc[structureId]) {
          acc[structureId] = [];
        }
        acc[structureId].push({
          ...service,
          is_included: service.is_included ?? service.is_default_included ?? false,
          custom_fee: service.custom_fee ?? null,
          estimated_fee: service.estimated_fee ?? null,
          is_active: service.is_active ?? true
        });
        return acc;
      }, {});

      set({ 
        proposal: {
          ...proposal,
          project_data: {
            ...projectData,
            structures
          }
        },
        status: proposal.status,
        structures,
        calculations: projectData.calculations,
        disciplines: projectData.disciplines || [],
        services: projectData.services || [],
        trackedServices,
        contacts: proposal.contacts || [],
        loadingStates: {
          proposal: false,
          structures: false,
          services: false,
          calculations: false
        }
      });
    } catch (error) {
      console.error('Error in setProposal:', error);
      set(state => ({
        loadingStates: {
          ...state.loadingStates,
          proposal: false,
          structures: false,
          services: false,
          calculations: false
        },
        error: error instanceof Error ? error.message : 'Failed to process proposal data'
      }));
    }
  },
  
  updateStatus: async (newStatus: proposal_status_code) => {
    const { proposal } = get();
    if (!proposal) return;
    
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      
      const updatedProposal = await response.json();
      set({ 
        proposal: updatedProposal,
        status: updatedProposal.status,
        error: null
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update status' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchStatuses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/proposal-statuses', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch statuses');
      }
      
      const statuses = await response.json();
      set({ statuses, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch statuses' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setDeleteDialogOpen: (isOpen: boolean) => set({ isDeleteDialogOpen: isOpen }),
  setRejectDialogOpen: (isOpen: boolean) => set({ isRejectDialogOpen: isOpen }),
  setRejectFeedback: (feedback: string) => set({ rejectFeedback: feedback }),
  
  // Structure actions
  setStructures: (structures: Structure[]) => set(state => ({
    structures,
    proposal: state.proposal ? {
      ...state.proposal,
      project_data: {
        ...state.proposal.project_data,
        structures
      }
    } : null
  })),
  
  updateStructure: (structureId: string, updates: Partial<Structure>) => set(state => {
    // First update the parent structure
    const updatedStructures = state.structures.map(structure => {
      if (structure.id === structureId) {
        return { ...structure, ...updates };
      }
      // If this is a duplicate of the updated structure, update it too
      if (structure.duplicate_parent_id === structureId) {
        // Only update specific fields that should be synced with parent
        const duplicateUpdates = {
          ...updates,
          // Preserve duplicate-specific fields
          id: structure.id,
          // Update name to match parent but keep duplicate number
          name: updates.name ? `${updates.name} (Duplicate ${structure.duplicate_number})` : structure.name,
          parent_id: structure.parent_id,
          is_duplicate: structure.is_duplicate,
          duplicate_number: structure.duplicate_number,
          duplicate_parent_id: structure.duplicate_parent_id,
          duplicate_rate: structure.duplicate_rate,
          // Update levels to match parent's structure but keep duplicate's IDs
          levels: updates.levels ? updates.levels.map((parentLevel, index) => {
            const duplicateLevel = structure.levels[index];
            if (!duplicateLevel) return parentLevel;
            return {
              ...parentLevel,
              id: duplicateLevel.id,
              spaces: parentLevel.spaces.map((parentSpace, spaceIndex) => {
                const duplicateSpace = duplicateLevel.spaces[spaceIndex];
                if (!duplicateSpace) return parentSpace;
                return {
                  ...parentSpace,
                  id: duplicateSpace.id,
                  // Preserve construction costs but update other fields
                  construction_costs: duplicateSpace.construction_costs
                };
              })
            };
          }) : structure.levels
        };
        return { ...structure, ...duplicateUpdates };
      }
      return structure;
    });

    return {
      structures: updatedStructures,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          structures: updatedStructures
        }
      } : null
    };
  }),
  
  updateSpace: (structureId: string, levelId: string, spaceId: string, updates: Partial<Space>) => set(state => {
    console.log('=== proposalStore.updateSpace called ===');
    console.log('Current state:', {
      structureId,
      levelId,
      spaceId,
      updates,
      currentStructures: state.structures
    });

    const updatedStructures = state.structures.map(structure => {
      if (structure.id !== structureId) {
        console.log(`Skipping structure ${structure.id} - not the target`);
        return structure;
      }
      
      console.log(`Found target structure ${structureId}`);
      return {
        ...structure,
        levels: structure.levels.map(level => {
          if (level.id !== levelId) {
            console.log(`Skipping level ${level.id} - not the target`);
            return level;
          }
          
          console.log(`Found target level ${levelId}`);
          return {
            ...level,
            spaces: level.spaces.map(space => {
              if (space.id !== spaceId) {
                console.log(`Skipping space ${space.id} - not the target`);
                return space;
              }
              
              console.log(`Found target space ${spaceId}`);
              console.log('Original space:', space);
              const updatedSpace = { ...space, ...updates };
              console.log('Updated space:', updatedSpace);
              return updatedSpace;
            })
          };
        })
      };
    });

    console.log('Final updated structures:', updatedStructures);
    
    return {
      structures: updatedStructures,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          structures: updatedStructures
        }
      } : null
    };
  }),
  
  addStructure: (structure: Omit<Structure, 'id'>) => set(state => {
    const newStructure = { ...structure, id: crypto.randomUUID() };
    const updatedStructures = [...state.structures, newStructure];
    return {
      structures: updatedStructures,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          structures: updatedStructures
        }
      } : null
    };
  }),
  
  removeStructure: (structureId: string) => set(state => {
    const structureToRemove = state.structures.find(s => s.id === structureId);
    if (!structureToRemove) return state;

    // If we're removing a parent structure, remove all its duplicates too
    if (!structureToRemove.is_duplicate) {
      const updatedStructures = state.structures.filter(s => 
        s.id !== structureId && s.duplicate_parent_id !== structureId
      );
      return {
        structures: updatedStructures,
        proposal: state.proposal ? {
          ...state.proposal,
          project_data: {
            ...state.proposal.project_data,
            structures: updatedStructures
          }
        } : null
      };
    }

    // If we're removing a duplicate, we need to renumber the remaining duplicates
    const parentId = structureToRemove.duplicate_parent_id;
    if (!parentId) return state;

    // Get all remaining duplicates of this parent, sorted by duplicate_number
    const remainingDuplicates = state.structures
      .filter(s => s.duplicate_parent_id === parentId && s.id !== structureId)
      .sort((a, b) => (a.duplicate_number || 0) - (b.duplicate_number || 0));

    // Renumber the remaining duplicates and update their rates
    const updatedDuplicates = remainingDuplicates.map((duplicate, index) => {
      const newDuplicateNumber = index + 1;
      const newRate = Math.pow(0.75, newDuplicateNumber - 1); // First duplicate gets 100%, second gets 75%, etc.
      
      return {
        ...duplicate,
        name: duplicate.name.replace(/\(Duplicate \d+\)/, `(Duplicate ${newDuplicateNumber})`),
        duplicate_number: newDuplicateNumber,
        duplicate_rate: newRate
      };
    });

    // Create the final structures array
    const updatedStructures = state.structures
      .filter(s => s.id !== structureId) // Remove the deleted duplicate
      .map(s => {
        // Update the renumbered duplicates
        const updatedDuplicate = updatedDuplicates.find(d => d.id === s.id);
        return updatedDuplicate || s;
      });

    return {
      structures: updatedStructures,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          structures: updatedStructures
        }
      } : null
    };
  }),
  
  duplicateStructure: (structureId: string) => {
    const { structures } = get();
    const structure = structures.find(s => s.id === structureId);
    if (!structure) return;

    // Find the next duplicate number for this parent
    const duplicateNumber = (structures.filter(s => s.duplicate_parent_id === structureId).length + 1);
    
    // Simple rate lookup based on duplicate number
    // First duplicate gets 100%, second gets 75%, third gets 56.25%, etc.
    const rate = Math.pow(0.75, duplicateNumber - 1);
    
    // Create the duplicate structure
    const duplicateStructure: Structure = {
      ...structure,
      id: crypto.randomUUID(),
      name: `${structure.name} (Duplicate ${duplicateNumber})`,
      parent_id: structureId,
      is_duplicate: true,
      duplicate_number: duplicateNumber,
      duplicate_parent_id: structureId,
      duplicate_rate: rate, // Store the rate but don't apply it
      levels: structure.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID(),
          // Keep original construction costs without applying the rate
          construction_costs: { ...space.construction_costs }
        }))
      }))
    };

    // Find the index where to insert the duplicate
    // First find the parent's index
    const parentIndex = structures.findIndex(s => s.id === structureId);
    if (parentIndex === -1) return;

    // Then find the last duplicate of this parent
    let insertIndex = parentIndex;
    for (let i = parentIndex + 1; i < structures.length; i++) {
      if (structures[i].duplicate_parent_id === structureId) {
        insertIndex = i;
      } else if (structures[i].parent_id !== structureId && !structures[i].name.includes('(Copy)')) {
        // Stop when we hit a non-duplicate, non-copy structure
        break;
      }
    }

    // Insert the duplicate after the last duplicate of this parent
    const newStructures = [
      ...structures.slice(0, insertIndex + 1),
      duplicateStructure,
      ...structures.slice(insertIndex + 1)
    ];

    set(state => ({
      structures: newStructures
    }));
  },
  
  // Calculation actions
  setCalculations: (phase: 'design' | 'construction', calculations: FeeCalculationState['design' | 'construction']) => {
    set((state) => ({
      calculations: {
        ...state.calculations,
        [phase]: {
          ...calculations,
          parameters: {
            cost_index: calculations.parameters.cost_index ?? null
          }
        }
      }
    }));
  },
  
  addCalculation: (phase: 'design' | 'construction', calculation: FeeCalculationResult) => set(state => {
    const updatedCalculations = {
      ...state.calculations,
      [phase]: {
        ...state.calculations[phase],
        structures: calculation.structure_id ? [...state.calculations[phase].structures, calculation] : state.calculations[phase].structures,
        levels: calculation.level_id ? [...state.calculations[phase].levels, calculation] : state.calculations[phase].levels,
        spaces: calculation.space_id ? [...state.calculations[phase].spaces, calculation] : state.calculations[phase].spaces,
        parameters: {
          cost_index: state.calculations[phase].parameters.cost_index
        }
      }
    };
    
    return {
      calculations: updatedCalculations,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          calculations: updatedCalculations
        }
      } : null
    };
  }),
  
  updateCalculation: (phase: 'design' | 'construction', calculationId: string, updates: Partial<FeeCalculationResult>) => set(state => {
    const updatedCalculations = {
      ...state.calculations,
      [phase]: {
        ...state.calculations[phase],
        structures: state.calculations[phase].structures.map(calc => 
          calc.structure_id === calculationId ? { ...calc, ...updates } : calc
        ),
        levels: state.calculations[phase].levels.map(calc => 
          calc.level_id === calculationId ? { ...calc, ...updates } : calc
        ),
        spaces: state.calculations[phase].spaces.map(calc => 
          calc.space_id === calculationId ? { ...calc, ...updates } : calc
        )
      }
    };
    
    return {
      calculations: updatedCalculations,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          calculations: updatedCalculations
        }
      } : null
    };
  }),
  
  removeCalculation: (phase: 'design' | 'construction', calculationId: string) => set(state => {
    const updatedCalculations = {
      ...state.calculations,
      [phase]: {
        ...state.calculations[phase],
        structures: state.calculations[phase].structures.filter(calc => calc.structure_id !== calculationId),
        levels: state.calculations[phase].levels.filter(calc => calc.level_id !== calculationId),
        spaces: state.calculations[phase].spaces.filter(calc => calc.space_id !== calculationId)
      }
    };
    
    return {
      calculations: updatedCalculations,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          calculations: updatedCalculations
        }
      } : null
    };
  }),
  
  // Service actions
  setServices: (services: engineering_standard_service[]) => set(state => ({
    services,
    proposal: state.proposal ? {
      ...state.proposal,
      project_data: {
        ...state.proposal.project_data,
        services
      }
    } : null
  })),
  
  toggleServiceInclusion: (structureId: string, serviceId: string, isIncluded: boolean) => set(state => {
    const updatedTrackedServices = {
      ...state.trackedServices,
      [structureId]: state.trackedServices[structureId]?.map(service =>
        service.id === serviceId ? { ...service, is_included: isIncluded } : service
      ) || []
    };
    
    const allTrackedServices = Object.values(updatedTrackedServices).flat();
    
    return {
      trackedServices: updatedTrackedServices,
      proposal: state.proposal ? {
        ...state.proposal,
        project_data: {
          ...state.proposal.project_data,
          tracked_services: allTrackedServices
        }
      } : null
    };
  }),
  
  // Contact actions
  setContacts: (contacts: proposal_contact[]) => set(state => ({
    contacts,
    proposal: state.proposal ? {
      ...state.proposal,
      contacts
    } : null
  })),
  
  addContact: (contact: proposal_contact) => set(state => ({
    contacts: [...state.contacts, contact],
    proposal: state.proposal ? {
      ...state.proposal,
      contacts: [...state.proposal.contacts, contact]
    } : null
  })),
  
  updateContact: (contactId: string, updates: Partial<proposal_contact>) => set(state => {
    const updatedContacts = state.contacts.map(contact =>
      contact.id === contactId ? { ...contact, ...updates } : contact
    );
    return {
      contacts: updatedContacts,
      proposal: state.proposal ? {
        ...state.proposal,
        contacts: updatedContacts
      } : null
    };
  }),
  
  removeContact: (contactId: string) => set(state => ({
    contacts: state.contacts.filter(c => c.id !== contactId),
    proposal: state.proposal ? {
      ...state.proposal,
      contacts: state.proposal.contacts.filter(c => c.id !== contactId)
    } : null
  })),
  
  setPrimaryContact: (contactId: string) => set(state => {
    const updatedContacts = state.contacts.map(contact => ({
      ...contact,
      is_primary: contact.id === contactId
    }));
    return {
      contacts: updatedContacts,
      proposal: state.proposal ? {
        ...state.proposal,
        contacts: updatedContacts
      } : null
    };
  }),
  
  // Data persistence actions
  saveProposal: async () => {
    const state = get();
    if (!state.proposal) return;
    
    set({ isSaving: true, error: null });
    try {
      const response = await fetch(`/api/proposals/${state.proposal.id}`, {
        method: state.proposal.id === 'new' ? 'POST' : 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(state.proposal)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/auth/login';
          return;
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to save proposal');
      }
      
      const savedProposal = await response.json();
      set({ 
        proposal: savedProposal,
        status: savedProposal.status,
        error: null
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save proposal' });
    } finally {
      set({ isSaving: false });
    }
  },
  
  loadProposal: async (proposalId: string) => {
    const state = get();
    set(state => ({ 
      loadingStates: {
        ...state.loadingStates,
        proposal: true
      },
      error: null 
    }));

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load proposal');
      }
      
      const proposal = await response.json();
      
      get().setProposal(proposal);
      
    } catch (error) {
      console.error('Error loading proposal:', error);
      set(state => ({
        loadingStates: {
          ...state.loadingStates,
          proposal: false
        },
        error: error instanceof Error ? error.message : 'Failed to load proposal'
      }));
    }
  },
  
  createProposal: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const newProposal: proposal = {
        id: 'new',
        project_id: projectId,
        proposal_number: 0,
        revision_number: 1,
        is_temporary_revision: true,
        status_id: '',
        contacts: [],
        created_by: '',
        updated_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: null,
        status: {
          id: '',
          code: 'edit',
          name: 'Edit',
          description: '',
          icon: null,
          color: null,
          is_initial: true,
          is_final: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        project_data: {
          structures: [],
          calculations: {
            design: { structures: [], levels: [], spaces: [], total: 0, parameters: {} },
            construction: { structures: [], levels: [], spaces: [], total: 0, parameters: {} },
            total: 0
          },
          disciplines: [],
          services: [],
          tracked_services: []
        }
      };
      
      get().setProposal(newProposal);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create proposal' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Modify reset to include auth error state
  reset: () => set({
    proposal: null,
    status: null,
    isLoading: false,
    error: null,
    authError: false,
    statuses: [],
    structures: [],
    calculations: {
      design: { 
        structures: [], 
        levels: [], 
        spaces: [], 
        total: 0, 
        parameters: { cost_index: null } 
      },
      construction: { 
        structures: [], 
        levels: [], 
        spaces: [], 
        total: 0, 
        parameters: { cost_index: null } 
      },
      total: 0
    },
    disciplines: [],
    services: [],
    trackedServices: {},
    contacts: [],
    isDeleting: false,
    isSaving: false,
    isPublishing: false,
    isReviewing: false,
    isApproving: false,
    isRejecting: false,
    isDeleteDialogOpen: false,
    isRejectDialogOpen: false,
    rejectFeedback: '',
    loadingStates: {
      proposal: false,
      structures: false,
      services: false,
      calculations: false
    }
  }),
  
  setTrackedServices: (structureId: string, services: tracked_service[]) => set(state => ({
    trackedServices: {
      ...state.trackedServices,
      [structureId]: services
    }
  })),

  updateTrackedService: (structureId: string, serviceId: string, updates: Partial<tracked_service>) => set(state => ({
    trackedServices: {
      ...state.trackedServices,
      [structureId]: state.trackedServices[structureId]?.map(service =>
        service.id === serviceId ? { ...service, ...updates } : service
      ) || []
    }
  })),

  resetCalculations: () => set({
    calculations: {
      design: {
        structures: [],
        levels: [],
        spaces: [],
        total: 0,
        parameters: {
          cost_index: null
        }
      },
      construction: {
        structures: [],
        levels: [],
        spaces: [],
        total: 0,
        parameters: {
          cost_index: null
        }
      },
      total: 0
    }
  }),

  setProject: (project) => set(state => ({
    project: {
      ...project,
      client_contacts: state.project?.client_contacts || []
    }
  })),
})); 