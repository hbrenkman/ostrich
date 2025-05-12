-- Enable RLS on locations table if not already enabled
alter table public.locations enable row level security;

-- Drop existing policies if any
drop policy if exists "Locations are viewable by authenticated users" on public.locations;
drop policy if exists "Locations are manageable by admins" on public.locations;
drop policy if exists "Locations are insertable by admins" on public.locations;
drop policy if exists "Locations are updatable by admins" on public.locations;
drop policy if exists "Locations are deletable by admins" on public.locations;

-- Create new policies

-- Select policy - Allow authenticated users to view all locations
create policy "Locations are viewable by authenticated users"
    on public.locations
    for select
    to authenticated
    using (true);

-- Insert policy - Allow admin users to insert locations
create policy "Locations are insertable by admins"
    on public.locations
    for insert
    to authenticated
    with check (
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() ->> 'role' = 'project_management'
    );

-- Update policy - Allow admin users to update locations
create policy "Locations are updatable by admins"
    on public.locations
    for update
    to authenticated
    using (
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() ->> 'role' = 'project_management'
    )
    with check (
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() ->> 'role' = 'project_management'
    );

-- Delete policy - Allow admin users to delete locations
create policy "Locations are deletable by admins"
    on public.locations
    for delete
    to authenticated
    using (
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'project_management' OR
        auth.jwt() ->> 'role' = 'project_management'
    ); 