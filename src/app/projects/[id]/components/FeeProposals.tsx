"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import type { FeeProposalsProps, FeeProposalListItem } from '@/types/proposal/shared';
import { ProposalStatusBadge } from './proposal-status-badge';

export default function FeeProposals({
  projectId,
  projectUUID,
  onAddProposal,
  onProposalSelect,
  onProposalDelete,
  canEdit = true,
  canDelete = true
}: FeeProposalsProps) {
  const [proposals, setProposals] = useState<FeeProposalListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/fee-proposals?project_id=${projectId}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch proposals (${response.status})`);
        }

        const data = await response.json();
        setProposals(data);
        setRetryCount(0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load proposals';
        setError(message);
        
        if (retryCount === 0) {
          toast.error(message);
        }
        
        setRetryCount(prev => prev + 1);
      } finally {
        setIsLoading(false);
      }
    };

    if (retryCount < 3) {
      fetchProposals();
    }

    return () => {
      setRetryCount(0);
    };
  }, [projectId, retryCount]);

  const handleDelete = async (proposalId: string) => {
    if (!onProposalDelete) return;

    try {
      await onProposalDelete(proposalId);
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      toast.success('Proposal deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete proposal';
      toast.error(message);
    }
  };

  const canDeleteProposal = (status: string) => {
    // Only allow deletion for proposals in Edit or Review status
    return ['Edit', 'Review'].includes(status);
  };

  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#D1D5DB] dark:border-[#4DB6AC]">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading proposals...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#D1D5DB] dark:border-[#4DB6AC]">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Error Loading Proposals</h3>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#D1D5DB] dark:border-[#4DB6AC]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E5E7EB]">Fee Proposals</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddProposal}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Proposal
          </button>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No proposals found. Click "Add Proposal" to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Proposal #{proposal.proposal_number}
                    {proposal.is_temporary_revision && ' (Draft)'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Revision {proposal.revision_number}
                  </p>
                </div>
                <ProposalStatusBadge status={proposal.status} />
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <Link
                    href={`/projects/${projectId}/proposals/${proposal.id}`}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                )}
                
                {canDelete && canDeleteProposal(proposal.status.name) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => handleDelete(proposal.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Proposal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 