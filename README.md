# Ostrich with Supabase Python Integration

This project demonstrates how to integrate Supabase with a Next.js application using Python as the backend language for database operations.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up Python environment:
   ```
   npm run setup:python
   ```
4. Create a `.env` file based on `.env.example` and add your Supabase credentials
5. Connect to Supabase using the "Connect to Supabase" button in the top right
6. Run the migrations to set up the database schema
7. Seed the state cost index data:
   ```
   npm run seed:state-cost-index
   ```
8. Start the development server:
   ```
   npm run dev
   ```

## Features

- Python-based Supabase integration
- Reference tables management
- State cost index data
- Building construction rates

## Architecture

The application uses:
- Next.js for the frontend and API routes
- Python for database operations via Supabase
- PythonShell for communication between JavaScript and Python
- Supabase for database storage

## API Routes

- `/api/python` - General-purpose Python-Supabase bridge
- `/api/reference-tables` - CRUD operations for reference tables
- `/api/state-cost-index` - CRUD operations for state cost index data

## Database Schema

The database includes the following tables:
- `reference_tables` - Stores various reference data like fee multipliers and building rates
- `state_cost_index` - Stores construction cost indices by state and metro area

## Supabase Startup

# 1. First, stop and remove the current containers
docker rm -f supabase-ostrich-kong supabase-ostrich-auth

# 2. Start the auth service (this should be part of your Supabase startup)
# If you're using docker-compose, you would do:
docker-compose up -d auth

# 3. Start Kong with the saved configuration
docker run -d --name supabase-ostrich-kong \
    --network supabase-ostrich_default \
    -p 8000:8000 \
    -p 8001:8001 \
    -p 8444:8444 \
    -v supabase-ostrich-kong-data:/var/lib/kong \
    -v "$(pwd)/kong.yml:/home/kong/kong.yml:ro" \
    -e KONG_DATABASE=off \
    -e KONG_DECLARATIVE_CONFIG=/home/kong/kong.yml \
    -e KONG_DNS_ORDER=LAST,A,CNAME \
    -e KONG_PLUGINS=request-transformer,cors,key-auth,acl \
    -e KONG_ADMIN_LISTEN=0.0.0.0:8001 \
    -e KONG_PROXY_LISTEN=0.0.0.0:8000 \
    -e KONG_ADMIN_SSL_LISTEN=0.0.0.0:8444 \
    -e KONG_PROXY_SSL_LISTEN=0.0.0.0:8443 \
    kong:2.8.1

# 4. Verify everything is running
docker ps | grep -E "kong|auth"

# 5. Test the auth endpoint
curl -i -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2MDc5MjAwLCJleHAiOjE5MDM4NDU2MDB9.fBnFSBgi2O_ObRR3ByelsgJ7xKaPoPdWYyw6C-7Ci70" http://localhost:8000/auth/v1/health

## Fee Calculations
# 1 space-dialog
   building_types:      table contains building or space type by category.  This is cross referenced with construction_costs effectively giving us a construction cost by building or space type.
   construction_costs:  table contains total construction cost per sq.ft but also broken out by discipline (mech, plumb, elec)
   construction_index:  data in construction_costs are averages for the USA.  construction_index adjusts these costs to the specifci area
   project_construction_types: this table has a relative_cost_index that we use to adjust the construction_costs based on project type
   The above tables are used in space-dialog.tsx when a space is created.
      On open of space-dialog the construction_index is passed on for the project location.
      A space type is selected defining the construction cost per sq.ft
      A project construction type is selected defining an adjustment to the construction cost.
      as and example region_cost_index x construction_cost_by_disicipline x project_type_index = construction_cost_for discipline.  We calculate this for each discipline.
      Sum the disciplines togther and pass the total cost on to the structure with levels and spaces component in page.tsx.
   
