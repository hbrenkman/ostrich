-- Create the industries reference table
CREATE TABLE IF NOT EXISTS industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the industry options
INSERT INTO industries (name, code, description) VALUES
    ('Architecture', 'ARCH', 'Architecture firms and practices'),
    ('Engineering', 'ENG', 'Engineering firms and practices'),
    ('Construction', 'CON', 'Construction companies and contractors'),
    ('Real Estate', 'RE', 'Real estate development and management'),
    ('Technology', 'TECH', 'Technology companies and IT services'),
    ('Healthcare', 'HC', 'Healthcare providers and facilities'),
    ('Manufacturing', 'MFG', 'Manufacturing companies'),
    ('Retail', 'RET', 'Retail businesses'),
    ('Financial Services', 'FIN', 'Financial institutions and services'),
    ('Education', 'EDU', 'Educational institutions'),
    ('Government', 'GOV', 'Government agencies and departments'),
    ('Non-Profit', 'NP', 'Non-profit organizations'),
    ('Transportation', 'TRANS', 'Transportation and logistics'),
    ('Energy', 'NRG', 'Energy companies and utilities'),
    ('Telecommunications', 'TELECOM', 'Telecommunications providers'),
    ('Professional Services', 'PRO', 'Professional service providers'),
    ('Other', 'OTHER', 'Other industry types');

-- Add RLS policies for the industries table
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- Read policy
CREATE POLICY "Enable read access for all authenticated users" ON industries
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert policy
CREATE POLICY "Enable insert for admin users only" ON industries
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Update policy
CREATE POLICY "Enable update for admin users only" ON industries
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Delete policy
CREATE POLICY "Enable delete for admin users only" ON industries
    FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Modify the Companies table to reference the industries table
DO $$ 
BEGIN
    -- Drop the industry check constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'companies_industry_check'
    ) THEN
        ALTER TABLE companies DROP CONSTRAINT companies_industry_check;
    END IF;

    -- Add industry_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'industry_id'
    ) THEN
        ALTER TABLE companies ADD COLUMN industry_id UUID;
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'companies_industry_id_fkey'
    ) THEN
        ALTER TABLE companies 
            ADD CONSTRAINT companies_industry_id_fkey 
            FOREIGN KEY (industry_id) 
            REFERENCES industries(id);
    END IF;
END $$;

-- Create an index on the industry_id column for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_industry_id ON companies(industry_id); 