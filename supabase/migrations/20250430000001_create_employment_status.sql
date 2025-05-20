/*
  # Create employment_status table

  1. New Tables
    - `employment_status`
      - `id` (uuid, primary key)
      - `code` (text, not null, unique)
      - `name` (text, not null)
      - `description` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `employment_status` table
    - Add policy for authenticated users to read all statuses
    - Add policy for admin users to insert, update, and delete statuses
*/

-- Create employment_status table
CREATE TABLE IF NOT EXISTS employment_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS employment_status_code_idx ON employment_status(code);
CREATE INDEX IF NOT EXISTS employment_status_name_idx ON employment_status(name);

-- Enable Row Level Security
ALTER TABLE employment_status ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Select policy - Allow authenticated users to view all statuses
CREATE POLICY "Employment statuses are viewable by authenticated users"
  ON employment_status
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin users to insert statuses
CREATE POLICY "Employment statuses are editable by admin users"
  ON employment_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['admin'])
  );

-- Update policy - Allow admin users to update statuses
CREATE POLICY "Employment statuses are updatable by admin users"
  ON employment_status
  FOR UPDATE
  TO authenticated
  USING (
    has_role(ARRAY['admin'])
  )
  WITH CHECK (
    has_role(ARRAY['admin'])
  );

-- Delete policy - Allow admin users to delete statuses
CREATE POLICY "Employment statuses are deletable by admin users"
  ON employment_status
  FOR DELETE
  TO authenticated
  USING (has_role(ARRAY['admin']));

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employment_status_updated_at') THEN
    CREATE TRIGGER update_employment_status_updated_at
    BEFORE UPDATE ON employment_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert initial employment statuses
INSERT INTO employment_status (code, name, description) VALUES
  ('ACTIVE', 'Active', 'Employee is currently employed and working'),
  ('TERMINATED', 'Terminated', 'Employee has been terminated from employment'),
  ('RESIGNED', 'Resigned', 'Employee has voluntarily resigned'),
  ('UNPAID_LEAVE', 'Unpaid Leave', 'Employee is on unpaid leave of absence'),
  ('PAID_LEAVE', 'Paid Leave', 'Employee is on paid leave of absence'),
  ('SUSPENDED', 'Suspended', 'Employee is temporarily suspended from work'),
  ('RETIRED', 'Retired', 'Employee has retired from the company'),
  ('CONTRACT_ENDED', 'Contract Ended', 'Employee contract has ended'),
  ('PROBATION', 'Probation', 'Employee is in probationary period'),
  ('PART_TIME', 'Part Time', 'Employee works part-time hours'),
  ('FULL_TIME', 'Full Time', 'Employee works full-time hours'),
  ('CONTRACTOR', 'Contractor', 'Employee is a contractor or consultant'),
  ('INTERN', 'Intern', 'Employee is an intern or trainee'),
  ('SEASONAL', 'Seasonal', 'Employee works on a seasonal basis'),
  ('MATERNITY_LEAVE', 'Maternity Leave', 'Employee is on maternity leave'),
  ('PATERNITY_LEAVE', 'Paternity Leave', 'Employee is on paternity leave'),
  ('SICK_LEAVE', 'Sick Leave', 'Employee is on sick leave'),
  ('DISABILITY', 'Disability', 'Employee is on disability leave'),
  ('MILITARY_LEAVE', 'Military Leave', 'Employee is on military leave'),
  ('EDUCATIONAL_LEAVE', 'Educational Leave', 'Employee is on educational leave')
ON CONFLICT (code) DO NOTHING;

-- Add a comment to explain the table
COMMENT ON TABLE employment_status IS 'Reference table for employee employment statuses';
COMMENT ON COLUMN employment_status.code IS 'Unique code for the status (e.g., ACTIVE, TERMINATED)';
COMMENT ON COLUMN employment_status.name IS 'Display name of the status';
COMMENT ON COLUMN employment_status.description IS 'Detailed description of what the status means';
COMMENT ON COLUMN employment_status.is_active IS 'Whether this status is currently active and available for use'; 