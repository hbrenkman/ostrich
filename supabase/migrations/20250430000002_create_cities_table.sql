/*
  # Create cities table

  1. New Table
    - `cities`
      - `id` (uuid, primary key)
      - `metro_area_id` (uuid, references metro_areas)
      - `name` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on cities table
    - Add policy for authenticated users to read all cities
    - Add policy for admin and project_management users to insert/update
    - Add policy for admin users to delete
*/

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metro_area_id uuid REFERENCES metro_areas(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(metro_area_id, name)
);

-- Enable Row Level Security
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Cities are viewable by authenticated users"
    ON cities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Cities are editable by admin and project_management users"
    ON cities FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'project_management')
    );

CREATE POLICY "Cities are updatable by admin and project_management users"
    ON cities FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'project_management')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'project_management')
    );

CREATE POLICY "Cities are deletable by admin users"
    ON cities FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE cities IS 'Cities associated with metro areas';
COMMENT ON COLUMN cities.metro_area_id IS 'Reference to the metro area this city belongs to';
COMMENT ON COLUMN cities.name IS 'Name of the city';
COMMENT ON COLUMN cities.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN cities.updated_at IS 'Timestamp when the record was last updated';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cities_metro_area_id ON cities(metro_area_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Create function to get cities for a metro area
CREATE OR REPLACE FUNCTION get_cities_for_metro_area(p_metro_area_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'metro_area_id', c.metro_area_id,
            'created_at', c.created_at,
            'updated_at', c.updated_at
        )
    )
    INTO v_result
    FROM cities c
    WHERE c.metro_area_id = p_metro_area_id
    ORDER BY c.name;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$; 