# 2 structure/building component/duplicates   
   In the structure component we use the construction value from construction_costs table with cost_type "totals"
    for each space to give as a structure construction total.
   fee_duplicate_structures:  This table adjust the construction costs for duplicate structures/building.  The parent structure has index 1 in this table with a rate of 1.  The second entry in this table with id 2, would represent the second structure/building and first duplicate.  It has a rate of 0.75.  The thrid entry would have id 3 and represent duplicate 2 with rate 0.5625.  so it goes. The 10th structure (duplicate 9) and subsequent duplicates allhave the same rate represented by the rate with id 10.

   if we have a total structure construction cost of 10000 for the parent structure then the duplicate 1 total construction cost for the structure would be 10000x0.75 = 75000.  The same applies for the discipline construction costs.

# 3 fee calculations using FixedFees.tsx component
   These construction costs from above are passed on to the FixedFees.tsx component.
   design_fee_scale:  this table has a field called construction_cost, prime_consultant_rate and then fraction_of_prime_rate_mechanical, fraction_of_prime_rate_electrical, fraction_of_prime_rate_plumbing and fraction_of_prime_rate_structural.  These are used to adjust the prime rate by discipline.

   Calculating a dengineering fee:  we take the total construction cost of the structure passed to FixedFee.tsx after it has been corrected by cost indices etc. as described above.  We find the bracket this corrected construction cost falls in on the design_fee_scale and get the corresponding prime_consultant_rate which is a percentage value.  Let's say the corrected construction cost passed to the FixedFee.tsx component is $170,000 and the mechanical discipline construction cost is $75,000.  In the design_fee_scale table we get the entries:
         construction_cost    prime_consultant_rate fraction_of_prime_rate_mechanical ....
         150,000              9.12                 7.5
         200,000              8.83                 7.5

         to calculate the design fee for mechanical discipline on the $170,000 structure total construction cost we do the following:

         170,000 falls between 150,000 and 200,000 so we use the 8.83% prime_consultant_rate.
         To get the mechanical discipline fee we say then 75,000 x 8.83% x 7.5% = 497.

         We do the same for the other disciplines

   to get the design fee we Design percentage field value in the FixedFee.tsx component, which usually is set to 80% and multiply it with the engineering fee calculated above.  When Construction Administartion is active it will use the construction percentage value and multiply that with the engineering fee to get the constrcution admin fee portion

## Services

Let me check the filtering criteria in the `FixedFees` component:


Read file: src/app/projects/[id]/proposals/[proposalId]/components/FixedFees.tsx
Based on the code, here are the criteria used to determine which services should be rendered in the `FixedFees` component:

1. **Phase Matching**: 
   ```typescript
   service.phase === phase
   ```
   - Services must match the current phase ('design' or 'construction')

2. **Construction Admin Exclusion**:
   ```typescript
   !service.isConstructionAdmin
   ```
   - Construction admin services are explicitly excluded from display

3. **Fee-Related Values**:
   ```typescript
   (service.min_fee !== null || service.rate !== null || service.fee_increment !== null)
   ```
   - Services must have at least one of these fee-related values:
     - `min_fee`: A minimum fee amount
     - `rate`: A percentage rate
     - `fee_increment`: A fee increment value

4. **Structure Association**:
   - Services are filtered by `structureId` (passed as a parameter to `renderTrackedServices`)
   - Only services associated with the specific structure are displayed

5. **Grouping**:
   - Services are grouped by `service_name` for display
   - Each group can have multiple services for different disciplines

6. **Service State**:
   - Services have a `isDefaultIncluded` flag that determines if they're enabled by default
   - Services can have a `customFee` that overrides the calculated fee
   - Services can be toggled on/off using the UI

So, for a service to appear in the FixedFees component, it must:
1. Match the current phase (design/construction)
2. Not be a construction admin service
3. Have at least one fee-related value (min_fee, rate, or fee_increment)
4. Be associated with the correct structure
5. Be properly grouped with other services of the same name

The issue we were seeing earlier might be because:
1. The services weren't being created with the correct `structureId`
2. The services might not have had the required fee-related values
3. The services might have been marked as construction admin services



