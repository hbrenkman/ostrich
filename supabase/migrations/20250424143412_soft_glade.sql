/*
  # Fix contacts table and add sample data

  1. Ensure contacts table exists
  2. Add sample contacts data
  3. Create fallback policies for public access during development
*/

-- Make sure contacts table exists
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

-- Create index on email for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);

-- Create index on client_id for faster joins if it doesn't exist
CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts(client_id);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create or replace policies with more permissive settings for development
CREATE OR REPLACE POLICY "Contacts are viewable by anyone"
  ON contacts
  FOR SELECT
  USING (true);

CREATE OR REPLACE POLICY "Contacts are insertable by anyone"
  ON contacts
  FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE POLICY "Contacts are updatable by anyone"
  ON contacts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE POLICY "Contacts are deletable by anyone"
  ON contacts
  FOR DELETE
  USING (true);

-- Create trigger to update the updated_at timestamp if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
    CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert sample contacts data if the table is empty
DO $$
DECLARE
  contact_count integer;
BEGIN
  SELECT COUNT(*) INTO contact_count FROM contacts;
  
  IF contact_count = 0 THEN
    -- Get client IDs
    DECLARE
      acme_id uuid;
      stellar_id uuid;
      global_id uuid;
    BEGIN
      SELECT id INTO acme_id FROM clients WHERE name = 'Acme Corporation' LIMIT 1;
      SELECT id INTO stellar_id FROM clients WHERE name = 'Stellar Solutions' LIMIT 1;
      SELECT id INTO global_id FROM clients WHERE name = 'Global Dynamics' LIMIT 1;
      
      -- Insert sample contacts
      IF acme_id IS NOT NULL THEN
        INSERT INTO contacts (first_name, last_name, email, phone, mobile, client_id, role)
        VALUES 
          ('John', 'Smith', 'john.smith@acme.com', '+1 (555) 123-4567', '+1 (555) 987-6543', acme_id, 'CEO'),
          ('Sarah', 'Johnson', 'sarah.johnson@acme.com', '+1 (555) 234-5678', '+1 (555) 876-5432', acme_id, 'CTO');
      END IF;
      
      IF stellar_id IS NOT NULL THEN
        INSERT INTO contacts (first_name, last_name, email, phone, mobile, client_id, role)
        VALUES 
          ('Michael', 'Brown', 'michael.brown@stellar.com', '+1 (555) 345-6789', '+1 (555) 765-4321', stellar_id, 'Project Manager');
      END IF;
      
      IF global_id IS NOT NULL THEN
        INSERT INTO contacts (first_name, last_name, email, phone, mobile, client_id, role)
        VALUES 
          ('Emily', 'Davis', 'emily.davis@globaldynamics.com', '+1 (555) 456-7890', '+1 (555) 654-3210', global_id, 'Director'),
          ('David', 'Wilson', 'david.wilson@globaldynamics.com', '+1 (555) 567-8901', '+1 (555) 543-2109', global_id, 'Engineer');
      END IF;
    END;
  END IF;
END $$;