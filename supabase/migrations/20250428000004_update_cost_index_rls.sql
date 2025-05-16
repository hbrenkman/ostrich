-- Update RLS policies for cost index tables to match contacts table implementation
-- This migration ensures consistent role checking and policy structure

-- Enable RLS on all tables
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_index ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for states table
DROP POLICY IF EXISTS "States are viewable by authenticated users" ON states;
DROP POLICY IF EXISTS "States are editable by admin users" ON states;
DROP POLICY IF EXISTS "States are insertable by admin users" ON states;
DROP POLICY IF EXISTS "States are updatable by admin users" ON states;
DROP POLICY IF EXISTS "States are deletable by admin users" ON states;
DROP POLICY IF EXISTS "Debug - States are viewable by authenticated users" ON states;
DROP POLICY IF EXISTS "Debug - States are editable by authenticated users" ON states;
DROP POLICY IF EXISTS "Debug - States are updatable by authenticated users" ON states;
DROP POLICY IF EXISTS "Debug - States are deletable by authenticated users" ON states;

-- Create new policies for states table
CREATE POLICY "States are viewable by authenticated users"
  ON states
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "States are editable by admin and project_management users"
  ON states
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "States are updatable by admin and project_management users"
  ON states
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "States are deletable by admin users"
  ON states
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Drop existing policies for metro_areas table
DROP POLICY IF EXISTS "Metro areas are viewable by authenticated users" ON metro_areas;
DROP POLICY IF EXISTS "Metro areas are editable by admin users" ON metro_areas;
DROP POLICY IF EXISTS "Metro areas are insertable by admin users" ON metro_areas;
DROP POLICY IF EXISTS "Metro areas are updatable by admin users" ON metro_areas;
DROP POLICY IF EXISTS "Metro areas are deletable by admin users" ON metro_areas;
DROP POLICY IF EXISTS "Debug - Metro areas are viewable by authenticated users" ON metro_areas;
DROP POLICY IF EXISTS "Debug - Metro areas are editable by authenticated users" ON metro_areas;
DROP POLICY IF EXISTS "Debug - Metro areas are updatable by authenticated users" ON metro_areas;
DROP POLICY IF EXISTS "Debug - Metro areas are deletable by authenticated users" ON metro_areas;

-- Create new policies for metro_areas table
CREATE POLICY "Metro areas are viewable by authenticated users"
  ON metro_areas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Metro areas are editable by admin and project_management users"
  ON metro_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "Metro areas are updatable by admin and project_management users"
  ON metro_areas
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "Metro areas are deletable by admin users"
  ON metro_areas
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Drop existing policies for construction_index table
DROP POLICY IF EXISTS "Construction index is viewable by authenticated users" ON construction_index;
DROP POLICY IF EXISTS "Construction index is editable by admin users" ON construction_index;
DROP POLICY IF EXISTS "Construction index is insertable by admin users" ON construction_index;
DROP POLICY IF EXISTS "Construction index is updatable by admin users" ON construction_index;
DROP POLICY IF EXISTS "Construction index is deletable by admin users" ON construction_index;
DROP POLICY IF EXISTS "Debug - Construction index is viewable by authenticated users" ON construction_index;
DROP POLICY IF EXISTS "Debug - Construction index is editable by authenticated users" ON construction_index;
DROP POLICY IF EXISTS "Debug - Construction index is updatable by authenticated users" ON construction_index;
DROP POLICY IF EXISTS "Debug - Construction index is deletable by authenticated users" ON construction_index;

-- Create new policies for construction_index table
CREATE POLICY "Construction index is viewable by authenticated users"
  ON construction_index
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Construction index is editable by admin and project_management users"
  ON construction_index
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "Construction index is updatable by admin and project_management users"
  ON construction_index
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  );

CREATE POLICY "Construction index is deletable by admin users"
  ON construction_index
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin'); 