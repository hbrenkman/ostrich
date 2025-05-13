-- Create a debug version of get_user_role that logs its attempts
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_value text;
    jwt_data jsonb;
BEGIN
    -- Log the entire JWT for debugging
    BEGIN
        jwt_data := jwt();
        RAISE LOG 'Full JWT data: %', jwt_data;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error getting JWT: %', SQLERRM;
    END;

    -- Try the new path first (app_metadata.claims.role)
    BEGIN
        role_value := (jwt_data -> 'app_metadata' -> 'claims' ->> 'role');
        RAISE LOG 'Attempt 1 (app_metadata.claims.role): %', role_value;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error in attempt 1: %', SQLERRM;
        role_value := NULL;
    END;

    -- If that didn't work, try the old path (direct role)
    IF role_value IS NULL THEN
        BEGIN
            role_value := (jwt_data ->> 'role');
            RAISE LOG 'Attempt 2 (direct role): %', role_value;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error in attempt 2: %', SQLERRM;
            role_value := NULL;
        END;
    END IF;

    -- If that didn't work, try auth.jwt()
    IF role_value IS NULL THEN
        BEGIN
            role_value := (auth.jwt() ->> 'role');
            RAISE LOG 'Attempt 3 (auth.jwt role): %', role_value;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error in attempt 3: %', SQLERRM;
            role_value := NULL;
        END;
    END IF;

    -- Try app_metadata.role directly
    IF role_value IS NULL THEN
        BEGIN
            role_value := (jwt_data -> 'app_metadata' ->> 'role');
            RAISE LOG 'Attempt 4 (app_metadata.role): %', role_value;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error in attempt 4: %', SQLERRM;
            role_value := NULL;
        END;
    END IF;

    -- Try user_metadata.role
    IF role_value IS NULL THEN
        BEGIN
            role_value := (jwt_data -> 'user_metadata' ->> 'role');
            RAISE LOG 'Attempt 5 (user_metadata.role): %', role_value;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error in attempt 5: %', SQLERRM;
            role_value := NULL;
        END;
    END IF;

    RAISE LOG 'Final role value: %', role_value;
    RETURN role_value;
END;
$$; 