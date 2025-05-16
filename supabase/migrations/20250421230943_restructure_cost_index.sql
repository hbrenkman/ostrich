-- Rename and restructure the cost index tables
-- First, create the new tables

-- States table
CREATE TABLE IF NOT EXISTS states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Metro areas table
CREATE TABLE IF NOT EXISTS metro_areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id uuid NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_other boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(state_id, name)
);

-- Construction index table
CREATE TABLE IF NOT EXISTS construction_index (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metro_area_id uuid NOT NULL REFERENCES metro_areas(id) ON DELETE CASCADE,
    index_value numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(metro_area_id)
);

-- Enable RLS on all tables
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_index ENABLE ROW LEVEL SECURITY;

-- Create policies for states table
CREATE POLICY "States are viewable by authenticated users"
    ON states FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "States are editable by admin users"
    ON states FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for metro_areas table
CREATE POLICY "Metro areas are viewable by authenticated users"
    ON metro_areas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Metro areas are editable by admin users"
    ON metro_areas FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for construction_index table
CREATE POLICY "Construction index is viewable by authenticated users"
    ON construction_index FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Construction index is editable by admin users"
    ON construction_index FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create triggers to update timestamps
CREATE TRIGGER update_states_updated_at
    BEFORE UPDATE ON states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metro_areas_updated_at
    BEFORE UPDATE ON metro_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_construction_index_updated_at
    BEFORE UPDATE ON construction_index
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrate data from existing tables
DO $$
DECLARE
    state_record RECORD;
    metro_record RECORD;
    state_id uuid;
    metro_id uuid;
BEGIN
    -- First, insert all states
    FOR state_record IN SELECT DISTINCT state FROM construction_index_states LOOP
        INSERT INTO states (name)
        VALUES (state_record.state)
        RETURNING id INTO state_id;
        
        -- Then insert metro areas for this state
        FOR metro_record IN 
            SELECT * FROM construction_index_metro_areas 
            WHERE state_id IN (
                SELECT id FROM construction_index_states 
                WHERE state = state_record.state
            )
        LOOP
            -- Insert metro area
            INSERT INTO metro_areas (state_id, name, is_other)
            VALUES (state_id, metro_record.name, metro_record.is_other)
            RETURNING id INTO metro_id;
            
            -- Insert construction index
            INSERT INTO construction_index (metro_area_id, index_value)
            VALUES (metro_id, metro_record.construction_index);
        END LOOP;
    END LOOP;
END $$;

-- Drop old tables after successful migration
DROP TABLE IF EXISTS construction_index_metro_areas;
DROP TABLE IF EXISTS construction_index_states; 