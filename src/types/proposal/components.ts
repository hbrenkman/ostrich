import type { ReactNode } from 'react';
import type { UIStructure } from './structure';
import type { TrackedService } from './service';
import type { BaseFee, FeeDuplicateStructure } from './base';

export interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structureId: string;
  levelId: string;
  spaceId?: string;
  onSave: (space: {
    id: string;
    name: string;
    description: string;
    floorArea: number;
    buildingType: string;
    buildingTypeId: string;
    spaceType: string;
    discipline: string;
    hvacSystem: string;
    projectConstructionType: string;
    projectConstructionTypeId: number;
  }) => void;
}

export interface ProposalDataProps {
  proposalId: string;
  projectId: string;
  isNewProposal?: boolean;
  onDataChange?: (data: any) => void;
  skipInitialLoad?: boolean;
}

export interface ProposalDataRef {
  save: () => Promise<void>;
  load: () => Promise<void>;
  getData: () => any;
}

export interface ProposalDataComponentProps extends ProposalDataProps {
  ref?: React.RefObject<ProposalDataRef>;
} 