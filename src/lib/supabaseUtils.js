// src/lib/supabaseUtils.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables for server-side scripts
if (typeof window === 'undefined') {
  dotenv.config();
}

// Determine if we're on the client or server
const isClient = typeof window !== 'undefined';

// Get Supabase credentials
let supabaseUrl = isClient
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

let supabaseKey = isClient
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('No valid Supabase credentials found. Using environment variables from .env file.');
  supabaseUrl = 'https://wzwklwuslejfzktcdpjy.supabase.co';
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d2tsd3VzbGVqZnprdGNkcGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMTk0MDksImV4cCI6MjA1OTY5NTQwOX0.kPGnGvpsE64OxRAynmC2Mms6s-gS-FQxpGit0RtRZq4';
}

// Create a single Supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Admin client for migrations (server-side only)
let supabaseAdmin = null;
if (!isClient) {
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d2tsd3VzbGVqZnprdGNkcGp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDExOTQwOSwiZXhwIjoyMDU5Njk1NDA5fQ.60_9NeBCPAWko3ZXSQxxMjXiyBgswE-G-WNwSGjSoXo';
  if (supabaseAdminKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } else {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set, admin operations will not be available');
  }
}

export { supabaseAdmin };

/**
 * Fetch data from a Supabase table with optional query parameters.
 * @param {string} tableName - The name of the table to query
 * @param {Object} queryParams - Optional query parameters
 * @returns {Promise<Object>} - The query result
 */
export async function fetchData(tableName, queryParams = {}) {
  try {
    let query = supabase.from(tableName).select('*');
    console.log(`Fetching data from table: ${tableName}`);
    
    // Apply query parameters if provided
    if (queryParams.filter) {
      for (const filter of queryParams.filter) {
        const { column, operator = 'eq', value } = filter;
        if (column && value !== undefined) {
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            case 'gt':
              query = query.gt(column, value);
              break;
            case 'lt':
              query = query.lt(column, value);
              break;
            case 'gte':
              query = query.gte(column, value);
              break;
            case 'lte':
              query = query.lte(column, value);
              break;
            case 'like':
              query = query.like(column, `%${value}%`);
              break;
          }
        }
      }
    }
    
    if (queryParams.order) {
      for (const order of queryParams.order) {
        const { column, ascending = true } = order;
        if (column) {
          query = query.order(column, { ascending });
        }
      }
    }
    
    if (queryParams.limit) {
      query = query.limit(queryParams.limit);
    }
    
    if (queryParams.offset) {
      query = query.offset(queryParams.offset);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`Successfully fetched ${data?.length || 0} records from ${tableName}`);
    return { status: 'success', data };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Insert data into a Supabase table.
 * @param {string} tableName - The name of the table
 * @param {Object} data - The data to insert
 * @returns {Promise<Object>} - The insert result
 */
export async function insertData(tableName, data) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) {
      console.error(`Error inserting data into ${tableName}:`, error);
      
      // Try again with upsert as a fallback
      console.log(`Trying upsert as fallback for ${tableName}`);
      const { data: upsertResult, error: upsertError } = await supabase
      .from(tableName)
      .insert(data)
      .upsert()
      .select();
      
      if (upsertError) throw upsertError;
      return { status: 'success', data: upsertResult };
    }
    
    console.log(`Successfully inserted data into ${tableName}`);
    return { status: 'success', data: result };
  } catch (error) {
    console.error('Error inserting data:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Update data in a Supabase table.
 * @param {string} tableName - The name of the table
 * @param {string} idColumn - The column name for the identifier
 * @param {string} idValue - The value of the identifier
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The update result
 */
export async function updateData(tableName, idColumn, idValue, data) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq(idColumn, idValue)
      .select();
    
    if (error) {
      console.error(`Error updating data in ${tableName}:`, error);
      
      // Try again with upsert as a fallback
      console.log(`Trying upsert as fallback for ${tableName}`);
      const { data: upsertResult, error: upsertError } = await supabase
      .from(tableName)
      .update(data)
      .eq(idColumn, idValue)
      .upsert()
      .select();
      
      if (upsertError) throw upsertError;
      return { status: 'success', data: upsertResult };
    }
    
    console.log(`Successfully updated data in ${tableName}`);
    return { status: 'success', data: result };
  } catch (error) {
    console.error('Error updating data:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Delete data from a Supabase table.
 * @param {string} tableName - The name of the table
 * @param {string} idColumn - The column name for the identifier
 * @param {string} idValue - The value of the identifier
 * @returns {Promise<Object>} - The delete result
 */
export async function deleteData(tableName, idColumn, idValue) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumn, idValue);
    
    if (error) {
      console.error(`Error deleting data from ${tableName}:`, error);
      
      // Try again with a different approach as a fallback
      console.log(`Trying alternative delete approach for ${tableName}`);
      const { data: altResult, error: altError } = await supabase.rpc('exec_sql', {
        query: `DELETE FROM ${tableName} WHERE ${idColumn} = '${idValue}'`
      });
      
      if (altError) throw altError;
      return { status: 'success', data: altResult };
    }
    
    console.log(`Successfully deleted data from ${tableName}`);
    return { status: 'success', data };
  } catch (error) {
    console.error('Error deleting data:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Execute a raw SQL query with fallbacks.
 * @param {string} query - The SQL query to execute
 * @returns {Promise<Object>} - The query result
 */
export async function executeSQL(query) {
  try {
    // First try using the admin client (server-side only)
    if (supabaseAdmin) {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('execute_sql', { sql: query });
      if (rpcError) {
        console.error('Error executing SQL via RPC (admin):', rpcError);
        throw rpcError;
      }
      return { status: 'success', data: rpcData };
    }

    // Fallback to regular client RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('execute_sql', { sql: query });
    if (rpcError) {
      console.error('Error executing SQL via RPC:', rpcError);
      throw rpcError;
    }

    return { status: 'success', data: rpcData };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Check if a table exists in the database.
 * @param {string} tableName - The name of the table to check
 * @returns {Promise<boolean>} - Whether the table exists
 */
export async function tableExists(tableName) {
  try {
    // Try direct SQL first
    const { data: sqlData, error: sqlError } = await supabase.sql(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = '${tableName}'
      )
    `);
    
    if (!sqlError && sqlData) {
      return { exists: true, error: null };
    }
    
    // Fall back to regular query
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    return { exists: !error, error };
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return { exists: false, error };
  }
}