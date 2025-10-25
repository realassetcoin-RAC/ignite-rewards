-- RAC Rewards Database Seed Data
-- This script populates the database with initial data for development

-- Insert NFT Collections
INSERT INTO nft_collections (id, collection_name, display_name, description, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'classic', 'Classic Collection', 'The original loyalty NFT collection featuring various rarity levels and benefits', true),
('550e8400-e29b-41d4-a716-446655440002', 'premium', 'Premium Collection', 'Premium loyalty NFT collection with enhanced benefits and features', true),
('550e8400-e29b-41d4-a716-446655440003', 'elite', 'Elite Collection', 'Elite loyalty NFT collection for high-value customers', true)
ON CONFLICT (collection_name) DO NOTHING;

-- Insert NFT Types
INSERT INTO nft_types (id, collection_id, collection, nft_name, display_name, image_url, evolution_image_url, buy_price_usdt, buy_price_nft, rarity, mint_quantity, is_upgradeable, is_evolvable, is_fractional_eligible, is_custodial, auto_staking_duration, earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio, passive_income_rate, custodial_income_rate, is_active) VALUES
-- Classic Collection
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'classic', 'Pearl White', 'Pearl White', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400', 0, 0, 'Common', 10000, true, true, false, true, 'Forever', 0.01, 0.00, 100, 0.0025, 0.01, 0, true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'classic', 'Lava Orange', 'Lava Orange', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400', 100, 100, 'Less Common', 3000, true, true, false, true, 'Forever', 0.011, 0.001, 500, 0.005, 0.011, 0.001, true),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'classic', 'Pink', 'Pink', 'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400', 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400', 100, 100, 'Less Common', 3000, true, true, false, true, 'Forever', 0.011, 0.001, 500, 0.005, 0.011, 0.001, true),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'classic', 'Silver', 'Silver', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400', 200, 200, 'Rare', 750, true, true, false, true, 'Forever', 0.012, 0.0015, 1000, 0.0075, 0.012, 0.0015, true),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'classic', 'Gold', 'Gold', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400', 300, 300, 'Rare', 750, true, true, false, true, 'Forever', 0.013, 0.002, 1500, 0.01, 0.013, 0.002, true),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'classic', 'Black', 'Black', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400', 500, 500, 'Very Rare', 250, true, true, false, true, 'Forever', 0.014, 0.003, 2500, 0.0125, 0.014, 0.003, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Merchant Subscription Plans
INSERT INTO merchant_subscription_plans (id, name, description, price_monthly, price_yearly, monthly_points, monthly_transactions, features, trial_days, is_active, popular, plan_number) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'StartUp', 'Perfect for small businesses and startups looking to build customer loyalty', 20.00, 150.00, 100, 100, '["Basic loyalty program setup", "Up to 100 transactions per month", "Customer database management", "Email support", "Basic analytics and reporting", "QR code generation", "Mobile app for customers"]', 14, true, false, 1),
('750e8400-e29b-41d4-a716-446655440002', 'Momentum Plan', 'Ideal for growing businesses that need more advanced features and higher limits', 50.00, 500.00, 300, 300, '["Advanced loyalty program features", "Up to 300 transactions per month", "Advanced customer segmentation", "Priority email support", "Advanced analytics and custom reports", "Custom QR codes with branding", "API access for integrations", "Up to 3 staff accounts"]', 14, true, true, 2),
('750e8400-e29b-41d4-a716-446655440003', 'Energizer Plan', 'For established businesses requiring enterprise-level features and higher capacity', 100.00, 1000.00, 600, 600, '["Premium loyalty program features", "Up to 600 transactions per month", "Advanced customer analytics and insights", "Dedicated account manager", "Real-time analytics and reporting", "Fully customizable loyalty programs", "Advanced API access", "Up to 6 staff accounts", "Custom integrations", "24/7 phone and chat support"]', 21, true, false, 3),
('750e8400-e29b-41d4-a716-446655440004', 'Cloud Plan', 'High-volume solution for large enterprises with extensive transaction needs', 250.00, 2500.00, 1800, 1800, '["Enterprise loyalty program features", "Up to 1800 transactions per month", "Advanced customer analytics and insights", "Dedicated account manager", "Real-time analytics and reporting", "Fully customizable loyalty programs", "Enterprise-grade security", "Advanced API access", "Unlimited staff accounts", "Custom integrations", "Multi-location support", "24/7 phone and chat support", "Custom onboarding and training"]', 30, true, false, 4),
('750e8400-e29b-41d4-a716-446655440005', 'Super Plan', 'Ultimate solution for massive enterprises with unlimited transaction requirements', 500.00, 5000.00, 4000, 4000, '["Ultimate loyalty program features", "Up to 4000 transactions per month", "Advanced customer analytics and insights", "Dedicated account manager", "Real-time analytics and reporting", "Fully customizable loyalty programs", "Enterprise-grade security", "Advanced API access", "Unlimited staff accounts", "Custom integrations", "Multi-location support", "24/7 phone and chat support", "Custom onboarding and training", "White-label solutions", "Priority feature requests"]', 30, true, false, 5)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Merchants
INSERT INTO merchants (id, business_name, contact_email, contact_phone, business_address, city, country, status, subscription_plan_id) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'TechStart Solutions', 'contact@techstart.com', '+1-555-0101', '123 Innovation Drive, Tech City, TC 12345', 'Tech City', 'United States', 'active', '750e8400-e29b-41d4-a716-446655440002'),
('850e8400-e29b-41d4-a716-446655440002', 'Green Earth Cafe', 'info@greenearthcafe.com', '+1-555-0102', '456 Eco Street, Green Valley, GV 67890', 'Green Valley', 'United States', 'active', '750e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440003', 'Fashion Forward', 'hello@fashionforward.com', '+1-555-0103', '789 Style Avenue, Fashion District, FD 11111', 'Fashion District', 'United States', 'pending', '750e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Cities (major cities)
INSERT INTO cities_lookup (id, city_name, country_name, country_code, state_province, population, is_capital, latitude, longitude) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'New York', 'United States', 'USA', 'New York', 8336817, false, 40.7128, -74.0060),
('950e8400-e29b-41d4-a716-446655440002', 'Los Angeles', 'United States', 'USA', 'California', 3979576, false, 34.0522, -118.2437),
('950e8400-e29b-41d4-a716-446655440003', 'Chicago', 'United States', 'USA', 'Illinois', 2693976, false, 41.8781, -87.6298),
('950e8400-e29b-41d4-a716-446655440004', 'Houston', 'United States', 'USA', 'Texas', 2320268, false, 29.7604, -95.3698),
('950e8400-e29b-41d4-a716-446655440005', 'Phoenix', 'United States', 'USA', 'Arizona', 1680992, false, 33.4484, -112.0740),
('950e8400-e29b-41d4-a716-446655440006', 'Philadelphia', 'United States', 'USA', 'Pennsylvania', 1584064, false, 39.9526, -75.1652),
('950e8400-e29b-41d4-a716-446655440007', 'San Antonio', 'United States', 'USA', 'Texas', 1547253, false, 29.4241, -98.4936),
('950e8400-e29b-41d4-a716-446655440008', 'San Diego', 'United States', 'USA', 'California', 1423851, false, 32.7157, -117.1611),
('950e8400-e29b-41d4-a716-446655440009', 'Dallas', 'United States', 'USA', 'Texas', 1343573, false, 32.7767, -96.7970),
('950e8400-e29b-41d4-a716-446655440010', 'San Jose', 'United States', 'USA', 'California', 1035317, false, 37.3382, -121.8863),
('950e8400-e29b-41d4-a716-446655440011', 'London', 'United Kingdom', 'GBR', 'England', 8982000, true, 51.5074, -0.1278),
('950e8400-e29b-41d4-a716-446655440012', 'Paris', 'France', 'FRA', 'Île-de-France', 2161000, true, 48.8566, 2.3522),
('950e8400-e29b-41d4-a716-446655440013', 'Tokyo', 'Japan', 'JPN', 'Tokyo', 13929286, true, 35.6762, 139.6503),
('950e8400-e29b-41d4-a716-446655440014', 'Sydney', 'Australia', 'AUS', 'New South Wales', 5312163, false, -33.8688, 151.2093),
('950e8400-e29b-41d4-a716-446655440015', 'Toronto', 'Canada', 'CAN', 'Ontario', 2930000, false, 43.6532, -79.3832)
ON CONFLICT (id) DO NOTHING;

