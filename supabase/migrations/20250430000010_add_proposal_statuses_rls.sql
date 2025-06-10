-- Enable RLS on proposal_statuses table
ALTER TABLE proposal_statuses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Proposal statuses are viewable by authenticated users" ON proposal_statuses;
DROP POLICY IF EXISTS "Proposal statuses are editable by admin users" ON proposal_statuses;

-- Create policies
-- Select policy - Allow authenticated users to view all proposal statuses
CREATE POLICY "Proposal statuses are viewable by authenticated users"
  ON proposal_statuses
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin users to insert proposal statuses
CREATE POLICY "Proposal statuses are editable by admin users"
  ON proposal_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['admin'])
  );

-- Update policy - Allow admin users to update proposal statuses
CREATE POLICY "Proposal statuses are updatable by admin users"
  ON proposal_statuses
  FOR UPDATE
  TO authenticated
  USING (
    has_role(ARRAY['admin'])
  )
  WITH CHECK (
    has_role(ARRAY['admin'])
  );

-- Delete policy - Allow only admin users to delete proposal statuses
CREATE POLICY "Proposal statuses are deletable by admin users"
  ON proposal_statuses
  FOR DELETE
  TO authenticated
  USING (has_role(ARRAY['admin'])); 