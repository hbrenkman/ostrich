import type { Structure, Level, Space, base_fee } from '@/types/proposal/base';

// The store's types are now just aliases of the base types since we've consolidated everything
export type ExtendedStructure = Structure;
export type ExtendedLevel = Level;

// Export the base types for convenience
export type { Structure, Level, Space, base_fee };

export interface ProposalState {
  // ... existing code ...
  setStructures: (structures: Structure[]) => void;
  updateStructure: (structureId: string, updates: Partial<Structure>) => void;
  updateSpace: (structureId: string, levelId: string, spaceId: string, updates: Partial<Space>) => void;
  addStructure: (structure: Omit<Structure, 'id'>) => void;
  removeStructure: (structureId: string) => void;
  duplicateStructure: (structureId: string) => void;
  // ... existing code ...
} 