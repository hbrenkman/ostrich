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