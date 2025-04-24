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