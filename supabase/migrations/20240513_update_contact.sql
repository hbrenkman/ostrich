-- Create a function to update contact details with proper error handling
create or replace function public.update_contact(
  p_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_mobile text,
  p_direct_phone text,
  p_role_id uuid,
  p_location_id uuid,
  p_updated_at timestamptz
) returns jsonb as $$
declare
  v_contact contacts;
  v_result jsonb;
begin
  -- First verify the contact exists
  select * into v_contact
  from contacts
  where id = p_id;

  if not found then
    raise exception 'Contact with id % not found', p_id;
  end if;

  -- Log the current state
  raise notice 'Updating contact % from name "% %" to "% %"', 
    p_id, v_contact.first_name, v_contact.last_name, p_first_name, p_last_name;

  -- Perform the update
  update contacts
  set 
    first_name = p_first_name,
    last_name = p_last_name,
    email = p_email,
    mobile = p_mobile,
    direct_phone = p_direct_phone,
    role_id = p_role_id,
    location_id = p_location_id,
    updated_at = p_updated_at
  where id = p_id
  returning to_jsonb(contacts.*) into v_result;

  -- Verify the update
  if v_result->>'first_name' != p_first_name or v_result->>'last_name' != p_last_name then
    raise exception 'Update verification failed: expected name "% %" but got "% %"',
      p_first_name, p_last_name, v_result->>'first_name', v_result->>'last_name';
  end if;

  return v_result;
end;
$$ language plpgsql security definer; 