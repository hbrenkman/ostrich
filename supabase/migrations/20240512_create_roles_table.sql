-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the predefined roles
INSERT INTO roles (name, description) VALUES
    ('Principle Architect', 'Senior architect with principal responsibilities'),
    ('Principle Engineer', 'Senior engineer with principal responsibilities'),
    ('Designer', 'General design professional'),
    ('Project Manager', 'Manages project execution and delivery'),
    ('Project Lead', 'Leads specific project aspects or teams'),
    ('Drafter', 'Creates technical drawings and documentation'),
    ('Engineer', 'Engineering professional'),
    ('Architect', 'Architecture professional'),
    ('Interior Designer', 'Specializes in interior spaces and design'),
    ('Owner', 'Business or property owner'),
    ('Manager', 'Management position'),
    ('Executive', 'Executive level position')
ON CONFLICT (name) DO NOTHING;

-- Add role_id column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- Create an index on role_id for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_role_id ON contacts(role_id);

-- Add RLS policies for the roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view roles
CREATE POLICY "Roles are viewable by authenticated users"
ON roles FOR SELECT
TO authenticated
USING (true);

-- Only allow admin and project_management users to modify roles
CREATE POLICY "Roles are editable by admin and project_management users"
ON roles FOR ALL
TO authenticated
USING ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text]))
WITH CHECK ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text]));

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 