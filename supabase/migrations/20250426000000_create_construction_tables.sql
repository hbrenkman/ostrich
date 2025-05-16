/*
  # Create construction costs tables

  1. New Tables
    - `building_categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `building_types`
      - `id` (uuid, primary key)
      - `category_id` (uuid, references building_categories)
      - `name` (text, not null)
      - `height` (numeric)
      - `description` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `construction_cost_types`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `construction_costs`
      - `id` (uuid, primary key)
      - `building_type_id` (uuid, references building_types)
      - `year` (integer, not null)
      - `total_cost_per_sqft` (numeric, not null)
      - `cost_type_id` (uuid, references construction_cost_types)
      - `percentage` (numeric)
      - `cost_per_sqft` (numeric)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on all tables
    - Add policy for authenticated users to read all tables
    - Add policy for admin users to insert, update, and delete
*/

-- Create building_categories table
CREATE TABLE IF NOT EXISTS building_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create building_types table
CREATE TABLE IF NOT EXISTS building_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES building_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  height numeric,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Create construction_cost_types table
CREATE TABLE IF NOT EXISTS construction_cost_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create construction_costs table
CREATE TABLE IF NOT EXISTS construction_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_type_id uuid REFERENCES building_types(id) ON DELETE CASCADE,
  year integer NOT NULL,
  total_cost_per_sqft numeric NOT NULL,
  cost_type_id uuid REFERENCES construction_cost_types(id) ON DELETE CASCADE,
  percentage numeric,
  cost_per_sqft numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(building_type_id, year, cost_type_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE building_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_cost_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_costs ENABLE ROW LEVEL SECURITY;

-- Create policies for building_categories
CREATE POLICY "Building categories are viewable by authenticated users"
  ON building_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Building categories are editable by admin users"
  ON building_categories FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for building_types
CREATE POLICY "Building types are viewable by authenticated users"
  ON building_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Building types are editable by admin users"
  ON building_types FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for construction_cost_types
CREATE POLICY "Construction cost types are viewable by authenticated users"
  ON construction_cost_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Construction cost types are editable by admin users"
  ON construction_cost_types FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for construction_costs
CREATE POLICY "Construction costs are viewable by authenticated users"
  ON construction_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Construction costs are editable by admin users"
  ON construction_costs FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create triggers to update timestamps
CREATE TRIGGER update_building_categories_updated_at
  BEFORE UPDATE ON building_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_building_types_updated_at
  BEFORE UPDATE ON building_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_construction_cost_types_updated_at
  BEFORE UPDATE ON construction_cost_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_construction_costs_updated_at
  BEFORE UPDATE ON construction_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial building categories
INSERT INTO building_categories (name, description) VALUES
  ('Commercial', 'Commercial buildings including offices, retail, and mixed-use'),
  ('Residential', 'Residential buildings including apartments, condos, and houses'),
  ('Industrial', 'Industrial buildings including warehouses, factories, and distribution centers'),
  ('Healthcare', 'Healthcare facilities including hospitals, clinics, and medical offices'),
  ('Educational', 'Educational facilities including schools, universities, and training centers'),
  ('Hospitality', 'Hospitality buildings including hotels, restaurants, and entertainment venues'),
  ('Institutional', 'Institutional buildings including government, religious, and cultural facilities')
ON CONFLICT (name) DO NOTHING;

-- Insert initial construction cost types
INSERT INTO construction_cost_types (name, description) VALUES
  ('Hard Costs', 'Direct construction costs including materials and labor'),
  ('Soft Costs', 'Indirect costs including design, permits, and fees'),
  ('Site Work', 'Site preparation and infrastructure costs'),
  ('Interior Finishes', 'Interior construction and finishing costs'),
  ('MEP', 'Mechanical, electrical, and plumbing systems'),
  ('Structure', 'Building structure and foundation costs'),
  ('Envelope', 'Building envelope and exterior costs')
ON CONFLICT (name) DO NOTHING; 