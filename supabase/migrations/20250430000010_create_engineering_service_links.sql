-- Create a junction table to link engineering services with additional items
CREATE TABLE IF NOT EXISTS engineering_service_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    engineering_service_id UUID REFERENCES engineering_standard_services(id) ON DELETE CASCADE,
    additional_item_id UUID REFERENCES engineering_additional_services(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('engineering_service', 'fee_additional_item')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(engineering_service_id, additional_item_id, link_type)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_engineering_service_links_service_id 
    ON engineering_service_links(engineering_service_id);
CREATE INDEX IF NOT EXISTS idx_engineering_service_links_item_id 
    ON engineering_service_links(additional_item_id);

-- Enable Row Level Security
ALTER TABLE engineering_service_links ENABLE ROW LEVEL SECURITY;

-- Create policies for different roles
CREATE POLICY "Engineering service links are viewable by authenticated users"
    ON engineering_service_links
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Engineering service links are editable by admin users"
    ON engineering_service_links
    FOR ALL
    TO authenticated
    USING (has_role(ARRAY['admin']))
    WITH CHECK (has_role(ARRAY['admin']));

CREATE POLICY "Engineering service links are editable by management users"
    ON engineering_service_links
    FOR ALL
    TO authenticated
    USING (has_role(ARRAY['management']))
    WITH CHECK (has_role(ARRAY['management']));

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_engineering_service_links_updated_at
    BEFORE UPDATE ON engineering_service_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add a function to check if an engineering service is included in a project
CREATE OR REPLACE FUNCTION is_engineering_service_included(
    p_engineering_service_id UUID,
    p_proposal_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM engineering_service_links esl
        JOIN engineering_additional_services fai ON esl.additional_item_id = fai.id
        JOIN fee_proposal_items fpi ON fai.id = fpi.additional_item_id
        WHERE esl.engineering_service_id = p_engineering_service_id
        AND fpi.proposal_id = p_proposal_id
        AND fpi.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to explain the table's purpose
COMMENT ON TABLE engineering_service_links IS 'Links engineering services to additional items (both engineering services and fee additional items) to track what is included in a project';

-- Add comments to explain the columns
COMMENT ON COLUMN engineering_service_links.engineering_service_id IS 'The ID of the engineering service being linked';
COMMENT ON COLUMN engineering_service_links.additional_item_id IS 'The ID of the additional item (engineering service or fee additional item) being linked';
COMMENT ON COLUMN engineering_service_links.link_type IS 'The type of link: engineering_service or fee_additional_item'; 