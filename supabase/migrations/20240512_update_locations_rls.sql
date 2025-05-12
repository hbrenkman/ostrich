-- Drop existing policies
DROP POLICY IF EXISTS "Locations are deletable by admin users" ON locations;
DROP POLICY IF EXISTS "Locations are editable by admin and project_management users" ON locations;
DROP POLICY IF EXISTS "Locations are viewable by authenticated users" ON locations;
DROP POLICY IF EXISTS "Locations are updatable by admin and project_management users" ON locations;

-- Create new policies matching contacts/companies structure
CREATE POLICY "Locations are deletable by admin users"
ON locations FOR DELETE
TO authenticated
USING ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Locations are editable by admin and project_management users"
ON locations FOR INSERT
TO authenticated
WITH CHECK ((SELECT log_jwt_claims() AS log_jwt_claims) AND ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text])));

CREATE POLICY "Locations are viewable by authenticated users"
ON locations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Locations are updatable by admin and project_management users"
ON locations FOR UPDATE
TO authenticated
USING ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text]))
WITH CHECK ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text])); 