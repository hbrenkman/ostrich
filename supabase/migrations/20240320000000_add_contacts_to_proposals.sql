-- Remove the old contact_id column
ALTER TABLE proposals DROP COLUMN IF EXISTS contact_id;

-- Add the contacts JSONB array column
ALTER TABLE proposals ADD COLUMN contacts JSONB DEFAULT '[]'::jsonb;

-- Add a GIN index for searching contacts
CREATE INDEX IF NOT EXISTS idx_proposals_contacts_gin ON proposals USING GIN (contacts);

-- Add a function to search contacts with company and location relationships
CREATE OR REPLACE FUNCTION search_proposal_contacts(search_query TEXT)
RETURNS TABLE (
  id UUID,
  proposal_number TEXT,
  contacts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.proposal_number,
    p.contacts
  FROM proposals p
  WHERE 
    -- Search in contact names
    p.contacts @> ANY(ARRAY[
      jsonb_build_array(jsonb_build_object('first_name', search_query)),
      jsonb_build_array(jsonb_build_object('last_name', search_query)),
      jsonb_build_array(jsonb_build_object('email', search_query))
    ])
    -- Search in company names
    OR p.contacts @> ANY(ARRAY[
      jsonb_build_array(jsonb_build_object('location', jsonb_build_object('company', jsonb_build_object('name', search_query))))
    ])
    -- Search in location names
    OR p.contacts @> ANY(ARRAY[
      jsonb_build_array(jsonb_build_object('location', jsonb_build_object('name', search_query)))
    ])
    -- Or search in any contact field using containment
    OR p.contacts::text ILIKE '%' || search_query || '%';
END;
$$ LANGUAGE plpgsql;

-- Add a function to get proposals by contact email
CREATE OR REPLACE FUNCTION get_proposals_by_contact_email(contact_email TEXT)
RETURNS TABLE (
  id UUID,
  proposal_number TEXT,
  contacts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.proposal_number,
    p.contacts
  FROM proposals p
  WHERE p.contacts @> ANY(ARRAY[
    jsonb_build_array(jsonb_build_object('email', contact_email))
  ]);
END;
$$ LANGUAGE plpgsql;

-- Add a function to get proposals by company
CREATE OR REPLACE FUNCTION get_proposals_by_company(company_id TEXT)
RETURNS TABLE (
  id UUID,
  proposal_number TEXT,
  contacts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.proposal_number,
    p.contacts
  FROM proposals p
  WHERE p.contacts @> ANY(ARRAY[
    jsonb_build_array(jsonb_build_object('location', jsonb_build_object('company_id', company_id)))
  ]);
END;
$$ LANGUAGE plpgsql;

-- Add a function to get proposals by location
CREATE OR REPLACE FUNCTION get_proposals_by_location(location_id TEXT)
RETURNS TABLE (
  id UUID,
  proposal_number TEXT,
  contacts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.proposal_number,
    p.contacts
  FROM proposals p
  WHERE p.contacts @> ANY(ARRAY[
    jsonb_build_array(jsonb_build_object('location_id', location_id))
  ]);
END;
$$ LANGUAGE plpgsql;

-- Add a function to get proposals by primary contact
CREATE OR REPLACE FUNCTION get_proposals_by_primary_contact(contact_id TEXT)
RETURNS TABLE (
  id UUID,
  proposal_number TEXT,
  contacts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.proposal_number,
    p.contacts
  FROM proposals p
  WHERE p.contacts @> ANY(ARRAY[
    jsonb_build_array(jsonb_build_object('id', contact_id, 'is_primary', true))
  ]);
END;
$$ LANGUAGE plpgsql; 