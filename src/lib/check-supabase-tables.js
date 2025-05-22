import { supabase } from './supabaseUtils.js';
import dotenv from 'dotenv';
import { createTables } from './create-tables.js';
import { seedAllData } from './seed-data.js';

// Load environment variables
dotenv.config();

async function checkSupabaseTables() {
  try {
    console.log('Checking Supabase connection and tables...');
    console.log('Supabase URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.substring(0, 10) + '...');
    
    // First, check if we can connect to Supabase
    let tablesData;
    let tablesError;
    
    try {
      const result = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      tablesData = result.data;
      tablesError = result.error;
    } catch (err) {
      console.error('Error querying pg_catalog:', err);
      tablesError = err;
    }
    
    if (tablesError) {
      console.error('Error connecting to Supabase:', tablesError.message);
      
      // Try a simpler query to check connection
      const { data: testData, error: testError } = await supabase.from('clients').select('count');
      
      if (testError) {
        console.error('Failed to connect to Supabase:', testError.message);
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Supabase Key (first 10 chars):', (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.substring(0, 10) + '...');
        
        // Try to create tables directly
        console.log('Attempting to create tables directly...');
        const tablesCreated = await createTables();
        
        if (tablesCreated) {
          console.log('Tables created successfully, seeding data...');
          await seedAllData();
        }
      } else {
        console.log('Connected to Supabase successfully, but could not list tables.');
      }
      return;
    }
    
    // List all tables
    console.log('Tables in your Supabase database:');
    if (tablesData && tablesData.length > 0) {
      tablesData.forEach(table => {
        console.log(`- ${table.tablename}`);
      });
    } else {
      console.log('No tables found in the database.');
    }
    
    // Check specific tables
    const tablesToCheck = [
      { name: 'clients', required: true },
      { name: 'assets', required: true },
      { name: 'contacts', required: true },
      { name: 'projects', required: true },
      { name: 'fee_proposals', required: true },
      { name: 'reference_tables', required: true },
      { name: 'state_cost_index', required: true }
    ];
    
    console.log('\nChecking specific tables:');
    let missingRequiredTables = false;
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table.name).select('count');
        
        if (error) {
          console.log(`❌ Table '${table.name}' does not exist or is not accessible.`);
          if (table.required) {
            missingRequiredTables = true;
          }
        } else {
          console.log(`✅ Table '${table.name}' exists.`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table.name}':`, err.message);
        if (table.required) {
          missingRequiredTables = true;
        }
      }
    }
    
    // If required tables are missing, try to create them
    if (missingRequiredTables) {
      console.log('\nSome required tables are missing. Attempting to create tables...');
      const tablesCreated = await createTables();
      
      if (tablesCreated) {
        console.log('Tables created successfully, seeding data...');
        await seedAllData();
      }
    }
    
    // Try to run the exec_sql function
    console.log('\nChecking exec_sql function:');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        query: 'SELECT 1 as test' 
      });
      
      if (error) {
        console.log('❌ exec_sql function does not exist or is not accessible.');
        console.log('Error:', error.message);
      } else {
        console.log('✅ exec_sql function exists and is working.');
      }
    } catch (err) {
      console.log('❌ Error checking exec_sql function:', err.message);
    }
    
  } catch (error) {
    console.error('Error checking Supabase tables:', error);
  }
}

// Run the check function
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSupabaseTables();
}

export { checkSupabaseTables };