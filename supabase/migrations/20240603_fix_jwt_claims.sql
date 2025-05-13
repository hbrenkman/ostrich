-- Create a safe JWT role check function that works with both claim paths
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_value text;
BEGIN
    -- Try the new path first (app_metadata.claims.role)
    BEGIN
        role_value := (jwt() -> 'app_metadata' -> 'claims' ->> 'role');
    EXCEPTION WHEN OTHERS THEN
        role_value := NULL;
    END;

    -- If that didn't work, try the old path (direct role)
    IF role_value IS NULL THEN
        BEGIN
            role_value := (jwt() ->> 'role');
        EXCEPTION WHEN OTHERS THEN
            role_value := NULL;
        END;
    END IF;

    -- If that didn't work, try auth.jwt()
    IF role_value IS NULL THEN
        BEGIN
            role_value := (auth.jwt() ->> 'role');
        EXCEPTION WHEN OTHERS THEN
            role_value := NULL;
        END;
    END IF;

    RETURN role_value;
END;
$$;

-- Create a function to check if user has required role
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    user_role := get_user_role();
    RETURN user_role = ANY(required_roles);
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Companies are editable by admin and project_management users" ON companies;
DROP POLICY IF EXISTS "Companies are updatable by admin and project_management users" ON companies;
DROP POLICY IF EXISTS "Companies are deletable by admin users" ON companies;
DROP POLICY IF EXISTS "Debug - Contacts are editable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Debug - Contacts are updatable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Debug - Contacts are deletable by authenticated users" ON contacts;

-- Create new policies using the new function
CREATE POLICY "Companies are editable by admin and project_management users"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Companies are updatable by admin and project_management users"
ON companies
FOR UPDATE
TO authenticated
USING (has_role(ARRAY['admin', 'project_management']))
WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Companies are deletable by admin users"
ON companies
FOR DELETE
TO authenticated
USING (has_role(ARRAY['admin']));

-- Create new contact policies
CREATE POLICY "Debug - Contacts are editable by authenticated users"
ON contacts
FOR INSERT
TO authenticated
WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Debug - Contacts are updatable by authenticated users"
ON contacts
FOR UPDATE
TO authenticated
USING (has_role(ARRAY['admin', 'project_management']))
WITH CHECK (has_role(ARRAY['admin', 'project_management']));

CREATE POLICY "Debug - Contacts are deletable by authenticated users"
ON contacts
FOR DELETE
TO authenticated
USING (has_role(ARRAY['admin']));

-- Add a function to log JWT claims for debugging (but make it optional)
CREATE OR REPLACE FUNCTION log_jwt_claims()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only log in development environment
    IF current_setting('app.settings.environment', true) = 'development' THEN
        RAISE LOG 'JWT Claims: %', jwt();
        RAISE LOG 'User Role: %', get_user_role();
    END IF;
    RETURN true;
END;
$$; 