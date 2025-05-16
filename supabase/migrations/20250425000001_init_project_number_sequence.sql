-- Insert initial row into project_number_sequence if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM project_number_sequence) THEN
    INSERT INTO project_number_sequence (current_number)
    VALUES (0);
  END IF;
END $$; 