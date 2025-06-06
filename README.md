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
   In the structure component we use the construction value from construction_costs table with cost_type "totals" for each space to give as a structure construction total.
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