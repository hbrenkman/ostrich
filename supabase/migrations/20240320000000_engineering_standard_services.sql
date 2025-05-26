-- Create engineering_standard_services table
CREATE TABLE IF NOT EXISTS engineering_standard_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discipline TEXT NOT NULL,
    service_name TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_fee TEXT,
    default_setting BOOLEAN DEFAULT false,
    phase VARCHAR DEFAULT 'design'
);

-- Add RLS policies
ALTER TABLE engineering_standard_services ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON engineering_standard_services
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 