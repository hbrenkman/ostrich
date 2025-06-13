# Proposal State Management

## Status Definitions

| Code | Name | Description | Icon | Color | Initial | Final |
|------|------|-------------|------|-------|---------|-------|
| edit | Edit | Proposal is being edited | edit | yellow | Yes | No |
| review | Review | Proposal is under review | eye | blue | No | No |
| approved | Approved | Proposal has been approved internally | check-circle | green | No | No |
| published | Published | Proposal has been published to client | send | purple | No | No |
| on_hold | On Hold | Proposal is on hold | pause-circle | orange | No | No |
| client_approved | Client Approved | Proposal has been approved by client | thumbs-up | green | No | Yes |
| client_rejected | Client Rejected | Proposal has been rejected by client | x-circle | red | No | Yes |
| cancelled | Cancelled | Proposal has been cancelled | x | red | No | Yes |

## Workflow Process

### Initial State
- All proposals start in the `edit` status
- This is the only status marked as `is_initial: true`

### Intermediate States
1. **Review**
   - Proposal moves to review for internal assessment
   - Can return to edit if changes are needed

2. **Approved**
   - Internal approval granted
   - Ready for client submission

3. **Published**
   - Proposal has been sent to client
   - Awaiting client decision

4. **On Hold**
   - Can be applied at various stages
   - Temporary suspension of the proposal process

### Final States
Three possible final states (marked as `is_final: true`):
1. **Client Approved**
   - Client has accepted the proposal
   - End of successful workflow

2. **Client Rejected**
   - Client has declined the proposal
   - May return to edit for revisions

3. **Cancelled**
   - Proposal has been terminated
   - No further actions possible

## Visual Indicators
Each status has associated visual elements:
- **Icons**: Using Lucide icon set
- **Colors**: Consistent color coding for status recognition
  - Green: Positive states (approved)
  - Red: Negative states (rejected, cancelled)
  - Blue: Review state
  - Purple: Published state
  - Orange: On hold state
  - Yellow: Edit state

## State Transitions
```
edit → review → approved → published → client_approved/client_rejected
   ↑      ↓
   └──────┘ (if rejected)
   ↑
   └──────── (if client rejects)
```

## Notes
- Only one initial state (`edit`)
- Three final states (`client_approved`, `client_rejected`, `cancelled`)
- `on_hold` can be applied at various stages
- All status changes are tracked with timestamps
- Each status has a unique code for system reference
- Status colors and icons are used for consistent UI representation


After analyzing the current architecture, here are several potential improvements and simplifications:

1. **State Management Consolidation**
```markdown
Current:
- Multiple state management patterns (local, shared, API)
- Duplicate state tracking across components
- Complex state synchronization

Proposed:
- Implement a global state management solution (e.g., Zustand or Jotai)
- Create a single source of truth for:
  - Proposal data
  - Services data
  - Fee calculations
  - UI state
- Benefits:
  - Reduced prop drilling
  - Simplified state updates
  - Better performance
  - Easier debugging
```

2. **Component Hierarchy Simplification**
```markdown
Current:
```
page.tsx
├── ProposalData
├── ProposalStructures
│   └── SpaceDialog
├── EngineeringServicesManager
├── FixedFees
├── FlexFees
└── ProposalActions
```

Proposed:
```
page.tsx
├── ProposalProvider (new global state)
├── ProposalLayout
│   ├── ProposalHeader
│   ├── ProposalContent
│   │   ├── StructuresManager (combined ProposalStructures + SpaceDialog)
│   │   ├── ServicesManager (simplified EngineeringServicesManager)
│   │   └── FeesManager (combined FixedFees + FlexFees)
│   └── ProposalFooter
└── ProposalActions
```

3. **Data Flow Optimization**
```markdown
Current:
- Multiple data transformation layers
- Redundant API calls
- Complex update chains

Proposed:
- Implement a data layer abstraction:
  ```typescript
  // Example of simplified data layer
  interface ProposalDataLayer {
    // Core data operations
    getProposal: (id: string) => Promise<Proposal>;
    updateProposal: (data: Partial<Proposal>) => Promise<void>;
    
    // Derived data operations
    getStructures: (proposalId: string) => Promise<Structure[]>;
    getServices: (structureId: string) => Promise<Service[]>;
    getFees: (proposalId: string) => Promise<FeeSummary>;
    
    // Batch operations
    updateMultiple: (updates: ProposalUpdate[]) => Promise<void>;
  }
  ```
- Benefits:
  - Centralized data operations
  - Reduced API calls
  - Simplified error handling
  - Better caching
```

4. **Component Simplification**
```markdown
Current Issues:
- ProposalStructures and SpaceDialog have overlapping responsibilities
- EngineeringServicesManager is too complex
- Fee components are split but related

