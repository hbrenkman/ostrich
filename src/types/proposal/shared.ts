/**
 * Shared Types
 * Common interfaces used across proposal components
 */

import type { 
  Space, 
  Level, 
  Structure,
  EngineeringServiceLink,
  FeeDuplicateStructure,
  DisciplineEngineeringFees,
  ConstructionCost,
  proposal,
  proposal_status,
  proposal_contact,
  EngineeringFee,
  base_fee,
  ConstructionCostsForSpace
} from '@/types/proposal/base';
import type { tracked_service } from '@/types/proposal/service';

// Re-export types from base
export type {
  ConstructionCost,
  ConstructionCostsForSpace,
  Space,
  Level,
  Structure,
  EngineeringServiceLink,
  FeeDuplicateStructure,
  DisciplineEngineeringFees,
  EngineeringFee,
  base_fee
};

export type EngineeringService = EngineeringServiceLink;
export type ProposalStatus = proposal_status;

/**
 * User roles that can interact with proposals
 */
export type UserRole = 'Project Manager' | 'Manager' | 'Admin';

/**
 * Project interface for the current project context
 */
export interface Project {
  id: string;
  number: string;
  name: string;
  company: string;
  cost_index: number | null;
  client_contacts: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  description?: string | null;
  status?: string;
  type?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

/**
 * Project construction type for space calculations
 */
export interface ProjectConstructionType {
  id: number;
  project_type: string;
  definition: string;
  description: string;
  relative_cost_index: number;
  created_at: string;
}

/**
 * Fee proposal list item
 */
export interface FeeProposalListItem {
  id: string;
  project_id: string;
  proposal_number: number;
  revision_number: number;
  is_temporary_revision: boolean;
  status: ProposalStatus;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  project_data: Record<string, any>;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

/**
 * Props for the fee proposals list component
 */
export interface FeeProposalsProps {
  projectId: string;
  projectUUID: string | null;
  onAddProposal: () => void;
  onProposalSelect?: (proposal: FeeProposalListItem) => void;
  onProposalDelete?: (proposalId: string) => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * Props for the proposal list item component
 */
export interface ProposalListItemProps {
  proposal: FeeProposalListItem;
  onSelect?: (proposal: FeeProposalListItem) => void;
  onDelete?: (proposalId: string) => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * Props for the proposal status badge component
 */
export interface ProposalStatusBadgeProps {
  status: ProposalStatus;
}

/**
 * Props for the proposal contact list component
 */
export interface ProposalContactListProps {
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  onRemove?: (contactId: string) => void;
  canEdit?: boolean;
}

/**
 * Props for the proposal contact item component
 */
export interface ProposalContactItemProps {
  contact: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onRemove?: (contactId: string) => void;
  canEdit?: boolean;
}

/**
 * Dialog state for proposal actions
 */
export interface ProposalDialogState {
  isDeleteDialogOpen: boolean;
  isRejectDialogOpen: boolean;
  rejectFeedback: string;
  error: string | null;
}

/**
 * Dialog actions for proposal actions
 */
export interface ProposalDialogActions {
  setDeleteDialogOpen: (isOpen: boolean) => void;
  setRejectDialogOpen: (isOpen: boolean) => void;
  setRejectFeedback: (feedback: string) => void;
  setError: (error: string | null) => void;
}

/**
 * Represents a building type in the system
 */
export interface BuildingType {
  id: string;
  name: string;
  description: string | null;
  space_type: string | null;
  discipline: string | null;
  hvac_system: string | null;
  default_construction_cost: number | null;
  default_area: number | null;
}

/**
 * Represents a fee subcomponent in the flex fees system
 */
export interface FeeSubcomponent {
  id: string;
  name: string;
  amount: number;
  type: 'simple' | 'hourly' | undefined;
  hourlyRate?: number;
  hours?: number;
  minFee?: number;
  maxFee?: number;
  discipline_id?: number;
  role_id?: string;
  role_designation?: string | null;
  description?: string;
  quantity?: number;
}

/**
 * Represents a fee component in the flex fees system
 */
export interface FeeComponent {
  id: string;
  name: string;
  amount: number;
  type: 'simple' | 'hourly' | undefined;
  hourlyRate?: number;
  hours?: number;
  minFee?: number;
  maxFee?: number;
  subcomponents?: FeeSubcomponent[];
  discipline_id?: number;
  role_id?: string;
  role_designation?: string | null;
  description?: string;
  quantity?: number;
}

/**
 * Represents a category of fees in the flex fees system
 */
export interface Category {
  id: string;
  name: string;
  fees: FeeComponent[];
}

/**
 * Props for the EngineeringServicesManager component
 */
export interface EngineeringServicesManagerProps {
  proposalId: string;
  structureId: string;
  onServicesChange: (services: tracked_service[]) => void;
  initialTrackedServices?: tracked_service[];
  isCollapsed?: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

/**
 * Project summary totals for design and construction phases
 */
export interface ProjectSummary {
  design_totals: Record<string, number>;
  construction_totals: Record<string, number>;
  grand_totals: Record<string, number>;
  project_total: number;
}

/**
 * Tracked services organized by structure ID
 */
export interface TrackedServices {
  [structure_id: string]: tracked_service[];
}

/**
 * Props for the FixedFees component
 */
export interface FixedFeesProps {
  structures: Structure[];
  phase: 'design' | 'construction';
  on_structures_change: (structures: Structure[]) => void;
  tracked_services: TrackedServices;
  has_construction_admin_services: boolean;
  duplicate_structure_rates: FeeDuplicateStructure[];
  construction_costs: Record<string, Record<string, number>>;
  on_fee_update: (structure_id: string, level_id: string, space_id: string, fee_id: string, updates: Partial<base_fee>, phase: 'design' | 'construction') => void;
  on_service_fee_update?: (service_id: string, discipline: string, fee: number, phase: 'design' | 'construction') => void;
  on_discipline_fee_toggle?: (structure_id: string, level_id: string, space_id: string, discipline: string, is_active: boolean) => void;
}

/**
 * Represents a discipline in the system
 */
export interface Discipline {
  id: number;
  name: string;
  description: string | null;
}

/**
 * Represents a role in the system
 */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

/**
 * Represents an hourly rate for a discipline and role combination
 */
export interface HourlyRate {
  id: number;
  discipline_id: number;
  role_id: string;
  role_designation: string | null;
  rate: number;
  description: string | null;
}

export interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (space: Omit<Space, 'id'>) => void;
  defaultValues?: Partial<Omit<Space, 'id'>>;
  costIndex: number | null;
  initialSpace?: Space;
  structureId: string;
  levelId: string;
} 