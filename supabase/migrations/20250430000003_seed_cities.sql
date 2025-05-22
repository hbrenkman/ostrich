/*
  # Seed cities table with major cities for existing metro areas

  This migration populates the cities table with major cities for the following metro areas:
  - California: Los Angeles, San Francisco, San Diego, Sacramento, San Jose
  - New York: New York City, Buffalo, Rochester, Syracuse, Albany
  - Texas: Houston, Dallas, Austin, San Antonio, Fort Worth
*/

-- Insert cities for California metro areas
DO $$
DECLARE
    la_id uuid;
    sf_id uuid;
    sd_id uuid;
    sac_id uuid;
    sj_id uuid;
    other_ca_id uuid;
BEGIN
    -- Get metro area IDs for California
    SELECT id INTO la_id FROM metro_areas WHERE name = 'Los Angeles' AND state_id IN (SELECT id FROM states WHERE name = 'California');
    SELECT id INTO sf_id FROM metro_areas WHERE name = 'San Francisco' AND state_id IN (SELECT id FROM states WHERE name = 'California');
    SELECT id INTO sd_id FROM metro_areas WHERE name = 'San Diego' AND state_id IN (SELECT id FROM states WHERE name = 'California');
    SELECT id INTO sac_id FROM metro_areas WHERE name = 'Sacramento' AND state_id IN (SELECT id FROM states WHERE name = 'California');
    SELECT id INTO sj_id FROM metro_areas WHERE name = 'San Jose' AND state_id IN (SELECT id FROM states WHERE name = 'California');
    SELECT id INTO other_ca_id FROM metro_areas WHERE name = 'Other' AND state_id IN (SELECT id FROM states WHERE name = 'California');

    -- Los Angeles Metro Area
    IF la_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (la_id, 'Los Angeles'),
            (la_id, 'Long Beach'),
            (la_id, 'Glendale'),
            (la_id, 'Santa Clarita'),
            (la_id, 'Palmdale'),
            (la_id, 'Lancaster'),
            (la_id, 'Pasadena'),
            (la_id, 'Torrance'),
            (la_id, 'Burbank'),
            (la_id, 'Santa Monica')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- San Francisco Metro Area
    IF sf_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (sf_id, 'San Francisco'),
            (sf_id, 'Oakland'),
            (sf_id, 'San Jose'),
            (sf_id, 'Berkeley'),
            (sf_id, 'Richmond'),
            (sf_id, 'San Mateo'),
            (sf_id, 'Daly City'),
            (sf_id, 'South San Francisco'),
            (sf_id, 'San Rafael'),
            (sf_id, 'Palo Alto')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- San Diego Metro Area
    IF sd_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (sd_id, 'San Diego'),
            (sd_id, 'Chula Vista'),
            (sd_id, 'Oceanside'),
            (sd_id, 'Escondido'),
            (sd_id, 'Carlsbad'),
            (sd_id, 'El Cajon'),
            (sd_id, 'Vista'),
            (sd_id, 'San Marcos'),
            (sd_id, 'Encinitas'),
            (sd_id, 'La Mesa')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Sacramento Metro Area
    IF sac_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (sac_id, 'Sacramento'),
            (sac_id, 'Elk Grove'),
            (sac_id, 'Roseville'),
            (sac_id, 'Folsom'),
            (sac_id, 'Citrus Heights'),
            (sac_id, 'Rancho Cordova'),
            (sac_id, 'West Sacramento'),
            (sac_id, 'Davis'),
            (sac_id, 'Woodland'),
            (sac_id, 'Rocklin')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- San Jose Metro Area
    IF sj_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (sj_id, 'San Jose'),
            (sj_id, 'Sunnyvale'),
            (sj_id, 'Santa Clara'),
            (sj_id, 'Mountain View'),
            (sj_id, 'Milpitas'),
            (sj_id, 'Cupertino'),
            (sj_id, 'Campbell'),
            (sj_id, 'Los Gatos'),
            (sj_id, 'Saratoga'),
            (sj_id, 'Morgan Hill')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;
END $$;

-- Insert cities for New York metro areas
DO $$
DECLARE
    nyc_id uuid;
    buf_id uuid;
    roc_id uuid;
    syr_id uuid;
    alb_id uuid;
    other_ny_id uuid;
