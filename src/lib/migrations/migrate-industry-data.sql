-- First, let's see what unique industry values we currently have
DO $$ 
DECLARE
    industry_record RECORD;
BEGIN
    -- For each unique industry value in the companies table
    FOR industry_record IN 
        SELECT DISTINCT industry 
        FROM companies 
        WHERE industry IS NOT NULL
    LOOP
        -- Check if this industry exists in our new industries table
        IF NOT EXISTS (
            SELECT 1 
            FROM industries 
            WHERE name = industry_record.industry
        ) THEN
            -- If it doesn't exist, insert it into the industries table
            INSERT INTO industries (name, code, description)
            VALUES (
                industry_record.industry,
                UPPER(SUBSTRING(industry_record.industry, 1, 4)),
                'Migrated from existing company data'
            );
        END IF;
    END LOOP;
END $$;

-- Now update the industry_id in companies table based on the industry name
UPDATE companies c
SET industry_id = i.id
FROM industries i
WHERE c.industry = i.name
AND c.industry_id IS NULL;

-- Let's verify the migration
SELECT c.name as company_name, c.industry as old_industry, i.name as new_industry
FROM companies c
LEFT JOIN industries i ON c.industry_id = i.id
WHERE c.industry IS NOT NULL;

-- After verifying the data is correct, we can add a comment to remind us
-- that we need to update the application code before removing the old column
COMMENT ON COLUMN companies.industry IS 'DEPRECATED: This column will be removed after application code is updated to use industry_id.'; 