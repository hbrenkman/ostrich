/*
  # Create fee proposals table

  1. New Tables
    - `fee_proposals`
      - `id` (uuid, primary key)
      - `number` (text, not null, unique)
      - `project_id` (uuid, references projects)
      - `overview` (text)
      - `design_budget` (numeric, not null)
      - `construction_support_budget` (numeric, not null)
      - `status` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `fee_proposals` table
    - Add policy for authenticated users to read all fee proposals
    - Add policy for admin and project_management users to insert, update, and delete fee proposals
*/

-- Create fee_proposals table
CREATE TABLE IF NOT EXISTS fee_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  overview text,
  design_budget numeric NOT NULL,
  construction_support_budget numeric NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE fee_proposals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Fee proposals are viewable by authenticated users"
  ON fee_proposals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Fee proposals are editable by admin and project_management users"
  ON fee_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'project_management'
  );

CREATE POLICY "Fee proposals are updatable by admin and project_management users"
  ON fee_proposals
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

CREATE POLICY "Fee proposals are deletable by admin users"
  ON fee_proposals
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fee_proposals_updated_at') THEN
    CREATE TRIGGER update_fee_proposals_updated_at
    BEFORE UPDATE ON fee_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;