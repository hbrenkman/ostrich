/**
 * Proposal Detail Page Types
 * Page-specific types that extend the central types
 */

import type {
  Proposal,
  ProposalStatus,
  ProposalContact,
  EngineeringService,
  Structure,
  Level,
  Space,
  CalculationResult
} from '@/types/proposal';

import type {
  fee_item,
  fee_calculation_result,
  fee_calculation_state,
  engineering_standard_service,
  manual_fee_override,
  base_fee,
  fee_scale,
  fee_duplicate_structure,
  nested_fee_item,
  flex_fees_data,
  service_fee_calculation,
  fee_component,
  fee_subcomponent,
  base_proposal,
  proposal_project_data,
  proposal,
  proposal_status,
  proposal_status_code,
  proposal_contact,
  contact_role,
  contact_status,
  contact_role_string,
  contact_role_object,
  ui_construction_cost,
  fixed_fees_structure,
  fixed_fees_props
} from '@/types/proposal/base';

import type { tracked_service } from '@/types/proposal/service';

// =============== Page Props Types ===============

/**
 * Props for the proposal detail page
 */
export interface ProposalDetailPageProps {
  params: {
    id: string;
    proposalId: string;
  };
}

/**
 * Props for the proposal detail component
 */
export interface ProposalDetailProps {
  proposal: Proposal;
  projectId: string;
  proposalId: string;
  onProposalUpdate: (proposal: Proposal) => void;
}

// =============== Component Props Types ===============

/**
 * Props for the proposal structures component
 */
export interface ProposalStructuresProps {
  proposal: Proposal;
  onStructureUpdate: (structures: Structure[]) => void;
  onStructureAdd: (structure: Structure) => void;
  onStructureDelete: (structureId: string) => void;
}

/**
 * Props for the proposal actions component
 */
export interface ProposalActionsProps {
  proposal: Proposal;
  onStatusChange: (status: ProposalStatus) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
}

// =============== Form Types ===============

/**
 * Extended form data type for proposal detail page
 */
export interface ProposalDetailForm {
  // Additional fields specific to detail page
  isEditing: boolean;
  lastSavedAt?: string;
  validationErrors?: {
    [key: string]: string;
  };
}

// =============== State Types ===============

/**
 * State type for proposal detail page
 */
export interface ProposalDetailState {
  proposal: Proposal;
  form: ProposalDetailForm;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSavedAt: string | null;
}

// =============== API Response Types ===============

/**
 * API response type for proposal detail
 */
export interface ProposalDetailResponse {
  proposal: Proposal;
  success: boolean;
  error?: string;
}

/**
 * API response type for proposal update
 */
export interface ProposalUpdateResponse {
  success: boolean;
  proposal?: Proposal;
  error?: string;
}

// Re-export base types for convenience
export type {
  Structure,
  Level,
  Space,
  engineering_standard_service,
  tracked_service
};

export interface engineering_service_link {
  id: string;
  engineering_service_id: string;
  additional_item_id: string;
  link_type: 'engineering_service' | 'fee_additional_item';
  created_at: string;
  updated_at: string;
}

export interface fee_table_props {
  structure: Structure;
  manual_overrides: manual_fee_override[];
  engineering_services: engineering_standard_service[];
  service_links: engineering_service_link[];
  on_fee_update: (structure_id: string, discipline: string, type: 'design' | 'construction', value: number | null, space_id?: string) => void;
  on_discipline_fee_toggle: (structure_id: string, discipline: string, is_active: boolean) => void;
  on_reset_fees: (structure_id: string, discipline: string, space_id?: string) => void;
  on_service_toggle: (structure_id: string, space_id: string, service_id: string, is_active: boolean) => void;
  on_service_fee_update: (structure_id: string, space_id: string, service_id: string, fee: string | null) => void;
} 