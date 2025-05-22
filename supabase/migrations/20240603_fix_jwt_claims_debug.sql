-- Drop functions in correct order (dependent functions first)
DROP FUNCTION IF EXISTS test_role_check();
DROP FUNCTION IF EXISTS check_database_config();
DROP FUNCTION IF EXISTS check_request_headers();
DROP FUNCTION IF EXISTS check_supabase_jwt_config();
DROP FUNCTION IF EXISTS debug_jwt_claims();
DROP FUNCTION IF EXISTS get_user_role();

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

-- Create a function to check database configuration
CREATE OR REPLACE FUNCTION check_database_config()
RETURNS TABLE (
    setting_name text,
    setting_value text,
    description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 'database.role'::text,
           current_user::text,
           'Current database role'::text
    UNION ALL
    SELECT 'database.schema'::text,
           current_schema::text,
           'Current database schema'::text
    UNION ALL
    SELECT 'database.jwt_secret'::text,
           current_setting('app.settings.jwt_secret', true)::text,
           'JWT secret from app settings'::text
    UNION ALL
    SELECT 'database.jwt_audience'::text,
           current_setting('app.settings.jwt_audience', true)::text,
           'JWT audience from app settings'::text
    UNION ALL
    SELECT 'database.jwt_issuer'::text,
           current_setting('app.settings.jwt_issuer', true)::text,
           'JWT issuer from app settings'::text
    UNION ALL
    SELECT 'database.jwt_exp'::text,
           current_setting('app.settings.jwt_exp', true)::text,
           'JWT expiration from app settings'::text
    UNION ALL
    SELECT 'database.jwt_claims'::text,
           current_setting('request.jwt.claims', true)::text,
           'JWT claims from request'::text
    UNION ALL
    SELECT 'database.jwt_role'::text,
           current_setting('request.jwt.role', true)::text,
           'JWT role from request'::text
    UNION ALL
    SELECT 'database.jwt_user_id'::text,
           current_setting('request.jwt.user_id', true)::text,
           'JWT user ID from request'::text
    UNION ALL
    SELECT 'database.jwt_email'::text,
           current_setting('request.jwt.email', true)::text,
           'JWT email from request'::text
    UNION ALL
    SELECT 'database.jwt_raw'::text,
           current_setting('request.jwt.claim', true)::text,
           'Raw JWT from request'::text
    UNION ALL
    SELECT 'database.jwt_headers'::text,
           current_setting('request.headers', true)::text,
           'Request headers'::text
    UNION ALL
    SELECT 'database.jwt_cookies'::text,
           current_setting('request.cookies', true)::text,
           'Request cookies'::text;
END;
$$;

-- Create a function to check request headers and cookies
CREATE OR REPLACE FUNCTION check_request_headers()
RETURNS TABLE (
    header_name text,
    header_value text,
    description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 'authorization'::text,
           current_setting('request.headers.authorization', true)::text,
           'Authorization header'::text
    UNION ALL
    SELECT 'cookie'::text,
           current_setting('request.headers.cookie', true)::text,
           'Cookie header'::text
    UNION ALL
    SELECT 'host'::text,
           current_setting('request.headers.host', true)::text,
           'Host header'::text
    UNION ALL
    SELECT 'origin'::text,
           current_setting('request.headers.origin', true)::text,
           'Origin header'::text
    UNION ALL
    SELECT 'referer'::text,
           current_setting('request.headers.referer', true)::text,
           'Referer header'::text
    UNION ALL
    SELECT 'user-agent'::text,
           current_setting('request.headers.user-agent', true)::text,
           'User-Agent header'::text
    UNION ALL
    SELECT 'x-client-info'::text,
           current_setting('request.headers.x-client-info', true)::text,
           'Client info header'::text
    UNION ALL
    SELECT 'x-application-name'::text,
           current_setting('request.headers.x-application-name', true)::text,
           'Application name header'::text;
END;
$$;

-- Create a function to check Supabase JWT configuration
CREATE OR REPLACE FUNCTION check_supabase_jwt_config()
RETURNS TABLE (
    setting_name text,
    setting_value text,
    description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 'jwt_secret'::text,
           current_setting('app.settings.jwt_secret', true)::text,
           'JWT secret used for signing tokens'::text
    UNION ALL
    SELECT 'jwt_audience'::text,
           current_setting('app.settings.jwt_audience', true)::text,
           'JWT audience claim'::text
    UNION ALL
    SELECT 'jwt_issuer'::text,
           current_setting('app.settings.jwt_issuer', true)::text,
           'JWT issuer claim'::text
    UNION ALL
    SELECT 'request.jwt.claim'::text,
           current_setting('request.jwt.claim', true)::text,
           'Raw JWT claim from request'::text
    UNION ALL
    SELECT 'request.jwt.claims'::text,
           current_setting('request.jwt.claims', true)::text,
           'Parsed JWT claims from request'::text
    UNION ALL
    SELECT 'request.jwt.role'::text,
           current_setting('request.jwt.role', true)::text,
           'JWT role claim'::text
    UNION ALL
    SELECT 'request.jwt.user_id'::text,
           current_setting('request.jwt.user_id', true)::text,
           'JWT user ID claim'::text
    UNION ALL
    SELECT 'request.jwt.email'::text,
           current_setting('request.jwt.email', true)::text,
           'JWT email claim'::text;
END;
$$;

-- Create a debug function to check JWT claims with more detail
CREATE OR REPLACE FUNCTION debug_jwt_claims()
RETURNS TABLE (
    path text,
    value text,
    token_info text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    jwt_token text;
    jwt_header jsonb;
    jwt_payload jsonb;
    jwt_signature text;
BEGIN
    -- Get the raw JWT token from the request
    jwt_token := current_setting('request.jwt.claim', true);
    
    -- Try to decode the JWT if it exists
    IF jwt_token IS NOT NULL THEN
        BEGIN
            -- Split the JWT into its parts
            jwt_header := decode(split_part(jwt_token, '.', 1), 'base64')::jsonb;
            jwt_payload := decode(split_part(jwt_token, '.', 2), 'base64')::jsonb;
            jwt_signature := split_part(jwt_token, '.', 3);
        EXCEPTION WHEN OTHERS THEN
            jwt_header := NULL;
            jwt_payload := NULL;
            jwt_signature := NULL;
        END;
    END IF;

    RETURN QUERY
    SELECT 'raw_token'::text as path,
           jwt_token as value,
           'Raw JWT token from request'::text as token_info
    UNION ALL
    SELECT 'jwt_header'::text,
           jwt_header::text,
           'Decoded JWT header'::text
    UNION ALL
    SELECT 'jwt_payload'::text,
           jwt_payload::text,
           'Decoded JWT payload'::text
    UNION ALL
    SELECT 'jwt_signature'::text,
           jwt_signature,
           'JWT signature'::text
    UNION ALL
    SELECT 'app_metadata.claims.role'::text,
           (auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role'),
           'Role from app_metadata.claims'::text
    UNION ALL
    SELECT 'app_metadata.role'::text,
           (auth.jwt() -> 'app_metadata' ->> 'role'),
           'Role from app_metadata'::text
    UNION ALL
    SELECT 'user_metadata.app_metadata.role'::text,
           (auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role'),
           'Role from user_metadata.app_metadata'::text
    UNION ALL
    SELECT 'user_metadata.role'::text,
           (auth.jwt() -> 'user_metadata' ->> 'role'),
           'Role from user_metadata'::text
    UNION ALL
    SELECT 'direct.role'::text,
           (auth.jwt() ->> 'role'),
           'Role from direct JWT claim'::text
    UNION ALL
    SELECT 'full_jwt'::text,
           auth.jwt()::text,
           'Full JWT from auth.jwt()'::text;
END;
$$;

-- Create a function to test role checking
CREATE OR REPLACE FUNCTION test_role_check()
RETURNS TABLE (
    role_path text,
    has_role boolean,
    required_roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    -- Get the role from all possible paths
    SELECT COALESCE(
        (auth.jwt() -> 'app_metadata' -> 'claims' ->> 'role'),
        (auth.jwt() -> 'app_metadata' ->> 'role'),
        (auth.jwt() -> 'user_metadata' -> 'app_metadata' ->> 'role'),
        (auth.jwt() -> 'user_metadata' ->> 'role'),
        (auth.jwt() ->> 'role')
    ) INTO user_role;

    -- Return test results
    RETURN QUERY
    SELECT 'admin'::text as role_path,
           user_role = 'admin' as has_role,
           ARRAY['admin']::text[] as required_roles
    UNION ALL
    SELECT 'project_management'::text,
           user_role = 'project_management',
           ARRAY['project_management']::text[]
    UNION ALL
    SELECT 'admin_or_project_management'::text,
           user_role = ANY(ARRAY['admin', 'project_management']),
           ARRAY['admin', 'project_management']::text[];
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_jwt_claims() TO authenticated;
GRANT EXECUTE ON FUNCTION check_supabase_jwt_config() TO authenticated;
GRANT EXECUTE ON FUNCTION check_request_headers() TO authenticated;
GRANT EXECUTE ON FUNCTION check_database_config() TO authenticated;
GRANT EXECUTE ON FUNCTION test_role_check() TO authenticated; 