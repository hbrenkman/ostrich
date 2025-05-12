-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Contacts are viewable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Contacts are editable by admin and project_management users" ON contacts;
DROP POLICY IF EXISTS "Contacts are updatable by admin and project_management users" ON contacts;
DROP POLICY IF EXISTS "Contacts are deletable by admin users" ON contacts;
DROP POLICY IF EXISTS "Debug - Contacts are viewable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Debug - Contacts are editable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Debug - Contacts are updatable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Debug - Contacts are deletable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Contacts are viewable by all" ON contacts;
DROP POLICY IF EXISTS "Contacts are insertable by anyone" ON contacts;
DROP POLICY IF EXISTS "Contacts are updatable by anyone" ON contacts;
DROP POLICY IF EXISTS "Contacts are deletable by anyone" ON contacts;
DROP POLICY IF EXISTS "Contacts are editable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Contacts are updatable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Contacts are deletable by authenticated users" ON contacts;

-- Create function to log JWT claims
CREATE OR REPLACE FUNCTION log_jwt_claims()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
  jwt_user_id text;
  jwt_email text;
BEGIN
  jwt_role := auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role';
  jwt_user_id := auth.jwt() ->> 'sub';
  jwt_email := auth.jwt() ->> 'email';
  
  RAISE LOG 'JWT Claims - Role: %, User ID: %, Email: %', jwt_role, jwt_user_id, jwt_email;
  RETURN true;
END;
$$;

-- Create more permissive policies for debugging
CREATE POLICY "Debug - Contacts are viewable by authenticated users"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Debug - Contacts are editable by authenticated users"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Log the JWT claims
    (SELECT log_jwt_claims()) AND
    -- Check role in the correct path
    (auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' IN ('admin', 'project_management'))
  );

CREATE POLICY "Debug - Contacts are updatable by authenticated users"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' IN ('admin', 'project_management'))
  WITH CHECK (auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' IN ('admin', 'project_management'));

CREATE POLICY "Debug - Contacts are deletable by authenticated users"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'admin'); 