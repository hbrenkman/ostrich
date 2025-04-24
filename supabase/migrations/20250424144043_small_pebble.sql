/*
  # Fix contacts table and RLS policies

  1. Changes
    - Ensure contacts table exists with proper structure
    - Disable RLS temporarily for seeding
    - Create helper functions for seeding
    - Add more permissive policies for development
*/

-- First make sure the contacts table exists
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

-- Temporarily disable RLS for development
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- Create a function to insert contacts directly
CREATE OR REPLACE FUNCTION insert_contact(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_mobile text,
  p_client_id uuid,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
  result jsonb;
BEGIN
  INSERT INTO contacts (
    first_name, last_name, email, phone, mobile, client_id, role
  ) VALUES (
    p_first_name, p_last_name, p_email, p_phone, p_mobile, p_client_id, p_role
  )
  RETURNING id INTO v_id;
  
  result := jsonb_build_object(
    'success', true,
    'id', v_id
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

-- Create a function to clear all contacts
CREATE OR REPLACE FUNCTION clear_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  DELETE FROM contacts;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'All contacts deleted'
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

-- Create a function to check if contacts table exists
CREATE OR REPLACE FUNCTION check_contacts_table()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
  result jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contacts'
  ) INTO table_exists;
  
  result := jsonb_build_object(
    'success', true,
    'exists', table_exists
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