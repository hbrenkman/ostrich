# Proposal Types Documentation

## Current Type Definitions

### 1. Proposal Status Types
Currently defined in multiple places with inconsistencies:

```typescript
// In ProposalActions.tsx
type ProposalStatusName = 'Edit' | 'Review' | 'Approved' | 'Published' | 'Active' | 'On Hold' | 'Cancelled';

// In page.tsx
type ProposalStatus = 'Edit' | 'Review' | 'Approved' | 'Published' | 'Active' | 'On Hold' | 'Cancelled';

// In ProposalFormData
status: 'Pending' | 'Active' | 'On Hold' | 'Cancelled' | 'Review' | 'Approved' | 'Edit';
```

### 2. Proposal Status Interface
Multiple inconsistent definitions:

```typescript
// In ProposalActions.tsx
interface ProposalStatus {
  id: string;
  name: ProposalStatusName;
  description: string;
  is_active: boolean;
}

// In proposal-statuses/route.ts
interface ProposalStatus {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### 3. Proposal Interface
Multiple inconsistent definitions:

```typescript
// In ProposalActions.tsx
interface Proposal {
  id: string;
  status_id: string;
  status: ProposalStatusName;  // Backward compatibility
  revisionNumber: string;
  isTemporaryRevision: boolean;
  proposal_number?: number;
  clientContacts?: Contact[];
  contacts?: Contact[];
  description?: string;
  project_data?: any;
  created_by?: string;
  updated_by?: string;
}

// In fee-proposals/route.ts
interface Proposal {
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
  project_data: Record<string, any>;
  contacts: any[];
  status: {
    name: string;
  } | null;
}
```

## Proposed Consolidation Plan

### 1. Create a Central Types File
Create `src/types/proposal.ts` with all consolidated types:

```typescript
// Status Codes (from database)
export type ProposalStatusCode = 
  | 'edit'
  | 'review'
  | 'approved'
  | 'published'
  | 'client_approved'
  | 'client_rejected'
  | 'on_hold'
  | 'cancelled';

// Status Interface (matches database)
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

// Base Proposal Interface
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

// Extended Proposal Interface
export interface Proposal extends BaseProposal {
  status: ProposalStatus;
  contacts: ProposalContact[];
  project_data: ProposalProjectData;
}

// Contact Interface
export interface ProposalContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  is_primary: boolean;
  details: {
    first_name: string;
    last_name: string;
    role_id: string | null;
    location_id: string | null;
    company_id: string | null;
    status: string;
  };
}

// Project Data Interface
export interface ProposalProjectData {
  structures: Structure[];
  calculations: {
    design: CalculationData;
    construction: CalculationData;
    total: number;
  };
  disciplines: Discipline[];
  services: ProposalService[];
  tracked_services: TrackedService[];
}

// Additional type definitions...
```

### 2. Implementation Steps

1. **Create the Central Types File**
   - Create `src/types/proposal.ts`
   - Move all consolidated types there
   - Export all types for use across the application

2. **Update Existing Files**
   - Replace all local type definitions with imports from the central file
   - Update components to use the new types
   - Remove duplicate type definitions

3. **Database Alignment**
   - Ensure database schema matches the type definitions
   - Update any migrations if needed
   - Add any missing columns (icon, color, is_initial, is_final)

4. **API Updates**
   - Update API routes to use the new types
   - Ensure consistent response formats
   - Add proper type checking

5. **Component Updates**
   - Update all components to use the new types
   - Remove any hardcoded status values
   - Use the status code constants

### 3. Benefits

1. **Type Safety**
   - Single source of truth for types
   - Consistent type checking across the application
   - Better TypeScript support

2. **Maintainability**
   - Easier to update status definitions
   - Centralized documentation
   - Reduced code duplication

3. **Database Consistency**
   - Types match database schema
   - Clear mapping between frontend and backend
   - Better data integrity

4. **Developer Experience**
   - Better IDE support
   - Clearer documentation
   - Easier onboarding for new developers

### 4. Migration Strategy

1. **Phase 1: Setup**
   - Create central types file
   - Add new types without removing old ones
   - Update documentation

2. **Phase 2: Gradual Migration**
   - Update one component at a time
   - Test thoroughly after each update
   - Keep backward compatibility where needed

3. **Phase 3: Cleanup**
   - Remove old type definitions
   - Update any remaining hardcoded values
   - Final testing and validation

4. **Phase 4: Documentation**
   - Update all relevant documentation
   - Add examples and usage guidelines
   - Document migration process for future reference 