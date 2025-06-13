"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProposalStructures } from './proposal-structures';
import { EngineeringServicesManager } from './engineering-services-manager';
import { ContactSearch } from './contact-search';
import { SpaceDialog } from './space-dialog';
import { useProposalStore } from '@/store/proposal';

// Import types from base module
import type { 
  proposal,
  Structure,
  Level,
  Space,
  FeeCalculationResult,
  EngineeringServiceLink,
  FeeScale,
  FeeCalculationState,
  proposal_contact
} from '@/types/proposal/base';

// Import tracked service type from service module
import type { tracked_service } from '@/types/proposal/service';

// Component props type
interface ProposalDataProps {
  proposalId: string;
  projectId: string;
  isNewProposal?: boolean;
  onDataChange?: (data: proposal) => void;
}

interface ProposalDataRef {
  save: () => Promise<void>;
  load: () => Promise<void>;
  getData: () => proposal | null;
}

// Update calculation result creation to use correct property names
const createCalculationResult = (
  type: 'design' | 'construction',
  category: 'discipline_fee' | 'construction_cost' | 'service_fee',
  value: number,
  parameters: Record<string, number | string | boolean>,
  structure_id: string,
  level_id: string,
  space_id: string,
  fee_id: string,
  fee_type: string
): FeeCalculationResult => ({
  id: crypto.randomUUID(),
  type,
  category,
  value,
  parameters,
  timestamp: new Date().toISOString(),
  source: 'fixed_fees',
  structure_id,
  level_id,
  space_id,
  fee_id,
  fee_type
});

/**
 * ProposalData Component
 * Manages proposal data and calculations
 */
export const ProposalData = forwardRef<ProposalDataRef, ProposalDataProps>(({ 
  proposalId, 
  projectId, 
  isNewProposal = false, 
  onDataChange
}, ref): JSX.Element => {
  const router = useRouter();
  const isInitialized = useRef(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);
  
  // Get state and actions from the store
  const {
    proposal,
    isLoading,
    isSaving,
    error,
    loadProposal,
    setProposal
  } = useProposalStore();

  // Single loading effect to handle all loading cases
  useEffect(() => {
    const loadData = async () => {
      // Skip if we don't have required IDs
      if (!proposalId || !projectId) {
        console.log('ProposalData: Missing required IDs:', {
          hasProposalId: !!proposalId,
          hasProjectId: !!projectId
        });
        return;
      }

      // Skip if already loading
      if (isLoading) {
        console.log('ProposalData: Already loading, skipping');
        return;
      }

      // Skip if we already have the proposal
      if (proposal?.id === proposalId) {
        console.log('ProposalData: Already have proposal data:', {
          proposalId,
          hasStructures: !!proposal.project_data?.structures,
          structureCount: proposal.project_data?.structures?.length
        });
        return;
      }

      try {
        if (isNewProposal) {
          console.log('Initializing new proposal data');
          // Initialize new proposal data using store action
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
          setProposal(newProposal);
        } else {
          console.log('ProposalData: Loading proposal data...');
          await loadProposal(proposalId);
          console.log('ProposalData: Proposal data loaded successfully');
        }
      } catch (error) {
        console.error('ProposalData: Error loading proposal:', error);
        toast.error('Failed to load proposal data');
      }
    };

    loadData();
  }, [proposalId, projectId, isLoading, loadProposal, proposal?.id, isNewProposal, setProposal]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      if (!proposal) {
        console.log('ProposalData: No proposal to save');
        return;
      }

      try {
        console.log('ProposalData: Saving proposal...');
        const response = await fetch(`/api/proposals/${proposalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proposal)
        });

        if (!response.ok) {
          throw new Error(`Failed to save proposal: ${response.statusText}`);
        }

        const updatedProposal = await response.json();
        console.log('ProposalData: Proposal saved successfully:', updatedProposal);
        setProposal(updatedProposal);
        toast.success('Proposal saved successfully');
      } catch (error) {
        console.error('ProposalData: Error saving proposal:', error);
        toast.error('Failed to save proposal');
        throw error;
      }
    },
    load: async () => {
      // Skip if we already have the proposal
      if (proposal?.id === proposalId) {
        console.log('ProposalData: Already have proposal data, skipping load');
        return;
      }

      try {
        console.log('ProposalData: Loading proposal via ref...');
        await loadProposal(proposalId);
        console.log('ProposalData: Proposal loaded successfully via ref');
      } catch (error) {
        console.error('ProposalData: Error loading proposal via ref:', error);
        toast.error('Failed to load proposal');
        throw error;
      }
    },
    getData: () => proposal
  }), [proposal, proposalId, setProposal, loadProposal]);

  // Notify parent of data changes - only when proposal ID changes
  useEffect(() => {
    if (onDataChange && proposal) {
      console.log('ProposalData: Calling onDataChange with proposal ID:', proposal.id);
      onDataChange(proposal);
    }
  }, [proposal?.id, onDataChange]); // Only depend on proposal ID

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal data...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error Loading Proposal</h3>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={() => loadProposal(proposalId)}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  // Handle no proposal state
  if (!proposal) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800">No Proposal Data</h3>
        <p className="mt-2 text-yellow-700">No proposal data is available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          onClick={() => saveRef.current?.()}
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