## Design Phase Space Fees & Services Logic
# Visibility of Design Phase Fees for Spaces:
Design phase fees for all spaces are always displayed. Every space in every structure will show its design phase fee breakdown by discipline, regardless of which services are included.
# Fee Calculation:
Design phase fees are calculated based on the construction cost for each discipline and the "Design Percentage" parameter (set at the top of the Fixed Fees component). The calculation uses the appropriate fee scale and discipline-specific rates to determine the design phase portion of the total fee.
# Services Handling:
For each discipline, standard engineering services (such as Mechanical, Electrical, Plumbing, etc.) are listed and can be toggled on or off. Each service may have its own minimum fee, rate, or fee increment, and these are factored into the total design phase fee for the discipline. Users can also override service fees or revert to the calculated value as needed.
# UI Consistency:
The user interface for design phase space fees includes editable fee fields and toggle buttons for enabling or disabling fees per discipline, as well as for each service within a discipline. This allows users to customize which disciplines and services are included in the design phase fee calculation for each space.
# Summary:
This logic ensures that design phase space fees and services are always visible and editable, providing a clear and comprehensive view of all design-related fees and services in the proposal.
Construction Phase Space Fees & Services Logic
# Visibility of Construction Phase Fees for Spaces:
Construction phase fees for individual spaces are only displayed if there is at least one engineering service in the proposal with the isConstructionAdmin flag set to true and isDefaultIncluded set to true. This ensures that construction phase calculations are only relevant when construction administration services are included in the project.
# Fee Calculation:
When construction phase fees are enabled (i.e., when a construction admin service is present), the system uses the "Construction Percentage" parameter (set at the top of the Fixed Fees component) to determine the portion of the total fee allocated to the construction phase. The calculation for each discipline is based on the construction cost and the selected percentage.
# Services Handling:
For each discipline, construction phase services are listed and can be toggled on or off. Each service may have its own minimum fee, rate, or fee increment, and these are factored into the total construction phase fee for the discipline. Construction administration services specifically control whether construction phase space fees are shown and calculated.
# UI Consistency:
The user interface for construction phase space fees matches the design phase, including editable fee fields and toggle buttons for enabling or disabling fees per discipline and per service.
# Summary:
This logic ensures that construction phase space fees and services are only shown and calculated when appropriate, providing clarity and accuracy in project fee proposals.

## Construction Phase Space Fees & Services Logic
# Visibility of Construction Phase Fees for Spaces:
Construction phase fees for individual spaces are only displayed if there is at least one engineering service in the proposal with the isConstructionAdmin flag set to true and isDefaultIncluded set to true. This ensures that construction phase calculations are only relevant when construction administration services are included in the project.
# Fee Calculation:
When construction phase fees are enabled (i.e., when a construction admin service is present), the system uses the "Construction Percentage" parameter (set at the top of the Fixed Fees component) to determine the portion of the total fee allocated to the construction phase. The calculation for each discipline is based on the construction cost and the selected percentage.
# Services Handling:
For each discipline, construction phase services are listed and can be toggled on or off. Each service may have its own minimum fee, rate, or fee increment, and these are factored into the total construction phase fee for the discipline. Construction administration services specifically control whether construction phase space fees are shown and calculated.
# UI Consistency:
The user interface for construction phase space fees matches the design phase, including editable fee fields and toggle buttons for enabling or disabling fees per discipline and per service.
# Summary:
This logic ensures that construction phase space fees and services are only shown and calculated when appropriate, providing clarity and accuracy in project fee proposals.

# Proposal Workflow

## Overview
The proposal system implements a structured workflow to manage the creation, review, and approval of engineering proposals. This ensures proper oversight and maintains a clear audit trail of proposal revisions.

## Roles and Permissions
- **Project Manager (PM)**: Creates and manages proposals
- **Manager**: Reviews and approves/rejects proposals
- **Admin**: Full system access, including review and approval capabilities

## Proposal Statuses
1. **Edit** (Initial State)
   - Created by PM, Manager, or Admin
   - Assigned temporary revision number
   - Full editing capabilities
   - Can be deleted
   - Can be submitted for review

2. **Review**
   - Submitted by PM for review
   - Only Manager and Admin can approve/reject
   - If rejected: Returns to Edit status
   - If approved: Moves to Approved status

3. **Approved**
   - Ready for PM to publish
   - Revision number becomes permanent upon publishing
   - PM can publish to send to client

