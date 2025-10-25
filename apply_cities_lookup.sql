-- Apply Cities Lookup Table to Supabase Database
-- Run this script in your Supabase SQL editor

-- Create Cities Lookup Table for Merchant Signup Form
-- This table will support city/country lookup functionality

-- Drop table if exists
DROP TABLE IF EXISTS cities_lookup CASCADE;

-- Create cities lookup table
CREATE TABLE cities_lookup (
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

-- Create indexes for better performance
CREATE INDEX idx_cities_lookup_city_name ON cities_lookup(city_name);
CREATE INDEX idx_cities_lookup_country_name ON cities_lookup(country_name);
CREATE INDEX idx_cities_lookup_city_country ON cities_lookup(city_name, country_name);

-- Enable RLS
ALTER TABLE cities_lookup ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Cities lookup is publicly readable" ON cities_lookup
    FOR SELECT USING (true);

-- Insert comprehensive cities data
INSERT INTO cities_lookup (city_name, country_name, country_code, state_province, population, is_capital, latitude, longitude) VALUES
-- Major US Cities
('New York', 'United States', 'USA', 'New York', 8336817, false, 40.7128, -74.0060),
('Los Angeles', 'United States', 'USA', 'California', 3979576, false, 34.0522, -118.2437),
('Chicago', 'United States', 'USA', 'Illinois', 2693976, false, 41.8781, -87.6298),
('Houston', 'United States', 'USA', 'Texas', 2320268, false, 29.7604, -95.3698),
('Phoenix', 'United States', 'USA', 'Arizona', 1680992, false, 33.4484, -112.0740),
('Philadelphia', 'United States', 'USA', 'Pennsylvania', 1584064, false, 39.9526, -75.1652),
('San Antonio', 'United States', 'USA', 'Texas', 1547253, false, 29.4241, -98.4936),
('San Diego', 'United States', 'USA', 'California', 1423851, false, 32.7157, -117.1611),
('Dallas', 'United States', 'USA', 'Texas', 1343573, false, 32.7767, -96.7970),
('San Jose', 'United States', 'USA', 'California', 1035317, false, 37.3382, -121.8863),
('Washington', 'United States', 'USA', 'District of Columbia', 705749, true, 38.9072, -77.0369),
('Boston', 'United States', 'USA', 'Massachusetts', 692600, false, 42.3601, -71.0589),
('Seattle', 'United States', 'USA', 'Washington', 744955, false, 47.6062, -122.3321),
('Denver', 'United States', 'USA', 'Colorado', 715522, false, 39.7392, -104.9903),
('Atlanta', 'United States', 'USA', 'Georgia', 498715, false, 33.7490, -84.3880),
('Miami', 'United States', 'USA', 'Florida', 467963, false, 25.7617, -80.1918),
('Las Vegas', 'United States', 'USA', 'Nevada', 641903, false, 36.1699, -115.1398),
('Portland', 'United States', 'USA', 'Oregon', 652503, false, 45.5152, -122.6784),
('Detroit', 'United States', 'USA', 'Michigan', 639111, false, 42.3314, -83.0458),
('Minneapolis', 'United States', 'USA', 'Minnesota', 429606, false, 44.9778, -93.2650),

-- Major European Cities
('London', 'United Kingdom', 'GBR', 'England', 8982000, true, 51.5074, -0.1278),
('Paris', 'France', 'FRA', 'Île-de-France', 2161000, true, 48.8566, 2.3522),
('Berlin', 'Germany', 'DEU', 'Berlin', 3669491, true, 52.5200, 13.4050),
('Madrid', 'Spain', 'ESP', 'Madrid', 3223334, true, 40.4168, -3.7038),
('Rome', 'Italy', 'ITA', 'Lazio', 2873000, true, 41.9028, 12.4964),
('Amsterdam', 'Netherlands', 'NLD', 'North Holland', 872680, true, 52.3676, 4.9041),
('Vienna', 'Austria', 'AUT', 'Vienna', 1911191, true, 48.2082, 16.3738),
('Prague', 'Czech Republic', 'CZE', 'Prague', 1308632, true, 50.0755, 14.4378),
('Warsaw', 'Poland', 'POL', 'Masovian', 1790658, true, 52.2297, 21.0122),
('Stockholm', 'Sweden', 'SWE', 'Stockholm', 975551, true, 59.3293, 18.0686),
('Copenhagen', 'Denmark', 'DNK', 'Capital Region', 632340, true, 55.6761, 12.5683),
('Oslo', 'Norway', 'NOR', 'Oslo', 697010, true, 59.9139, 10.7522),
('Helsinki', 'Finland', 'FIN', 'Uusimaa', 656229, true, 60.1699, 24.9384),
('Dublin', 'Ireland', 'IRL', 'Leinster', 1173179, true, 53.3498, -6.2603),
('Brussels', 'Belgium', 'BEL', 'Brussels', 1218255, true, 50.8503, 4.3517),
('Zurich', 'Switzerland', 'CHE', 'Zurich', 415367, false, 47.3769, 8.5417),
('Geneva', 'Switzerland', 'CHE', 'Geneva', 201818, false, 46.2044, 6.1432),
('Barcelona', 'Spain', 'ESP', 'Catalonia', 1636762, false, 41.3851, 2.1734),
('Milan', 'Italy', 'ITA', 'Lombardy', 1378689, false, 45.4642, 9.1900),
('Munich', 'Germany', 'DEU', 'Bavaria', 1484226, false, 48.1351, 11.5820),

-- Major Asian Cities
('Tokyo', 'Japan', 'JPN', 'Tokyo', 13929286, true, 35.6762, 139.6503),
('Shanghai', 'China', 'CHN', 'Shanghai', 24870895, false, 31.2304, 121.4737),
('Beijing', 'China', 'CHN', 'Beijing', 21540000, true, 39.9042, 116.4074),
('Mumbai', 'India', 'IND', 'Maharashtra', 12478447, false, 19.0760, 72.8777),
('Delhi', 'India', 'IND', 'Delhi', 32941000, true, 28.7041, 77.1025),
('Seoul', 'South Korea', 'KOR', 'Seoul', 9720846, true, 37.5665, 126.9780),
('Bangkok', 'Thailand', 'THA', 'Bangkok', 10539000, true, 13.7563, 100.5018),
('Singapore', 'Singapore', 'SGP', 'Singapore', 5453600, true, 1.3521, 103.8198),
('Hong Kong', 'Hong Kong', 'HKG', 'Hong Kong', 7500700, false, 22.3193, 114.1694),
('Dubai', 'United Arab Emirates', 'ARE', 'Dubai', 3331420, false, 25.2048, 55.2708),
('Kuala Lumpur', 'Malaysia', 'MYS', 'Kuala Lumpur', 1588750, true, 3.1390, 101.6869),
('Jakarta', 'Indonesia', 'IDN', 'Jakarta', 10560000, true, -6.2088, 106.8456),
('Manila', 'Philippines', 'PHL', 'Metro Manila', 13484425, true, 14.5995, 120.9842),
('Ho Chi Minh City', 'Vietnam', 'VNM', 'Ho Chi Minh City', 8993082, false, 10.8231, 106.6297),
('Taipei', 'Taiwan', 'TWN', 'Taipei', 2602418, true, 25.0330, 121.5654),
('Osaka', 'Japan', 'JPN', 'Osaka', 2691185, false, 34.6937, 135.5023),
('Kyoto', 'Japan', 'JPN', 'Kyoto', 1464890, false, 35.0116, 135.7681),
('Bangalore', 'India', 'IND', 'Karnataka', 12425304, false, 12.9716, 77.5946),
('Chennai', 'India', 'IND', 'Tamil Nadu', 10972000, false, 13.0827, 80.2707),
('Kolkata', 'India', 'IND', 'West Bengal', 14974073, false, 22.5726, 88.3639),

-- Major Canadian Cities
('Toronto', 'Canada', 'CAN', 'Ontario', 2930000, false, 43.6532, -79.3832),
('Vancouver', 'Canada', 'CAN', 'British Columbia', 675218, false, 49.2827, -123.1207),
('Montreal', 'Canada', 'CAN', 'Quebec', 1780000, false, 45.5017, -73.5673),
('Calgary', 'Canada', 'CAN', 'Alberta', 1306784, false, 51.0447, -114.0719),
('Ottawa', 'Canada', 'CAN', 'Ontario', 1017449, true, 45.4215, -75.6972),
('Edmonton', 'Canada', 'CAN', 'Alberta', 1010899, false, 53.5461, -113.4938),
('Winnipeg', 'Canada', 'CAN', 'Manitoba', 749607, false, 49.8951, -97.1384),
('Quebec City', 'Canada', 'CAN', 'Quebec', 549459, false, 46.8139, -71.2080),
('Hamilton', 'Canada', 'CAN', 'Ontario', 767000, false, 43.2557, -79.8711),
('Kitchener', 'Canada', 'CAN', 'Ontario', 256885, false, 43.4501, -80.4829),

-- Major Australian Cities
('Sydney', 'Australia', 'AUS', 'New South Wales', 5312163, false, -33.8688, 151.2093),
('Melbourne', 'Australia', 'AUS', 'Victoria', 5078193, false, -37.8136, 144.9631),
('Brisbane', 'Australia', 'AUS', 'Queensland', 2487098, false, -27.4698, 153.0251),
('Perth', 'Australia', 'AUS', 'Western Australia', 2085939, false, -31.9505, 115.8605),
('Adelaide', 'Australia', 'AUS', 'South Australia', 1359640, false, -34.9285, 138.6007),
('Canberra', 'Australia', 'AUS', 'Australian Capital Territory', 431380, true, -35.2809, 149.1300),
('Gold Coast', 'Australia', 'AUS', 'Queensland', 646983, false, -28.0167, 153.4000),
('Newcastle', 'Australia', 'AUS', 'New South Wales', 322278, false, -32.9267, 151.7789),
('Wollongong', 'Australia', 'AUS', 'New South Wales', 302739, false, -34.4278, 150.8931),
('Hobart', 'Australia', 'AUS', 'Tasmania', 240342, false, -42.8821, 147.3272),

-- Major South American Cities
('São Paulo', 'Brazil', 'BRA', 'São Paulo', 12396372, false, -23.5505, -46.6333),
('Rio de Janeiro', 'Brazil', 'BRA', 'Rio de Janeiro', 6747815, false, -22.9068, -43.1729),
('Buenos Aires', 'Argentina', 'ARG', 'Buenos Aires', 3075646, true, -34.6118, -58.3960),
('Lima', 'Peru', 'PER', 'Lima', 10750000, true, -12.0464, -77.0428),
('Bogotá', 'Colombia', 'COL', 'Bogotá', 7743955, true, 4.7110, -74.0721),
('Santiago', 'Chile', 'CHL', 'Santiago', 7000000, true, -33.4489, -70.6693),
('Caracas', 'Venezuela', 'VEN', 'Capital District', 2843428, true, 10.4806, -66.9036),
('Montevideo', 'Uruguay', 'URY', 'Montevideo', 1389516, true, -34.9011, -56.1645),
('La Paz', 'Bolivia', 'BOL', 'La Paz', 789585, true, -16.2902, -68.1332),
('Quito', 'Ecuador', 'ECU', 'Pichincha', 2011388, true, -0.1807, -78.4678),

-- Major African Cities
('Cairo', 'Egypt', 'EGY', 'Cairo', 20484965, true, 30.0444, 31.2357),
('Lagos', 'Nigeria', 'NGA', 'Lagos', 15388000, false, 6.5244, 3.3792),
('Johannesburg', 'South Africa', 'ZAF', 'Gauteng', 5634800, false, -26.2041, 28.0473),
('Cape Town', 'South Africa', 'ZAF', 'Western Cape', 4618000, false, -33.9249, 18.4241),
('Nairobi', 'Kenya', 'KEN', 'Nairobi', 4397073, true, -1.2921, 36.8219),
('Casablanca', 'Morocco', 'MAR', 'Casablanca-Settat', 3359818, false, 33.5731, -7.5898),
('Kinshasa', 'Democratic Republic of the Congo', 'COD', 'Kinshasa', 15000000, true, -4.4419, 15.2663),
('Addis Ababa', 'Ethiopia', 'ETH', 'Addis Ababa', 3384569, true, 9.1450, 38.7667),
('Tunis', 'Tunisia', 'TUN', 'Tunis', 1056247, true, 36.8065, 10.1815),
('Algiers', 'Algeria', 'DZA', 'Algiers', 3415811, true, 36.7372, 3.0865);

-- Create a function to search cities
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

-- Grant permissions
GRANT SELECT ON cities_lookup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_cities TO anon, authenticated;

-- Add comments
COMMENT ON TABLE cities_lookup IS 'Lookup table for cities and countries to support merchant signup form';
COMMENT ON FUNCTION search_cities IS 'Function to search cities by name, country, or state/province';

