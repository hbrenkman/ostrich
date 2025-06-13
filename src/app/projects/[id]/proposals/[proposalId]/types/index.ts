import type { ReactNode } from 'react';
import type { Structure } from '@/types/proposal/base';
import type { tracked_service } from '@/types/proposal/service';
import type { base_fee, fee_duplicate_structure } from '@/types/proposal/base';

export interface SpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (space: any) => void;
  structureId: string;
  levelId: string;
  space?: any;
}

export interface FeeTableProps {
  fees: base_fee[];
  onFeeUpdate: (feeId: string, updates: Partial<base_fee>) => void;
  onDisciplineFeeToggle?: (discipline: string, is_active: boolean) => void;
  phase: 'design' | 'construction';
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