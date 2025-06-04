/*
  # Add role_designation to hourly_rates table

  1. Changes
    - Add role_designation column (VARCHAR(50), nullable)
    - Add index for better query performance
    - Add comment to document the field
*/

-- Add role_designation column
ALTER TABLE hourly_rates
ADD COLUMN role_designation VARCHAR(50) DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_hourly_rates_role_designation ON hourly_rates(role_designation);

-- Add comment to document the field
COMMENT ON COLUMN hourly_rates.role_designation IS 'Designation or level within a role (e.g., Junior, Senior, Level 1, Principal)';

-- Update the unique constraint to include role_designation
ALTER TABLE hourly_rates
DROP CONSTRAINT IF EXISTS hourly_rates_discipline_id_role_id_key;

ALTER TABLE hourly_rates
ADD CONSTRAINT hourly_rates_discipline_id_role_id_role_designation_key 
UNIQUE (discipline_id, role_id, role_designation); 