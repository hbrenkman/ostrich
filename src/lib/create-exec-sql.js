import { supabaseAdmin } from './supabaseUtils.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Create the exec_sql function in Supabase.
 * @returns {Promise<boolean>} - Whether the function was created successfully
 */
async function createExecSqlFunction() {
  try {
    console.log('Creating exec_sql function...');
    console.log('Supabase URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.substring(0, 10) + '...');
    
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return false;
    }
    
    // Read the SQL file
    let sql;
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_exec_sql_function.sql');
    
    try {
      sql = fs.readFileSync(sqlPath, 'utf8');
    } catch (err) {
      console.log('SQL file not found, using inline SQL');
      sql = `
      CREATE OR REPLACE FUNCTION exec_sql(query text)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        EXECUTE query;
        result := '{"success": true}'::jsonb;
        RETURN result;
      END;
      $$;
      `;
    }
    
    // Try to execute the SQL directly
    console.log('Executing SQL directly...');
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { query: sql });
    
    if (sqlError) {
      console.error('Error executing SQL directly:', sqlError);
      
      // Try with a simpler SQL statement
      console.log('Trying with a simpler SQL statement...');
      const simpleSql = `
      CREATE OR REPLACE FUNCTION exec_sql(query text)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        EXECUTE query;
        result := '{"success": true}'::jsonb;
        RETURN result;
      END;
      $$;
      `;
      
      const { error: simpleError } = await supabaseAdmin.rpc('exec_sql', { query: simpleSql });
      
      if (simpleError) {
        console.error('Error with simpler SQL:', simpleError);
        return false;
      } else {
        console.log('exec_sql function created successfully with simpler SQL.');
        return true;
      }
    } else {
      console.log('exec_sql function created successfully.');
      return true;
    }
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  createExecSqlFunction()
    .then(success => {
      console.log(`exec_sql function creation ${success ? 'succeeded' : 'failed'}.`);
      if (!success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

export { createExecSqlFunction };