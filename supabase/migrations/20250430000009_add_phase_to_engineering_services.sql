-- Create the phase enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE engineering_service_phase AS ENUM ('design', 'construction');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the phase column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE engineering_standard_services ADD COLUMN phase engineering_service_phase;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update any existing NULL values to be explicitly NULL
UPDATE engineering_standard_services SET phase = NULL WHERE phase IS NULL;

-- Add a check constraint to ensure only valid values are allowed
ALTER TABLE engineering_standard_services 
    DROP CONSTRAINT IF EXISTS engineering_standard_services_phase_check,
    ADD CONSTRAINT engineering_standard_services_phase_check 
    CHECK (phase IN ('design', 'construction') OR phase IS NULL);

-- Add a comment to the column
COMMENT ON COLUMN engineering_standard_services.phase IS 'The phase of the engineering service: design, construction, or NULL'; 