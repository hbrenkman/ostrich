/**
 * Proposal Types
 * Central type definitions for the proposal system
 */

import type { 
  Structure,
  Level,
  Space,
  fee_scale,
  fee_duplicate_structure,
  nested_fee_item,
  manual_fee_override
} from './base';

// =============== Status Types ===============

/**
 * Valid proposal status codes from the database
 */
export type ProposalStatusCode = 
  | 'edit'
  | 'review'
  | 'approved'
  | 'published'
  | 'client_approved'
  | 'client_rejected'
  | 'on_hold'
  | 'cancelled';

/**
 * Proposal status interface matching database schema
 */
export interface ProposalStatus {
  id: string;
  code: ProposalStatusCode;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_initial: boolean;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

// =============== Contact Types ===============

export type ContactRole = 
  | 'client'
  | 'consultant'
  | 'contractor'
  | 'architect'
  | 'engineer'
  | 'other';

export type ContactStatus = 
  | 'active'
  | 'inactive'
  | 'pending';

export interface ProposalContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: ContactRole;
  company?: string;
  is_primary: boolean;
  details: {
    first_name: string;
    last_name: string;
    role_id: string | null;
    location_id: string | null;
    company_id: string | null;
    status: ContactStatus;
  };
}

// =============== Project Data Types ===============

export interface ProjectAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface ProjectData {
  project_name?: string;
  project_number?: string;
  project_description?: string;
  project_address?: ProjectAddress;
  project_type?: string;
  project_phase?: string;
  project_status?: string;
  project_start_date?: string;
  project_end_date?: string;
  project_budget?: number;
  project_notes?: string;
  structures: Structure[];
  calculations: {
    design: CalculationPhase;
    construction: CalculationPhase;
    total: number;
  };
  disciplines: Discipline[];
  services: EngineeringService[];
  tracked_services: TrackedService[];
}

export interface CalculationPhase {
  structures: CalculationResult[];
  levels: CalculationResult[];
  spaces: CalculationResult[];
  total: number;
  parameters: Record<string, any>;
}

export interface CalculationResult {
  id: string;
  type: 'design' | 'construction';
  category: string;
  structure_id?: string;
  level_id?: string;
  space_id?: string;
  amount: number;
  parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Discipline {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface EngineeringService {
  id: string;
  service_name: string;
  is_active: boolean;
  parameters: Record<string, any>;
}

export interface TrackedService {
  id: string;
  structure_id: string;
  service_id: string;
  is_included: boolean;
  parameters: Record<string, any>;
}

// =============== Base Proposal Types ===============

export interface BaseProposal {
  id: string;
  project_id: string;
  proposal_number: number;
  revision_number: number;
  is_temporary_revision: boolean;
  status_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  description: string | null;
}

export interface Proposal extends BaseProposal {
  status: ProposalStatus;
  contacts: ProposalContact[];
  project_data: ProjectData;
}

// =============== Component Props Types ===============

export interface ProposalDataProps {
  proposalId: string;
  projectId: string;
  isNewProposal?: boolean;
  onDataChange?: (data: Proposal) => void;
  skipInitialLoad?: boolean;
}

export interface ProposalDataRef {
  refreshData: () => Promise<void>;
  saveData: () => Promise<void>;
  getData: () => Proposal | null;
  handleFixedFeesData: (data: FixedFeesData) => void;
  handleFlexFeesData: (data: FlexFeesData) => void;
  handleFeeCalculation: (data: FeeCalculationData) => void;
  addContact: (contact: Omit<ProposalContact, 'id'>) => void;
  updateContact: (contactId: string, updates: Partial<ProposalContact>) => void;
  removeContact: (contactId: string) => void;
  setPrimaryContact: (contactId: string) => void;
  searchContacts: (query: string) => ProposalContact[];
  updateData: (newData: Partial<Proposal>) => void;
}

export interface ProposalActionsProps {
  proposal: Proposal;
  onStatusChange: (status: ProposalStatus) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
}

// =============== API Response Types ===============

export interface ProposalResponse {
  success: boolean;
  proposal?: Proposal;
  error?: string;
}

export interface ProposalListResponse {
  success: boolean;
  proposals?: Proposal[];
  error?: string;
}

// =============== Fee Types ===============

export interface FixedFeesData {
  type: 'design' | 'construction';
  fees: FeeItem[];
}

export interface FlexFeesData {
  type: 'design' | 'construction';
  fees: FeeItem[];
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  parameters: Record<string, any>;
}

export interface FeeCalculationData {
  type: 'design' | 'construction';
  items: FeeItem[];
  total: number;
}

// Base Types
export type {
  Structure,
  Level,
  Space,
  EngineeringService,
  EngineeringServiceLink,
  base_fee,
  fee_scale,
  manual_fee_override,
  fee_calculation_result,
  fee_calculation_state,
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
  fee_item,
  engineering_standard_service,
  ui_construction_cost,
  fixed_fees_structure,
  fixed_fees_props
} from './base';

// UI Structure Types
export type {
  UIStructure as ui_structure,
  UILevel as ui_level,
  UISpace as ui_space
} from './structure';

// Fee Types
export type {
  FeeTableProps as fee_table_props
} from './fee';

// Component Types
export type {
  SpaceDialogProps as space_dialog_props
} from './components';

// Store Types
export type {
  ExtendedStructure as extended_structure
} from './store';

// Form Types
export type {
  ProposalFormData as proposal_form_data
} from './forms';

// Service Types
export type {
  TrackedService as tracked_service,
  EngineeringAdditionalService as engineering_additional_service
} from './service'; 