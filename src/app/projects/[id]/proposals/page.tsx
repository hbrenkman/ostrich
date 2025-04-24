"use client";

import { useState } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface ProposalFormData {
  number: string;
  overview: string;
  designBudget: string;
  constructionSupportBudget: string;
  status: 'Pending' | 'Active' | 'On Hold' | 'Cancelled';
  clientContact: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  notes: string;
  deliverables: string[];
  milestones: {
    description: string;
    date: string;
    completed: boolean;
  }[];
}

export default function NewProposalPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();

  const [proposal, setProposal] = useState<ProposalFormData>({
    number: `${params.id}.${new Date().getTime().toString().slice(-3)}`,
    overview: '',
    designBudget: '',
    constructionSupportBudget: '',
    status: 'Pending',
    clientContact: '',
    projectManager: '',
    startDate: '',
    endDate: '',
    notes: '',
    deliverables: [],
    milestones: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    router.push(`/projects/${params.id}`);
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(number);
  };

  const addDeliverable = () => {
    setProposal({
      ...proposal,
      deliverables: [...proposal.deliverables, '']
    });
  };

  const updateDeliverable = (index: number, value: string) => {
    const newDeliverables = [...proposal.deliverables];
    newDeliverables[index] = value;
    setProposal({
      ...proposal,
      deliverables: newDeliverables
    });
  };

  const removeDeliverable = (index: number) => {
    setProposal({
      ...proposal,
      deliverables: proposal.deliverables.filter((_, i) => i !== index)
    });
  };

  const addMilestone = () => {
    setProposal({
      ...proposal,
      milestones: [...proposal.milestones, {
        description: '',
        date: '',
        completed: false
      }]
    });
  };

  const updateMilestone = (index: number, field: keyof typeof proposal.milestones[0], value: string | boolean) => {
    const newMilestones = [...proposal.milestones];
    newMilestones[index] = {
      ...newMilestones[index],
      [field]: value
    };
    setProposal({
      ...proposal,
      milestones: newMilestones
    });
  };

  const removeMilestone = (index: number) => {
    setProposal({
      ...proposal,
      milestones: proposal.milestones.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/projects/${params.id}`}
          className="p-2 hover:bg-muted/10 rounded-full transition-colors dark:text-[#E5E7EB]"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-h1 dark:text-[#E5E7EB]">New Proposal</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Proposal Number
              </label>
              <input
                type="text"
                value={proposal.number}
                disabled
                className="w-full px-3 py-2 bg-gray-50 border rounded-md text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Status
              </label>
              <select
                value={proposal.status}
                onChange={(e) => setProposal({ ...proposal, status: e.target.value as ProposalFormData['status'] })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Overview
              </label>
              <RichTextEditor
                value={proposal.overview}
                onChange={(e) => setProposal({ ...proposal, overview: e.target.value })}
                placeholder="Enter proposal overview with formatting..."
                className="border-[#4DB6AC] dark:border-[#4DB6AC] focus-within:ring-2 focus-within:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Budget Information */}
        <div className="bg-white dark:bg-[#374151] rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-[#E5E7EB]">Budget Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Design Budget
              </label>
              <input
                type="text"
                value={proposal.designBudget}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  if (formatted) {
                    setProposal({ ...proposal, designBudget: formatted });
                  }
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="$0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Construction Support Budget
              </label>
              <input
                type="text"
                value={proposal.constructionSupportBudget}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  if (formatted) {
                    setProposal({ ...proposal, constructionSupportBudget: formatted });
                  }
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="$0.00"
              />
            </div>
          </div>
        </div>

        {/* Team Information */}
        <div className="bg-white dark:bg-[#374151] rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-[#E5E7EB]">Team Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Client Contact
              </label>
              <input
                type="text"
                value={proposal.clientContact}
                onChange={(e) => setProposal({ ...proposal, clientContact: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter client contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Project Manager
              </label>
              <input
                type="text"
                value={proposal.projectManager}
                onChange={(e) => setProposal({ ...proposal, projectManager: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter project manager name"
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-[#374151] rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-[#E5E7EB]">Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={proposal.startDate}
                onChange={(e) => setProposal({ ...proposal, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={proposal.endDate}
                onChange={(e) => setProposal({ ...proposal, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="bg-white dark:bg-[#374151] rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-[#E5E7EB]">Deliverables</h2>
            <button
              type="button"
              onClick={addDeliverable}
              className="text-sm text-primary hover:text-primary/90"
            >
              Add Deliverable
            </button>
          </div>
          <div className="space-y-3">
            {proposal.deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={deliverable}
                  onChange={(e) => updateDeliverable(index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter deliverable..."
                />
                <button
                  type="button"
                  onClick={() => removeDeliverable(index)}
                  className="p-2 text-gray-500 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white dark:bg-[#374151] rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-[#E5E7EB]">Milestones</h2>
            <button
              type="button"
              onClick={addMilestone}
              className="text-sm text-primary hover:text-primary/90"
            >
              Add Milestone
            </button>
          </div>
          <div className="space-y-4">
            {proposal.milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={milestone.completed}
                  onChange={(e) => updateMilestone(index, 'completed', e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter milestone description..."
                  />
                  <input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="p-2 text-gray-500 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-[#374151] rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-[#E5E7EB]">Additional Notes</h2>
          <textarea
            value={proposal.notes}
            onChange={(e) => setProposal({ ...proposal, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={4}
            placeholder="Enter any additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/projects/${params.id}`}
            className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground dark:text-[#E5E7EB]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Proposal</span>
          </button>
        </div>
      </form>
    </div>
  );
}