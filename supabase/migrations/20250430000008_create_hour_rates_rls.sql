-- Enable RLS on hour_rates table
ALTER TABLE hour_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Hour rates are viewable by authenticated users" ON hour_rates;
DROP POLICY IF EXISTS "Hour rates are editable by admin and project_management users" ON hour_rates;
DROP POLICY IF EXISTS "Hour rates are updatable by admin and project_management users" ON hour_rates;
DROP POLICY IF EXISTS "Hour rates are deletable by admin users" ON hour_rates;

-- Create policies
-- Select policy - Allow authenticated users to view all hour rates
CREATE POLICY "Hour rates are viewable by authenticated users"
  ON hour_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin and project_management users to insert hour rates
CREATE POLICY "Hour rates are editable by admin and project_management users"
  ON hour_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Update policy - Allow admin and project_management users to update hour rates
CREATE POLICY "Hour rates are updatable by admin and project_management users"
  ON hour_rates
  FOR UPDATE
  TO authenticated
  USING (
    has_role(ARRAY['admin', 'project_management'])
  )
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Delete policy - Allow only admin users to delete hour rates
CREATE POLICY "Hour rates are deletable by admin users"
  ON hour_rates
  FOR DELETE
  TO authenticated
  USING (has_role(ARRAY['admin'])); 