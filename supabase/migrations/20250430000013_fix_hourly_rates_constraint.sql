/*
  # Fix hourly_rates table unique constraint

  1. Changes
    - Drop the old unique constraint that only includes discipline_id and role_id
    - Add a new unique constraint that includes role_designation
*/

-- Drop the old constraint
ALTER TABLE hourly_rates
DROP CONSTRAINT IF EXISTS hourly_rates_discipline_id_role_id_key;

-- Add the new constraint
ALTER TABLE hourly_rates
ADD CONSTRAINT hourly_rates_discipline_id_role_id_role_designation_key 
UNIQUE (discipline_id, role_id, role_designation);

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT hourly_rates_discipline_id_role_id_role_designation_key ON hourly_rates 
IS 'Ensures unique combinations of discipline, role, and designation'; 