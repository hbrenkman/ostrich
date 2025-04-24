/*
  # Create exec_sql function

  This migration creates a PostgreSQL function that allows executing arbitrary SQL
  statements. This is used by the migration system to run SQL migrations.
*/

-- Create the exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query;
  result := '{"success": true}'::jsonb;
  RETURN result;
END;
$$;