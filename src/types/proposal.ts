/**
 * Proposal Types
 * Central type definitions for the proposal system
 */

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

// =============== Calculation Types ===============

/**
 * Calculation result type
 */
export interface CalculationResult {
  structure_id?: string;
  level_id?: string;
  space_id?: string;
  type: 'design' | 'construction';
  category: string;
  value: number;
  parameters: {
    [key: string]: number | string | boolean;
  };
  timestamp: string;
  source: 'fixed_fees' | 'manual' | 'formula';
}

// =============== Service Types ===============

/**
 * Proposal service type
 */
export interface ProposalService {
  id: string;
  discipline_id: string;
  name: string;
  type: 'design' | 'construction';
  is_active: boolean;
  parameters: {
    [key: string]: number | string | boolean;
  };
  calculations: CalculationResult[];
}

// =============== Proposal Types ===============

/**
 * Base proposal interface
 */
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

/**
 * Proposal contact type
 */
export interface ProposalContact {
  id: string;
  proposal_id: string;
  contact_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Project data for proposals
 */
export interface ProposalProjectData {
  project_name: string;
  project_number: string;
  project_description?: string;
  project_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  project_type?: string;
  project_phase?: string;
  project_status?: string;
  project_start_date?: string;
  project_end_date?: string;
  project_budget?: number;
  project_notes?: string;
  cost_index: number | null;
}

/**
 * Complete proposal interface
 */
export interface Proposal extends BaseProposal {
  status: ProposalStatus;
  contacts: ProposalContact[];
  project_data: ProposalProjectData;
}

// =============== Form Data Types ===============

/**
 * Form data for proposals
 */
export interface ProposalFormData {
  number: number;
  display_number: string;
  project_number: string;
  project_name: string;
  company: string;
  client_contacts: ProposalContact[];
  overview: string;
  design_budget: string;
  construction_support_budget: string;
  status: ProposalStatusCode;
  is_temporary_revision: boolean;
  cost_index: number | null;
}

// Import ProposalStatus from shared types
import type { ProposalStatus } from '@/types/proposal/shared'; 