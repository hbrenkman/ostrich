-- Remove industry entries from reference_tables
DELETE FROM reference_tables WHERE name = 'Industries';

-- Add indexes to industries table for better performance
CREATE INDEX IF NOT EXISTS idx_industries_name ON industries(name);
CREATE INDEX IF NOT EXISTS idx_industries_code ON industries(code);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_industries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_industries_updated_at
    BEFORE UPDATE ON industries
    FOR EACH ROW
    EXECUTE FUNCTION update_industries_updated_at();

-- Add a comment to the industries table
COMMENT ON TABLE industries IS 'Reference table for company industries. This is the primary source of industry data.'; 