-- Drop and recreate the companies INSERT policy to match contacts exactly
DROP POLICY IF EXISTS "Companies are editable by admin and project_management users" ON companies;

CREATE POLICY "Companies are editable by admin and project_management users"
ON companies FOR INSERT
TO authenticated
WITH CHECK ((SELECT log_jwt_claims() AS log_jwt_claims) AND ((((jwt() -> 'app_metadata'::text) -> 'claims'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'project_management'::text]))); 