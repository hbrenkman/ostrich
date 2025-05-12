-- Drop existing policies
DROP POLICY IF EXISTS "Companies are deletable by admin users" ON companies;
DROP POLICY IF EXISTS "Companies are editable by admin and project_management users" ON companies;
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are updatable by admin and project_management users" ON companies;

-- Create new policies matching contacts structure
CREATE POLICY "Companies are deletable by admin users"
ON companies FOR DELETE
TO authenticated
USING ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Companies are editable by admin and project_management users"
ON companies FOR INSERT
TO authenticated
WITH CHECK ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text]));

CREATE POLICY "Companies are viewable by authenticated users"
ON companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Companies are updatable by admin and project_management users"
ON companies FOR UPDATE
TO authenticated
USING ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text]))
WITH CHECK ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text]));

-- Add logging function if it doesn't exist (matching contacts)
CREATE OR REPLACE FUNCTION log_jwt_claims()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE LOG 'JWT Claims: %', (jwt() -> 'app_metadata' -> 'claims');
  RETURN true;
END;
$$; 