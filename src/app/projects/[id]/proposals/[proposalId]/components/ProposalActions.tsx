"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { supabase } from '@/lib/supabase';

type ProposalStatusName = 'Edit' | 'Review' | 'Approved' | 'Published' | 'Active' | 'On Hold' | 'Cancelled';
type UserRole = 'Project Manager' | 'Manager' | 'Admin';

interface ProposalStatus {
  id: string;
  name: ProposalStatusName;
  description: string;
  is_active: boolean;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  direct_phone: string | null;
  role_id: string | null;
  location_id: string | null;
  status: string;
  company_id: string | null;
  role?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    zip: string;
    company_id: string;
    company?: {
      id: string;
      name: string;
    }
  }
}

interface Proposal {
  id: string;
  status_id: string;
  status: ProposalStatusName;  // Keep this for backward compatibility
  revisionNumber: string;
  isTemporaryRevision: boolean;
  proposal_number?: number;
  clientContacts?: Contact[];  // Contacts from the UI
  contacts?: Contact[];        // Contacts from the database
  description?: string;
  project_data?: any;
  created_by?: string;
  updated_by?: string;
}

export function ProposalActions() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  if (!params?.proposalId || !params?.id) {
    return <div>Invalid proposal or project ID</div>;
  }
  
  const proposalId = params.proposalId as string;
  const projectId = params.id as string;
  const isNewProposal = proposalId === 'new';

  // State management
  const [proposalStatuses, setProposalStatuses] = useState<ProposalStatus[]>([]);
  const [proposal, setProposal] = useState<Proposal>(isNewProposal ? {
    id: 'new',
    status_id: '', // This will be set when we fetch statuses
    status: 'Edit',
    revisionNumber: '1',
    isTemporaryRevision: true
  } : {
    id: '',
    status_id: '',
    status: 'Edit',
    revisionNumber: '1',
    isTemporaryRevision: true
  });
  const [userRole, setUserRole] = useState<UserRole>('Project Manager'); // This should come from your auth system
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // Fetch proposal statuses
  useEffect(() => {
    const fetchProposalStatuses = async () => {
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

        console.log('Fetching proposal statuses...');
        const response = await fetch('/api/proposal-statuses', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.status === 401) {
          console.log('Unauthorized response, attempting to refresh session...');
          // Try to refresh the session
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Failed to refresh session:', refreshError);
            router.push('/auth/login');
            return;
          }

          if (!session) {
            console.log('No session after refresh, redirecting to login...');
            router.push('/auth/login');
            return;
          }

          // Retry the request with the new session
          console.log('Retrying request with refreshed session...');
          const retryResponse = await fetch('/api/proposal-statuses', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          if (!retryResponse.ok) {
            throw new Error('Failed to fetch proposal statuses after session refresh');
          }

          const data = await retryResponse.json();
          setProposalStatuses(data);
          
          // For new proposals, set the initial status_id to the 'Edit' status
          if (isNewProposal) {
            const editStatus = data.find((status: ProposalStatus) => status.name === 'Edit');
            if (editStatus) {
              setProposal(prev => ({
                ...prev,
                status_id: editStatus.id
              }));
            }
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch proposal statuses');
        }

        const data = await response.json();
        setProposalStatuses(data);
        
        // For new proposals, set the initial status_id to the 'Edit' status
        if (isNewProposal) {
          const editStatus = data.find((status: ProposalStatus) => status.name === 'Edit');
          if (editStatus) {
            setProposal(prev => ({
              ...prev,
              status_id: editStatus.id
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching proposal statuses:', error);
        toast.error('Failed to fetch proposal statuses');
        
        // If it's an auth error, redirect to login
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          router.push('/auth/login');
        }
      }
    };

    fetchProposalStatuses();
  }, [isNewProposal, user, authLoading, router]);

  // Fetch proposal data only if not a new proposal
  useEffect(() => {
    if (isNewProposal) return;

    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch proposal');
        }
        const data = await response.json();
        updateProposalState(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        toast.error('Failed to fetch proposal');
      }
    };

    fetchProposal();
  }, [proposalId, isNewProposal]);

  // Action handlers
  const handleDelete = () => {
    if (proposal?.status !== 'Edit') {
      toast.error('Proposals can only be deleted in Edit status');
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!proposal) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete proposal');
      }
      router.push(`/projects/${projectId}`);
      toast.success('Proposal deleted successfully');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete proposal');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReview = async () => {
    if (!proposal) return;
    const reviewStatus = proposalStatuses.find(s => s.name === 'Review');
    if (!reviewStatus) {
      toast.error('Review status not found');
      return;
    }

    setIsReviewing(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status_id: reviewStatus.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit for review');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal submitted for review');
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit for review');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApprove = async () => {
    if (!proposal) return;
    setIsApproving(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status_id: proposal.status_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve proposal');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal approved');
    } catch (error) {
      console.error('Error approving proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve proposal');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status_id: proposal.status_id,
          rejection_reason: rejectFeedback,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject proposal');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal rejected');
      setIsRejectDialogOpen(false);
      setRejectFeedback('');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject proposal');
    } finally {
      setIsRejecting(false);
    }
  };

  const handlePublish = async () => {
    if (!proposal) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status_id: proposal.status_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish proposal');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal published');
    } catch (error) {
      console.error('Error publishing proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish proposal');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClientApprove = async () => {
    if (!proposal) return;
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/client-approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_id: proposal.status_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as client approved');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal marked as client approved');
    } catch (error) {
      console.error('Error marking as client approved:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark as client approved');
    }
  };

  const handleClientReject = async () => {
    if (!proposal) return;
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/client-reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_id: proposal.status_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as client rejected');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal marked as client rejected');
    } catch (error) {
      console.error('Error marking as client rejected:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark as client rejected');
    }
  };

  const handleHold = async () => {
    if (!proposal) return;
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/hold`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_id: proposal.status_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place proposal on hold');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal placed on hold');
    } catch (error) {
      console.error('Error placing proposal on hold:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place proposal on hold');
    }
  };

  const handleCancel = async () => {
    if (!proposal) return;
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_id: proposal.status_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel proposal');
      }
      
      const updatedProposal = await response.json();
      setProposal(updatedProposal);
      toast.success('Proposal cancelled');
    } catch (error) {
      console.error('Error cancelling proposal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel proposal');
    }
  };

  const handleSave = async () => {
    if (proposal?.status !== 'Edit') return;
    if (!user?.id) {
      toast.error('You must be logged in to save a proposal');
      return;
    }
    setIsSaving(true);
    try {
      // Add debug logging
      console.log('Saving proposal with contacts:', {
        clientContacts: proposal.clientContacts,
        contacts: proposal.contacts,
        proposalState: proposal
      });

      // Structure the contacts to maintain company-location relationships
      const structuredContacts = (proposal.clientContacts || proposal.contacts || []).map(contact => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        mobile: contact.mobile,
        direct_phone: contact.direct_phone,
        role_id: contact.role_id,
        location_id: contact.location_id,
        status: contact.status,
        company_id: contact.company_id,
        // Include the full role information if available
        role: contact.role ? {
          id: contact.role.id,
          name: contact.role.name
        } : null,
        // Include the full location and company information if available
        location: contact.location ? {
          id: contact.location.id,
          name: contact.location.name,
          address_line1: contact.location.address_line1,
          address_line2: contact.location.address_line2,
          city: contact.location.city,
          state: contact.location.state,
          zip: contact.location.zip,
          company_id: contact.location.company_id,
          company: contact.location.company ? {
            id: contact.location.company.id,
            name: contact.location.company.name
          } : null
        } : null
      }));

      const requestBody = {
        project_id: projectId,
        status_id: proposal.status_id,
        proposal_number: proposal.proposal_number,
        revision_number: proposal.revisionNumber,
        is_temporary_revision: proposal.isTemporaryRevision,
        description: proposal.description,
        project_data: proposal.project_data,
        contacts: structuredContacts, // Add the structured contacts to the request body
        created_by: user.id,
        updated_by: user.id
      };

      // Add debug logging for request body
      console.log('Request body being sent:', requestBody);

      const saveResponse = await fetch(`/api/proposals/${proposalId}`, {
        method: isNewProposal ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save proposal');
      }

      const savedProposal = await saveResponse.json();
      console.log('Saved proposal response:', savedProposal);

      // Update both clientContacts and contacts in the state with the saved contacts
      setProposal({
        ...savedProposal,
        clientContacts: savedProposal.contacts || [], // Update clientContacts with saved contacts
        contacts: savedProposal.contacts || [] // Also update contacts to keep them in sync
      });

      toast.success('Proposal saved successfully');
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get status name from status_id
  const getStatusName = (statusId: string) => {
    const status = proposalStatuses.find(s => s.id === statusId);
    return status?.name || 'Unknown';
  };

  // Update the renderStatusBadge to use status_id
  const renderStatusBadge = () => {
    const statusName = getStatusName(proposal.status_id);
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusName === 'Edit' ? 'bg-yellow-100 text-yellow-800' :
        statusName === 'Review' ? 'bg-blue-100 text-blue-800' :
        statusName === 'Approved' ? 'bg-green-100 text-green-800' :
        statusName === 'Published' ? 'bg-purple-100 text-purple-800' :
        statusName === 'Active' ? 'bg-green-100 text-green-800' :
        statusName === 'On Hold' ? 'bg-orange-100 text-orange-800' :
        'bg-red-100 text-red-800'
      }`}>
        {statusName === 'Edit' && <Clock className="w-3 h-3 mr-1" />}
        {statusName === 'Review' && <AlertCircle className="w-3 h-3 mr-1" />}
        {statusName === 'Approved' && <CheckCircle className="w-3 h-3 mr-1" />}
        {statusName === 'Published' && <Send className="w-3 h-3 mr-1" />}
        {statusName === 'Active' && <CheckCircle className="w-3 h-3 mr-1" />}
        {statusName === 'On Hold' && <Clock className="w-3 h-3 mr-1" />}
        {statusName === 'Cancelled' && <XCircle className="w-3 h-3 mr-1" />}
        {statusName} {proposal.isTemporaryRevision ? '(Temporary)' : `(Rev. ${proposal.revisionNumber})`}
      </div>
    );
  };

  // Update the updateProposalState function to handle both contact fields
  const updateProposalState = (data: Partial<Proposal>) => {
    if (!data) {
      setProposal({
        id: '',
        status_id: '',
        status: 'Edit',
        revisionNumber: '1',
        isTemporaryRevision: true,
        clientContacts: [], // Initialize empty clientContacts array
        contacts: []        // Initialize empty contacts array
      });
      return;
    }

    // If we have contacts from the database, sync them with clientContacts
    const contacts = data.contacts || [];
    setProposal({
      id: data.id || '',
      status_id: data.status_id || '',
      status: (data.status as ProposalStatusName) || 'Edit',
      revisionNumber: data.revisionNumber || '1',
      isTemporaryRevision: data.isTemporaryRevision ?? true,
      proposal_number: data.proposal_number,
      clientContacts: data.clientContacts || contacts, // Use clientContacts if available, otherwise use contacts
      contacts: contacts,                             // Keep contacts in sync
      description: data.description,
      project_data: data.project_data,
      created_by: data.created_by,
      updated_by: data.updated_by
    });
  };

  if (!isNewProposal && proposal.id === '') {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {renderStatusBadge()}
        <div className="flex gap-2">
          {/* Edit Status Actions */}
          {getStatusName(proposal.status_id) === 'Edit' && (
            <>
              {userRole === 'Project Manager' && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReview}
                  disabled={isReviewing}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {isReviewing ? 'Submitting...' : 'Submit for Review'}
                </Button>
              )}
              {(userRole === 'Project Manager' || userRole === 'Manager' || userRole === 'Admin') && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Proposal
                </Button>
              )}
            </>
          )}

          {/* Review Status Actions */}
          {getStatusName(proposal.status_id) === 'Review' && ['Manager', 'Admin'].includes(userRole) && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleApprove}
                disabled={isApproving}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isApproving ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={isRejecting}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </Button>
            </>
          )}

          {/* Approved Status Actions */}
          {getStatusName(proposal.status_id) === 'Approved' && userRole === 'Project Manager' && (
            <Button
              type="button"
              variant="secondary"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              <Send className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish to Client'}
            </Button>
          )}

          {/* Published Status Actions */}
          {getStatusName(proposal.status_id) === 'Published' && userRole === 'Project Manager' && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClientApprove}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Client Approved
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleClientReject}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Client Rejected
              </Button>
            </>
          )}

          {/* Active Status Actions */}
          {getStatusName(proposal.status_id) === 'Active' && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleHold}
              >
                <Clock className="w-4 h-4 mr-2" />
                Place On Hold
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}

          {/* Common Actions */}
          <div className="flex gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            {getStatusName(proposal.status_id) === 'Edit' && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Proposal'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this proposal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Please provide feedback for rejecting this proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <textarea
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="Enter rejection feedback..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectFeedback('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectFeedback.trim()}
            >
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 