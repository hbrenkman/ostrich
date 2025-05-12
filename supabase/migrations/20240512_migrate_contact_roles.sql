-- Create a temporary function to map old role names to new role IDs
CREATE OR REPLACE FUNCTION map_role_to_id(old_role TEXT)
RETURNS UUID AS $$
DECLARE
    role_id UUID;
BEGIN
    -- Map old role names to new role names
    CASE old_role
        WHEN 'Principal' THEN
            SELECT id INTO role_id FROM roles WHERE name = 'Principle Architect';
        WHEN 'Project Lead' THEN
            SELECT id INTO role_id FROM roles WHERE name = 'Project Lead';
        WHEN 'Team Member' THEN
            SELECT id INTO role_id FROM roles WHERE name = 'Engineer';
        WHEN 'Consultant' THEN
            SELECT id INTO role_id FROM roles WHERE name = 'Designer';
        WHEN 'Client Representative' THEN
            SELECT id INTO role_id FROM roles WHERE name = 'Manager';
        WHEN 'Stakeholder' THEN
            SELECT id INTO role_id FROM roles WHERE name = 'Owner';
        WHEN 'Other' THEN
            SELECT id INTO role_id FROM roles WHERE name = 'Manager';
        ELSE
            -- Try to find an exact match
            SELECT id INTO role_id FROM roles WHERE name = old_role;
    END CASE;

    -- If no match found, default to Manager
    IF role_id IS NULL THEN
        SELECT id INTO role_id FROM roles WHERE name = 'Manager';
    END IF;

    RETURN role_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing contacts to use role_id
UPDATE contacts
SET role_id = map_role_to_id(role)
WHERE role_id IS NULL;

-- Drop the temporary function
DROP FUNCTION map_role_to_id;

-- Make role_id NOT NULL after migration
ALTER TABLE contacts
ALTER COLUMN role_id SET NOT NULL;

-- Drop the old role column
ALTER TABLE contacts
DROP COLUMN role; 