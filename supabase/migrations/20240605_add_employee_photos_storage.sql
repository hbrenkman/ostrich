-- Create the employee-photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Employee photos are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Employee photos are uploadable by admin and project_management users" ON storage.objects;
DROP POLICY IF EXISTS "Employee photos are deletable by admin users" ON storage.objects;

-- Create policies for the employee-photos bucket
-- Allow authenticated users to view photos
CREATE POLICY "Employee photos are viewable by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-photos');

-- Allow admin and project_management users to upload photos
CREATE POLICY "Employee photos are uploadable by admin and project_management users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-photos' AND
  (
    auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' IN ('admin', 'project_management') OR
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'project_management') OR
    auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' IN ('admin', 'project_management') OR
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'project_management') OR
    auth.jwt() ->> 'role' IN ('admin', 'project_management')
  )
);

-- Allow admin users to delete photos
CREATE POLICY "Employee photos are deletable by admin users"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-photos' AND
  (
    auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'admin'
  )
); 