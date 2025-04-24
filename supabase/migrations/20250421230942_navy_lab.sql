/*
  # Create state cost index table

  1. New Tables
    - `state_cost_index`
      - `id` (uuid, primary key)
      - `state` (text, not null)
      - `metro_area` (text, not null)
      - `cost_index` (numeric, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `state_cost_index` table
    - Add policy for authenticated users to read all state cost index entries
    - Add policy for admin users to insert, update, and delete state cost index entries
*/

-- Create state_cost_index table
CREATE TABLE IF NOT EXISTS state_cost_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL,
  metro_area text NOT NULL,
  cost_index numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on state and metro_area
CREATE UNIQUE INDEX state_metro_unique_idx ON state_cost_index (state, metro_area);

-- Enable Row Level Security
ALTER TABLE state_cost_index ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "State cost index is viewable by authenticated users"
  ON state_cost_index
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "State cost index is editable by admin users"
  ON state_cost_index
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "State cost index is updatable by admin users"
  ON state_cost_index
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "State cost index is deletable by admin users"
  ON state_cost_index
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_state_cost_index_updated_at
BEFORE UPDATE ON state_cost_index
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();