-- Create locations table if it doesn't exist
create table if not exists public.locations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    address_line1 text not null,
    address_line2 text,
    city text not null,
    state text not null,
    postal_code text not null,
    phone text,
    location_type_id uuid references location_types(id),
    company_id uuid references companies(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.locations enable row level security;

-- Create a simple policy that allows all operations for authenticated users
create policy "Enable all access for authenticated users"
    on locations
    for all
    to authenticated
    using (true)
    with check (true); 