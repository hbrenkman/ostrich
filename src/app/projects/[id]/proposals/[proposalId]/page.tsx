"use client";

import React from 'react';
import { useState } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SpaceDialog } from './space-dialog';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Space {
  constructionType: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  fee: string;
}

interface ProposalFormData {
  number: string;
  projectNumber: string;
  projectName: string;
  company: string;
  clientContact: Contact | null;
  overview: string;
  designBudget: string;
  constructionSupportBudget: string;
  status: 'Pending' | 'Active' | 'On Hold' | 'Cancelled';
  spaces: Space[];
}

const contacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 234-5678',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+1 (555) 345-6789',
  },
];

export default function EditProposalPage({ 
  params 
}: { 
  params: Promise<{ id: string; proposalId: string }> 
}) {
  const router = useRouter();
  const { id, proposalId } = React.use(params);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);

  const [proposal, setProposal] = useState<ProposalFormData>({
    number: proposalId === 'new' ? `FP-${new Date().getTime().toString().slice(-4)}` : proposalId,
    projectNumber: 'PRJ-001',
    projectName: 'Website Redesign',
    company: 'Acme Corporation',
    clientContact: null,
    overview: '', // Initialize with empty string
    designBudget: '',
    constructionSupportBudget: '',
    status: 'Pending',
    spaces: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/projects/${id}`);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      router.push(`/projects/${id}`);
    }, 500);
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(number);
  };

  const getStatusColor = (status: ProposalFormData['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-primary text-primary-foreground';
      case 'Pending':
        return 'bg-secondary text-secondary-foreground';
      case 'On Hold':
        return 'bg-muted text-muted-foreground';
      case 'Cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const handleAddSpace = (space: Space) => {
    setProposal({
      ...proposal,
      spaces: [...proposal.spaces, space]
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${id}`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{proposal.projectNumber}</span>
              <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{proposal.projectName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{proposal.company}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{proposal.number}</span>
                <select
                  value={proposal.status}
                  onChange={(e) => setProposal({ ...proposal, status: e.target.value as ProposalFormData['status'] })}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E7EB] mb-1">
                Client Contact
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsContactDialogOpen(true)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md text-left hover:bg-muted/5 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className={proposal.clientContact ? "text-gray-900 dark:text-[#E5E7EB]" : "text-gray-400"}>
                    {proposal.clientContact ? proposal.clientContact.name : "Search contacts..."}
                  </span>
                </button>
                {proposal.clientContact && (
                  <button
                    type="button"
                    onClick={() => setProposal({ ...proposal, clientContact: null })}
                    className="p-2 text-gray-500 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <RichTextEditor
                value={proposal.overview}
                onChange={(e) => setProposal({ ...proposal, overview: e.target.value })}
                placeholder="Enter proposal overview with formatting..."
                className="border-[#4DB6AC] dark:border-[#4DB6AC] focus-within:ring-2 focus-within:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-[#E5E7EB]">Spaces</h2>
            <button
              type="button"
              onClick={() => setIsSpaceDialogOpen(true)}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Space
            </button>
          </div>
          <div className="space-y-4">
            {proposal.spaces.map((space, index) => (
              <div
                key={index}
                className="p-2 bg-muted/5 rounded-md hover:bg-muted/10 cursor-pointer border border-[#4DB6AC] dark:border-[#4DB6AC]"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-[#E5E7EB]">{space.spaceType}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProposal({
                        ...proposal,
                        spaces: proposal.spaces.filter((_, i) => i !== index)
                      });
                    }}
                    className="p-2 text-gray-500 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-[#9CA3AF]">Construction Type:</span>
                    <span className="ml-2 dark:text-[#E5E7EB]">{space.constructionType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-[#9CA3AF]">Floor Area:</span>
                    <span className="ml-2 dark:text-[#E5E7EB]">{space.floorArea} sq ft</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-[#9CA3AF]">Description:</span>
                    <p className="mt-1 text-gray-700 dark:text-[#E5E7EB]">{space.description}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-[#9CA3AF]">Discipline:</span>
                    <span className="ml-2 dark:text-[#E5E7EB]">{space.discipline}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-[#9CA3AF]">HVAC System:</span>
                    <span className="ml-2 dark:text-[#E5E7EB]">{space.hvacSystem}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-[#9CA3AF]">Fee:</span>
                    <span className="ml-2 dark:text-[#E5E7EB]">{space.fee}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
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
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
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
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                placeholder="$0.00"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Proposal</span>
          </button>
          <div className="flex gap-3">
            <Link
              href={`/projects/${id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Proposal</span>
            </button>
          </div>
        </div>
      </form>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="p-0">
          <Command>
            <CommandInput placeholder="Search contacts..." />
            <CommandList>
              <CommandEmpty>No contacts found.</CommandEmpty>
              <CommandGroup>
                {contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    onSelect={() => {
                      setProposal({ ...proposal, clientContact: contact });
                      setIsContactDialogOpen(false);
                    }}
                    className="flex flex-col items-start py-2"
                  >
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <SpaceDialog
        open={isSpaceDialogOpen}
        onOpenChange={setIsSpaceDialogOpen}
        onSave={handleAddSpace}
      />
    </div>
  );
}