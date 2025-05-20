/*
  # Update employee_compensation table to use tax_withholding_status_reference

  1. Changes
    - Add tax_withholding_status_id column (uuid, references tax_withholding_status_reference)
    - Update existing records to use the new status reference
    - Drop the old tax_withholding_status column
*/

-- First, add the new column
ALTER TABLE employee_compensation
ADD COLUMN tax_withholding_status_id uuid REFERENCES tax_withholding_status_reference(status_id);

-- Update existing records to use the new status reference
UPDATE employee_compensation ec
SET tax_withholding_status_id = ts.status_id
FROM tax_withholding_status_reference ts
WHERE LOWER(ec.tax_withholding_status) = LOWER(ts.status_code);

-- Make the new column required
ALTER TABLE employee_compensation
ALTER COLUMN tax_withholding_status_id SET NOT NULL;

-- Drop the old column
ALTER TABLE employee_compensation
DROP COLUMN tax_withholding_status;

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS employee_compensation_tax_status_id_idx ON employee_compensation(tax_withholding_status_id);

-- Add a comment to explain the change
COMMENT ON COLUMN employee_compensation.tax_withholding_status_id IS 'Reference to the tax_withholding_status_reference table'; 