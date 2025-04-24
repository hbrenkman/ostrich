/*
  # Create contacts table

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `email` (text, not null)
      - `phone` (text)
      - `mobile` (text)
      - `client_id` (uuid, references clients)
      - `role` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `contacts` table
    - Add policy for authenticated users to read all contacts
    - Add policy for admin and project_management users to insert, update, and delete contacts
*/

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  mobile text,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);

-- Create index on client_id for faster joins
CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts(client_id);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Contacts are viewable by authenticated users"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contacts are editable by admin and project_management users"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'project_management'
  );

CREATE POLICY "Contacts are updatable by admin and project_management users"
  ON contacts
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

CREATE POLICY "Contacts are deletable by admin users"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
    CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;