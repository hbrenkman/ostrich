/*
  # Add location fields to projects table

  1. Changes
    - Add city_id (uuid, references cities)
    - Add address_line1 (text)
    - Add address_line2 (text, nullable)
    - Add zip (text)
    - Add indexes for faster lookups
*/

-- Add location columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS zip text;

-- Create indexes for faster address lookups
CREATE INDEX IF NOT EXISTS idx_projects_city_id ON projects(city_id);
CREATE INDEX IF NOT EXISTS idx_projects_zip ON projects(zip);

-- Add comments to explain the location fields
COMMENT ON TABLE projects IS 'Project information including location details';
COMMENT ON COLUMN projects.city_id IS 'Reference to the city where the project is located';
COMMENT ON COLUMN projects.address_line1 IS 'Primary address line (street address)';
COMMENT ON COLUMN projects.address_line2 IS 'Secondary address line (suite, unit, etc.)';
COMMENT ON COLUMN projects.zip IS 'Postal/ZIP code'; 