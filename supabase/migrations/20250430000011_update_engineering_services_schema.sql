-- Update engineering_standard_services table schema

-- First, rename default_setting to included_in_fee
ALTER TABLE engineering_standard_services 
    RENAME COLUMN default_setting TO included_in_fee;

-- Add min_fee and rate columns
ALTER TABLE engineering_standard_services
    ADD COLUMN IF NOT EXISTS min_fee NUMERIC,
    ADD COLUMN IF NOT EXISTS rate NUMERIC;

-- Drop the estimated_fee column as it's no longer used
ALTER TABLE engineering_standard_services
    DROP COLUMN IF EXISTS estimated_fee;

-- Add comments to explain the columns
COMMENT ON COLUMN engineering_standard_services.included_in_fee IS 'Whether this service is included in the project scope (true) or is an additional service (false)';
COMMENT ON COLUMN engineering_standard_services.min_fee IS 'Minimum fee for additional services (null if included in project scope)';
COMMENT ON COLUMN engineering_standard_services.rate IS 'Hourly rate for additional services (null if included in project scope)';

-- Update any existing records to set included_in_fee based on whether they have min_fee or rate
UPDATE engineering_standard_services
SET included_in_fee = (min_fee IS NULL AND rate IS NULL)
WHERE included_in_fee IS NULL; 