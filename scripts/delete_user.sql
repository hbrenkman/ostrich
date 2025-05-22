-- Function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION delete_user(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user's ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;

    -- Delete from project_team_members
    DELETE FROM project_team_members WHERE user_id = target_user_id;

    -- Delete from projects (created_by and updated_by references)
    UPDATE projects 
    SET created_by = NULL, updated_by = NULL 
    WHERE created_by = target_user_id OR updated_by = target_user_id;

    -- Finally, delete the user from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;

    RAISE NOTICE 'Successfully deleted user % and all related data', user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user(text) TO authenticated; 