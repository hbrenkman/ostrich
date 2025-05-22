-- Check the column definition
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users' 
AND column_name = 'confirmation_token';

-- Check for any NULL values
SELECT COUNT(*) as null_count 
FROM auth.users 
WHERE confirmation_token IS NULL;

-- Sample some records
SELECT id, email, confirmation_token 
FROM auth.users 
LIMIT 5; 