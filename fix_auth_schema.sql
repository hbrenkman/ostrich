-- Update NULL confirmation tokens to empty strings
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;

-- Set default value for confirmation_token
ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';

-- Verify the changes
SELECT id, email, confirmation_token FROM auth.users WHERE confirmation_token IS NULL; 