-- Create location_types table
create table if not exists public.location_types (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create function to update location_types
create or replace function public.update_location_type(
    p_id uuid,
    p_name text,
    p_description text,
    p_is_active boolean
) returns jsonb as $$
declare
    v_result jsonb;
begin
    update location_types
    set 
        name = p_name,
        description = p_description,
        is_active = p_is_active,
        updated_at = now()
    where id = p_id
    returning to_jsonb(location_types.*) into v_result;

    if not found then
        raise exception 'Location type with id % not found', p_id;
    end if;

    return v_result;
end;
$$ language plpgsql security definer;

-- Create function to add location_type
create or replace function public.add_location_type(
    p_name text,
    p_description text default null,
    p_is_active boolean default true
) returns jsonb as $$
declare
    v_result jsonb;
begin
    insert into location_types (name, description, is_active)
    values (p_name, p_description, p_is_active)
    returning to_jsonb(location_types.*) into v_result;

    return v_result;
end;
$$ language plpgsql security definer;

-- Create function to get all active location types
create or replace function public.get_active_location_types()
returns jsonb as $$
declare
    v_result jsonb;
begin
    select jsonb_agg(to_jsonb(lt.*))
    into v_result
    from location_types lt
    where lt.is_active = true
    order by lt.name;

    return coalesce(v_result, '[]'::jsonb);
end;
$$ language plpgsql security definer;

-- Create location type enum
create type public.location_type as enum (
    'Main Office',
    'Headquarters',
    'Branch Office',
    'Satellite Office',
    'Remote Office',
    'Regional Office',
    'Field Office',
    'Distribution Center',
    'Warehouse',
    'Store Location',
    'Retail Location',
    'Service Center',
    'Customer Support Center',
    'Data Center',
    'Research Facility',
    'Manufacturing Plant',
    'Other'
);

-- Add location_type column to locations table
alter table public.locations
add column if not exists location_type public.location_type;

-- Create function to get all location types
create or replace function public.get_location_types()
returns jsonb as $$
declare
    v_result jsonb;
begin
    select jsonb_agg(enum_range(null::public.location_type))
    into v_result;
    return v_result;
end;
$$ language plpgsql security definer;

-- Insert default location types
insert into public.location_types (name, description) values
    ('Main Office', 'Primary business location'),
    ('Headquarters', 'Corporate headquarters'),
    ('Branch Office', 'Secondary business location'),
    ('Satellite Office', 'Remote office connected to main location'),
    ('Remote Office', 'Work from home or remote work location'),
    ('Regional Office', 'Office serving a specific region'),
    ('Field Office', 'Mobile or temporary office location'),
    ('Distribution Center', 'Warehouse or distribution facility'),
    ('Warehouse', 'Storage facility'),
    ('Store Location', 'Retail store location'),
    ('Retail Location', 'Customer-facing retail space'),
    ('Service Center', 'Customer service or support center'),
    ('Customer Support Center', 'Dedicated customer support facility'),
    ('Data Center', 'IT infrastructure facility'),
    ('Research Facility', 'Research and development center'),
    ('Manufacturing Plant', 'Production facility'),
    ('Other', 'Other type of location')
on conflict (name) do nothing;

-- Create RLS policies
alter table public.location_types enable row level security;

create policy "Location types are viewable by authenticated users"
    on public.location_types for select
    to authenticated
    using (true);

create policy "Location types are manageable by admins"
    on public.location_types for all
    to authenticated
    using (auth.jwt() ->> 'role' = 'admin')
    with check (auth.jwt() ->> 'role' = 'admin'); 