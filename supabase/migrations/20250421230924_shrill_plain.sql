/*
  # Create reference tables schema

  1. New Tables
    - `reference_tables`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `category` (text, not null)
      - `description` (text)
      - `entries` (jsonb, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `reference_tables` table
    - Add policy for authenticated users to read all reference tables
    - Add policy for admin users to insert, update, and delete reference tables
*/

-- Create reference_tables table
CREATE TABLE IF NOT EXISTS reference_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  entries jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reference_tables ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Reference tables are viewable by authenticated users"
  ON reference_tables
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reference tables are editable by admin users"
  ON reference_tables
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Reference tables are updatable by admin users"
  ON reference_tables
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Reference tables are deletable by admin users"
  ON reference_tables
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_reference_tables_updated_at
BEFORE UPDATE ON reference_tables
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO reference_tables (name, category, description, entries)
VALUES 
  ('Fee Multipliers', 'Fee Calculation', 'Base multipliers for calculating project fees based on complexity', 
   '[
     {"id": "1", "key": "Simple Complexity Project", "value": 1.2, "description": "Projects with standard requirements and minimal customization"},
     {"id": "2", "key": "Medium Complexity Project", "value": 1.5, "description": "Projects with moderate customization and technical requirements"},
     {"id": "3", "key": "Complex Project", "value": 1.8, "description": "Projects with extensive customization and advanced technical requirements"}
   ]'),
  ('Building Construction Rates', 'Rate Categories', 'Construction cost rates per square foot by building type',
   '[
     {"id": "1", "key": "Apartment", "value": "APT", "description": "Multi-family residential buildings - $225/sq.ft"},
     {"id": "2", "key": "Office", "value": "OFF", "description": "Commercial office spaces - $195/sq.ft"},
     {"id": "3", "key": "Medical Office", "value": "MED", "description": "Healthcare professional offices - $275/sq.ft"},
     {"id": "4", "key": "Dental Office", "value": "DEN", "description": "Dental clinics and practices - $265/sq.ft"},
     {"id": "5", "key": "Hospital", "value": "HOS", "description": "Medical treatment facilities - $425/sq.ft"},
     {"id": "6", "key": "Retail", "value": "RET", "description": "Shops and commercial retail spaces - $185/sq.ft"},
     {"id": "7", "key": "Factory", "value": "FAC", "description": "Manufacturing and industrial facilities - $155/sq.ft"},
     {"id": "8", "key": "Warehouse", "value": "WAR", "description": "Storage and distribution facilities - $125/sq.ft"},
     {"id": "9", "key": "Hotel", "value": "HOT", "description": "Lodging and hospitality buildings - $245/sq.ft"},
     {"id": "10", "key": "Recreational", "value": "REC", "description": "Sports and entertainment venues - $215/sq.ft"},
     {"id": "11", "key": "Church", "value": "CHU", "description": "Religious and worship facilities - $235/sq.ft"},
     {"id": "12", "key": "School", "value": "SCH", "description": "Educational institutions - $255/sq.ft"},
     {"id": "13", "key": "Laboratory", "value": "LAB", "description": "Research and testing facilities - $315/sq.ft"},
     {"id": "14", "key": "Data Center", "value": "DAT", "description": "IT infrastructure facilities - $385/sq.ft"},
     {"id": "15", "key": "Restaurant", "value": "RES", "description": "Food service establishments - $225/sq.ft"},
     {"id": "16", "key": "Residential", "value": "RSD", "description": "Single-family homes and dwellings - $205/sq.ft"}
   ]');