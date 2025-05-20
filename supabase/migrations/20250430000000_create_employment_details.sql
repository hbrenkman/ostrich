/*
  # Create employment_details table

  1. Drop existing table if it exists
  2. New Tables
    - `employment_details`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `effective_date` (date, not null)
      - `employment_status` (text, not null)
      - `job_title_id` (integer, references employee_job_title)
      - `manager` (text)
      - `location` (text)
      - `work_schedule` (text)
      - `details` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `created_by` (uuid, references auth.users)
      - `updated_by` (uuid, references auth.users)
  3. Security
    - Enable RLS on `employment_details` table
    - Add policy for authenticated users to read all details
    - Add policy for admin and project_management users to insert, update, and delete details
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS employment_details CASCADE;

-- Create employment_details table
CREATE TABLE employment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  effective_date date NOT NULL,
  employment_status text NOT NULL,
  job_title_id integer REFERENCES employee_job_title(role_id),
  manager text,
  location text,
  work_schedule text,
  details text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create indexes for faster lookups
CREATE INDEX employment_details_employee_id_idx ON employment_details(employee_id);
CREATE INDEX employment_details_effective_date_idx ON employment_details(effective_date);
CREATE INDEX employment_details_job_title_id_idx ON employment_details(job_title_id);

-- Enable Row Level Security
ALTER TABLE employment_details ENABLE ROW LEVEL SECURITY;

-- Create a function to check for role in multiple JWT paths
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    -- Check all possible JWT claim paths for the role
    user_role := COALESCE(
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() ->> 'role'
    );

    -- If no role is found, return false
    IF user_role IS NULL THEN
        RETURN false;
    END IF;

    RETURN user_role = ANY(required_roles);
END;
$$;

-- Create policies
-- Select policy - Allow authenticated users to view all employment details
CREATE POLICY "Employment details are viewable by authenticated users"
  ON employment_details
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin and project_management users to insert employment details
CREATE POLICY "Employment details are editable by admin and project_management users"
  ON employment_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Update policy - Allow admin and project_management users to update employment details
CREATE POLICY "Employment details are updatable by admin and project_management users"
  ON employment_details
  FOR UPDATE
  TO authenticated
  USING (
    has_role(ARRAY['admin', 'project_management'])
  )
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Delete policy - Allow only admin users to delete employment details
CREATE POLICY "Employment details are deletable by admin users"
  ON employment_details
  FOR DELETE
  TO authenticated
  USING (has_role(ARRAY['admin']));

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employment_details_updated_at') THEN
    CREATE TRIGGER update_employment_details_updated_at
    BEFORE UPDATE ON employment_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 