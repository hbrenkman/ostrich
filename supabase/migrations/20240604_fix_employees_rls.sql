-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Employees are viewable by authenticated users" ON employees;
DROP POLICY IF EXISTS "Employees are editable by admin and project_management users" ON employees;
DROP POLICY IF EXISTS "Employees are updatable by admin and project_management users" ON employees;
DROP POLICY IF EXISTS "Employees are deletable by admin users" ON employees;

-- Create a function to check for role in multiple JWT paths
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

-- Create policies
-- Select policy - Allow authenticated users to view all employees
CREATE POLICY "Employees are viewable by authenticated users"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin and project_management users to insert employees
CREATE POLICY "Employees are editable by admin and project_management users"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Update policy - Allow admin and project_management users to update employees
CREATE POLICY "Employees are updatable by admin and project_management users"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    has_role(ARRAY['admin', 'project_management'])
  )
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Delete policy - Allow only admin users to delete employees
CREATE POLICY "Employees are deletable by admin users"
  ON employees
  FOR DELETE
  TO authenticated
  USING (has_role(ARRAY['admin'])); 