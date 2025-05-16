-- Create project_number_sequence table
CREATE TABLE IF NOT EXISTS project_number_sequence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    current_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO project_number_sequence (current_number)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM project_number_sequence);

-- Create function to preview next project number
CREATE OR REPLACE FUNCTION preview_next_project_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT current_number + 1 INTO next_number
    FROM project_number_sequence
    FOR UPDATE;
    
    RETURN next_number;
END;
$$;

-- Create function to increment and get next project number
CREATE OR REPLACE FUNCTION increment_project_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    UPDATE project_number_sequence
    SET current_number = current_number + 1,
        updated_at = NOW()
    RETURNING current_number INTO next_number;
    
    RETURN next_number;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_project_number_sequence_updated_at
    BEFORE UPDATE ON project_number_sequence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE project_number_sequence ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Project number sequence is viewable by authenticated users"
    ON project_number_sequence
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Project number sequence is updatable by admin users"
    ON project_number_sequence
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin'); 