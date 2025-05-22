-- Standardize RLS policies and has_role function across all tables
-- This migration ensures consistent role checking and policy structure

-- First, drop all policies that depend on has_role
DO $$ 
DECLARE
    r record;
BEGIN
    -- Drop all policies that use has_role
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE policyname LIKE '%admin%' 
           OR policyname LIKE '%project_management%'
           OR policyname LIKE '%authenticated%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Now we can safely drop the has_role function
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
    SELECT COALESCE(
        (auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role'),
        (auth.jwt() -> 'app_metadata' ->> 'role'),
        (auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role'),
        (auth.jwt() -> 'user_metadata' ->> 'role'),
        (auth.jwt() ->> 'role')
    ) INTO user_role;

    -- If no role is found, return false
    IF user_role IS NULL THEN
        RETURN false;
    END IF;

    RETURN user_role = ANY(required_roles);
END;
$$;

-- Function to standardize policy names
CREATE OR REPLACE FUNCTION standardize_policy_name(p_table_name text, p_policy_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use shorter policy names to avoid truncation
    RETURN CASE p_policy_type
        WHEN 'view' THEN p_table_name || '_view'
        WHEN 'insert' THEN p_table_name || '_insert'
        WHEN 'update' THEN p_table_name || '_update'
        WHEN 'delete' THEN p_table_name || '_delete'
    END;
END;
$$;

-- Function to check if policies need updating
CREATE OR REPLACE FUNCTION check_policies_need_update(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    policy_count integer;
    policy_name text;
    expected_name text;
    policy_type text;
    policy_types text[] := ARRAY['view', 'insert', 'update', 'delete'];
BEGIN
    -- Get count of existing policies for the table
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE tablename = p_table_name;

    -- If we don't have exactly 4 policies, we need an update
    IF policy_count != 4 THEN
        RETURN true;
    END IF;

    -- Check each policy type
    FOREACH policy_type IN ARRAY policy_types LOOP
        expected_name := standardize_policy_name(p_table_name, policy_type);
        
        -- Check if we have a policy that matches the expected name
        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE tablename = p_table_name
            AND policyname = expected_name
        ) THEN
            RETURN true;
        END IF;
    END LOOP;

    RETURN false;
END;
$$;

-- Function to update policies for a table
CREATE OR REPLACE FUNCTION update_table_policies(p_table_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    policy_count integer;
    policy_name text;
    needs_update boolean;
BEGIN
    -- Check if policies need updating
    SELECT check_policies_need_update(p_table_name) INTO needs_update;
    
    IF NOT needs_update THEN
        RETURN format('No update needed for table %%s - policies are already correct', p_table_name);
    END IF;

    -- Enable RLS if not already enabled
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
    
    -- Drop existing policies for this table
    FOR policy_name IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = p_table_name
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, p_table_name);
    END LOOP;
    
    -- Create new policies with standardized names
    -- SELECT policy (all authenticated users can view)
    EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)',
        standardize_policy_name(p_table_name, 'view'),
        p_table_name
    );
    
    -- INSERT policy (admin and project_management can insert)
    EXECUTE format(
        'CREATE POLICY %I ON %I FOR INSERT TO authenticated 
        WITH CHECK (has_role(ARRAY[''admin'', ''project_management'']))',
        standardize_policy_name(p_table_name, 'insert'),
        p_table_name
    );
    
    -- UPDATE policy (admin and project_management can update)
    EXECUTE format(
        'CREATE POLICY %I ON %I FOR UPDATE TO authenticated 
        USING (has_role(ARRAY[''admin'', ''project_management'']))
        WITH CHECK (has_role(ARRAY[''admin'', ''project_management'']))',
        standardize_policy_name(p_table_name, 'update'),
        p_table_name
    );
    
    -- DELETE policy (only admin can delete)
    EXECUTE format(
        'CREATE POLICY %I ON %I FOR DELETE TO authenticated 
        USING (has_role(ARRAY[''admin'']))',
        standardize_policy_name(p_table_name, 'delete'),
        p_table_name
    );

    -- Count created policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = p_table_name;

    RETURN format('Updated %%d policies for table %%s', policy_count, p_table_name);
END;
$$;

-- Update policies for all relevant tables and collect results
DO $$
DECLARE
    result text;
BEGIN
    -- Update each table and store results
    FOR result IN 
        SELECT update_table_policies('states') UNION ALL
        SELECT update_table_policies('metro_areas') UNION ALL
        SELECT update_table_policies('construction_index') UNION ALL
        SELECT update_table_policies('project_types') UNION ALL
        SELECT update_table_policies('construction_costs') UNION ALL
        SELECT update_table_policies('building_types') UNION ALL
        SELECT update_table_policies('building_categories') UNION ALL
        SELECT update_table_policies('construction_cost_types') UNION ALL
        SELECT update_table_policies('reference_tables') UNION ALL
        SELECT update_table_policies('projects') UNION ALL
        SELECT update_table_policies('fee_proposals')
    LOOP
        RAISE NOTICE '%', result;
    END LOOP;

    -- Verify all policies were created
    RAISE NOTICE 'Policy creation summary:';
    FOR result IN 
        SELECT format('Table: %%s, Policies: %%s', 
                     tablename, 
                     COUNT(*))
        FROM pg_policies 
        WHERE tablename IN (
            'states', 'metro_areas', 'construction_index', 
            'project_types', 'construction_costs', 'building_types',
            'building_categories', 'construction_cost_types',
            'reference_tables', 'projects', 'fee_proposals'
        )
        GROUP BY tablename
    LOOP
        RAISE NOTICE '%', result;
    END LOOP;
END $$;

-- Drop the helper functions
DROP FUNCTION update_table_policies(text);
DROP FUNCTION check_policies_need_update(text);
DROP FUNCTION standardize_policy_name(text, text); 