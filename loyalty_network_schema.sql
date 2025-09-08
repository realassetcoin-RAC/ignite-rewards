-- Loyalty Network Integration Schema
-- This schema supports linking third-party loyalty accounts and converting points

-- Table for third-party loyalty networks
CREATE TABLE IF NOT EXISTS loyalty_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT, -- Encrypted API credentials
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    requires_mobile_verification BOOLEAN DEFAULT true,
    conversion_rate DECIMAL(10,4) DEFAULT 1.0000, -- Points to tokens conversion rate
    min_conversion_amount INTEGER DEFAULT 100, -- Minimum points required for conversion
    max_conversion_amount INTEGER DEFAULT 100000, -- Maximum points per conversion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table for user loyalty account links
CREATE TABLE IF NOT EXISTS user_loyalty_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_network_id UUID NOT NULL REFERENCES loyalty_networks(id) ON DELETE CASCADE,
    mobile_number VARCHAR(20) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_attempts INTEGER DEFAULT 0,
    last_verification_attempt TIMESTAMP WITH TIME ZONE,
    linked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, loyalty_network_id)
);

-- Table for OTP verification sessions
CREATE TABLE IF NOT EXISTS loyalty_otp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_network_id UUID NOT NULL REFERENCES loyalty_networks(id) ON DELETE CASCADE,
    mobile_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for point conversion transactions
CREATE TABLE IF NOT EXISTS loyalty_point_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_network_id UUID NOT NULL REFERENCES loyalty_networks(id) ON DELETE CASCADE,
    user_loyalty_link_id UUID NOT NULL REFERENCES user_loyalty_links(id) ON DELETE CASCADE,
    third_party_points INTEGER NOT NULL,
    converted_tokens DECIMAL(15,4) NOT NULL,
    conversion_rate DECIMAL(10,4) NOT NULL,
    transaction_id VARCHAR(255), -- Third-party transaction reference
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table for point balance snapshots
CREATE TABLE IF NOT EXISTS loyalty_point_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_loyalty_link_id UUID NOT NULL REFERENCES user_loyalty_links(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_loyalty_links_user_id ON user_loyalty_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_links_network_id ON user_loyalty_links(loyalty_network_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_sessions_user_id ON loyalty_otp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_sessions_expires_at ON loyalty_otp_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_conversions_user_id ON loyalty_point_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_conversions_status ON loyalty_point_conversions(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_balances_link_id ON loyalty_point_balances(user_loyalty_link_id);

-- Row Level Security (RLS) Policies
ALTER TABLE loyalty_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_point_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_point_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_networks
CREATE POLICY "Anyone can view active loyalty networks" ON loyalty_networks
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage loyalty networks" ON loyalty_networks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'administrator')
        )
    );

-- RLS Policies for user_loyalty_links
CREATE POLICY "Users can view their own loyalty links" ON user_loyalty_links
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own loyalty links" ON user_loyalty_links
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own loyalty links" ON user_loyalty_links
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all loyalty links" ON user_loyalty_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'administrator')
        )
    );

-- RLS Policies for loyalty_otp_sessions
CREATE POLICY "Users can manage their own OTP sessions" ON loyalty_otp_sessions
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for loyalty_point_conversions
CREATE POLICY "Users can view their own conversions" ON loyalty_point_conversions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversions" ON loyalty_point_conversions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all conversions" ON loyalty_point_conversions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'administrator')
        )
    );

-- RLS Policies for loyalty_point_balances
CREATE POLICY "Users can view their own point balances" ON loyalty_point_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_loyalty_links 
            WHERE user_loyalty_links.id = loyalty_point_balances.user_loyalty_link_id 
            AND user_loyalty_links.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert point balances" ON loyalty_point_balances
    FOR INSERT WITH CHECK (true);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_loyalty_networks_updated_at 
    BEFORE UPDATE ON loyalty_networks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_loyalty_links_updated_at 
    BEFORE UPDATE ON user_loyalty_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate OTP code
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS VARCHAR(6) AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired OTP sessions
CREATE OR REPLACE FUNCTION cleanup_expired_otp_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM loyalty_otp_sessions 
    WHERE expires_at < NOW() OR is_used = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some default loyalty networks
INSERT INTO loyalty_networks (name, display_name, description, is_active, conversion_rate, min_conversion_amount, max_conversion_amount) VALUES
('starbucks', 'Starbucks Rewards', 'Starbucks loyalty program', true, 1.0000, 25, 50000),
('mcdonalds', 'McDonald''s App', 'McDonald''s mobile app rewards', true, 0.8000, 50, 40000),
('subway', 'Subway Rewards', 'Subway loyalty program', true, 1.2000, 30, 60000),
('dunkin', 'Dunkin'' Rewards', 'Dunkin'' Donuts loyalty program', true, 0.9000, 40, 45000),
('pizza_hut', 'Pizza Hut Rewards', 'Pizza Hut loyalty program', true, 1.1000, 35, 55000)
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
