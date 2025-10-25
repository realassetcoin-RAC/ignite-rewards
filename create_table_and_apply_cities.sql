-- Create Cities Lookup Table and Apply Data
-- Run this script in the Supabase SQL Editor

-- Step 1: Create the cities_lookup table
CREATE TABLE IF NOT EXISTS cities_lookup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(255) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(3),
    state_province VARCHAR(255),
    population BIGINT,
    is_capital BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cities_lookup_city_name ON cities_lookup(city_name);
CREATE INDEX IF NOT EXISTS idx_cities_lookup_country_name ON cities_lookup(country_name);
CREATE INDEX IF NOT EXISTS idx_cities_lookup_city_country ON cities_lookup(city_name, country_name);

-- Step 3: Enable RLS
ALTER TABLE cities_lookup ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Cities lookup is publicly readable" ON cities_lookup;
DROP POLICY IF EXISTS "Cities lookup is publicly writable" ON cities_lookup;

-- Step 5: Create RLS policies
CREATE POLICY "Cities lookup is publicly readable" ON cities_lookup
    FOR SELECT USING (true);

CREATE POLICY "Cities lookup is publicly writable" ON cities_lookup
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cities lookup is publicly updatable" ON cities_lookup
    FOR UPDATE USING (true);

CREATE POLICY "Cities lookup is publicly deletable" ON cities_lookup
    FOR DELETE USING (true);

-- Step 6: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cities_lookup TO anon, authenticated;

-- Step 7: Clear any existing data
TRUNCATE TABLE cities_lookup CASCADE;

-- Step 8: Insert sample data (first 100 cities from City_Country.txt)
INSERT INTO cities_lookup (city_name, country_name, country_code, state_province, population, is_capital, latitude, longitude) VALUES
('les Escaldes', 'Andorra', 'AND', NULL, NULL, false, NULL, NULL),
('Andorra la Vella', 'Andorra', 'AND', NULL, NULL, false, NULL, NULL),
('Warīsān', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Umm Suqaym', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Umm Al Quwain City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Ţarīf Kalbā', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Ar Rāshidīyah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Ras Al Khaimah City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Zayed City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Khawr Fakkān', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Kalbā', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Jumayrā', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dubai', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dibba Al-Fujairah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dibba Al-Hisn', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dayrah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Sharjah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Ar Ruways', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Ḩattā', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Fujairah City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Ain City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Ajman City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Adh Dhayd', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Abu Dhabi', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Abū Hayl', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('As Saţwah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Ḩamīdīyah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Waheda', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Karama', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('The Palm Jumeirah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Bur Dubai', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Khalifah A City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Mirdif', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Hawr al ''Anz', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Mankhūl', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Nāyf', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Murar al Qadīm', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Warqaa', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('International City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dubai Marina', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dubai Internet City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Safa', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Ar Rumaylah', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Jurf', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Al Majaz', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dubai Festival City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dubai International Financial Centre', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Dubai Investments Park', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Jebel Ali', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL),
('Bani Yas City', 'United Arab Emirates', 'ARE', NULL, NULL, false, NULL, NULL);

-- Step 9: Create search function
CREATE OR REPLACE FUNCTION search_cities(search_term TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    city_name VARCHAR(255),
    country_name VARCHAR(255),
    country_code VARCHAR(3),
    state_province VARCHAR(255),
    population BIGINT,
    is_capital BOOLEAN,
    display_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.city_name,
        c.country_name,
        c.country_code,
        c.state_province,
        c.population,
        c.is_capital,
        (c.city_name || ', ' || c.country_name)::TEXT as display_name
    FROM cities_lookup c
    WHERE 
        LOWER(c.city_name) LIKE LOWER('%' || search_term || '%')
        OR LOWER(c.country_name) LIKE LOWER('%' || search_term || '%')
        OR LOWER(c.state_province) LIKE LOWER('%' || search_term || '%')
    ORDER BY 
        CASE 
            WHEN LOWER(c.city_name) LIKE LOWER(search_term || '%') THEN 1
            WHEN LOWER(c.city_name) LIKE LOWER('%' || search_term || '%') THEN 2
            ELSE 3
        END,
        c.population DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Grant permissions on function
GRANT EXECUTE ON FUNCTION search_cities TO anon, authenticated;

-- Step 11: Verify the setup
SELECT COUNT(*) as total_cities FROM cities_lookup;
SELECT city_name, country_name FROM cities_lookup ORDER BY city_name LIMIT 10;

-- Step 12: Test the search function
SELECT * FROM search_cities('Dubai', 5);