4. **Published**
   - Sent to client for review
   - Cannot be deleted
   - If client rejects: PM can return to Edit status
   - If client approves: Moves to Active status

5. **Active**
   - Client has approved the proposal
   - Cannot be deleted
   - Can be placed On Hold or Cancelled at client's request

6. **On Hold**
   - Temporary suspension of the proposal
   - Can be reactivated or cancelled
   - Cannot be deleted

7. **Cancelled**
   - Final state for terminated proposals
   - Cannot be reactivated or deleted
   - Maintains historical record

## Workflow Process
1. **Creation**
   - PM/Manager/Admin creates new proposal
   - System assigns temporary revision number
   - Proposal starts in Edit status

2. **Review Process**
   - PM submits proposal for review
   - Manager/Admin reviews proposal
   - If rejected: Returns to Edit status with feedback
   - If approved: Moves to Approved status

3. **Client Review**
   - PM publishes approved proposal
   - System assigns permanent revision number
   - Proposal sent to client
   - Client can approve, reject, or request changes

4. **Client Decision**
   - If client rejects: PM can return to Edit status
   - If client approves: Proposal moves to Active status
   - If client requests hold: Proposal moves to On Hold status
   - If client cancels: Proposal moves to Cancelled status

## Key Rules
- Proposals can only be deleted while in Edit status
- Revision numbers become permanent upon publishing
- Once published, proposals cannot be deleted
- Active proposals can be placed On Hold or Cancelled
- All status changes are logged for audit purposes

## Status Transitions
```
Edit → Review → Approved → Published → Active
   ↑      ↓
   └──────┘ (if rejected)
   ↑
   └──────── (if client rejects)
```

## Notes
- All status changes require appropriate role permissions
- System maintains a complete history of all proposal revisions
- Each status change is logged with timestamp and user information
- Client communications are tracked and associated with the proposal

I'll create a comprehensive README.md that explains the complete data flow across all components:

```markdown
# Proposal Page Architecture

## Overview
The proposal page implements a complex data management system for handling architectural proposals, including structures, spaces, services, and fees. This document outlines the complete data flow and component interactions.

## Core Components

### 1. Page Component (`page.tsx`)
- **Primary Role**: Root component and data orchestrator
- **Key Responsibilities**:
  - Manages overall proposal state
  - Handles data transformations
  - Coordinates component interactions
  - Manages proposal lifecycle
- **State Management**:
  - `proposal`: Raw proposal data
  - `displayData`: Transformed data for UI
  - `isLoading`: Loading states
  - `proposalStatus`: Proposal lifecycle state

### 2. ProposalData Component
- **Primary Role**: Data management and API interface
- **Key Responsibilities**:
  - Loads proposal data from database
  - Manages data updates
  - Provides data transformation methods
  - Handles API communication
- **Data Flow**:
  ```
  Database → ProposalData → handleDataChange → page.tsx → displayData → UI Components
  ```

### 3. ProposalStructures Component
- **Primary Role**: Structure and space management
- **Key Responsibilities**:
  - Manages building structures
  - Handles level organization
  - Controls space management
  - Implements drag-and-drop
- **Data Flow**:
  ```
  User Action → ProposalStructures → handleStructuresChange → 
    → Update proposal state
    → Update displayData
    → UI Components
  ```

### 4. SpaceDialog Component
- **Primary Role**: Space creation and editing
- **Key Responsibilities**:
  - Manages space details
  - Handles space updates
  - Controls space services
  - Manages space fees
- **Data Flow**:
  ```
  User Action → SpaceDialog → handleSpaceUpdate → 
    → Update structure state
    → Update proposal state
    → Update displayData
  ```

### 5. EngineeringServicesManager Component
- **Primary Role**: Service management per structure
- **Key Responsibilities**:
  - Manages engineering services
  - Handles service inclusion/exclusion
  - Controls service fees
  - Implements service filtering
- **Data Flow**:
  ```
  API → EngineeringServicesManager → 
    → Track service changes
    → Update service fees
    → Notify parent of changes
  ```

### 6. FixedFees Component
- **Primary Role**: Fixed fee calculations
- **Key Responsibilities**:
  - Calculates structure fees
  - Manages fee scales
  - Handles fee updates
  - Provides fee summaries
- **Data Flow**:
  ```
  User Action → FixedFees → onFeeUpdate → 
    → Update proposal state
    → Update displayData
  ```

### 7. FlexFees Component
- **Primary Role**: Flexible fee management
- **Key Responsibilities**:
  - Manages hourly rates
  - Handles fee categories
  - Controls fee components
  - Implements drag-and-drop
- **Data Flow**:
  ```
  User Action → FlexFees → 
    → Internal state management
    → API calls for rates/roles
    → UI updates
  ```

### 8. ProposalActions Component
- **Primary Role**: Proposal lifecycle management
- **Key Responsibilities**:
  - Handles status changes
  - Manages proposal actions
  - Controls permissions
  - Provides UI feedback
- **Data Flow**:
  ```
  User Action → ProposalActions → 
    → API calls
    → Status updates
    → UI feedback
  ```

## Complete Data Flow

### 1. Initial Load
```
Database → ProposalData → page.tsx → displayData → UI Components
```

### 2. Structure Management
```
User Action → ProposalStructures → handleStructuresChange → 
  → Update proposal state
  → Update displayData
  → Update UI
