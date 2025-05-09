import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createExecSqlFunction } from './create-exec-sql.js';

// Load environment variables
dotenv.config();

/**
 * Create tables directly using SQL statements
 */
async function createTables() {
  try {
    console.log('Creating tables directly...');
    console.log('Supabase URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.substring(0, 10) + '...');
    
    // First, try to create the exec_sql function
    await createExecSqlFunction();
    
    // Define the tables to create
    const tables = [
      {
        name: 'assets',
        sql: `
          CREATE TABLE IF NOT EXISTS assets (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            number text NOT NULL UNIQUE,
            description text NOT NULL,
            designation text NOT NULL,
            location text,
            purchase_value numeric,
            purchase_date date,
            status text NOT NULL,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Enable Row Level Security
          ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Assets are viewable by all"
            ON assets
            FOR SELECT
            USING (true);
        `
      },
      {
        name: 'reference_tables',
        sql: `
          CREATE TABLE IF NOT EXISTS reference_tables (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            category text NOT NULL,
            description text,
            entries jsonb NOT NULL DEFAULT '[]',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Enable Row Level Security
          ALTER TABLE reference_tables ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Reference tables are viewable by all"
            ON reference_tables
            FOR SELECT
            USING (true);
        `
      },
      {
        name: 'state_cost_index',
        sql: `
          CREATE TABLE IF NOT EXISTS state_cost_index (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            state text NOT NULL,
            metro_area text NOT NULL,
            cost_index numeric NOT NULL,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Create unique constraint on state and metro_area
          CREATE UNIQUE INDEX IF NOT EXISTS state_metro_unique_idx ON state_cost_index (state, metro_area);
          
          -- Enable Row Level Security
          ALTER TABLE state_cost_index ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "State cost index is viewable by all"
            ON state_cost_index
            FOR SELECT
            USING (true);
        `
      },
      {
        name: 'clients',
        sql: `
          CREATE TABLE IF NOT EXISTS clients (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            type text NOT NULL,
            status text NOT NULL,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Enable Row Level Security
          ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Clients are viewable by all"
            ON clients
            FOR SELECT
            USING (true);
        `
      },
      {
        name: 'contacts',
        sql: `
          CREATE TABLE IF NOT EXISTS contacts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name text NOT NULL,
            last_name text NOT NULL,
            email text NOT NULL,
            phone text,
            mobile text,
            client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
            role text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Create index on email for faster lookups
          CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
          
          -- Create index on client_id for faster joins
          CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts(client_id);
          
          -- Enable Row Level Security
          ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Contacts are viewable by all"
            ON contacts
            FOR SELECT
            USING (true);
        `
      },
      {
        name: 'projects',
        sql: `
          CREATE TABLE IF NOT EXISTS projects (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            number text NOT NULL UNIQUE,
            name text NOT NULL,
            client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
            type text NOT NULL,
            status text NOT NULL,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Enable Row Level Security
          ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Projects are viewable by all"
            ON projects
            FOR SELECT
            USING (true);
        `
      },
      {
        name: 'fee_proposals',
        sql: `
          CREATE TABLE IF NOT EXISTS fee_proposals (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            number text NOT NULL UNIQUE,
            project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
            overview text,
            design_budget numeric NOT NULL,
            construction_support_budget numeric NOT NULL,
            status text NOT NULL,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Enable Row Level Security
          ALTER TABLE fee_proposals ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Fee proposals are viewable by all"
            ON fee_proposals
            FOR SELECT
            USING (true);
        `
      }
    ];
    
    // Create the updated_at function if it doesn't exist
    await createUpdatedAtFunction();
    
    // Create each table
    for (const table of tables) {
      console.log(`Creating table: ${table.name}`);
      
      try {
        // First check if the table exists
        const { data, error: checkError } = await supabase
          .from(table.name)
          .select('count')
          .limit(1);
        
        if (checkError) {
          console.log(`Table '${table.name}' does not exist, creating it...`);
          
          // Try to create the table using SQL
          const { error: sqlError } = await supabase.sql(table.sql);
          
          if (sqlError) {
            console.error(`Error creating table '${table.name}' via SQL:`, sqlError);
            
            // Try using RPC if SQL fails
            try {
              const { error: rpcError } = await supabase.rpc('exec_sql', { query: table.sql });
              
              if (rpcError) {
                console.error(`Error creating table '${table.name}' via RPC:`, rpcError);
              } else {
                console.log(`Table '${table.name}' created successfully via RPC.`);
              }
            } catch (rpcErr) {
              console.error(`Exception creating table '${table.name}' via RPC:`, rpcErr);
            }
          } else {
            console.log(`Table '${table.name}' created successfully via SQL.`);
          }
        } else {
          console.log(`Table '${table.name}' already exists.`);
        }
      } catch (err) {
        console.error(`Exception checking/creating table '${table.name}':`, err);
      }
    }
    
    console.log('Table creation process completed.');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

/**
 * Create the updated_at function if it doesn't exist
 */
async function createUpdatedAtFunction() {
  try {
    console.log('Creating updated_at function...');
    
    const sql = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    `;
    
    const { error } = await supabase.sql(sql);
    
    if (error) {
      console.error('Error creating updated_at function:', error);
      return false;
    }
    
    console.log('updated_at function created successfully.');
    return true;
  } catch (error) {
    console.error('Error creating updated_at function:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  createTables();
}

export { createTables };