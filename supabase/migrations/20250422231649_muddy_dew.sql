/*
  # Create assets table

  1. New Tables
    - `assets`
      - `id` (uuid, primary key)
      - `number` (text, not null, unique)
      - `description` (text, not null)
      - `designation` (text, not null)
      - `location` (text)
      - `purchase_value` (numeric)
      - `purchase_date` (date)
      - `status` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `assets` table
    - Add policy for authenticated users to read all assets
    - Add policy for admin users to insert, update, and delete assets
*/

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  description text NOT NULL,
  designation text NOT NULL,
  location text,
  purchase_value numeric,
  purchase_date date,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Assets are viewable by authenticated users"
  ON assets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Assets are editable by admin users"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Assets are updatable by admin users"
  ON assets
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Assets are deletable by admin users"
  ON assets
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assets_updated_at') THEN
    CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;