```

### 3. Space Management
```
User Action → SpaceDialog → handleSpaceUpdate → 
  → Update structure
  → Update proposal
  → Update displayData
  → Update UI
```

### 4. Service Management
```
User Action → EngineeringServicesManager → 
  → Update services
  → Update fees
  → Update proposal
  → Update displayData
```

### 5. Fee Management
```
Fixed Fees:
User Action → FixedFees → onFeeUpdate → 
  → Update proposal
  → Update displayData

Flexible Fees:
User Action → FlexFees → 
  → Update internal state
  → Update API
  → Update UI
```

### 6. Proposal Actions
```
User Action → ProposalActions → 
  → Update status
  → Update database
  → Update UI
```

## State Management Patterns

### 1. Shared State (page.tsx)
- Proposal data
- Display data
- Loading states
- Proposal status

### 2. Component State
- Local UI state
- Form state
- Drag-and-drop state
- Filter states

### 3. API State
- Service data
- Fee scales
- User roles
- Proposal status

## Key Features

### 1. Drag and Drop
- Structure management
- Service organization
- Fee component arrangement
- Level organization

### 2. Data Transformation
- Raw to display data
- Fee calculations
- Service tracking
- Space management

### 3. Fee Management
- Fixed fee calculations
- Flexible fee structures
- Service-based fees
- Space-based fees

### 4. Service Management
- Service inclusion/exclusion
- Fee tracking
- Phase management
- Discipline filtering

## Best Practices

1. **Single Source of Truth**: ProposalData component
2. **Clear Data Flow**: Unidirectional data flow
3. **Component Independence**: Self-contained components
4. **State Management**: Appropriate state patterns
5. **Error Handling**: Comprehensive error management
6. **Type Safety**: TypeScript interfaces
7. **Performance**: Memoization and optimization
8. **User Experience**: Consistent drag-and-drop
9. **Code Organization**: Clear component responsibilities
10. **API Integration**: Clean API communication

## Component Dependencies

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

## Data Update Flow

1. **User Action** triggers component update
2. **Component** processes update
3. **State Update** propagates to parent
4. **ProposalData** updates database
5. **Page Component** transforms data
6. **UI Components** reflect changes

## Error Handling

1. **API Errors**: Handled by ProposalData
2. **Validation Errors**: Component-level handling
3. **State Errors**: Error boundaries
4. **User Feedback**: Toast notifications
5. **Loading States**: Loading indicators

## Performance Considerations

1. **Memoization**: useMemo for expensive calculations
2. **State Updates**: Batched updates
3. **API Calls**: Cached responses
4. **Component Rendering**: Optimized re-renders
5. **Data Transformation**: Efficient algorithms
```

This architecture ensures:
1. Clear data flow and component responsibilities
2. Efficient state management
3. Consistent user experience
4. Maintainable codebase
5. Scalable system

Would you like me to expand on any particular aspect of this architecture?