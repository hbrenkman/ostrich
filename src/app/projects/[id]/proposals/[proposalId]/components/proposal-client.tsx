"use client";

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalStructures } from './proposal-structures';
import { FixedFees } from './fixed-fees';
import { FlexFees } from './flex-fees';
import { ContactSearch } from './contact-search';
import { ProposalActions } from './proposal-actions';
import { useProposalStore } from '@/store/proposal';
import { useParams } from 'next/navigation';

export function ProposalClient() {
  const params = useParams();
  const proposalId = params?.proposalId as string;
  const projectId = params?.id as string;
  const store = useProposalStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState('fixed');

  // Load project data
  const loadProject = useCallback(async () => {
    if (!projectId) return;

    try {
      console.log('ProposalClient: Loading project...', { projectId });
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status}`);
      }
      const projectData = await response.json();
      console.log('ProposalClient: Project data loaded:', projectData);
      // Update the store with project data
      store.setProject(projectData);
    } catch (err) {
      console.error('ProposalClient: Failed to load project...', { projectId, error: err });
      // Don't set error here, just log it
    }
  }, [projectId, store]);

  // Simple load function - remove store dependency to prevent infinite loops
  const loadProposal = useCallback(async () => {
    if (!proposalId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('ProposalClient: Loading proposal...', { proposalId });
      await store.loadProposal(proposalId);
      console.log('ProposalClient: Load complete', { 
        hasProposal: !!store.proposal, 
        hasStructures: store.structures.length > 0 
      });
    } catch (err) {
      console.error('ProposalClient: Load failed...', { proposalId, error: err });
      setError(err instanceof Error ? err : new Error('Failed to load proposal'));
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]); // Remove store dependency

  // Load both proposal and project when component mounts
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadProposal(),
        loadProject()
      ]);
    };
    loadData();
  }, [proposalId, projectId]); // Depend on both IDs

  // Handle contact selection and removal
  const handleContactSelect = useCallback((contact: any) => {
    // Convert CompanyContact to proposal_contact
    const proposalContact = {
      id: contact.id,
      name: `${contact.first_name} ${contact.last_name}`,
      email: contact.email || '',
      phone: contact.direct_phone || contact.mobile || '',
      role: contact.role,
      company: contact.location?.company?.name || '',
      is_primary: false,
      first_name: contact.first_name,
      last_name: contact.last_name,
      mobile: contact.mobile || undefined,
      direct_phone: contact.direct_phone || undefined,
      role_id: contact.role_id,
      location_id: contact.location_id,
      company_id: contact.company_id,
      status: 'active' as const,
      location: contact.location,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.addContact(proposalContact);
  }, [store]);

  const handleContactRemove = useCallback((contactId: string) => {
    store.removeContact(contactId);
  }, [store]);

  // Convert store contacts to CompanyContact format for ContactSearch
  const convertedContacts = store.contacts.map(contact => ({
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    mobile: contact.mobile || null,
    direct_phone: contact.direct_phone || null,
    role_id: contact.role_id,
    location_id: contact.location_id,
    status: contact.status,
    company_id: contact.company_id,
    role: typeof contact.role === 'string' ? undefined : contact.role
  }));

  // Handle invalid params
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

  // Render loading state
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

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error.message}</p>
            <button 
              onClick={loadProposal}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render no proposal state
  if (!store.proposal) {
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

  // Render proposal content with proper styling
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
                <h2 className="text-2xl font-semibold">
                  {store.project?.name || 'Loading project...'}
                </h2>
                <p className="text-gray-600">
                  Project #{store.project?.number || 'Loading...'}
                </p>
              </div>
              {store.proposal && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Proposal #{store.proposal.proposal_number}</p>
                  <p className="text-sm text-gray-600">Revision {store.proposal.revision_number}</p>
                  <p className="text-sm font-medium">{store.proposal.status.name}</p>
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
              selectedCompany={store.project?.company}
              onContactSelect={handleContactSelect}
              selectedContacts={convertedContacts}
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
            <ProposalStructures 
              costIndex={store.proposal.project_data?.cost_index ?? null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading fee calculations...</div>
            ) : store.structures ? (
              <div>
                <div className="flex gap-2 mb-4">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('fixed')}
                    className={`custom-tab ${activeTab === 'fixed' ? 'bg-primary/20 text-primary font-medium' : ''}`}
                  >
                    Fixed Fees
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('flex')}
                    className={`custom-tab ${activeTab === 'flex' ? 'bg-primary/20 text-primary font-medium' : ''}`}
                  >
                    Flex Fees
                  </button>
                </div>
                
                {activeTab === 'fixed' && (
                  <div>
                    <FixedFees
                      phase="design"
                      on_structures_change={(structures) => store.setStructures(structures)}
                      tracked_services={store.trackedServices}
                      has_construction_admin_services={false}
                      duplicate_structure_rates={[]}
                      construction_costs={{}}
                      on_fee_update={(structureId, levelId, spaceId, feeId, updates, phase) => {
                        // Handle fee updates
                      }}
                    />
                  </div>
                )}
                
                {activeTab === 'flex' && (
                  <div>
                    <FlexFees 
                      proposalId={proposalId}
                      onFeesChange={(categories) => {
                        // Handle fee changes
                      }}
                    />
                  </div>
                )}
              </div>
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
            <div className="text-center py-8 text-gray-600">
              Cost Breakdown component will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 