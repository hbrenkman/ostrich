-- Add isConstructionAdmin column to engineering_standard_services table
ALTER TABLE engineering_standard_services
    ADD COLUMN IF NOT EXISTS isConstructionAdmin BOOLEAN DEFAULT false;

-- Add a comment to explain the column
COMMENT ON COLUMN engineering_standard_services.isConstructionAdmin IS 'Whether this service affects construction administration fee calculations';

-- Update the API interface to include the new column
-- Note: This is just a comment for documentation, the actual interface is in the TypeScript code
COMMENT ON TABLE engineering_standard_services IS 'Engineering standard services table. Each service can be marked as affecting construction administration fee calculations using the isConstructionAdmin column.'; 