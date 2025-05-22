"use client";

import React, { useState, useEffect, DragEvent } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search, Building2, Layers, Building, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
import { StructureDialog } from './structure-dialog';
import { SpaceDialog } from './space-dialog';

interface Contact {
  id: string;
  name: string;
  email: string;
  mobile: string;
  direct_phone: string;
}

interface Space {
  id: string;
  name: string;
  buildingTypeId: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  fees: {
    discipline: string;
    isActive: boolean;
    costPerSqft: number;
    totalFee: number;
  }[];
}

interface Level {
  id: string;
  name: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  spaces: Space[];
}

interface Structure {
  id: string;
  constructionType: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  levels: Level[];
  parentId?: string;
}

interface Project {
  id: string;
  number: string;
  name: string;
  company: string;
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
  structures: Structure[];
}

interface StructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (structure: Omit<Structure, 'id' | 'levels'>) => void;
}

const contacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    mobile: '+1 (555) 123-4567',
    direct_phone: '+1 (555) 123-4567',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    mobile: '+1 (555) 234-5678',
    direct_phone: '+1 (555) 234-5678',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    mobile: '+1 (555) 345-6789',
    direct_phone: '+1 (555) 345-6789',
  },
];

export default function EditProposalPage() {
  const router = useRouter();
  const params = useParams();
  
  if (!params) {
    router.push('/projects');
    return null;
  }

  const id = params.id as string;
  const proposalId = params.proposalId as string;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || id === '000') {
        router.push('/projects');
        return;
      }

      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.error('Project not found');
            router.push('/projects');
            return;
          }
          throw new Error(`Failed to fetch project: ${response.statusText}`);
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        router.push('/projects');
      }
    };

    fetchProject();
  }, [id, router]);

  useEffect(() => {
    if (project) {
      setIsLoading(false);
    }
  }, [project]);

  const [proposal, setProposal] = useState<ProposalFormData>({
    number: proposalId === 'new' ? `FP-${new Date().getTime().toString().slice(-4)}` : proposalId,
    projectNumber: project?.number || '',
    projectName: project?.name || '',
    company: project?.company || '',
    clientContact: null,
    overview: '',
    designBudget: '',
    constructionSupportBudget: '',
    status: 'Pending',
    structures: [],
  });

  useEffect(() => {
    if (project) {
      setProposal(prev => ({
        ...prev,
        projectNumber: project.number,
        projectName: project.name,
        company: project.company,
      }));
    }
  }, [project]);

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

  const formatCurrency = (value: string | number): string => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    
    // Remove any non-digit characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (!numericValue) return '$0.00';
    
    // Convert to number and format
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  const handleAddStructure = (structure: Omit<Structure, 'id'>) => {
    setProposal({
      ...proposal,
      structures: [...proposal.structures, { ...structure, id: crypto.randomUUID() }]
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStructureId?: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    
    if (data.type === 'structure') {
      const newStructure: Structure = {
        id: data.id,
        constructionType: "New Construction",
        floorArea: "0",
        description: "New Structure",
        spaceType: "Office",
        discipline: "MEP",
        hvacSystem: "VAV System",
        levels: [{
          id: crypto.randomUUID(),
          name: "Level 0",
          floorArea: "0",
          description: "New Level",
          spaceType: "Office",
          discipline: "MEP",
          hvacSystem: "VAV System",
          spaces: []
        }]
      };
      setProposal({
        ...proposal,
        structures: [...proposal.structures, newStructure]
      });
    } else if (data.type === 'level' && targetStructureId) {
      const structure = proposal.structures.find(s => s.id === targetStructureId);
      if (!structure) return;

      // Find the highest level number
      const highestLevel = structure.levels.reduce((highest, level) => {
        const levelNum = parseInt(level.name.split(' ')[1]);
        return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
      }, -1);

      const newLevel: Level = {
        id: data.id,
        name: `Level ${highestLevel + 1}`,
        floorArea: "0",
        description: "New Level",
        spaceType: "Office",
        discipline: "MEP",
        hvacSystem: "VAV System",
        spaces: []
      };

      // Sort levels in reverse order (higher numbers first)
      const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
        const aNum = parseInt(a.name.split(' ')[1]);
        const bNum = parseInt(b.name.split(' ')[1]);
        return bNum - aNum; // Reversed order
      });
      
      setProposal({
        ...proposal,
        structures: proposal.structures.map(s =>
          s.id === targetStructureId
            ? { ...s, levels: updatedLevels }
            : s
        )
      });
    }
  };

  const handleAddFiveLevels = (structureId: string) => {
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) return;

    const currentLevelCount = structure.levels.length;
    const newLevels: Level[] = Array.from({ length: 5 }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Level ${currentLevelCount + index + 1}`,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "MEP",
      hvacSystem: "VAV System",
      spaces: []
    }));

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s =>
        s.id === structureId
          ? { ...s, levels: [...s.levels, ...newLevels] }
          : s
      )
    });
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, type: 'structure' | 'level') => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type,
      id: crypto.randomUUID()
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, isStructureContainer: boolean = false) => {
    e.preventDefault();
    
    // Check if the drag data contains our custom type
    const hasJsonData = e.dataTransfer.types.includes('application/json');
    if (!hasJsonData) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // Only allow level drops on structures
    if (!isStructureContainer) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data?.type === 'level') {
          e.dataTransfer.dropEffect = 'none';
          return;
        }
      } catch {
        // If we can't parse the data, don't allow the drop
        e.dataTransfer.dropEffect = 'none';
        return;
      }
    }
    
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleAddSpace = (space: Omit<Space, 'id'>) => {
    if (!selectedStructureId || !selectedLevelId) return;

    setProposal({
      ...proposal,
      structures: proposal.structures.map(structure =>
        structure.id === selectedStructureId
          ? {
              ...structure,
              levels: structure.levels.map(level =>
                level.id === selectedLevelId
                  ? {
                      ...level,
                      spaces: [...(level.spaces || []), { ...space, id: crypto.randomUUID() }]
                    }
                  : level
              )
            }
          : structure
      )
    });
  };

  const handleAddLowerLevel = (structureId: string) => {
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) return;

    // Find the lowest level number
    const lowestLevel = structure.levels.reduce((lowest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? lowest : Math.min(lowest, levelNum);
    }, 0);

    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${lowestLevel - 1}`,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "MEP",
      hvacSystem: "VAV System",
      spaces: []
    };

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s =>
        s.id === structureId
          ? { ...s, levels: updatedLevels }
          : s
      )
    });
  };

  const handleAddUpperLevel = (structureId: string) => {
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) return;

    // Find the highest level number
    const highestLevel = structure.levels.reduce((highest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
    }, -1);

    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${highestLevel + 1}`,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "MEP",
      hvacSystem: "VAV System",
      spaces: []
    };

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s =>
        s.id === structureId
          ? { ...s, levels: updatedLevels }
          : s
      )
    });
  };

  const handleAddFiveUpperLevels = (structureId: string) => {
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) return;

    // Find the highest level number
    const highestLevel = structure.levels.reduce((highest, level) => {
      const levelNum = parseInt(level.name.split(' ')[1]);
      return isNaN(levelNum) ? highest : Math.max(highest, levelNum);
    }, -1);

    const newLevels: Level[] = Array.from({ length: 5 }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Level ${highestLevel + index + 1}`,
      floorArea: "0",
      description: "New Level",
      spaceType: "Office",
      discipline: "MEP",
      hvacSystem: "VAV System",
      spaces: []
    }));

    // Sort levels in reverse order (higher numbers first)
    const updatedLevels = [...structure.levels, ...newLevels].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s =>
        s.id === structureId
          ? { ...s, levels: updatedLevels }
          : s
      )
    });
  };

  const handleDuplicateLevel = (structureId: string, levelId: string) => {
    const structure = proposal.structures.find(s => s.id === structureId);
    if (!structure) return;

    const levelToDuplicate = structure.levels.find(l => l.id === levelId);
    if (!levelToDuplicate) return;

    // Get the level number from the name
    const levelNum = parseInt(levelToDuplicate.name.split(' ')[1]);
    if (isNaN(levelNum)) return;

    // Create a new level with duplicated spaces
    const newLevel: Level = {
      id: crypto.randomUUID(),
      name: `Level ${levelNum >= 0 ? levelNum + 1 : levelNum - 1}`,
      floorArea: levelToDuplicate.floorArea,
      description: levelToDuplicate.description,
      spaceType: levelToDuplicate.spaceType,
      discipline: levelToDuplicate.discipline,
      hvacSystem: levelToDuplicate.hvacSystem,
      spaces: levelToDuplicate.spaces.map(space => ({
        ...space,
        id: crypto.randomUUID()
      }))
    };

    // Add the new level and sort
    const updatedLevels = [...structure.levels, newLevel].sort((a, b) => {
      const aNum = parseInt(a.name.split(' ')[1]);
      const bNum = parseInt(b.name.split(' ')[1]);
      return bNum - aNum; // Reversed order
    });

    setProposal({
      ...proposal,
      structures: proposal.structures.map(s =>
        s.id === structureId
          ? { ...s, levels: updatedLevels }
          : s
      )
    });
  };

  const handleDuplicateStructure = (structureId: string) => {
    const structureToDuplicate = proposal.structures.find(s => s.id === structureId);
    if (!structureToDuplicate) return;

    // Create a new structure with duplicated levels and spaces
    const newStructure: Structure = {
      id: crypto.randomUUID(),
      constructionType: structureToDuplicate.constructionType,
      floorArea: structureToDuplicate.floorArea,
      description: structureToDuplicate.description,
      spaceType: structureToDuplicate.spaceType,
      discipline: structureToDuplicate.discipline,
      hvacSystem: structureToDuplicate.hvacSystem,
      levels: structureToDuplicate.levels.map(level => ({
        ...level,
        id: crypto.randomUUID(),
        spaces: level.spaces.map(space => ({
          ...space,
          id: crypto.randomUUID()
        }))
      })),
      parentId: structureId
    };

    console.log('Duplicating structure:', {
      originalId: structureId,
      newId: newStructure.id,
      parentId: newStructure.parentId
    });

    // Find the index of the original structure
    const originalIndex = proposal.structures.findIndex(s => s.id === structureId);
    
    // Create new structures array with the duplicate inserted after the original
    const newStructures = [
      ...proposal.structures.slice(0, originalIndex + 1),
      newStructure,
      ...proposal.structures.slice(originalIndex + 1)
    ];

    setProposal({
      ...proposal,
      structures: newStructures
    });
  };

  return (
    <div className="container mx-auto py-6 pt-24 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${id}`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex flex-col">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded mt-2"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{project?.number}</span>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-[#E5E7EB]">{project?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{project?.company}</span>
                </div>
              </>
            )}
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
            <h2 className="text-lg font-semibold dark:text-[#E5E7EB]">Structures</h2>
            <div className="flex items-center gap-2">
            <button
              type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, 'structure')}
                onDragEnd={handleDragEnd}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors ${isDragging ? 'opacity-50' : ''}`}
                title="Drag to add structure"
              >
                <Building2 className="w-4 h-4" />
                <span>Add Structure</span>
            </button>
            </div>
          </div>
          <div 
            className={`space-y-2 min-h-[200px] ${isDragging ? 'border-2 border-dashed border-primary/50 rounded-lg' : ''}`}
            onDragOver={(e) => handleDragOver(e, true)}
            onDrop={(e) => handleDrop(e)}
          >
            {proposal.structures.map((structure) => (
              <div 
                key={structure.id} 
                className={`border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md overflow-hidden ${
                  structure.parentId ? 'ml-16 relative' : ''
                }`}
              >
                <div
                  className={`p-4 bg-muted/5 hover:bg-muted/10 cursor-pointer flex items-center gap-4 border-b border-[#4DB6AC]/50 dark:border-[#4DB6AC]/50 ${
                    structure.parentId ? 'bg-muted/10' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e, structure.id)}
                >
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium dark:text-[#E5E7EB]">{structure.description}</div>
                    <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                      {structure.constructionType} • {structure.floorArea} sq ft
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateStructure(structure.id)}
                      className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                      title="Duplicate Structure"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <rect width="14" height="14" x="8" y="2" rx="2" ry="2" />
                        <path d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLowerLevel(structure.id)}
                      className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                      title="Add Lower Level"
                    >
                      <Layers className="w-4 h-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddUpperLevel(structure.id)}
                      className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                      title="Add Upper Level"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFiveUpperLevels(structure.id)}
                      className="p-2 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                      title="Add 5 Upper Levels"
                    >
                      <Building className="w-4 h-4" />
                    </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProposal({
                        ...proposal,
                          structures: proposal.structures.filter(s => s.id !== structure.id)
                      });
                    }}
                    className="p-2 text-gray-500 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                </div>
                {structure.levels.length > 0 && (
                  <div className="bg-muted/5 divide-y divide-[#4DB6AC]/20 dark:divide-[#4DB6AC]/20">
                    {structure.levels.map((level) => (
                      <div
                        key={level.id}
                        className="border-t border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20"
                      >
                        <div className="p-3 flex items-center gap-3 hover:bg-muted/10 cursor-pointer">
                          <div className="p-1.5 bg-primary/5 rounded-md">
                            <Layers className="w-4 h-4 text-primary/70" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium dark:text-[#E5E7EB]">{level.name}</div>
                            <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                              {level.spaceType} • {level.floorArea} sq ft
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStructureId(structure.id);
                                setSelectedLevelId(level.id);
                                setIsSpaceDialogOpen(true);
                              }}
                              className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                              title="Add Space"
                            >
                              <Home className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateLevel(structure.id, level.id)}
                              className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                              title="Duplicate Level"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-3.5 h-3.5"
                              >
                                <rect width="14" height="14" x="8" y="2" rx="2" ry="2" />
                                <path d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProposal({
                                  ...proposal,
                                  structures: proposal.structures.map(s =>
                                    s.id === structure.id
                                      ? { ...s, levels: s.levels.filter(l => l.id !== level.id) }
                                      : s
                                  )
                                });
                              }}
                              className="p-1.5 text-gray-500 hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {level.spaces && level.spaces.length > 0 && (
                          <div className="bg-muted/5 divide-y divide-[#4DB6AC]/10 dark:divide-[#4DB6AC]/10">
                            {level.spaces.map((space) => (
                              <div key={space.id} className="p-3 pl-12">
                                <div className="flex items-start gap-3">
                                  <div className="p-1.5 bg-primary/5 rounded-md">
                                    <Home className="w-4 h-4 text-primary/70" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium dark:text-[#E5E7EB]">{space.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                      {space.description}
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <div className="text-gray-500 dark:text-[#9CA3AF]">
                                        Building Type: {space.spaceType}
                                      </div>
                                      <div className="text-gray-500 dark:text-[#9CA3AF]">
                                        Floor Area: {space.floorArea} sq ft
                                      </div>
                                      <div className="text-gray-500 dark:text-[#9CA3AF]">
                                        Disciplines: {space.fees.filter(f => f.isActive).map(f => f.discipline).join(', ')}
                                      </div>
                                      <div className="mt-1 font-medium text-primary">
                                        Construction Cost: {formatCurrency(space.fees.reduce((sum, fee) => sum + (fee.isActive ? fee.totalFee : 0), 0))}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProposal({
                                        ...proposal,
                                        structures: proposal.structures.map(s =>
                                          s.id === structure.id
                                            ? {
                                                ...s,
                                                levels: s.levels.map(l =>
                                                  l.id === level.id
                                                    ? { ...l, spaces: l.spaces.filter(sp => sp.id !== space.id) }
                                                    : l
                                                )
                                              }
                                            : s
                                        )
                                      });
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                  </div>
                            ))}
                  </div>
                        )}
                  </div>
                    ))}
                  </div>
                )}
                {structure.levels.length === 0 && (
                  <div 
                    className="p-4 text-center text-gray-400 border-t border-[#4DB6AC]/20 dark:border-[#4DB6AC]/20 cursor-pointer hover:bg-muted/5"
                    onDragOver={(e) => handleDragOver(e)}
                    onDrop={(e) => handleDrop(e, structure.id)}
                  >
                    <Layers className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <p className="text-sm">Drop a level here</p>
                  </div>
                )}
                  </div>
            ))}
            {proposal.structures.length === 0 && (
              <div className="flex items-center justify-center h-[200px] text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Drag and drop a structure here</p>
                </div>
              </div>
            )}
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

      <StructureDialog
        open={isStructureDialogOpen}
        onOpenChange={setIsStructureDialogOpen}
        onSave={(structure) => handleAddStructure({ ...structure, levels: [] })}
      />

      <SpaceDialog
        open={isSpaceDialogOpen}
        onOpenChange={setIsSpaceDialogOpen}
        onSave={handleAddSpace}
      />
    </div>
  );
}