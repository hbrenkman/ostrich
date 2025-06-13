/**
 * Base Types
 * These types directly match our database schema
 */

import type { tracked_service } from './service';

// =============== Status Types ===============
export type proposal_status_code = 
  | 'edit'
  | 'review'
  | 'approved'
  | 'published'
  | 'client_approved'
  | 'client_rejected'
  | 'on_hold'
  | 'cancelled';

export interface proposal_status {
  id: string;
  code: proposal_status_code;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_initial: boolean;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

// =============== Structure Types ===============
export interface Structure {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  design_fee_rate: number | null;
  fee_scale: FeeScale;
  construction_support_enabled: boolean;
  design_percentage: number | null;
  is_duplicate: boolean;
  duplicate_number: number | null;
  duplicate_parent_id: string | null;
  duplicate_rate: number | null;
  created_at: string;
  updated_at: string;
  total_construction_cost: number;
  total_floor_area: number;
  is_active: boolean;
  is_duplicate_collapsed?: boolean;
  levels: Level[];
}

export interface Level {
  id: string;
  structure_id: string;
  name: string;
  level_number: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  total_cost: number;
  total_area: number;
  is_active: boolean;
  is_collapsed?: boolean;
  spaces: Space[];
}

export interface ConstructionCostsForSpace {
  Mechanical?: ConstructionCost;
  Plumbing?: ConstructionCost;
  Electrical?: ConstructionCost;
  Civil?: ConstructionCost;
  Structural?: ConstructionCost;
  Total?: ConstructionCost;
}

// Base interface for costs and fees
export interface BaseCostOrFee {
  id: string;
  discipline: string;
  is_active: boolean;
  name?: string;
}

// Base fee type that extends BaseCostOrFee
export type base_fee = BaseCostOrFee & {
  fee_amount: number;
  prime_consultant_rate?: number;
  fraction_of_prime_rate_discipline?: number;
};

// Actual construction costs
export interface ConstructionCost extends BaseCostOrFee {
  cost_type: 'Mechanical' | 'Plumbing' | 'Electrical' | 'Civil' | 'Structural' | 'Total';
  cost_per_sqft: number;
  year: number;
  building_type_id: string;
  total_construction_cost?: number;  // Optional since it can be calculated
}

// Design fees
export interface EngineeringFee extends BaseCostOrFee {
  fee_amount: number;
  prime_consultant_rate?: number;
  fraction_of_prime_rate_discipline?: number; 
}

// Combined type for discipline-specific costs and fees
export interface DisciplineEngineeringFees {
  discipline: string;
  engineering_fees: EngineeringFee[];
  is_active: boolean;
}

// =============== Service Types ===============
export interface DisciplineEngineeringService {
  id: string;
  discipline: string;
  service_name: string;
  description: string | null;
  is_included_in_fee: boolean;
  is_default_included: boolean;
  phase: 'design' | 'construction' | null;
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  is_construction_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface EngineeringServiceLink {
  id: string;
  engineering_service_id: string;
  additional_item_id: string;
  link_type: 'engineering_service' | 'fee_additional_item';
  created_at: string;
  updated_at: string;
}


export interface FeeCalculationResult {
  id: string;
  fee_id: string;
  fee_type: 'fixed' | 'flex';
  structure_id?: string;
  level_id?: string;
  space_id?: string;
  type: 'design' | 'construction';
  category: 'discipline_fee' | 'construction_cost' | 'service_fee';
  value: number;
  rate?: number;
  is_custom?: boolean;
  parameters: Record<string, number | string | boolean>;
  timestamp: string;
  source: 'fixed_fees' | 'flex_fees';
}

/**
 * Fee calculation state for storing all fee calculations
 */
export interface FeeCalculationState {
  design: {
    structures: FeeCalculationResult[];
    levels: FeeCalculationResult[];
    spaces: FeeCalculationResult[];
    total: number;
    parameters: Record<string, number | string | boolean>;
  };
  construction: {
    structures: FeeCalculationResult[];
    levels: FeeCalculationResult[];
    spaces: FeeCalculationResult[];
    total: number;
    parameters: Record<string, number | string | boolean>;
  };
  total: number;
}

/**
 * Fee scale type that defines the rates for different disciplines
 */
export interface FeeScale {
  id: number;
  construction_cost: number;
  prime_consultant_rate: number;
  fraction_of_prime_rate_mechanical: number;
  fraction_of_prime_rate_plumbing: number;
  fraction_of_prime_rate_electrical: number;
  fraction_of_prime_rate_structural: number;
  created_at?: string;
  updated_at?: string;
}

// =============== Base Proposal Types ===============
export interface base_proposal {
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

export interface proposal_project_data {
  project_name?: string;
  project_number?: string;
  project_description?: string;
  project_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  project_type?: string;
  project_phase?: string;
  project_status?: string;
  project_start_date?: string;
  project_end_date?: string;
  project_budget?: number;
  project_notes?: string;
  [key: string]: any; // Allow for additional project-specific data
}

export interface proposal extends base_proposal {
  status: proposal_status;
  contacts: proposal_contact[];
  project_data: proposal_project_data;
}

// =============== Contact Types ===============
export type contact_role_string = 'primary' | 'secondary' | 'technical' | 'billing';
export type contact_status = 'active' | 'inactive';

export interface contact_role_object {
  id: string;
  name: string;
}

export type contact_role = contact_role_string | contact_role_object;

export interface proposal_contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: contact_role;
  company?: string;
  is_primary: boolean;
  first_name: string;
  last_name: string;
  mobile?: string;
  direct_phone?: string;
  role_id: string | null;
  location_id: string | null;
  company_id: string | null;
  status: contact_status;
  location?: {
    id: string;
    name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    zip: string;
    company_id: string;
    company?: {
      id: string;
      name: string;
    }
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Fee Types
 */

export interface fee_item {
  id: string;
  name: string;
  description: string;
  default_min_value: number;
  is_active: boolean;
  discipline?: string;
  parent_discipline?: string;
  type: 'rescheck' | 'nested' | 'multi' | 'discipline' | 'additional_service';
  phase: 'design' | 'construction';
  service_name?: string;
  estimated_fee?: string | null;
}

export interface engineering_standard_service {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  is_included_in_fee: boolean;
  phase: 'design' | 'construction';
  min_fee: number | undefined;
  rate: number | undefined;
}

/**
 * Space engineering service type for storing engineering services in spaces
 */
export interface space_engineering_service {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  estimated_fee: string | null;
  is_active: boolean;
}

// Update Space interface to use the new types
export interface Space {
  id: string;
  level_id: string;
  structure_id: string;
  name: string;
  description: string;
  floor_area: number;
  building_type: string;
  building_type_id: string;
  space_type: string;
  project_construction_type: string;
  project_construction_type_id: number;
  construction_costs: ConstructionCostsForSpace;  // Total construction costs by discipline
  discipline_engineering_services: DisciplineEngineeringService[];
  discipline_engineering_fees: DisciplineEngineeringFees[];  // Now properly separated costs and fees
  created_at: string;
  updated_at: string;
} 