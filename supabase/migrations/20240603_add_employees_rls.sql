-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Employees are viewable by authenticated users" ON employees;
DROP POLICY IF EXISTS "Employees are editable by admin and project_management users" ON employees;
DROP POLICY IF EXISTS "Employees are updatable by admin and project_management users" ON employees;
DROP POLICY IF EXISTS "Employees are deletable by admin users" ON employees;

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
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

-- Update policy - Allow admin and project_management users to update employees
CREATE POLICY "Employees are updatable by admin and project_management users"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

-- Delete policy - Allow only admin users to delete employees
CREATE POLICY "Employees are deletable by admin users"
  ON employees
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin'); 