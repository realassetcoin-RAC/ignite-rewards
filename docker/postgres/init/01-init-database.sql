-- RAC Rewards Database Initialization Script
-- This script creates all tables, indexes, RLS policies, and functions
-- for the RAC Rewards application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'user', 'merchant', 'moderator');
CREATE TYPE merchant_status AS ENUM ('active', 'pending', 'suspended', 'inactive');
CREATE TYPE subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
CREATE TYPE nft_rarity AS ENUM ('Common', 'Less Common', 'Rare', 'Very Rare', 'Legendary');
CREATE TYPE tier_level AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role app_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NFT collections table
CREATE TABLE IF NOT EXISTS nft_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    contract_address VARCHAR(42),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NFT types table
CREATE TABLE IF NOT EXISTS nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES nft_collections(id) ON DELETE CASCADE,
    collection VARCHAR(100) NOT NULL,
    nft_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    image_url TEXT,
    evolution_image_url TEXT,
    buy_price_usdt DECIMAL(10,2) DEFAULT 0,
    buy_price_nft INTEGER DEFAULT 0,
    rarity nft_rarity DEFAULT 'Common',
    mint_quantity INTEGER DEFAULT 10000,
    is_upgradeable BOOLEAN DEFAULT TRUE,
    is_evolvable BOOLEAN DEFAULT TRUE,
    is_fractional_eligible BOOLEAN DEFAULT FALSE,
    is_custodial BOOLEAN DEFAULT TRUE,
    auto_staking_duration VARCHAR(50) DEFAULT 'Forever',
    earn_on_spend_ratio DECIMAL(5,4) DEFAULT 0.01,
    upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.00,
    evolution_min_investment DECIMAL(10,2) DEFAULT 100,
    evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0025,
    passive_income_rate DECIMAL(5,4) DEFAULT 0.01,
    custodial_income_rate DECIMAL(5,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user loyalty cards table
CREATE TABLE IF NOT EXISTS user_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    nft_type_id UUID REFERENCES nft_types(id) ON DELETE CASCADE,
    loyalty_number VARCHAR(20) UNIQUE NOT NULL,
    card_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    points_balance INTEGER DEFAULT 0,
    tier_level tier_level DEFAULT 'bronze',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchant subscription plans table
CREATE TABLE IF NOT EXISTS merchant_subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    monthly_points INTEGER DEFAULT 0,
    monthly_transactions INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]',
    trial_days INTEGER DEFAULT 14,
    is_active BOOLEAN DEFAULT TRUE,
    popular BOOLEAN DEFAULT FALSE,
    plan_number INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    business_address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    status merchant_status DEFAULT 'pending',
    subscription_plan_id UUID REFERENCES merchant_subscription_plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cities lookup table
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

