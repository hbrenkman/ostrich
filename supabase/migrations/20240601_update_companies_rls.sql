-- Enable RLS on companies table if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are editable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are updatable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are deletable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are editable by admin and project_management users" ON companies;
DROP POLICY IF EXISTS "Companies are updatable by admin and project_management users" ON companies;
DROP POLICY IF EXISTS "Companies are deletable by admin users" ON companies;

-- Create new policies

-- Select policy - Allow authenticated users to view all companies
CREATE POLICY "Companies are viewable by authenticated users"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin and project_management users to insert companies
CREATE POLICY "Companies are editable by admin and project_management users"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'project_management'
  );

-- Update policy - Allow admin and project_management users to update companies
CREATE POLICY "Companies are updatable by admin and project_management users"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'project_management'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'project_management'
  );

-- Delete policy - Allow only admin users to delete companies
CREATE POLICY "Companies are deletable by admin users"
  ON companies
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin'); 