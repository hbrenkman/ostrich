/*
  # Create design fee scale table

  1. New Tables
    - `design_fee_scale`
      - `id` (integer, primary key)
      - `construction_cost` (numeric, not null)
      - `prime_consultant_fee` (numeric, not null)
      - `fraction_of_prime_rate_mechanical` (numeric, not null)
      - `fraction_of_prime_rate_plumbing` (numeric, not null)
      - `fraction_of_prime_rate_electrical` (numeric, not null)
      - `fraction_of_prime_rate_structural` (numeric, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `design_fee_scale` table
    - Add policy for authenticated users to read all fee scales
    - Add policy for admin users to insert, update, and delete fee scales
*/

-- Create design_fee_scale table
CREATE TABLE IF NOT EXISTS design_fee_scale (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  construction_cost numeric NOT NULL,
  prime_consultant_fee numeric NOT NULL,
  fraction_of_prime_rate_mechanical numeric NOT NULL,
  fraction_of_prime_rate_plumbing numeric NOT NULL,
  fraction_of_prime_rate_electrical numeric NOT NULL,
  fraction_of_prime_rate_structural numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE design_fee_scale ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Design fee scales are viewable by authenticated users"
  ON design_fee_scale
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Design fee scales are editable by admin users"
  ON design_fee_scale
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_design_fee_scale_updated_at
  BEFORE UPDATE ON design_fee_scale
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial design fee scale data
INSERT INTO design_fee_scale (
  construction_cost,
  prime_consultant_fee,
  fraction_of_prime_rate_mechanical,
  fraction_of_prime_rate_plumbing,
  fraction_of_prime_rate_electrical,
  fraction_of_prime_rate_structural
) VALUES
  (100000, 10.0, 0.85, 0.75, 0.80, 0.90),
  (250000, 9.5, 0.85, 0.75, 0.80, 0.90),
  (500000, 9.0, 0.85, 0.75, 0.80, 0.90),
  (1000000, 8.5, 0.85, 0.75, 0.80, 0.90),
  (2500000, 8.0, 0.85, 0.75, 0.80, 0.90),
  (5000000, 7.5, 0.85, 0.75, 0.80, 0.90),
  (10000000, 7.0, 0.85, 0.75, 0.80, 0.90),
  (25000000, 6.5, 0.85, 0.75, 0.80, 0.90),
  (50000000, 6.0, 0.85, 0.75, 0.80, 0.90),
  (100000000, 5.5, 0.85, 0.75, 0.80, 0.90)
ON CONFLICT (construction_cost) DO UPDATE SET
  prime_consultant_fee = EXCLUDED.prime_consultant_fee,
  fraction_of_prime_rate_mechanical = EXCLUDED.fraction_of_prime_rate_mechanical,
  fraction_of_prime_rate_plumbing = EXCLUDED.fraction_of_prime_rate_plumbing,
  fraction_of_prime_rate_electrical = EXCLUDED.fraction_of_prime_rate_electrical,
  fraction_of_prime_rate_structural = EXCLUDED.fraction_of_prime_rate_structural,
  updated_at = now(); 