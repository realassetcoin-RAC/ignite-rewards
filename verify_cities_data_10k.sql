-- Verify the data
SELECT COUNT(*) as total_cities FROM cities_lookup;
SELECT city_name, country_name FROM cities_lookup ORDER BY city_name LIMIT 10;
SELECT country_name, COUNT(*) as city_count FROM cities_lookup GROUP BY country_name ORDER BY city_count DESC LIMIT 20;