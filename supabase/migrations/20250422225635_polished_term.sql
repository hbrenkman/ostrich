/*
  # Create proposals table

  1. New Tables
    - `proposals`
      - `id` (uuid, primary key, default uuid_generate_v4())
      - `project_id` (uuid, not null, references projects)
      - `proposal_number` (varchar(50), not null)
      - `revision_number` (integer, not null, default 1)
      - `is_temporary_revision` (boolean, not null, default true)
      - `status_id` (uuid, not null)
      - `created_by` (uuid, not null)
      - `updated_by` (uuid, not null)
      - `created_at` (timestamptz, not null, default now())
      - `updated_at` (timestamptz, not null, default now())
      - `description` (text)
      - `project_data` (jsonb, not null, default '{}')
      - `contacts` (jsonb, default '[]')
  2. Security
    - Enable RLS on `proposals` table
    - Add policy for authenticated users to read all proposals
    - Add policy for admin and project_management users to insert, update, and delete proposals
*/

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_number varchar(50) NOT NULL,
  revision_number integer NOT NULL DEFAULT 1,
  is_temporary_revision boolean NOT NULL DEFAULT true,
  status_id uuid NOT NULL,
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  description text,
  project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  contacts jsonb DEFAULT '[]'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status_id ON proposals(status_id);
CREATE INDEX IF NOT EXISTS idx_proposals_proposal_number ON proposals(proposal_number);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_updated_by ON proposals(updated_by);
CREATE INDEX IF NOT EXISTS idx_proposals_contacts_gin ON proposals USING GIN(contacts);

-- Enable Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Proposals are viewable by authenticated users"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Proposals are editable by admin and project_management users"
  ON proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'project_management'
  );

CREATE POLICY "Proposals are updatable by admin and project_management users"
  ON proposals
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

CREATE POLICY "Proposals are deletable by admin users"
  ON proposals
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_proposals_updated_at') THEN
    CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add comments to explain the table's purpose and columns
COMMENT ON TABLE proposals IS 'Proposals table containing project proposals and their associated data';
COMMENT ON COLUMN proposals.id IS 'Unique identifier for the proposal';
COMMENT ON COLUMN proposals.project_id IS 'Reference to the associated project';
COMMENT ON COLUMN proposals.proposal_number IS 'Unique proposal number (max 50 characters)';
COMMENT ON COLUMN proposals.revision_number IS 'Revision number of the proposal, starting at 1';
COMMENT ON COLUMN proposals.is_temporary_revision IS 'Whether this is a temporary revision';
COMMENT ON COLUMN proposals.status_id IS 'Reference to the proposal status';
COMMENT ON COLUMN proposals.created_by IS 'User who created the proposal';
COMMENT ON COLUMN proposals.updated_by IS 'User who last updated the proposal';
COMMENT ON COLUMN proposals.created_at IS 'Timestamp when the proposal was created';
COMMENT ON COLUMN proposals.updated_at IS 'Timestamp when the proposal was last updated';
COMMENT ON COLUMN proposals.description IS 'Description of the proposal';
COMMENT ON COLUMN proposals.project_data IS 'JSON data containing project-specific information';
COMMENT ON COLUMN proposals.contacts IS 'JSON array of contacts associated with the proposal';