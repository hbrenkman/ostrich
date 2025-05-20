/*
  # Create employment history table

  1. New Tables
    - `employment_history`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `effective_date` (date, not null)
      - `employment_status` (text, not null)
      - `job_title_id` (uuid, references employee_job_title)
      - `manager` (text)
      - `location` (text)
      - `work_schedule` (text)
      - `details` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `created_by` (uuid, references auth.users)
      - `updated_by` (uuid, references auth.users)
  2. Security
    - Enable RLS on `employment_history` table
    - Add policy for authenticated users to read all history
    - Add policy for admin and project_management users to insert, update, and delete history
*/

-- Create employment_history table
CREATE TABLE IF NOT EXISTS employment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  effective_date date NOT NULL,
  employment_status text NOT NULL,
  job_title_id uuid REFERENCES employee_job_title(role_id),
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
CREATE INDEX IF NOT EXISTS employment_history_employee_id_idx ON employment_history(employee_id);
CREATE INDEX IF NOT EXISTS employment_history_effective_date_idx ON employment_history(effective_date);
CREATE INDEX IF NOT EXISTS employment_history_job_title_id_idx ON employment_history(job_title_id);

-- Enable Row Level Security
ALTER TABLE employment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employment history is viewable by authenticated users"
  ON employment_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Employment history is editable by admin and project_management users"
  ON employment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'project_management'
  );

CREATE POLICY "Employment history is updatable by admin and project_management users"
  ON employment_history
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

CREATE POLICY "Employment history is deletable by admin users"
  ON employment_history
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employment_history_updated_at') THEN
    CREATE TRIGGER update_employment_history_updated_at
    BEFORE UPDATE ON employment_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 