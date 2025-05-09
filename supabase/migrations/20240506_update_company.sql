-- Create a function to update company details with proper error handling
create or replace function public.update_company(
  p_id uuid,
  p_name text,
  p_industry_id uuid,
  p_status text,
  p_updated_at timestamptz
) returns jsonb as $$
declare
  v_company companies;
  v_result jsonb;
begin
  -- First verify the company exists
  select * into v_company
  from companies
  where id = p_id;

  if not found then
    raise exception 'Company with id % not found', p_id;
  end if;

  -- Log the current state
  raise notice 'Updating company % from name "%" to "%"', 
    p_id, v_company.name, p_name;

  -- Perform the update
  update companies
  set 
    name = p_name,
    industry_id = p_industry_id,
    status = p_status,
    updated_at = p_updated_at
  where id = p_id
  returning to_jsonb(companies.*) into v_result;

  -- Verify the update
  if v_result->>'name' != p_name then
    raise exception 'Update verification failed: expected name "%" but got "%"',
      p_name, v_result->>'name';
  end if;

  return v_result;
end;
$$ language plpgsql security definer; 