-- Create loyalty networks table
CREATE TABLE IF NOT EXISTS loyalty_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_nft_types_collection ON nft_types(collection);
CREATE INDEX IF NOT EXISTS idx_nft_types_rarity ON nft_types(rarity);
CREATE INDEX IF NOT EXISTS idx_nft_types_active ON nft_types(is_active);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_user_id ON user_loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_loyalty_number ON user_loyalty_cards(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_cards_email ON user_loyalty_cards(email);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_popular ON merchant_subscription_plans(popular);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_subscription_plan ON merchants(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_cities_lookup_city_country ON cities_lookup(city_name, country_name);
CREATE INDEX IF NOT EXISTS idx_cities_lookup_country ON cities_lookup(country_name);
CREATE INDEX IF NOT EXISTS idx_loyalty_networks_active ON loyalty_networks(is_active);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_cities_lookup_search ON cities_lookup USING gin(to_tsvector('english', city_name || ' ' || country_name));
CREATE INDEX IF NOT EXISTS idx_merchants_search ON merchants USING gin(to_tsvector('english', business_name || ' ' || contact_email));

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_networks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for nft_collections
CREATE POLICY "NFT collections are publicly readable" ON nft_collections FOR SELECT USING (true);
CREATE POLICY "Admins can manage NFT collections" ON nft_collections FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for nft_types
CREATE POLICY "NFT types are publicly readable" ON nft_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage NFT types" ON nft_types FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for user_loyalty_cards
CREATE POLICY "Users can view their own loyalty cards" ON user_loyalty_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own loyalty cards" ON user_loyalty_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loyalty cards" ON user_loyalty_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all loyalty cards" ON user_loyalty_cards FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for merchant_subscription_plans
CREATE POLICY "Subscription plans are publicly readable" ON merchant_subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage subscription plans" ON merchant_subscription_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for merchants
CREATE POLICY "Merchants can view their own data" ON merchants FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Merchants can update their own data" ON merchants FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all merchants" ON merchants FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for cities_lookup
CREATE POLICY "Cities lookup is publicly readable" ON cities_lookup FOR SELECT USING (true);
CREATE POLICY "Cities lookup is publicly writable" ON cities_lookup FOR INSERT WITH CHECK (true);
CREATE POLICY "Cities lookup is publicly updatable" ON cities_lookup FOR UPDATE USING (true);
CREATE POLICY "Cities lookup is publicly deletable" ON cities_lookup FOR DELETE USING (true);

-- Create RLS policies for loyalty_networks
CREATE POLICY "Loyalty networks are publicly readable" ON loyalty_networks FOR SELECT USING (true);
CREATE POLICY "Admins can manage loyalty networks" ON loyalty_networks FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nft_collections TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nft_types TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_loyalty_cards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON merchant_subscription_plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON merchants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cities_lookup TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON loyalty_networks TO anon, authenticated;

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nft_collections_updated_at BEFORE UPDATE ON nft_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nft_types_updated_at BEFORE UPDATE ON nft_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_loyalty_cards_updated_at BEFORE UPDATE ON user_loyalty_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchant_subscription_plans_updated_at BEFORE UPDATE ON merchant_subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_lookup_updated_at BEFORE UPDATE ON cities_lookup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_networks_updated_at BEFORE UPDATE ON loyalty_networks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create utility functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_admin_access()
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_use_mfa()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role app_role,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role, p.created_at, p.updated_at
    FROM profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_loyalty_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_number VARCHAR(20);
    counter INTEGER;
BEGIN
    -- Generate a random 7-digit number
    counter := floor(random() * 9000000) + 1000000;
    new_number := 'A' || counter::VARCHAR;
    
    -- Check if number already exists
    WHILE EXISTS (SELECT 1 FROM user_loyalty_cards WHERE loyalty_number = new_number) LOOP
        counter := floor(random() * 9000000) + 1000000;
        new_number := 'A' || counter::VARCHAR;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_code VARCHAR(10);
BEGIN
    -- Generate a random 6-character code
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists (you might want to add a referrals table)
    -- For now, just return the code
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_valid_subscription_plans()
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    monthly_points INTEGER,
    monthly_transactions INTEGER,
    features JSONB,
    trial_days INTEGER,
    is_active BOOLEAN,
    popular BOOLEAN,
    plan_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        msp.id, msp.name, msp.description, msp.price_monthly, msp.price_yearly,
        msp.monthly_points, msp.monthly_transactions, msp.features, msp.trial_days,
        msp.is_active, msp.popular, msp.plan_number, msp.created_at, msp.updated_at
    FROM merchant_subscription_plans msp
    WHERE msp.is_active = TRUE
    ORDER BY msp.plan_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_cities(search_term TEXT)
RETURNS TABLE (
    id UUID,
    city_name VARCHAR(255),
    country_name VARCHAR(255),
    country_code VARCHAR(3),
    state_province VARCHAR(255),
    population BIGINT,
    is_capital BOOLEAN,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, c.city_name, c.country_name, c.country_code, c.state_province,
        c.population, c.is_capital, c.latitude, c.longitude
    FROM cities_lookup c
    WHERE 
        c.city_name ILIKE '%' || search_term || '%' OR
        c.country_name ILIKE '%' || search_term || '%' OR
        c.state_province ILIKE '%' || search_term || '%'
    ORDER BY 
        CASE 
            WHEN c.city_name ILIKE search_term || '%' THEN 1
            WHEN c.city_name ILIKE '%' || search_term || '%' THEN 2
            ELSE 3
        END,
        c.population DESC NULLS LAST
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_admin_access() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_use_mfa() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_loyalty_number() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_valid_subscription_plans() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_cities(TEXT) TO anon, authenticated;
