"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Trash2, Send, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { useProposalStore } from '@/store/proposal';
import { ProposalStatusBadge } from '@/app/projects/[id]/components/proposal-status-badge';
import type { UserRole } from '@/types/proposal/shared';

export function ProposalActions() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get state and actions from the store
  const {
    proposal,
    status,
    statuses,
    isLoading,
    error,
    isDeleteDialogOpen,
    isRejectDialogOpen,
    rejectFeedback,
    canEdit,
    canReview,
    canApprove,
    canPublish,
    canClientApprove,
    canClientReject,
    canHold,
    canCancel,
    setProposal,
    updateStatus,
    fetchStatuses,
    setDeleteDialogOpen,
    setRejectDialogOpen,
    setRejectFeedback,
    setError
  } = useProposalStore();
  
  if (!params?.proposalId || !params?.id) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Invalid Proposal</h3>
        <p className="mt-2 text-red-700">Invalid proposal or project ID</p>
      </div>
    );
  }
  
  const proposalId = params.proposalId as string;
  const projectId = params.id as string;
  const isNewProposal = proposalId === 'new';

  // Fetch proposal statuses on mount
  useEffect(() => {
    const initializeStatuses = async () => {
      // Prevent multiple initializations
      if (isInitialized) return;

      try {
        // Wait for auth to be ready
        if (authLoading) {
          console.log('Waiting for auth to be ready...');
          return;
        }

        // Check if we have a user
        if (!user) {
          console.log('No user found, redirecting to login...');
          router.push('/auth/login');
          return;
        }

        // Fetch statuses only if we don't have them yet
        if (!statuses.length) {
          await fetchStatuses();
        }

        // For new proposals, set initial status
        if (isNewProposal && proposal) {
          const editStatus = statuses.find(s => s.code === 'edit');
          if (editStatus && proposal.status_id !== editStatus.id) {
            setProposal({
              ...proposal,
              status_id: editStatus.id,
              status: editStatus,
              updated_by: user.id,
              updated_at: new Date().toISOString()
            });
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing statuses:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize statuses');
        toast.error('Failed to initialize statuses');
      }
    };

    initializeStatuses();
  }, [authLoading, user, router, isNewProposal, proposal, fetchStatuses, setProposal, setError, isInitialized, statuses.length]);

  // Action handlers
  const handleDelete = () => {
    if (!canEdit) {
      toast.error('Proposals can only be deleted in edit status');
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!proposal) return;
    
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete proposal');
      }
      
      toast.success('Proposal deleted successfully');
      router.push(`/projects/${projectId}/proposals`);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete proposal');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleReview = async () => {
    if (!canReview) return;
    await updateStatus('review');
    toast.success('Proposal submitted for review');
  };

  const handleApprove = async () => {
    if (!canApprove) return;
    await updateStatus('approved');
    toast.success('Proposal approved');
  };

  const handleReject = async () => {
    if (!canApprove || !proposal) return;
    
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback: rejectFeedback })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject proposal');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal rejected');
      setRejectDialogOpen(false);
      setRejectFeedback('');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject proposal');
    }
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    await updateStatus('published');
    toast.success('Proposal published to client');
  };

  const handleClientApprove = async () => {
    if (!canClientApprove) return;
    await updateStatus('client_approved');
    toast.success('Proposal approved by client');
  };

  const handleClientReject = async () => {
    if (!canClientReject) return;
    await updateStatus('client_rejected');
    toast.success('Proposal rejected by client');
  };

  const handleHold = async () => {
    if (!canHold) return;
    await updateStatus('on_hold');
    toast.success('Proposal placed on hold');
  };

  const handleCancel = async () => {
    if (!canCancel) return;
    await updateStatus('cancelled');
    toast.success('Proposal cancelled');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal actions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error Loading Actions</h3>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {status && <ProposalStatusBadge status={status} />}
          {proposal && (
            <span className="text-sm text-gray-500">
              Revision {proposal.revision_number}
              {proposal.is_temporary_revision && ' (Temporary)'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          
          {canReview && (
            <Button
              variant="default"
              size="sm"
              onClick={handleReview}
              disabled={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          )}
          
          {canApprove && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleApprove}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setRejectDialogOpen(true)}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          
          {canPublish && (
            <Button
              variant="default"
              size="sm"
              onClick={handlePublish}
              disabled={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Publish to Client
            </Button>
          )}
          
          {canClientApprove && (
            <Button
              variant="default"
              size="sm"
              onClick={handleClientApprove}
              disabled={isLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Client Approve
            </Button>
          )}
          
          {canClientReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClientReject}
              disabled={isLoading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Client Reject
            </Button>
          )}
          
          {canHold && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleHold}
              disabled={isLoading}
            >
              <Clock className="w-4 h-4 mr-2" />
              Place on Hold
            </Button>
          )}
          
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this proposal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Please provide feedback for rejecting this proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="Enter rejection feedback..."
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectFeedback('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectFeedback.trim()}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 