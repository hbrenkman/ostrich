/*
  # Create project construction types table

  1. New Tables
    - `project_construction_types`
      - `id` (serial, primary key)
      - `project_type` (text, not null)
      - `definition` (text, not null)
      - `description` (text)
      - `relative_cost_index` (numeric, not null)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `project_construction_types` table
    - Add policy for authenticated users to read all construction types
    - Add policy for admin and management users to insert, update, and delete
    - Add policy for project managers to read only
*/

-- Create project_construction_types table
CREATE TABLE IF NOT EXISTS project_construction_types (
  id SERIAL PRIMARY KEY,
  project_type TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  description TEXT,
  relative_cost_index NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE project_construction_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Project construction types are viewable by authenticated users"
  ON project_construction_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project construction types are editable by admin and management users"
  ON project_construction_types
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'management')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'management')
  );

-- Insert initial data
INSERT INTO project_construction_types (project_type, definition, description, relative_cost_index) VALUES
  ('New Construction', 'Standard new building construction with typical systems and finishes.', 'Default construction type for new buildings.', 1.0),
  ('Type I - Fire Resistive', 'Construction in which the structural members, including walls, columns, beams, floors, and roofs, are of noncombustible or limited combustible materials with a high fire-resistance rating.', 'Highest level of fire protection, typically used for high-rise buildings.', 1.0),
  ('Type II - Non-Combustible', 'Construction in which the structural members, including walls, columns, beams, floors, and roofs, are of noncombustible or limited combustible materials with a moderate fire-resistance rating.', 'Common in commercial buildings, moderate fire protection.', 0.9),
  ('Type III - Ordinary', 'Construction in which the exterior walls are of noncombustible materials and the interior structural members are of any material permitted by the code.', 'Often used in mixed-use buildings, moderate fire protection.', 0.8),
  ('Type IV - Heavy Timber', 'Construction in which the exterior walls are of noncombustible materials and the interior structural members are of solid or laminated wood without concealed spaces.', 'Traditional construction method, moderate fire protection.', 0.85),
  ('Type V - Wood Frame', 'Construction in which the structural members, including walls, columns, beams, floors, and roofs, are wholly or partly of wood or other approved materials.', 'Most common for residential construction, basic fire protection.', 0.7)
ON CONFLICT (project_type) DO NOTHING; 