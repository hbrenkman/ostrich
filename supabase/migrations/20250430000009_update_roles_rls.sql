-- Drop existing policies
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
DROP POLICY IF EXISTS "Roles are editable by admin and project_management users" ON roles;

-- Create new policies matching disciplines table structure
-- Select policy - Allow all authenticated users to view roles
CREATE POLICY "Viewable by authenticated users"
    ON roles
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert policy - Allow admin and manager users to insert roles
CREATE POLICY "Editable by admin and manager"
    ON roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    );

-- Update policy - Allow admin and manager users to update roles
CREATE POLICY "Updatable by admin and manager"
    ON roles
    FOR UPDATE
    TO authenticated
    USING (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    )
    WITH CHECK (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    );

-- Delete policy - Allow admin and manager users to delete roles
CREATE POLICY "Deletable by admin and manager"
    ON roles
    FOR DELETE
    TO authenticated
    USING (
        (jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text])
    ); 