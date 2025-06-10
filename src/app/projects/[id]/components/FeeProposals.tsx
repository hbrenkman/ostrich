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
import { toast } from 'react-hot-toast';

interface Proposal {
  id: string;
  project_id: string;
  proposal_number: number;
  revision_number: number;
  is_temporary_revision: boolean;
  status_id: string;
  status_name: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  project_data: Record<string, any>;
  contacts: any[]; // JSONB array from database
}

interface FeeProposalsProps {
  projectId: string;
  projectUUID: string | null;
  onAddProposal: () => void;
}

const getProposalStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'published':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'on hold':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'edit':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export default function FeeProposals({
  projectId,
  projectUUID,
  onAddProposal,
}: FeeProposalsProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!projectUUID) {
        console.log('No project UUID available yet');
        return;
      }

      try {
        console.log('Fetching proposals for project:', { projectId, projectUUID });
        const response = await fetch(`/api/fee-proposals?project_id=${projectUUID}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to fetch proposals');
        }
        const data = await response.json();
        console.log('Fetched proposals:', data);
        setProposals(data);
      } catch (error) {
        console.error('Error fetching proposals:', error);
        toast.error('Failed to load proposals');
      } finally {
        setLoadingProposals(false);
      }
    };

    fetchProposals();
  }, [projectId, projectUUID]);

  const handleDeleteProposal = async (proposal: Proposal) => {
    if (!window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/fee-proposals/${proposal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to delete proposal');
      }

      // Remove the deleted proposal from the state
      setProposals(prev => prev.filter(p => p.id !== proposal.id));
      toast.success('Proposal deleted successfully');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Failed to delete proposal');
    }
  };

  const canDeleteProposal = (status: string) => {
    // Only allow deletion for proposals in Edit or Review status
    return ['Edit', 'Review'].includes(status);
  };

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

      {loadingProposals ? (
        <div className="text-sm text-gray-500">Loading proposals...</div>
      ) : proposals.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 dark:text-[#E5E7EB]">
                    #{proposal.proposal_number.toString().padStart(3, '0')}
                    {proposal.revision_number > 1 && ` (Rev. ${proposal.revision_number})`}
                    {proposal.is_temporary_revision && ' (Draft)'}
                  </span>
                  {proposal.description && (
                    <>
                      <span className="text-sm text-gray-500">|</span>
                      <span className="text-sm text-gray-900 dark:text-[#E5E7EB]">
                        {proposal.description}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProposalStatusColor(proposal.status_name)}`}>
                    {proposal.status_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link 
                      href={`/projects/${projectId}/proposals/${proposal.id}`}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Link>
                    {canDeleteProposal(proposal.status_name) && (
                      <button
                        onClick={() => handleDeleteProposal(proposal)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No proposals yet. Click "Add Proposal" to create one.</div>
      )}
    </div>
  );
} 