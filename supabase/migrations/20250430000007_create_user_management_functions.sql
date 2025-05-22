-- Create a function to fetch users with proper access control
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
    id uuid,
    email text,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    banned_at timestamptz
) 
SECURITY DEFINER -- Run with the privileges of the function creator
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_app_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can fetch users';
    END IF;

    -- Return user data
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_app_meta_data,
        u.raw_user_meta_data,
        u.created_at,
        u.last_sign_in_at,
        u.banned_at
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$;

-- Create a function to create a new user
CREATE OR REPLACE FUNCTION create_user(
    email text,
    password text,
    role text DEFAULT 'unassigned',
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Check if the calling user is an admin
    IF NOT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_app_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can create users';
    END IF;

    -- Create the user
    INSERT INTO auth.users (
        email,
        encrypted_password,
        raw_app_meta_data,
        raw_user_meta_data,
        email_confirmed_at,
        created_at,
        updated_at
    ) VALUES (
        email,
        crypt(password, gen_salt('bf')),
        jsonb_build_object('role', role),
        metadata,
        now(),
        now(),
        now()
    )
    RETURNING id INTO new_user_id;

    RETURN new_user_id;
END;
$$;

-- Create a function to update a user's role
CREATE OR REPLACE FUNCTION update_user_role(
    user_id uuid,
    new_role text
)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_app_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;

    -- Update the user's role
    UPDATE auth.users
    SET 
        raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new_role),
        updated_at = now()
    WHERE id = user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;

-- Create RLS policies for the functions
ALTER FUNCTION get_users() SET search_path = public, auth;
ALTER FUNCTION create_user(text, text, text, jsonb) SET search_path = public, auth;
ALTER FUNCTION update_user_role(uuid, text) SET search_path = public, auth; 