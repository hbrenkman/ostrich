"use client";

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ArrowLeft, Building2, Calculator, Contact2, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useProposalStore } from '@/store/proposal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProposalStructures } from './proposal-structures';
import { EngineeringServicesManager } from './engineering-services-manager';
import { SpaceDialog } from './space-dialog';
import { FixedFees } from './fixed-fees';
import { FlexFees } from './flex-fees';
import { ProposalData } from './proposal-data';
import { ContactSearch } from './contact-search';
import { ProposalActions } from './proposal-actions';
import type { Project, FeeProposalListItem } from '@/types/proposal/shared';
import type { 
  Structure, 
  Level, 
  Space,
  FeeCalculationState,
  proposal,
  proposal_contact
} from '@/types/proposal/base';
import type { tracked_service as TrackedService } from '@/types/proposal/service';

// Extend the Project type to include cost_index
type ExtendedProject = Project & {
  cost_index: number | null;
};

// Component implementation
export function ProposalClient() {
  const params = useParams();
  const proposalId = params?.proposalId as string;
  const projectId = params?.id as string;
  const store = useProposalStore();
  const {
    proposal,
    project: rawProject,
    structures,
    status,
    isLoading,
    error,
    contacts,
    trackedServices,
    setStructures,
    setTrackedServices,
    addContact,
    removeContact,
    loadProposal,
    calculations,
    setProposal,
    setProject
  } = store;

  // Cast project to include cost_index
  const project = rawProject as ExtendedProject | null;

  const [phase, setPhase] = useState<'design' | 'construction'>('design');
  const [isLoadingProject, setIsLoadingProject] = React.useState(true);
  const hasLoadedProject = useRef(false);
  const proposalDataRef = useRef<{ load: () => Promise<void> }>(null);

  // Compute hasConstructionAdminServices from trackedServices
  const hasConstructionAdminServices = React.useMemo(() => {
    return Object.values(trackedServices).some(services => 
      services.some(service => service.is_construction_admin)
    );
  }, [trackedServices]);

  // Extract params after hooks
  const isNewProposal = proposalId === 'new';

  // Add default calculations object
  const defaultCalculations = {
    design: { structures: [], levels: [], spaces: [], total: 0, parameters: { cost_index: 0 } },
    construction: { structures: [], levels: [], spaces: [], total: 0, parameters: { cost_index: 0 } },
    total: 0
  };

  // Load project information
  useEffect(() => {
    const loadProjectInfo = async () => {
      // Guard against re-running if we've already loaded the project
      if (!projectId || hasLoadedProject.current) {
        console.log('ProposalClient: Skipping project load:', {
          hasProjectId: !!projectId,
          hasLoaded: hasLoadedProject.current
        });
        return;
      }
      
      console.log('ProposalClient: Starting to load project data...', {
        projectId,
        currentProject: project,
        isLoadingProject
      });

      try {
        setIsLoadingProject(true);
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('ProposalClient: Project API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('ProposalClient: Project data received:', {
          id: data.id,
          name: data.name,
          costIndex: data.costIndex,
          hasData: !!data,
          hasProposal: !!proposal,
          hasProjectData: !!proposal?.project_data
        });

        // Set the project data in the store
        setProject({
          id: data.id,
          name: data.name,
          number: data.number,
          cost_index: data.costIndex,
          company: data.company,
          created_at: data.created_at,
          updated_at: data.updated_at
        });

        // Only update if we have a proposal and the cost index is different
        if (proposal?.project_data?.cost_index !== data.costIndex) {
          console.log('ProposalClient: Updating proposal cost index:', {
            oldIndex: proposal?.project_data?.cost_index,
            newIndex: data.costIndex
          });
          
          // If we don't have a proposal yet, just store the project data
          if (!proposal) {
            // Create new proposal with default values
            setProposal({
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
                  ...defaultCalculations,
                  design: { ...defaultCalculations.design, parameters: { cost_index: data.costIndex } },
                  construction: { ...defaultCalculations.construction, parameters: { cost_index: data.costIndex } }
                },
                disciplines: [],
                services: [],
                tracked_services: [],
                cost_index: data.costIndex
              }
            });
          } else {
            // Update existing proposal with new cost index
            const currentCalculations = proposal.project_data?.calculations || defaultCalculations;
            setProposal({
              ...proposal,
              project_data: {
                ...proposal.project_data,
                cost_index: data.costIndex,
                calculations: {
                  ...currentCalculations,
                  design: {
                    ...(currentCalculations.design || defaultCalculations.design),
                    parameters: { cost_index: data.costIndex }
                  },
                  construction: {
                    ...(currentCalculations.construction || defaultCalculations.construction),
                    parameters: { cost_index: data.costIndex }
                  }
                }
              }
            });
          }
        }

        hasLoadedProject.current = true;
      } catch (error) {
        console.error('ProposalClient: Error loading project data:', error);
        toast.error('Failed to load project data');
      } finally {
        console.log('ProposalClient: Finished loading project data, setting isLoadingProject to false');
        setIsLoadingProject(false);
      }
    };

    loadProjectInfo();
  }, [projectId]); // Only depend on projectId since we handle proposal updates inside

  // Handle proposal data changes
  const handleProposalDataChange = useCallback((data: typeof proposal) => {
    console.log('ProposalClient: Proposal data changed:', {
      id: data.id,
      hasStructures: !!data.project_data?.structures,
      structureCount: data.project_data?.structures?.length
    });
  }, []);

  // Memoize handlers to prevent unnecessary re-renders
  const handleStructuresChange = useCallback((newStructures: Structure[]) => {
    store.setStructures(newStructures);
  }, [store]);

  const handleConstructionCostUpdate = useCallback((
    structureId: string,
    levelId: string,
    spaceId: string,
    feeId: string,
    updates: Partial<{ 
      total_construction_cost?: number; 
      cost_per_sqft?: number; 
      fee_amount?: number;
      is_active: boolean 
    }>,
    feePhase: 'design' | 'construction'
  ) => {
    setStructures((prevStructures: Structure[]) => prevStructures.map((structure: Structure) => {
      if (structure.id !== structureId) return structure;

      return {
        ...structure,
        levels: structure.levels.map((level: Level) => {
          if (level.id !== levelId) return level;

          return {
            ...level,
            spaces: level.spaces.map((space: Space) => {
              if (space.id !== spaceId) return space;

              if (feePhase === 'construction') {
                // Update construction cost
                const discipline = Object.keys(space.construction_costs).find(
                  key => space.construction_costs[key as keyof typeof space.construction_costs]?.id === feeId
                );
                if (!discipline) return space;

                return {
                  ...space,
                  construction_costs: {
                    ...space.construction_costs,
                    [discipline]: {
                      ...space.construction_costs[discipline as keyof typeof space.construction_costs],
                      ...updates
                    }
                  }
                };
              } else {
                // Update engineering fee
                return {
                  ...space,
                  discipline_engineering_fees: space.discipline_engineering_fees.map(df => ({
                    ...df,
                    engineering_fees: df.engineering_fees.map(fee => 
                      fee.id === feeId ? { ...fee, ...updates } : fee
                    )
                  }))
                };
              }
            })
          };
        })
      };
    }));
  }, [setStructures]);

  const handleAddSpace = useCallback((structureId: string, levelId: string, space: Omit<Space, 'id'>) => {
    console.log('ProposalClient: handleAddSpace called with:', {
      structureId,
      levelId,
      space
    });

    if (!proposal) {
      console.log('ProposalClient: handleAddSpace - No proposal found');
      return;
    }

    const updatedStructures = structures.map(structure => {
      if (structure.id !== structureId) return structure;

      return {
        ...structure,
        levels: structure.levels.map(level => {
          if (level.id !== levelId) return level;

          return {
            ...level,
            spaces: [...level.spaces, { ...space, id: crypto.randomUUID() }]
          };
        })
      };
    });

    setStructures(updatedStructures);

    // Update proposal with new structures
    setProposal({
      ...proposal,
      project_data: {
        ...proposal.project_data,
        structures: updatedStructures
      }
    });
  }, [proposal, structures, setStructures, setProposal]);

  const handleServicesChange = useCallback((structureId: string, services: tracked_service[]) => {
    setTrackedServices(structureId, services);
  }, [setTrackedServices]);

  // Handlers for contacts
  const handleContactSelect = useCallback((contact: { id: string; name: string; email: string; role: string }) => {
    addContact(contact);
  }, [addContact]);

  const handleContactRemove = useCallback((contactId: string) => {
    removeContact(contactId);
  }, [removeContact]);

  // Now we can handle all conditional renders after all hooks are called
  if (!params?.proposalId || !params?.id) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Invalid proposal or project ID</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading proposal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            {isLoadingProject && (
              <>
                <p className="mb-4">Loading project information...</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!proposal || !status) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">No proposal found</p>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="container mx-auto px-4 pt-24 pb-4">
      {/* Back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/projects/${projectId}`} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Link>
        <ProposalActions />
      </div>

      {/* Project and Proposal Information */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{project?.name}</h2>
                <p className="text-gray-600">Project #{project?.number}</p>
              </div>
              {proposal && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Proposal #{proposal.proposal_number}</p>
                  <p className="text-sm text-gray-600">Revision {proposal.revision_number}</p>
                  <p className="text-sm font-medium">{status.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactSearch
              selectedCompany={project?.company}
              onContactSelect={handleContactSelect}
              selectedContacts={contacts}
              onContactRemove={handleContactRemove}
            />
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Structures</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProject ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading project data...</p>
                </div>
              </div>
            ) : !project ? (
              <div className="text-center p-8 text-gray-600">
                Project information not available
              </div>
            ) : (
              <>
                {console.log('ProposalClient: Structures section render state:', {
                  hasStructures: !!structures,
                  structuresCount: structures?.length,
                  hasProject: !!project,
                  projectId: project?.id,
                  isLoadingProject,
                  hasLoadedProject: hasLoadedProject.current
                })}
                <ProposalStructures
                  costIndex={project?.cost_index ?? null}
                  onAddProposal={handleAddSpace}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading fee calculations...</div>
            ) : structures ? (
              <Tabs defaultValue="flex">
                <TabsList>
                  {/* Temporarily disabled FixedFees tab
                  <TabsTrigger value="fixed">Fixed Fees</TabsTrigger>
                  */}
                  <TabsTrigger value="flex">Flex Fees</TabsTrigger>
                </TabsList>
                {/* Temporarily disabled FixedFees content
                <TabsContent value="fixed">
                  <FixedFees
                    cost_index={project?.cost_index}
                  />
                </TabsContent>
                */}
                <TabsContent value="flex">
                  <FlexFees 
                    structures={structures}
                    phase={phase}
                    onStructuresChange={handleStructuresChange}
                    trackedServices={trackedServices}
                    onTrackedServicesChange={handleServicesChange}
                    calculations={calculations}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div>No fee calculations available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ProposalData
              ref={proposalDataRef}
              proposalId={proposalId}
              projectId={projectId}
              isNewProposal={isNewProposal}
              onDataChange={handleProposalDataChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 