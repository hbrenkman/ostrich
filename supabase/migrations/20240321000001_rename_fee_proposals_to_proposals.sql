-- Rename fee_proposals table to proposals
ALTER TABLE fee_proposals RENAME TO proposals;

-- Update any references to fee_proposals in functions
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
    p.number as proposal_number,
    p.contacts
  FROM proposals p
  WHERE 
    -- Search in contact names
    p.contacts @> ANY(ARRAY[
      jsonb_build_array(jsonb_build_object('name', search_query)),
      jsonb_build_array(jsonb_build_object('email', search_query))
    ])
    -- Or search in any contact field using containment
    OR p.contacts::text ILIKE '%' || search_query || '%';
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies
DROP POLICY IF EXISTS "Fee proposals are viewable by authenticated users" ON proposals;
DROP POLICY IF EXISTS "Fee proposals are editable by admin and project_management users" ON proposals;
DROP POLICY IF EXISTS "Fee proposals are updatable by admin and project_management users" ON proposals;
DROP POLICY IF EXISTS "Fee proposals are deletable by admin users" ON proposals;

CREATE POLICY "Proposals are viewable by authenticated users"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Proposals are editable by admin and project_management users"
  ON proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'project_management'
  );

CREATE POLICY "Proposals are updatable by admin and project_management users"
  ON proposals
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

CREATE POLICY "Proposals are deletable by admin users"
  ON proposals
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Update trigger name
ALTER TRIGGER update_fee_proposals_updated_at ON proposals RENAME TO update_proposals_updated_at;

-- Update any other functions that reference fee_proposals
CREATE OR REPLACE FUNCTION is_engineering_service_included(
    p_engineering_service_id UUID,
    p_proposal_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM engineering_service_links esl
        JOIN engineering_additional_services fai ON esl.additional_item_id = fai.id
        JOIN proposal_items pi ON fai.id = pi.additional_item_id
        WHERE esl.engineering_service_id = p_engineering_service_id
        AND pi.proposal_id = p_proposal_id
        AND pi.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to explain the table's purpose
COMMENT ON TABLE proposals IS 'Proposals table containing fee proposals and their associated data';
COMMENT ON COLUMN proposals.number IS 'Unique proposal number';
COMMENT ON COLUMN proposals.project_id IS 'Reference to the associated project';
COMMENT ON COLUMN proposals.overview IS 'Overview of the proposal';
COMMENT ON COLUMN proposals.design_budget IS 'Budget allocated for design work';
COMMENT ON COLUMN proposals.construction_support_budget IS 'Budget allocated for construction support';
COMMENT ON COLUMN proposals.status IS 'Current status of the proposal'; 