-- Insert Loyalty Networks
INSERT INTO loyalty_networks (id, name, description, logo_url, website_url, is_active) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'Starbucks', 'Coffee and beverage loyalty network', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100', 'https://www.starbucks.com', true),
('a50e8400-e29b-41d4-a716-446655440002', 'Airlines', 'Airline loyalty and frequent flyer programs', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100', 'https://www.airlines.com', true),
('a50e8400-e29b-41d4-a716-446655440003', 'Hotels', 'Hotel and accommodation loyalty programs', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100', 'https://www.hotels.com', true),
('a50e8400-e29b-41d4-a716-446655440004', 'Retail', 'Retail and shopping loyalty programs', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100', 'https://www.retail.com', true),
('a50e8400-e29b-41d4-a716-446655440005', 'Restaurants', 'Restaurant and dining loyalty programs', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100', 'https://www.restaurants.com', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample User Profiles (for development)
INSERT INTO profiles (id, email, full_name, role) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'admin@igniterewards.com', 'Admin User', 'admin'),
('b50e8400-e29b-41d4-a716-446655440002', 'user@igniterewards.com', 'Test User', 'user'),
('b50e8400-e29b-41d4-a716-446655440003', 'merchant@igniterewards.com', 'Test Merchant', 'merchant')
ON CONFLICT (email) DO NOTHING;

-- Insert Sample User Loyalty Cards
INSERT INTO user_loyalty_cards (id, user_id, nft_type_id, loyalty_number, card_number, full_name, email, phone, points_balance, tier_level, is_active) VALUES
('c50e8400-e29b-41d4-a716-446655440001', 'b50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'A1234567', 'LC123456', 'Admin User', 'admin@igniterewards.com', '+1-555-0001', 1250, 'gold', true),
('c50e8400-e29b-41d4-a716-446655440002', 'b50e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'B2345678', 'LC234567', 'Test User', 'user@igniterewards.com', '+1-555-0002', 750, 'silver', true),
('c50e8400-e29b-41d4-a716-446655440003', 'b50e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'C3456789', 'LC345678', 'Test Merchant', 'merchant@igniterewards.com', '+1-555-0003', 2500, 'platinum', true)
ON CONFLICT (id) DO NOTHING;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_tier_level ON user_loyalty_cards(tier_level);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_points_balance ON user_loyalty_cards(points_balance);
CREATE INDEX IF NOT EXISTS idx_merchants_city_country ON merchants(city, country);
CREATE INDEX IF NOT EXISTS idx_cities_lookup_population ON cities_lookup(population);
CREATE INDEX IF NOT EXISTS idx_cities_lookup_is_capital ON cities_lookup(is_capital);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nft_types_collection_rarity ON nft_types(collection, rarity);
CREATE INDEX IF NOT EXISTS idx_nft_types_price_range ON nft_types(buy_price_usdt, buy_price_nft);
CREATE INDEX IF NOT EXISTS idx_merchant_plans_price ON merchant_subscription_plans(price_monthly, price_yearly);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_tier ON user_loyalty_cards(user_id, tier_level);

-- Create partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_nft_types_active_collection ON nft_types(collection) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_merchant_plans_active ON merchant_subscription_plans(plan_number) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_merchants_active ON merchants(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_loyalty_networks_active ON loyalty_networks(name) WHERE is_active = true;

-- Create function to get user loyalty card
CREATE OR REPLACE FUNCTION get_user_loyalty_card(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nft_type_id UUID,
    loyalty_number VARCHAR(20),
    card_number VARCHAR(20),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    points_balance INTEGER,
    tier_level tier_level,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ulc.id, ulc.user_id, ulc.nft_type_id, ulc.loyalty_number, ulc.card_number,
        ulc.full_name, ulc.email, ulc.phone, ulc.points_balance, ulc.tier_level,
        ulc.is_active, ulc.created_at, ulc.updated_at
    FROM user_loyalty_cards ulc
    WHERE ulc.user_id = user_uuid AND ulc.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION get_user_loyalty_card(UUID) TO anon, authenticated;

-- Create view for active NFT types with collection info
CREATE OR REPLACE VIEW active_nft_types AS
SELECT 
    nt.id,
    nt.collection_id,
    nc.collection_name,
    nc.display_name as collection_display_name,
    nt.collection,
    nt.nft_name,
    nt.display_name,
    nt.image_url,
    nt.evolution_image_url,
    nt.buy_price_usdt,
    nt.buy_price_nft,
    nt.rarity,
    nt.mint_quantity,
    nt.is_upgradeable,
    nt.is_evolvable,
    nt.is_fractional_eligible,
    nt.is_custodial,
    nt.auto_staking_duration,
    nt.earn_on_spend_ratio,
    nt.upgrade_bonus_ratio,
    nt.evolution_min_investment,
    nt.evolution_earnings_ratio,
    nt.passive_income_rate,
    nt.custodial_income_rate,
    nt.is_active,
    nt.created_at,
    nt.updated_at
FROM nft_types nt
JOIN nft_collections nc ON nt.collection_id = nc.id
WHERE nt.is_active = true AND nc.is_active = true;

-- Grant select permission on the view
GRANT SELECT ON active_nft_types TO anon, authenticated;

-- Create view for merchant subscription plans with pricing info
CREATE OR REPLACE VIEW subscription_plans_pricing AS
SELECT 
    id,
    name,
    description,
    price_monthly,
    price_yearly,
    ROUND((price_yearly / 12), 2) as effective_monthly_price,
    ROUND(((price_yearly / 12) / price_monthly - 1) * 100, 1) as yearly_discount_percent,
    monthly_points,
    monthly_transactions,
    features,
    trial_days,
    is_active,
    popular,
    plan_number,
    created_at,
    updated_at
FROM merchant_subscription_plans
WHERE is_active = true;

-- Grant select permission on the view
GRANT SELECT ON subscription_plans_pricing TO anon, authenticated;

-- Create materialized view for city statistics (refreshed periodically)
CREATE MATERIALIZED VIEW city_statistics AS
SELECT 
    country_name,
    COUNT(*) as total_cities,
    COUNT(CASE WHEN is_capital = true THEN 1 END) as capital_cities,
    AVG(population) as avg_population,
    MAX(population) as max_population,
    MIN(population) as min_population
FROM cities_lookup
WHERE population IS NOT NULL
GROUP BY country_name;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_city_statistics_country ON city_statistics(country_name);

-- Grant select permission on the materialized view
GRANT SELECT ON city_statistics TO anon, authenticated;

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW city_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_materialized_views() TO anon, authenticated;

-- Create trigger to auto-refresh materialized view when cities are updated
CREATE OR REPLACE FUNCTION trigger_refresh_city_statistics()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW city_statistics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_city_statistics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cities_lookup
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_city_statistics();

-- Insert some additional sample data for testing
INSERT INTO cities_lookup (city_name, country_name, country_code, state_province, population, is_capital, latitude, longitude) VALUES
('Miami', 'United States', 'USA', 'Florida', 467963, false, 25.7617, -80.1918),
('Seattle', 'United States', 'USA', 'Washington', 749256, false, 47.6062, -122.3321),
('Boston', 'United States', 'USA', 'Massachusetts', 692600, false, 42.3601, -71.0589),
('Denver', 'United States', 'USA', 'Colorado', 715522, false, 39.7392, -104.9903),
('Atlanta', 'United States', 'USA', 'Georgia', 498715, false, 33.7490, -84.3880)
ON CONFLICT DO NOTHING;

-- Create a function to get popular cities by country
CREATE OR REPLACE FUNCTION get_popular_cities_by_country(country_name_param TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    city_name VARCHAR(255),
    state_province VARCHAR(255),
    population BIGINT,
    is_capital BOOLEAN,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.city_name, c.state_province, c.population, c.is_capital, c.latitude, c.longitude
    FROM cities_lookup c
    WHERE c.country_name = country_name_param
    ORDER BY 
        c.is_capital DESC,
        c.population DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_popular_cities_by_country(TEXT, INTEGER) TO anon, authenticated;

-- Final statistics
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'public';
    
    RAISE NOTICE 'Database initialization complete!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'Sample data inserted successfully!';
END $$;
