-- Enable Row Level Security
ALTER TABLE engineering_services ENABLE ROW LEVEL SECURITY;

-- Create policies for different roles

-- Allow authenticated users to view
CREATE POLICY "Engineering services are viewable by authenticated users"
ON engineering_services
FOR SELECT
TO authenticated
USING (true);

-- Allow admin users full access
CREATE POLICY "Engineering services are editable by admin users"
ON engineering_services
FOR INSERT
TO authenticated
WITH CHECK (has_role(ARRAY['admin']));

CREATE POLICY "Engineering services are updatable by admin users"
ON engineering_services
FOR UPDATE
TO authenticated
USING (has_role(ARRAY['admin']))
WITH CHECK (has_role(ARRAY['admin']));

CREATE POLICY "Engineering services are deletable by admin users"
ON engineering_services
FOR DELETE
TO authenticated
USING (has_role(ARRAY['admin']));

-- Allow management users full access
CREATE POLICY "Engineering services are editable by management users"
ON engineering_services
FOR INSERT
TO authenticated
WITH CHECK (has_role(ARRAY['management']));

CREATE POLICY "Engineering services are updatable by management users"
ON engineering_services
FOR UPDATE
TO authenticated
USING (has_role(ARRAY['management']))
WITH CHECK (has_role(ARRAY['management']));

CREATE POLICY "Engineering services are deletable by management users"
ON engineering_services
FOR DELETE
TO authenticated
USING (has_role(ARRAY['management']));

-- Allow project managers read-only access
CREATE POLICY "Engineering services are viewable by project managers"
ON engineering_services
FOR SELECT
TO authenticated
USING (has_role(ARRAY['project_manager'])); 