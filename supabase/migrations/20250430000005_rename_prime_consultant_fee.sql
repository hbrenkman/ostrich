-- Rename prime_consultant_fee column to prime_consultant_rate
ALTER TABLE design_fee_scale 
RENAME COLUMN prime_consultant_fee TO prime_consultant_rate;

-- Update any existing policies or triggers if they reference the old column name
-- (In this case, no policies or triggers reference the column name directly) 