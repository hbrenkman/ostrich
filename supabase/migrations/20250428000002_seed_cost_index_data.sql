-- Seed initial data for cost index tables
-- This migration adds sample data for states, metro areas, and construction indices

-- Insert states
INSERT INTO states (name) VALUES
  ('Alabama'),
  ('Alaska'),
  ('Arizona'),
  ('Arkansas'),
  ('California'),
  ('Colorado'),
  ('Connecticut'),
  ('Delaware'),
  ('Florida'),
  ('Georgia'),
  ('Hawaii'),
  ('Idaho'),
  ('Illinois'),
  ('Indiana'),
  ('Iowa'),
  ('Kansas'),
  ('Kentucky'),
  ('Louisiana'),
  ('Maine'),
  ('Maryland'),
  ('Massachusetts'),
  ('Michigan'),
  ('Minnesota'),
  ('Mississippi'),
  ('Missouri'),
  ('Montana'),
  ('Nebraska'),
  ('Nevada'),
  ('New Hampshire'),
  ('New Jersey'),
  ('New Mexico'),
  ('New York'),
  ('North Carolina'),
  ('North Dakota'),
  ('Ohio'),
  ('Oklahoma'),
  ('Oregon'),
  ('Pennsylvania'),
  ('Rhode Island'),
  ('South Carolina'),
  ('South Dakota'),
  ('Tennessee'),
  ('Texas'),
  ('Utah'),
  ('Vermont'),
  ('Virginia'),
  ('Washington'),
  ('West Virginia'),
  ('Wisconsin'),
  ('Wyoming')
ON CONFLICT (name) DO NOTHING;

-- Insert metro areas for each state
DO $$
DECLARE
    state_record RECORD;
    state_id uuid;
BEGIN
    FOR state_record IN SELECT id, name FROM states LOOP
        -- Get the state ID
        state_id := state_record.id;
        
        -- Insert metro areas for this state
        -- Using a base index value of 100 for the state's primary metro
        -- Other metros are adjusted based on relative cost differences
        
        CASE state_record.name
            WHEN 'California' THEN
                INSERT INTO metro_areas (state_id, name, is_other) VALUES
                    (state_id, 'Los Angeles', false),
                    (state_id, 'San Francisco', false),
                    (state_id, 'San Diego', false),
                    (state_id, 'Sacramento', false),
                    (state_id, 'San Jose', false),
                    (state_id, 'Other', true)
                ON CONFLICT (state_id, name) DO NOTHING;
                
                -- Insert construction indices
                WITH metro_data AS (
                    SELECT id, name FROM metro_areas WHERE state_id = state_id
                )
                INSERT INTO construction_index (metro_area_id, index_value)
                SELECT 
                    id,
                    CASE name
                        WHEN 'Los Angeles' THEN 135.0
                        WHEN 'San Francisco' THEN 145.0
                        WHEN 'San Diego' THEN 130.0
                        WHEN 'Sacramento' THEN 120.0
                        WHEN 'San Jose' THEN 140.0
                        WHEN 'Other' THEN 115.0
                    END
                FROM metro_data
                ON CONFLICT (metro_area_id) DO NOTHING;
                
            WHEN 'New York' THEN
                INSERT INTO metro_areas (state_id, name, is_other) VALUES
                    (state_id, 'New York City', false),
                    (state_id, 'Buffalo', false),
                    (state_id, 'Rochester', false),
                    (state_id, 'Syracuse', false),
                    (state_id, 'Albany', false),
                    (state_id, 'Other', true)
                ON CONFLICT (state_id, name) DO NOTHING;
                
                -- Insert construction indices
                WITH metro_data AS (
                    SELECT id, name FROM metro_areas WHERE state_id = state_id
                )
                INSERT INTO construction_index (metro_area_id, index_value)
                SELECT 
                    id,
                    CASE name
                        WHEN 'New York City' THEN 150.0
                        WHEN 'Buffalo' THEN 110.0
                        WHEN 'Rochester' THEN 105.0
                        WHEN 'Syracuse' THEN 100.0
                        WHEN 'Albany' THEN 105.0
                        WHEN 'Other' THEN 95.0
                    END
                FROM metro_data
                ON CONFLICT (metro_area_id) DO NOTHING;
                
            WHEN 'Texas' THEN
                INSERT INTO metro_areas (state_id, name, is_other) VALUES
                    (state_id, 'Houston', false),
                    (state_id, 'Dallas', false),
                    (state_id, 'Austin', false),
                    (state_id, 'San Antonio', false),
                    (state_id, 'Fort Worth', false),
                    (state_id, 'Other', true)
                ON CONFLICT (state_id, name) DO NOTHING;
                
                -- Insert construction indices
                WITH metro_data AS (
                    SELECT id, name FROM metro_areas WHERE state_id = state_id
                )
                INSERT INTO construction_index (metro_area_id, index_value)
                SELECT 
                    id,
                    CASE name
                        WHEN 'Houston' THEN 110.0
                        WHEN 'Dallas' THEN 115.0
                        WHEN 'Austin' THEN 120.0
                        WHEN 'San Antonio' THEN 105.0
                        WHEN 'Fort Worth' THEN 110.0
                        WHEN 'Other' THEN 95.0
                    END
                FROM metro_data
                ON CONFLICT (metro_area_id) DO NOTHING;
                
            ELSE
                -- For other states, create a primary metro and "Other" category
                INSERT INTO metro_areas (state_id, name, is_other) VALUES
                    (state_id, state_record.name || ' Metro', false),
                    (state_id, 'Other', true)
                ON CONFLICT (state_id, name) DO NOTHING;
                
                -- Insert construction indices with a base value of 100
                WITH metro_data AS (
                    SELECT id, name FROM metro_areas WHERE state_id = state_id
                )
                INSERT INTO construction_index (metro_area_id, index_value)
                SELECT 
                    id,
                    CASE name
                        WHEN state_record.name || ' Metro' THEN 100.0
                        WHEN 'Other' THEN 90.0
                    END
                FROM metro_data
                ON CONFLICT (metro_area_id) DO NOTHING;
        END CASE;
    END LOOP;
END $$; 