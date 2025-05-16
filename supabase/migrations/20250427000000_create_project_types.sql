/*
  # Create project types table

  1. New Tables
    - `project_types`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `code` (text, not null, unique)
      - `description` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `project_types` table
    - Add policy for authenticated users to read all project types
    - Add policy for admin users to insert, update, and delete project types
*/

-- Create project_types table
CREATE TABLE IF NOT EXISTS project_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS project_types_code_idx ON project_types(code);

-- Enable Row Level Security
ALTER TABLE project_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Project types are viewable by authenticated users"
  ON project_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project types are editable by admin users"
  ON project_types
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Project types are updatable by admin users"
  ON project_types
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Project types are deletable by admin users"
  ON project_types
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_types_updated_at') THEN
    CREATE TRIGGER update_project_types_updated_at
    BEFORE UPDATE ON project_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert initial project types
INSERT INTO project_types (name, code, description) VALUES
  ('Architectural Design', 'ARCH', 'Full architectural design services including plans, specifications, and construction documents'),
  ('Interior Design', 'INT', 'Interior design services including space planning, finishes, and furniture selection'),
  ('Construction Administration', 'CA', 'Construction phase services including site visits, RFIs, and change orders'),
  ('Feasibility Study', 'FEAS', 'Initial project assessment including site analysis and preliminary cost estimates'),
  ('Master Planning', 'MP', 'Long-term planning for multiple buildings or campus development'),
  ('Renovation', 'REN', 'Renovation and remodeling of existing buildings'),
  ('Historic Preservation', 'HP', 'Preservation and restoration of historic buildings'),
  ('Sustainable Design', 'SD', 'Green building and sustainable design services'),
  ('Code Review', 'CODE', 'Building code analysis and compliance review'),
  ('Accessibility Review', 'ADA', 'ADA and accessibility compliance review')
ON CONFLICT (code) DO NOTHING; 