/*
  # Update employment_details table to use employment_status

  1. Changes
    - Add employment_status_id column (uuid, references employment_status)
    - Update existing records to use the new status reference
    - Drop the old employment_status column
*/

-- First, add the new column
ALTER TABLE employment_details
ADD COLUMN employment_status_id uuid REFERENCES employment_status(id);

-- Update existing records to use the new status reference
UPDATE employment_details ed
SET employment_status_id = es.id
FROM employment_status es
WHERE LOWER(ed.employment_status) = LOWER(es.code);

-- Make the new column required
ALTER TABLE employment_details
ALTER COLUMN employment_status_id SET NOT NULL;

-- Drop the old column
ALTER TABLE employment_details
DROP COLUMN employment_status;

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS employment_details_status_id_idx ON employment_details(employment_status_id);

-- Add a comment to explain the change
COMMENT ON COLUMN employment_details.employment_status_id IS 'Reference to the employment_status table'; 