-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Contacts are viewable by authenticated users" ON contacts;
DROP POLICY IF EXISTS "Contacts are editable by admin and project_management users" ON contacts;
DROP POLICY IF EXISTS "Contacts are updatable by admin and project_management users" ON contacts;
DROP POLICY IF EXISTS "Contacts are deletable by admin users" ON contacts;

-- Create new policies
CREATE POLICY "Contacts are viewable by authenticated users"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contacts are editable by admin and project_management users"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "Contacts are updatable by admin and project_management users"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "Contacts are deletable by admin users"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin'); 