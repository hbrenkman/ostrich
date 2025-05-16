-- Drop the existing unique constraint on number
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_number_key;

-- Add a composite unique constraint on (number, revision)
ALTER TABLE projects ADD CONSTRAINT projects_number_revision_key UNIQUE (number, revision);

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_projects_number_revision ON projects(number, revision); 