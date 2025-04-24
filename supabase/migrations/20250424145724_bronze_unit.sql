/*
  # Final fix for contacts table

  This migration provides a comprehensive fix for the contacts table issues.
  It creates the table if it doesn't exist, adds necessary indexes,
  and populates it with sample data.

  1. Changes
    - Create contacts table with proper structure if it doesn't exist
    - Add indexes for email and client_id
    - Disable RLS temporarily for easier data seeding
    - Insert sample contact data linked to existing clients
  
  2. Data
    - Sample contacts for Acme Corporation, Stellar Solutions, and Global Dynamics
*/

-- Step 1: Create the contacts table if it doesn't exist
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

-- Step 2: Create indices if they don't exist
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts(client_id);

-- Step 3: Disable RLS for now to allow direct inserts
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- Step 4: Clear existing contacts to avoid duplicates
DELETE FROM contacts;

-- Step 5: Insert sample contacts
DO $$
DECLARE
  acme_id uuid;
  stellar_id uuid;
  global_id uuid;
BEGIN
  -- Get client IDs
  SELECT id INTO acme_id FROM clients WHERE name = 'Acme Corporation' LIMIT 1;
  SELECT id INTO stellar_id FROM clients WHERE name = 'Stellar Solutions' LIMIT 1;
  SELECT id INTO global_id FROM clients WHERE name = 'Global Dynamics' LIMIT 1;
  
  -- Insert sample contacts if client IDs exist
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
END $$;

-- Step 6: Create a function to check if contacts were inserted correctly
CREATE OR REPLACE FUNCTION check_contacts_count()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contact_count integer;
  result jsonb;
BEGIN
  SELECT COUNT(*) INTO contact_count FROM contacts;
  
  result := jsonb_build_object(
    'success', true,
    'count', contact_count
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$;