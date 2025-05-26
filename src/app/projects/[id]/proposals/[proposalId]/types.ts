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
  fees: Array<{
    id: string;
    discipline: string;
    totalFee: number;
    isActive: boolean;
    costPerSqft: number;
  }>;
  splitFees: boolean;
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
}

export interface ManualFeeOverride {
  structureId: string;
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
  estimated_fee: string | null;
  default_setting: boolean;
  phase: 'design' | 'construction' | null;
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