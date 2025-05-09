import { supabaseAdmin } from './supabase';
import { supabase } from './supabase';

export async function getTablePolicies(tableName: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_table_policies', {
      table_name: tableName
    });

    if (error) {
      console.error('Error fetching policies:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error:', err);
    return null;
  }
}

export async function checkCompanyPolicies() {
  try {
    // First, check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.error('Error checking RLS:', rlsError);
      return null;
    }

    // Then, try to get the policies
    const { data: policyData, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'companies');

    if (policyError) {
      console.error('Error fetching policies:', policyError);
      return null;
    }

    return {
      rlsEnabled: rlsData !== null,
      policies: policyData
    };
  } catch (err) {
    console.error('Error:', err);
    return null;
  }
}

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // First try a simple health check
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    console.log('Health check response:', response.status, response.statusText);
    
    // Then try a simple query
    const { data, error } = await supabase
      .from('industries')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('Query error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error('Connection test error:', err);
    return {
      success: false,
      error: err.message,
      details: err
    };
  }
} 