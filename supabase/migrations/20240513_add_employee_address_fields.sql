/*
  # Add address fields to employees table

  1. Changes
    - Add address_line1 (text)
    - Add address_line2 (text, nullable)
    - Add city (text)
    - Add state (text)
    - Add zip (text)
    - Add indexes for city, state, and zip for faster lookups
*/

-- Add address columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip text;

-- Create indexes for faster address lookups
CREATE INDEX IF NOT EXISTS idx_employees_city ON employees(city);
CREATE INDEX IF NOT EXISTS idx_employees_state ON employees(state);
CREATE INDEX IF NOT EXISTS idx_employees_zip ON employees(zip);

-- Add a comment to the table explaining the address fields
COMMENT ON TABLE employees IS 'Employee information including address details';
COMMENT ON COLUMN employees.address_line1 IS 'Primary address line (street address)';
COMMENT ON COLUMN employees.address_line2 IS 'Secondary address line (apartment, suite, etc.)';
COMMENT ON COLUMN employees.city IS 'City name';
COMMENT ON COLUMN employees.state IS 'State or province code';
COMMENT ON COLUMN employees.zip IS 'Postal/ZIP code'; 