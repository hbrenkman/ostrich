/*
  # Create fee duplicate structure table

  1. New Tables
    - `fee_duplicate_structures`
      - `id` (integer, primary key, not null)
      - `rate` (numeric, not null)
      - `created_at` (timestamp without time zone, default CURRENT_TIMESTAMP)
  2. Security
    - Enable RLS on `fee_duplicate_structures` table
    - Add policy for admin/management users to have full access
    - Add policy for project managers to have read-only access
*/

-- Create fee_duplicate_structures table
CREATE TABLE IF NOT EXISTS fee_duplicate_structures (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  rate numeric NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE fee_duplicate_structures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "admin_management_full_access"
  ON fee_duplicate_structures
  FOR ALL
  TO public
  USING ((jwt() ->> 'role') = ANY (ARRAY['admin', 'management']))
  WITH CHECK ((jwt() ->> 'role') = ANY (ARRAY['admin', 'management']));

CREATE POLICY "project_manager_read_only"
  ON fee_duplicate_structures
  FOR SELECT
  TO public
  USING ((jwt() ->> 'role') = 'project_manager');

-- Insert initial rates (using 0.75 multiplier for each duplicate)
INSERT INTO fee_duplicate_structures (rate) VALUES
  (1.000000),    -- id=1: Parent building (original)
  (0.750000),    -- id=2: First duplicate (0.75^1)
  (0.562500),    -- id=3: Second duplicate (0.75^2)
  (0.421875),    -- id=4: Third duplicate (0.75^3)
  (0.316406),    -- id=5: Fourth duplicate (0.75^4)
  (0.237305),    -- id=6: Fifth duplicate (0.75^5)
  (0.177979),    -- id=7: Sixth duplicate (0.75^6)
  (0.133484),    -- id=8: Seventh duplicate (0.75^7)
  (0.100113),    -- id=9: Eighth duplicate (0.75^8)
  (0.075085);    -- id=10: Ninth duplicate (0.75^9) 