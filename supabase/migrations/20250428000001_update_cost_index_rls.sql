-- Update RLS policies for cost index tables to use comprehensive role checking
-- This migration updates the policies for states, metro_areas, and construction_index tables

-- First, create the has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
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

-- Update states table policies
DROP POLICY IF EXISTS "States are viewable by authenticated users" ON states;
DROP POLICY IF EXISTS "States are editable by admin users" ON states;

CREATE POLICY "States are viewable by authenticated users"
    ON states FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "States are insertable by admin users"
    ON states FOR INSERT
    TO authenticated
    WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "States are updatable by admin users"
    ON states FOR UPDATE
    TO authenticated
    USING (has_role(ARRAY['admin', 'project_management']))
    WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "States are deletable by admin users"
    ON states FOR DELETE
    TO authenticated
    USING (has_role(ARRAY['admin']));

-- Update metro_areas table policies
DROP POLICY IF EXISTS "Metro areas are viewable by authenticated users" ON metro_areas;
DROP POLICY IF EXISTS "Metro areas are editable by admin users" ON metro_areas;

CREATE POLICY "Metro areas are viewable by authenticated users"
    ON metro_areas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Metro areas are insertable by admin users"
    ON metro_areas FOR INSERT
    TO authenticated
    WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Metro areas are updatable by admin users"
    ON metro_areas FOR UPDATE
    TO authenticated
    USING (has_role(ARRAY['admin', 'project_management']))
    WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Metro areas are deletable by admin users"
    ON metro_areas FOR DELETE
    TO authenticated
    USING (has_role(ARRAY['admin']));

-- Update construction_index table policies
DROP POLICY IF EXISTS "Construction index is viewable by authenticated users" ON construction_index;
DROP POLICY IF EXISTS "Construction index is editable by admin users" ON construction_index;

CREATE POLICY "Construction index is viewable by authenticated users"
    ON construction_index FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Construction index is insertable by admin users"
    ON construction_index FOR INSERT
    TO authenticated
    WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Construction index is updatable by admin users"
    ON construction_index FOR UPDATE
    TO authenticated
    USING (has_role(ARRAY['admin', 'project_management']))
    WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Construction index is deletable by admin users"
    ON construction_index FOR DELETE
    TO authenticated
    USING (has_role(ARRAY['admin'])); 