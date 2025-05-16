-- Standardize RLS policies and has_role function across all tables
-- This migration ensures consistent role checking and policy structure

-- Drop all existing has_role functions to avoid conflicts
DROP FUNCTION IF EXISTS has_role(text[]);
DROP FUNCTION IF EXISTS has_role(text[], text);

-- Create a single, standardized has_role function
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    -- Check all possible JWT claim paths for the role
    user_role := COALESCE(
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() ->> 'role'
    );

    -- If no role is found, return false
    IF user_role IS NULL THEN
        RETURN false;
    END IF;

    RETURN user_role = ANY(required_roles);
END;
$$;

-- Function to update policies for a table
CREATE OR REPLACE FUNCTION update_table_policies(p_table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Enable RLS if not already enabled
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
    
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "%s are viewable by authenticated users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s are editable by admin users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s are insertable by admin users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s are updatable by admin users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s are deletable by admin users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are viewable by authenticated users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are editable by authenticated users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are updatable by authenticated users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are deletable by authenticated users" ON %I', p_table_name, p_table_name);
    
    -- Create new policies
    -- SELECT policy (all authenticated users can view)
    EXECUTE format(
        'CREATE POLICY "%s are viewable by authenticated users"
        ON %I FOR SELECT TO authenticated USING (true)',
        p_table_name, p_table_name
    );
    
    -- INSERT policy (admin and project_management can insert)
    EXECUTE format(
        'CREATE POLICY "%s are insertable by admin and project_management users"
        ON %I FOR INSERT TO authenticated 
        WITH CHECK (has_role(ARRAY[''admin'', ''project_management'']))',
        p_table_name, p_table_name
    );
    
    -- UPDATE policy (admin and project_management can update)
    EXECUTE format(
        'CREATE POLICY "%s are updatable by admin and project_management users"
        ON %I FOR UPDATE TO authenticated 
        USING (has_role(ARRAY[''admin'', ''project_management'']))
        WITH CHECK (has_role(ARRAY[''admin'', ''project_management'']))',
        p_table_name, p_table_name
    );
    
    -- DELETE policy (only admin can delete)
    EXECUTE format(
        'CREATE POLICY "%s are deletable by admin users"
        ON %I FOR DELETE TO authenticated 
        USING (has_role(ARRAY[''admin'']))',
        p_table_name, p_table_name
    );
END;
$$;

-- Update policies for all relevant tables
SELECT update_table_policies('states');
SELECT update_table_policies('metro_areas');
SELECT update_table_policies('construction_index');
SELECT update_table_policies('project_types');
SELECT update_table_policies('construction_costs');
SELECT update_table_policies('building_types');
SELECT update_table_policies('building_categories');
SELECT update_table_policies('construction_cost_types');
SELECT update_table_policies('reference_tables');
SELECT update_table_policies('projects');
SELECT update_table_policies('fee_proposals');

-- Drop the helper function
DROP FUNCTION update_table_policies(text); 