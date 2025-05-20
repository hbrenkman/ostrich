-- Create employee_job_title table
CREATE TABLE IF NOT EXISTS employee_job_title (
    role_id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS employee_job_title_role_name_idx ON employee_job_title(role_name);
CREATE INDEX IF NOT EXISTS employee_job_title_is_active_idx ON employee_job_title(is_active);

-- Enable RLS
ALTER TABLE employee_job_title ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON employee_job_title
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON employee_job_title
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON employee_job_title
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON employee_job_title
    FOR DELETE
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_job_title_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_job_title_updated_at
    BEFORE UPDATE ON employee_job_title
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_job_title_updated_at();

-- Insert some initial data
INSERT INTO employee_job_title (role_name, description) VALUES
    ('Software Engineer', 'Develops and maintains software applications'),
    ('Project Manager', 'Manages project timelines, resources, and deliverables'),
    ('Business Analyst', 'Analyzes business needs and requirements'),
    ('QA Engineer', 'Ensures software quality through testing'),
    ('DevOps Engineer', 'Manages infrastructure and deployment processes'),
    ('UI/UX Designer', 'Designs user interfaces and experiences'),
    ('Product Manager', 'Manages product development and strategy'),
    ('Technical Lead', 'Leads technical direction and architecture'),
    ('System Administrator', 'Manages system infrastructure and operations'),
    ('Data Analyst', 'Analyzes and interprets complex data sets')
ON CONFLICT (role_id) DO NOTHING;

-- Add comments
COMMENT ON TABLE employee_job_title IS 'Reference table for employee job titles';
COMMENT ON COLUMN employee_job_title.role_id IS 'Unique identifier for the job title';
COMMENT ON COLUMN employee_job_title.role_name IS 'Name of the job title';
COMMENT ON COLUMN employee_job_title.description IS 'Detailed description of the job title';
COMMENT ON COLUMN employee_job_title.is_active IS 'Whether this job title is currently active and available for use'; 