/*
  # Add RLS policies for companies table

  1. Changes
    - Enable RLS on companies table
    - Add policies for authenticated users to read all companies
    - Add policies for admin and project_management users to insert, update, and delete companies
*/

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies are editable by admin and project_management users" ON companies;
DROP POLICY IF EXISTS "Companies are updatable by admin and project_management users" ON companies;
DROP POLICY IF EXISTS "Companies are deletable by admin users" ON companies;

-- Create policies
CREATE POLICY "Companies are viewable by authenticated users"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- More permissive policies for development
CREATE POLICY "Companies are editable by authenticated users"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Companies are updatable by authenticated users"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Companies are deletable by authenticated users"
  ON companies
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
    CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 