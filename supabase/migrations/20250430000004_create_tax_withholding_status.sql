/*
  # Create tax withholding status reference table

  1. New Tables
    - `tax_withholding_status_reference`
      - `status_id` (uuid, primary key)
      - `status_code` (text, not null, unique)
      - `status_name` (text, not null)
      - `description` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `tax_withholding_status_reference` table
    - Add policy for authenticated users to read all statuses
    - Add policy for admin users to insert, update, and delete statuses
*/

-- Create tax_withholding_status_reference table
CREATE TABLE IF NOT EXISTS tax_withholding_status_reference (
  status_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_code text NOT NULL UNIQUE,
  status_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS tax_withholding_status_code_idx ON tax_withholding_status_reference(status_code);
CREATE INDEX IF NOT EXISTS tax_withholding_status_name_idx ON tax_withholding_status_reference(status_name);

-- Enable Row Level Security
ALTER TABLE tax_withholding_status_reference ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Select policy - Allow authenticated users to view all statuses
CREATE POLICY "Tax withholding statuses are viewable by authenticated users"
  ON tax_withholding_status_reference
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin users to insert statuses
CREATE POLICY "Tax withholding statuses are editable by admin users"
  ON tax_withholding_status_reference
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['admin'])
  );

-- Update policy - Allow admin users to update statuses
CREATE POLICY "Tax withholding statuses are updatable by admin users"
  ON tax_withholding_status_reference
  FOR UPDATE
  TO authenticated
  USING (
    has_role(ARRAY['admin'])
  )
  WITH CHECK (
    has_role(ARRAY['admin'])
  );

-- Delete policy - Allow admin users to delete statuses
CREATE POLICY "Tax withholding statuses are deletable by admin users"
  ON tax_withholding_status_reference
  FOR DELETE
  TO authenticated
  USING (has_role(ARRAY['admin']));

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tax_withholding_status_updated_at') THEN
    CREATE TRIGGER update_tax_withholding_status_updated_at
    BEFORE UPDATE ON tax_withholding_status_reference
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert initial tax withholding statuses
INSERT INTO tax_withholding_status_reference (status_code, status_name, description) VALUES
  ('SINGLE', 'Single', 'Single filing status with standard withholding'),
  ('MARRIED', 'Married', 'Married filing jointly with standard withholding'),
  ('MARRIED_SEP', 'Married Filing Separately', 'Married filing separately with standard withholding'),
  ('HEAD', 'Head of Household', 'Head of household filing status with standard withholding'),
  ('EXEMPT', 'Exempt', 'Exempt from federal tax withholding'),
  ('NON_RESIDENT', 'Non-Resident Alien', 'Non-resident alien with special withholding requirements')
ON CONFLICT (status_code) DO NOTHING;

-- Add comments to explain the table and its columns
COMMENT ON TABLE tax_withholding_status_reference IS 'Reference table for employee tax withholding statuses';
COMMENT ON COLUMN tax_withholding_status_reference.status_code IS 'Unique code for the status (e.g., SINGLE, MARRIED)';
COMMENT ON COLUMN tax_withholding_status_reference.status_name IS 'Display name of the status';
COMMENT ON COLUMN tax_withholding_status_reference.description IS 'Detailed description of what the status means';
COMMENT ON COLUMN tax_withholding_status_reference.is_active IS 'Whether this status is currently active and available for use'; 