/*
  # Update RLS policies for specific tables to match contacts table structure

  1. Changes
    - Update RLS policies for specific tables to use has_role function
    - Create separate policies for SELECT, INSERT, UPDATE, DELETE operations
    - Allow SELECT for all authenticated users
    - Allow INSERT/UPDATE for admin and project_management roles
    - Allow DELETE for admin role only

  2. Tables being updated:
    - project_types
    - construction_costs
    - building_types
    - building_categories
    - construction_cost_types
    - states
    - metro_areas
    - construction_index
    - reference_tables
    - projects
    - fee_proposals
*/

-- First, ensure the has_role function exists
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    -- Try the new path first (app_metadata.claims.role)
    BEGIN
        user_role := (jwt() -> 'app_metadata' -> 'claims' ->> 'role');
    EXCEPTION WHEN OTHERS THEN
        user_role := NULL;
    END;

    -- If that didn't work, try the old path (direct role)
    IF user_role IS NULL THEN
        BEGIN
            user_role := (jwt() ->> 'role');
        EXCEPTION WHEN OTHERS THEN
            user_role := NULL;
        END;
    END IF;

    -- If that didn't work, try auth.jwt()
    IF user_role IS NULL THEN
        BEGIN
            user_role := (auth.jwt() ->> 'role');
        EXCEPTION WHEN OTHERS THEN
            user_role := NULL;
        END;
    END IF;

    RETURN user_role = ANY(required_roles);
END;
$$;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    );
END;
$$;

-- Function to update policies for a table
CREATE OR REPLACE FUNCTION update_table_policies(p_table_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_table_exists boolean;
    v_policy_count integer;
BEGIN
    -- Check if table exists
    v_table_exists := table_exists(p_table_name);
    IF NOT v_table_exists THEN
        RETURN format('Table %s does not exist, skipping policy updates', p_table_name);
    END IF;

    -- Enable RLS if not already enabled
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
    
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are viewable by authenticated users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are editable by authenticated users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are updatable by authenticated users" ON %I', p_table_name, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Debug - %s are deletable by authenticated users" ON %I', p_table_name, p_table_name);
    
    -- Create new policies
    -- SELECT policy
    EXECUTE format(
        'CREATE POLICY "Debug - %s are viewable by authenticated users"
        ON %I FOR SELECT TO authenticated USING (true)',
        p_table_name, p_table_name
    );
    
    -- INSERT policy
    EXECUTE format(
        'CREATE POLICY "Debug - %s are editable by authenticated users"
        ON %I FOR INSERT TO authenticated WITH CHECK (has_role(ARRAY[''admin'', ''project_management'']))',
        p_table_name, p_table_name
    );
    
    -- UPDATE policy
    EXECUTE format(
        'CREATE POLICY "Debug - %s are updatable by authenticated users"
        ON %I FOR UPDATE TO authenticated 
        USING (has_role(ARRAY[''admin'', ''project_management'']))
        WITH CHECK (has_role(ARRAY[''admin'', ''project_management'']))',
        p_table_name, p_table_name
    );
    
    -- DELETE policy
    EXECUTE format(
        'CREATE POLICY "Debug - %s are deletable by authenticated users"
        ON %I FOR DELETE TO authenticated USING (has_role(ARRAY[''admin'']))',
        p_table_name, p_table_name
    );

    -- Count the number of policies created
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = p_table_name;

    RETURN format('Successfully updated policies for table %s. Created %s policies.', p_table_name, v_policy_count);
END;
$$;

-- Update policies for specific tables only and show results
SELECT update_table_policies('project_types') as result;
SELECT update_table_policies('construction_costs') as result;
SELECT update_table_policies('building_types') as result;
SELECT update_table_policies('building_categories') as result;
SELECT update_table_policies('construction_cost_types') as result;
SELECT update_table_policies('states') as result;
SELECT update_table_policies('metro_areas') as result;
SELECT update_table_policies('construction_index') as result;
SELECT update_table_policies('reference_tables') as result;
SELECT update_table_policies('projects') as result;
SELECT update_table_policies('fee_proposals') as result;

-- Drop the helper functions
DROP FUNCTION update_table_policies(text);
DROP FUNCTION table_exists(text); 