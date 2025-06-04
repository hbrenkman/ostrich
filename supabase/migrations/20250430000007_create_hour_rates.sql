-- Create hourly_rates table
CREATE TABLE IF NOT EXISTS hourly_rates (
    id SERIAL PRIMARY KEY,
    discipline_id INTEGER NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    rate NUMERIC NOT NULL CHECK (rate >= 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(discipline_id, role_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS hourly_rates_discipline_id_idx ON hourly_rates(discipline_id);
CREATE INDEX IF NOT EXISTS hourly_rates_role_id_idx ON hourly_rates(role_id);

-- Enable Row Level Security
ALTER TABLE hourly_rates ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Select policy - Allow all authenticated users to view hourly rates
CREATE POLICY "Viewable by authenticated users"
    ON hourly_rates
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert policy - Allow admin and manager users to insert hourly rates
CREATE POLICY "Editable by admin and manager"
    ON hourly_rates
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    );

-- Update policy - Allow admin and manager users to update hourly rates
CREATE POLICY "Updatable by admin and manager"
    ON hourly_rates
    FOR UPDATE
    TO authenticated
    USING (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    )
    WITH CHECK (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    );

-- Delete policy - Allow admin and manager users to delete hourly rates
CREATE POLICY "Deletable by admin and manager"
    ON hourly_rates
    FOR DELETE
    TO authenticated
    USING (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    );

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_hourly_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hourly_rates_updated_at
    BEFORE UPDATE ON hourly_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_hourly_rates_updated_at(); 