Proposed Changes:

a. Combine Structure and Space Management:
```typescript
// New unified component
interface StructuresManagerProps {
  proposalId: string;
  onUpdate: (update: StructureUpdate) => void;
}

function StructuresManager({ proposalId, onUpdate }: StructuresManagerProps) {
  // Combined state for structures and spaces
  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  
  // Unified handlers
  const handleStructureUpdate = useCallback((update: StructureUpdate) => {
    // Handle both structure and space updates
  }, []);
  
  // Simplified render
  return (
    <div>
      <StructureList structures={structures} onUpdate={handleStructureUpdate} />
      {selectedSpace && (
        <SpaceEditor 
          space={selectedSpace}
          onUpdate={handleStructureUpdate}
        />
      )}
    </div>
  );
}
```

b. Simplify Services Management:
```typescript
// Simplified services component
interface ServicesManagerProps {
  proposalId: string;
  structureId: string;
}

function ServicesManager({ proposalId, structureId }: ServicesManagerProps) {
  // Use global state instead of local state
  const { services, updateService } = useProposalStore();
  
  // Simplified service operations
  const handleServiceUpdate = useCallback((serviceId: string, update: ServiceUpdate) => {
    updateService(structureId, serviceId, update);
  }, [structureId, updateService]);
  
  return (
    <div>
      <ServiceList 
        services={services[structureId]}
        onUpdate={handleServiceUpdate}
      />
    </div>
  );
}
```

c. Unified Fee Management:
```typescript
// Combined fee management
interface FeesManagerProps {
  proposalId: string;
  structureId: string;
}

function FeesManager({ proposalId, structureId }: FeesManagerProps) {
  const { fees, updateFee } = useProposalStore();
  
  // Unified fee handling
  const handleFeeUpdate = useCallback((update: FeeUpdate) => {
    updateFee(structureId, update);
  }, [structureId, updateFee]);
  
  return (
    <div>
      <FeeCalculator 
        fees={fees[structureId]}
        onUpdate={handleFeeUpdate}
      />
      <FeeSummary fees={fees[structureId]} />
    </div>
  );
}
```

5. **API Layer Improvements**
```markdown
Current:
- Multiple API endpoints
- Inconsistent error handling
- Duplicate API calls

Proposed:
- Create a unified API client:
  ```typescript
  // Example API client
  class ProposalApiClient {
    // Core methods
    async getProposal(id: string): Promise<Proposal>;
    async updateProposal(id: string, data: Partial<Proposal>): Promise<void>;
    
    // Batch operations
    async batchUpdate(updates: ProposalUpdate[]): Promise<void>;
    
    // Caching
    private cache: Map<string, any>;
    private getCached<T>(key: string): T | null;
    private setCached<T>(key: string, value: T): void;
    
    // Error handling
    private handleError(error: unknown): never;
  }
  ```
- Benefits:
  - Consistent error handling
  - Request caching
  - Batch operations
  - Type safety
```

6. **Performance Optimizations**
```markdown
Current:
- Multiple re-renders
- Inefficient data transformations
- Unnecessary API calls

Proposed:
- Implement virtualization for long lists
- Use React.memo for expensive components
- Implement proper caching strategies
- Use web workers for heavy calculations
- Implement proper loading states
```

7. **Type System Improvements**
```markdown
Current:
- Inconsistent type definitions
- Some any types
- Complex nested types

Proposed:
- Create a unified type system:
  ```typescript
  // Core types
  type Proposal = {
    id: string;
    structures: Structure[];
    services: Service[];
    fees: FeeSummary;
    status: ProposalStatus;
  };
  
  // Update types
  type ProposalUpdate = 
    | { type: 'structure'; data: StructureUpdate }
    | { type: 'service'; data: ServiceUpdate }
    | { type: 'fee'; data: FeeUpdate };
    
  // Action types
  type ProposalAction = 
    | { type: 'UPDATE_PROPOSAL'; payload: ProposalUpdate }
    | { type: 'SET_STATUS'; payload: ProposalStatus };
  ```
- Benefits:
  - Better type safety
  - Easier refactoring
  - Better IDE support
```

8. **Testing Improvements**
```markdown
Current:
- Limited test coverage
- Complex component testing
- Difficult state testing

Proposed:
- Implement comprehensive testing strategy:
  - Unit tests for utilities
  - Integration tests for components
  - E2E tests for critical flows
  - State management tests
  - API mocking
```

These improvements would result in:
1. More maintainable codebase
2. Better performance
3. Easier debugging
4. Better developer experience
5. More reliable application
6. Easier testing
7. Better scalability

Would you like me to elaborate on any of these improvements or provide more specific implementation details?