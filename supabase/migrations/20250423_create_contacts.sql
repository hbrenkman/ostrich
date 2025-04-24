-- Create the contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('viewer', 'editor', 'admin', 'project_management')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read contacts
CREATE POLICY "Allow authenticated users to read contacts" ON contacts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Allow admins and project_management to edit contacts
CREATE POLICY "Allow admins to edit contacts" ON contacts
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'project_management'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'project_management'));