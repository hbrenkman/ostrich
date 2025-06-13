import type { base_fee } from './base';

export interface tracked_service {
  id: string;
  service_id: string;
  service_name: string;
  name: string;
  discipline: string;
  is_default_included: boolean;
  min_fee: number;
  rate: number;
  fee_increment: number;
  phase: 'design' | 'construction';
  custom_fee: number | null;
  is_construction_admin: boolean;
  fee: number;
  structure_id: string | null;
  level_id: string | null;
  space_id: string | null;
  is_included: boolean;
  description: string;
  estimated_fee: string | null;
  is_active: boolean;
}

export interface engineering_additional_service {
  id: string;
  discipline: string;
  service_name: string;
  description: string;
  estimated_fee: string | null;
  is_active: boolean;
  phase: 'design' | 'construction';
  min_fee?: number;
  rate?: number;
  fees?: Record<string, base_fee>;
} 