BEGIN
    -- Get metro area IDs for New York
    SELECT id INTO nyc_id FROM metro_areas WHERE name = 'New York City' AND state_id IN (SELECT id FROM states WHERE name = 'New York');
    SELECT id INTO buf_id FROM metro_areas WHERE name = 'Buffalo' AND state_id IN (SELECT id FROM states WHERE name = 'New York');
    SELECT id INTO roc_id FROM metro_areas WHERE name = 'Rochester' AND state_id IN (SELECT id FROM states WHERE name = 'New York');
    SELECT id INTO syr_id FROM metro_areas WHERE name = 'Syracuse' AND state_id IN (SELECT id FROM states WHERE name = 'New York');
    SELECT id INTO alb_id FROM metro_areas WHERE name = 'Albany' AND state_id IN (SELECT id FROM states WHERE name = 'New York');
    SELECT id INTO other_ny_id FROM metro_areas WHERE name = 'Other' AND state_id IN (SELECT id FROM states WHERE name = 'New York');

    -- New York City Metro Area
    IF nyc_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (nyc_id, 'New York City'),
            (nyc_id, 'Brooklyn'),
            (nyc_id, 'Queens'),
            (nyc_id, 'Bronx'),
            (nyc_id, 'Staten Island'),
            (nyc_id, 'Jersey City'),
            (nyc_id, 'Newark'),
            (nyc_id, 'Yonkers'),
            (nyc_id, 'Paterson'),
            (nyc_id, 'Elizabeth')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Buffalo Metro Area
    IF buf_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (buf_id, 'Buffalo'),
            (buf_id, 'Niagara Falls'),
            (buf_id, 'Tonawanda'),
            (buf_id, 'West Seneca'),
            (buf_id, 'Cheektowaga'),
            (buf_id, 'Kenmore'),
            (buf_id, 'Lackawanna'),
            (buf_id, 'Amherst'),
            (buf_id, 'Grand Island'),
            (buf_id, 'Hamburg')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Rochester Metro Area
    IF roc_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (roc_id, 'Rochester'),
            (roc_id, 'Greece'),
            (roc_id, 'Irondequoit'),
            (roc_id, 'Henrietta'),
            (roc_id, 'Brighton'),
            (roc_id, 'Webster'),
            (roc_id, 'Penfield'),
            (roc_id, 'Gates'),
            (roc_id, 'Fairport'),
            (roc_id, 'Pittsford')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Syracuse Metro Area
    IF syr_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (syr_id, 'Syracuse'),
            (syr_id, 'Cicero'),
            (syr_id, 'Clay'),
            (syr_id, 'Manlius'),
            (syr_id, 'Camillus'),
            (syr_id, 'DeWitt'),
            (syr_id, 'Salina'),
            (syr_id, 'Geddes'),
            (syr_id, 'Onondaga'),
            (syr_id, 'Skaneateles')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Albany Metro Area
    IF alb_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (alb_id, 'Albany'),
            (alb_id, 'Schenectady'),
            (alb_id, 'Troy'),
            (alb_id, 'Colonie'),
            (alb_id, 'Bethlehem'),
            (alb_id, 'Guilderland'),
            (alb_id, 'Clifton Park'),
            (alb_id, 'Niskayuna'),
            (alb_id, 'East Greenbush'),
            (alb_id, 'Saratoga Springs')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;
END $$;

-- Insert cities for Texas metro areas
DO $$
DECLARE
    hou_id uuid;
    dal_id uuid;
    aus_id uuid;
    sa_id uuid;
    ftw_id uuid;
    other_tx_id uuid;
BEGIN
    -- Get metro area IDs for Texas
    SELECT id INTO hou_id FROM metro_areas WHERE name = 'Houston' AND state_id IN (SELECT id FROM states WHERE name = 'Texas');
    SELECT id INTO dal_id FROM metro_areas WHERE name = 'Dallas' AND state_id IN (SELECT id FROM states WHERE name = 'Texas');
    SELECT id INTO aus_id FROM metro_areas WHERE name = 'Austin' AND state_id IN (SELECT id FROM states WHERE name = 'Texas');
    SELECT id INTO sa_id FROM metro_areas WHERE name = 'San Antonio' AND state_id IN (SELECT id FROM states WHERE name = 'Texas');
    SELECT id INTO ftw_id FROM metro_areas WHERE name = 'Fort Worth' AND state_id IN (SELECT id FROM states WHERE name = 'Texas');
    SELECT id INTO other_tx_id FROM metro_areas WHERE name = 'Other' AND state_id IN (SELECT id FROM states WHERE name = 'Texas');

    -- Houston Metro Area
    IF hou_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (hou_id, 'Houston'),
            (hou_id, 'Sugar Land'),
            (hou_id, 'The Woodlands'),
            (hou_id, 'Pearland'),
            (hou_id, 'Spring'),
            (hou_id, 'Katy'),
            (hou_id, 'Cypress'),
            (hou_id, 'League City'),
            (hou_id, 'Baytown'),
            (hou_id, 'Conroe')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Dallas Metro Area
    IF dal_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (dal_id, 'Dallas'),
            (dal_id, 'Plano'),
            (dal_id, 'Garland'),
            (dal_id, 'Irving'),
            (dal_id, 'Grand Prairie'),
            (dal_id, 'McKinney'),
            (dal_id, 'Frisco'),
            (dal_id, 'Carrollton'),
            (dal_id, 'Richardson'),
            (dal_id, 'Allen')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Austin Metro Area
    IF aus_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (aus_id, 'Austin'),
            (aus_id, 'Round Rock'),
            (aus_id, 'Cedar Park'),
            (aus_id, 'Georgetown'),
            (aus_id, 'Pflugerville'),
            (aus_id, 'Leander'),
            (aus_id, 'San Marcos'),
            (aus_id, 'Kyle'),
            (aus_id, 'Buda'),
            (aus_id, 'Lakeway')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- San Antonio Metro Area
    IF sa_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (sa_id, 'San Antonio'),
            (sa_id, 'New Braunfels'),
            (sa_id, 'Schertz'),
            (sa_id, 'Cibolo'),
            (sa_id, 'Universal City'),
            (sa_id, 'Live Oak'),
            (sa_id, 'Converse'),
            (sa_id, 'Windcrest'),
            (sa_id, 'Alamo Heights'),
            (sa_id, 'Terrell Hills')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;

    -- Fort Worth Metro Area
    IF ftw_id IS NOT NULL THEN
        INSERT INTO cities (metro_area_id, name) VALUES
            (ftw_id, 'Fort Worth'),
            (ftw_id, 'Arlington'),
            (ftw_id, 'Mansfield'),
            (ftw_id, 'Keller'),
            (ftw_id, 'North Richland Hills'),
            (ftw_id, 'Haltom City'),
            (ftw_id, 'Euless'),
            (ftw_id, 'Bedford'),
            (ftw_id, 'Grapevine'),
            (ftw_id, 'Southlake')
        ON CONFLICT (metro_area_id, name) DO NOTHING;
    END IF;
END $$; 