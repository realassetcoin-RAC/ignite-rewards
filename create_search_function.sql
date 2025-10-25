-- Create search function for cities
CREATE OR REPLACE FUNCTION search_cities(
    search_term TEXT, 
    limit_count INTEGER DEFAULT 10
) 
RETURNS TABLE(
    city_name VARCHAR(255), 
    country_name VARCHAR(255), 
    country_code VARCHAR(3)
) 
AS $$
BEGIN 
    RETURN QUERY 
    SELECT 
        cl.city_name, 
        cl.country_name, 
        cl.country_code 
    FROM cities_lookup cl 
    WHERE 
        cl.city_name ILIKE '%' || search_term || '%' 
        OR cl.country_name ILIKE '%' || search_term || '%' 
    ORDER BY cl.city_name 
    LIMIT limit_count; 
END; 
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_cities(TEXT, INTEGER) TO postgres;
