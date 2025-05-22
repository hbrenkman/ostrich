-- Enable the pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the create_user function to properly use pgcrypto
CREATE OR REPLACE FUNCTION public.create_user(
    email text,
    password text,
    role text DEFAULT 'unassigned'::text,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
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
        crypt(password, gen_salt('bf', 8)), -- Use pgcrypto's gen_salt with 8 rounds
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user(text, text, text, jsonb) TO authenticated; 