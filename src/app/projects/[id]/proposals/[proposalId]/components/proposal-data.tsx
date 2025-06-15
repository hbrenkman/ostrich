"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
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
type ProposalDataProps = {
  onDataChange: (data: { hasCompleteData: boolean }) => void;
  proposal: proposal;
  structures: Structure[];
  project: project | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  onSave: () => Promise<void>;
  trackedServices: Record<string, tracked_service[]>;
};

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
  onDataChange,
  proposal,
  structures,
  project,
  isLoading,
  isSaving,
  error,
  onSave,
  trackedServices
}, ref): JSX.Element => {
  const router = useRouter();
  const isInitialized = useRef(false);
  const saveRef = useRef(onSave);

  // Update saveRef when onSave changes
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  // Add logging for initial mount
  useEffect(() => {
    console.log('ProposalData: Component mounted', {
      proposalId: proposal?.id,
      hasProposal: !!proposal,
      isLoading,
      hasStructures: !!structures?.length,
      structureCount: structures?.length,
      hasError: !!error
    });
    return () => {
      console.log('ProposalData: Component unmounting');
    };
  }, []);

  // Track prop changes
  useEffect(() => {
    console.log('ProposalData: Props changed', {
      proposalId: proposal?.id,
      hasProposal: !!proposal,
      isLoading,
      hasStructures: !!structures?.length,
      structureCount: structures?.length,
      hasProject: !!project,
      hasError: !!error
    });

    if (!isLoading && proposal && project) {
      const data = {
        hasProjectData: !!project,
        hasStructures: structures.length > 0,
        hasCalculations: !!proposal.calculations,
        hasDisciplines: !!project?.disciplines,
        hasServices: !!project?.services,
        hasTrackedServices: Object.keys(trackedServices).length > 0
      };
      
      console.log('ProposalData: Checking data completeness', data);
      onDataChange({ hasCompleteData: data.hasProjectData });
    }
  }, [proposal, project, structures, trackedServices, isLoading, onDataChange]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      if (saveRef.current) {
        await saveRef.current();
      }
    },
    getData: () => proposal
  }), [proposal]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400 border-2 border-dashed border-gray-200 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p>Loading proposal...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error Loading Proposal</h3>
        <p className="mt-2 text-sm text-red-700">{error.message}</p>
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