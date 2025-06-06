export interface Space {
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
  structureId: string;
  levelId: string;
  totalConstructionCosts: Array<{
    id: string;
    discipline: string;
    totalConstructionCost: number;
    isActive: boolean;
    costPerSqft: number;
  }>;
  totalCost: number;
  totalCostPerSqft: number;
  engineeringServices?: Array<{
    id: string;
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee: string | null;
    isActive: boolean;
  }>;
}

export interface Level {
  id: string;
  name: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  spaces: Space[];
}

export interface Structure {
  id: string;
  name: string;
  constructionType: string;
  floorArea: string;
  description: string;
  spaceType: string;
  discipline: string;
  hvacSystem: string;
  levels: Level[];
  parentId?: string;
  designFeeRate?: number;
  constructionSupportEnabled?: boolean;
  designPercentage?: number;
  isDuplicate?: boolean;
  duplicateNumber?: number;
  duplicateParentId?: string | null;
  isDuplicateCollapsed?: boolean;
  constructionCosts?: Array<{
    id: string;
    discipline: string;
    totalConstructionCost: number;
    isActive: boolean;
    costPerSqft: number
  }>;
}

export interface ManualFeeOverride {
  id: string;
  structureId: string;
  levelId: string;
  discipline: string;
  designFee?: number;
  constructionSupportFee?: number;
  spaceId?: string;
}

export interface EngineeringService {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  isIncludedInFee: boolean;
  isDefaultIncluded: boolean;
  phase: 'design' | 'construction' | null;
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  isConstructionAdmin: boolean;
}

export interface EngineeringServiceLink {
  id: string;
  engineering_service_id: string;
  additional_item_id: string;
  link_type: 'engineering_service' | 'fee_additional_item';
  created_at: string;
  updated_at: string;
}

export interface FeeTableProps {
  structure: Structure;
  manualOverrides: ManualFeeOverride[];
  engineeringServices: EngineeringService[];
  serviceLinks: EngineeringServiceLink[];
  onFeeUpdate: (structureId: string, discipline: string, type: 'design' | 'construction', value: number | null, spaceId?: string) => void;
  onDisciplineFeeToggle: (structureId: string, discipline: string, isActive: boolean) => void;
  onResetFees: (structureId: string, discipline: string, spaceId?: string) => void;
  onServiceToggle: (structureId: string, spaceId: string, serviceId: string, isActive: boolean) => void;
  onServiceFeeUpdate: (structureId: string, spaceId: string, serviceId: string, fee: string | null) => void;
}

// TrackedService represents an engineering service associated with a structure
// structureId: Foreign key referencing Structure.id
// This is used to track which structure a service belongs to
export interface TrackedService {
  id: string;  // Primary key for the tracked service
  serviceId: string;  // References the engineering service template
  service_name: string;
  name: string;
  discipline: string;
  isDefaultIncluded: boolean;
  min_fee: number | null;
  rate: number | null;
  fee_increment: number | null;
  phase: 'design' | 'construction' | null;
  customFee?: number;
  isConstructionAdmin: boolean;
  fee: number;
  structureId: string;  // Foreign key referencing Structure.id
  levelId: string;  // Foreign key referencing Level.id
  spaceId: string;  // Foreign key referencing Space.id
  isIncluded: boolean;
}

export interface FeeScale {
  id: number;
  construction_cost: number;
  prime_consultant_rate: number;
  fraction_of_prime_rate_mechanical: number;
  fraction_of_prime_rate_plumbing: number;
  fraction_of_prime_rate_electrical: number;
  fraction_of_prime_rate_structural: number;
} 