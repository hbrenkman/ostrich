-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_users();

-- Create the get_users function with improved role checking
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
    id uuid,
    email varchar(255),
    role text,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    created_at timestamptz,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_user_id uuid;
    is_admin boolean;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- If running directly in SQL editor (current_user_id is null), allow access
    -- Otherwise, check if the user is an admin
    IF current_user_id IS NULL THEN
        -- Allow direct execution in SQL editor
        is_admin := true;
    ELSE
        -- Check all possible role locations for admin
        SELECT 
            COALESCE(
                (u.raw_app_meta_data->>'role') = 'admin',
                (u.raw_app_meta_data->'claims'->>'role') = 'admin',
                (u.raw_user_meta_data->>'role') = 'admin',
                (u.raw_user_meta_data->'app_metadata'->>'role') = 'admin',
                false
            ) INTO is_admin
        FROM auth.users u
        WHERE u.id = current_user_id;
    END IF;

    -- Raise error if not admin (unless running directly in SQL editor)
    IF NOT is_admin AND current_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Only admins can access user data';
    END IF;

    -- Return user data
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        COALESCE(
            u.raw_app_meta_data->>'role',
            u.raw_app_meta_data->'claims'->>'role',
            u.raw_user_meta_data->>'role',
            u.raw_user_meta_data->'app_metadata'->>'role',
            'unassigned'
        ) as role,
        u.raw_app_meta_data,
        u.raw_user_meta_data,
        u.created_at,
        u.updated_at
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$;

-- Create a function to update a user's role
CREATE OR REPLACE FUNCTION update_user_role(
    user_id UUID,
    new_role TEXT
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the current user is an admin
    IF (auth.jwt() ->> 'role')::text != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;

    -- Update the user's role in app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = 
        CASE 
            WHEN raw_app_meta_data IS NULL THEN 
                jsonb_build_object('role', new_role)
            ELSE 
                raw_app_meta_data || jsonb_build_object('role', new_role)
        END
    WHERE id = user_id;

    -- If no rows were updated, raise an error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$;

-- Create a function to create a new user
CREATE OR REPLACE FUNCTION create_user(
    email TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if the current user is an admin
    IF (auth.jwt() ->> 'role')::text != 'admin' THEN
        RAISE EXCEPTION 'Only admins can create users';
    END IF;

    -- Create the user using auth.users
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        email,
        crypt(password, gen_salt('bf')),
        NOW(),
        jsonb_build_object('role', role),
        metadata,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_user_id;

    RETURN new_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Add comments to the functions
COMMENT ON FUNCTION get_users() IS 'Returns a list of users. Only accessible by admins when called from the application, but can be run directly in SQL editor for testing.';
COMMENT ON FUNCTION update_user_role(UUID, TEXT) IS 'Updates a user''s role. Only accessible by admins.';
COMMENT ON FUNCTION create_user(TEXT, TEXT, TEXT, JSONB) IS 'Creates a new user with the specified role and metadata. Only accessible by admins.'; 