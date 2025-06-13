import type { base_fee } from './base';
import type { ui_structure } from './structure';
import type { tracked_service } from './service';

export interface fee_duplicate_structure {
  id: string;
  discipline: string;
  rate: number;
  duplicate_number: number;
  duplicate_parent_id: string | null;
}

export interface fee_table_props {
  fees: base_fee[];
  on_fee_update: (fee_id: string, updates: Partial<base_fee>) => void;
  on_discipline_fee_toggle?: (discipline: string, is_active: boolean) => void;
  phase: 'design' | 'construction';
} 