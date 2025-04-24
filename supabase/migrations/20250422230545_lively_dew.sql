/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `type` (text, not null)
      - `status` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `clients` table
    - Add policy for authenticated users to read all clients
    - Add policy for admin and project_management users to insert, update, and delete clients
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Clients are viewable by authenticated users"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients are editable by admin and project_management users"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'project_management'
  );

CREATE POLICY "Clients are updatable by admin and project_management users"
  ON clients
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

CREATE POLICY "Clients are deletable by admin users"
  ON clients
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
    CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add foreign key constraint to projects table for client_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_client_id_fkey'
  ) THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE SET NULL;
  END IF;
END $$;