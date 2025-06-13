export interface ProposalFormData {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  number: number;
  display_number: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  version: number;
  is_active: boolean;
  is_template: boolean;
  template_id: string | null;
  template_version: number | null;
  template_name: string | null;
  template_description: string | null;
  template_created_at: string | null;
  template_updated_at: string | null;
  template_created_by: string | null;
  template_updated_by: string | null;
  template_version_number: number | null;
  template_is_active: boolean | null;
  template_is_template: boolean | null;
  template_template_id: string | null;
  template_template_version: number | null;
  template_template_name: string | null;
  template_template_description: string | null;
  template_template_created_at: string | null;
  template_template_updated_at: string | null;
  template_template_created_by: string | null;
  template_template_updated_by: string | null;
  template_template_version_number: number | null;
  template_template_is_active: boolean | null;
  template_template_is_template: boolean | null;
}

export interface Proposal {
  id: string;
  project_id: string;
  proposal_number: number;
  revision_number: number;
  is_temporary_revision: boolean;
  status_id: string;
  contacts: ProposalContact[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  status: ProposalStatus;
  project_data: {
    structures: UIStructure[];
    calculations: {
      design: {
        structures: any[];
        levels: any[];
        spaces: any[];
        total: number;
        parameters: Record<string, any>;
      };
      construction: {
        structures: any[];
        levels: any[];
        spaces: any[];
        total: number;
        parameters: Record<string, any>;
      };
      total: number;
    };
    disciplines: any[];
    services: any[];
    tracked_services: any[];
  };
}

export interface ProposalStatus {
  id: string;
  code: ProposalStatusCode;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  is_initial: boolean;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

export type ProposalStatusCode = 'edit' | 'review' | 'approved' | 'rejected' | 'archived';

export interface ProposalContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  is_primary: boolean;
  status: ContactStatus;
  role_type: ContactRole;
}

export type ContactRole = 'client' | 'consultant' | 'contractor' | 'other';

export type ContactStatus = 'active' | 'inactive' | 'pending'; 