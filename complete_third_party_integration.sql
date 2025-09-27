-- Complete Third-Party Loyalty Integration System
-- This script creates all necessary tables and functions for third-party loyalty integration

-- 1. Create loyalty networks table
CREATE TABLE IF NOT EXISTS public.loyalty_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT, -- Encrypted API credentials
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    requires_mobile_verification BOOLEAN DEFAULT TRUE,
    conversion_rate DECIMAL(10,4) DEFAULT 1.0000, -- Points to tokens conversion rate
    min_conversion_amount INTEGER DEFAULT 100, -- Minimum points required for conversion
    max_conversion_amount INTEGER DEFAULT 100000, -- Maximum points per conversion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Create user loyalty links table
CREATE TABLE IF NOT EXISTS public.user_loyalty_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_network_id UUID NOT NULL REFERENCES public.loyalty_networks(id) ON DELETE CASCADE,
    mobile_number VARCHAR(20) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_attempts INTEGER DEFAULT 0,
    last_verification_attempt TIMESTAMP WITH TIME ZONE,
    linked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, loyalty_network_id)
);

-- 3. Create OTP verification sessions table
CREATE TABLE IF NOT EXISTS public.loyalty_otp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_network_id UUID NOT NULL REFERENCES public.loyalty_networks(id) ON DELETE CASCADE,
    mobile_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create loyalty point conversions table
CREATE TABLE IF NOT EXISTS public.loyalty_point_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_link_id UUID NOT NULL REFERENCES public.user_loyalty_links(id) ON DELETE CASCADE,
    points_converted INTEGER NOT NULL,
    tokens_received DECIMAL(18,8) NOT NULL,
    conversion_rate DECIMAL(10,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    transaction_hash VARCHAR(255), -- Blockchain transaction hash if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create loyalty point balances table
CREATE TABLE IF NOT EXISTS public.loyalty_point_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loyalty_link_id UUID NOT NULL REFERENCES public.user_loyalty_links(id) ON DELETE CASCADE,
    current_balance INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, loyalty_link_id)
);

-- 6. Enable RLS on all tables
ALTER TABLE public.loyalty_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_point_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_point_balances ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for loyalty networks
CREATE POLICY "Anyone can view active loyalty networks" ON public.loyalty_networks
    FOR SELECT TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage loyalty networks" ON public.loyalty_networks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Create RLS policies for user loyalty links
CREATE POLICY "Users can view their own loyalty links" ON public.user_loyalty_links
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loyalty links" ON public.user_loyalty_links
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty links" ON public.user_loyalty_links
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty links" ON public.user_loyalty_links
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Create RLS policies for OTP sessions
CREATE POLICY "Users can manage their own OTP sessions" ON public.loyalty_otp_sessions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

-- 10. Create RLS policies for point conversions
CREATE POLICY "Users can view their own point conversions" ON public.loyalty_point_conversions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own point conversions" ON public.loyalty_point_conversions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all point conversions" ON public.loyalty_point_conversions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 11. Create RLS policies for point balances
CREATE POLICY "Users can view their own point balances" ON public.loyalty_point_balances
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can update point balances" ON public.loyalty_point_balances
    FOR UPDATE TO authenticated
    WITH CHECK (TRUE);

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_loyalty_links_user_id ON public.user_loyalty_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_links_network_id ON public.user_loyalty_links(loyalty_network_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_sessions_user_id ON public.loyalty_otp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_sessions_expires_at ON public.loyalty_otp_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_conversions_user_id ON public.loyalty_point_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_conversions_status ON public.loyalty_point_conversions(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_balances_user_id ON public.loyalty_point_balances(user_id);

-- 13. Create function to generate OTP
CREATE OR REPLACE FUNCTION public.generate_loyalty_otp(
    p_user_id UUID,
    p_loyalty_network_id UUID,
    p_mobile_number VARCHAR(20)
)
RETURNS VARCHAR(10) AS $$
DECLARE
    otp_code VARCHAR(10);
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit OTP
    otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Clean up any existing OTP sessions for this user/network/mobile combination
    DELETE FROM public.loyalty_otp_sessions
    WHERE user_id = p_user_id 
    AND loyalty_network_id = p_loyalty_network_id 
    AND mobile_number = p_mobile_number;
    
    -- Create new OTP session
    INSERT INTO public.loyalty_otp_sessions (
        user_id, loyalty_network_id, mobile_number, otp_code, expires_at
    ) VALUES (
        p_user_id, p_loyalty_network_id, p_mobile_number, otp_code, expires_at
    );
    
    RETURN otp_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_loyalty_otp(
    p_user_id UUID,
    p_loyalty_network_id UUID,
    p_mobile_number VARCHAR(20),
    p_otp_code VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Get OTP session
    SELECT * INTO session_record
    FROM public.loyalty_otp_sessions
    WHERE user_id = p_user_id 
    AND loyalty_network_id = p_loyalty_network_id 
    AND mobile_number = p_mobile_number
    AND expires_at > NOW()
    AND is_used = FALSE
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check attempts limit
    IF session_record.attempts >= session_record.max_attempts THEN
        UPDATE public.loyalty_otp_sessions
        SET is_used = TRUE
        WHERE id = session_record.id;
        RETURN FALSE;
    END IF;
    
    -- Verify OTP code
    IF session_record.otp_code = p_otp_code THEN
        -- Mark as used
        UPDATE public.loyalty_otp_sessions
        SET is_used = TRUE
        WHERE id = session_record.id;
        
        -- Create or update loyalty link
        INSERT INTO public.user_loyalty_links (
            user_id, loyalty_network_id, mobile_number, is_verified, linked_at
        ) VALUES (
            p_user_id, p_loyalty_network_id, p_mobile_number, TRUE, NOW()
        )
        ON CONFLICT (user_id, loyalty_network_id)
        DO UPDATE SET
            mobile_number = EXCLUDED.mobile_number,
            is_verified = TRUE,
            linked_at = NOW(),
            updated_at = NOW();
        
        RETURN TRUE;
    ELSE
        -- Increment attempts
        UPDATE public.loyalty_otp_sessions
        SET attempts = attempts + 1
        WHERE id = session_record.id;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to get user's loyalty links
CREATE OR REPLACE FUNCTION public.get_user_loyalty_links(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    network_name VARCHAR(255),
    network_display_name VARCHAR(255),
    mobile_number VARCHAR(20),
    is_verified BOOLEAN,
    linked_at TIMESTAMP WITH TIME ZONE,
    current_balance INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ull.id,
        ln.name,
        ln.display_name,
        ull.mobile_number,
        ull.is_verified,
        ull.linked_at,
        COALESCE(lpb.current_balance, 0),
        lpb.last_updated
    FROM public.user_loyalty_links ull
    JOIN public.loyalty_networks ln ON ull.loyalty_network_id = ln.id
    LEFT JOIN public.loyalty_point_balances lpb ON ull.id = lpb.loyalty_link_id
    WHERE ull.user_id = p_user_id
    ORDER BY ull.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create function to convert loyalty points
CREATE OR REPLACE FUNCTION public.convert_loyalty_points(
    p_user_id UUID,
    p_loyalty_link_id UUID,
    p_points_to_convert INTEGER
)
RETURNS UUID AS $$
DECLARE
    link_record RECORD;
    network_record RECORD;
    tokens_received DECIMAL(18,8);
    conversion_id UUID;
BEGIN
    -- Get loyalty link and network details
    SELECT ull.*, ln.* INTO link_record
    FROM public.user_loyalty_links ull
    JOIN public.loyalty_networks ln ON ull.loyalty_network_id = ln.id
    WHERE ull.id = p_loyalty_link_id 
    AND ull.user_id = p_user_id 
    AND ull.is_verified = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loyalty link not found or not verified';
    END IF;
    
    -- Validate conversion amount
    IF p_points_to_convert < link_record.min_conversion_amount THEN
        RAISE EXCEPTION 'Points amount below minimum conversion threshold';
    END IF;
    
    IF p_points_to_convert > link_record.max_conversion_amount THEN
        RAISE EXCEPTION 'Points amount exceeds maximum conversion threshold';
    END IF;
    
    -- Calculate tokens to receive
    tokens_received := p_points_to_convert * link_record.conversion_rate;
    
    -- Create conversion record
    INSERT INTO public.loyalty_point_conversions (
        user_id, loyalty_link_id, points_converted, tokens_received, 
        conversion_rate, status
    ) VALUES (
        p_user_id, p_loyalty_link_id, p_points_to_convert, tokens_received,
        link_record.conversion_rate, 'pending'
    ) RETURNING id INTO conversion_id;
    
    RETURN conversion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Create function to update point balance
CREATE OR REPLACE FUNCTION public.update_loyalty_point_balance(
    p_user_id UUID,
    p_loyalty_link_id UUID,
    p_new_balance INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.loyalty_point_balances (
        user_id, loyalty_link_id, current_balance, last_updated, last_sync_at
    ) VALUES (
        p_user_id, p_loyalty_link_id, p_new_balance, NOW(), NOW()
    )
    ON CONFLICT (user_id, loyalty_link_id)
    DO UPDATE SET
        current_balance = p_new_balance,
        last_updated = NOW(),
        last_sync_at = NOW(),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Create function to cleanup expired OTP sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_loyalty_otp_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.loyalty_otp_sessions
    WHERE expires_at < NOW() OR is_used = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_loyalty_otp(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_loyalty_otp(UUID, UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_loyalty_links(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_loyalty_points(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_loyalty_point_balance(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_loyalty_otp_sessions() TO authenticated;

-- 20. Insert default loyalty networks (with error handling)
DO $$
BEGIN
    -- Check if the table exists and has the expected columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'loyalty_networks'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'loyalty_networks' AND column_name = 'name'
    ) THEN
        -- Insert default loyalty networks
        INSERT INTO public.loyalty_networks (name, display_name, description, conversion_rate, min_conversion_amount, max_conversion_amount) VALUES
        ('starbucks', 'Starbucks Rewards', 'Starbucks Rewards loyalty program', 1.0000, 100, 100000),
        ('mcdonalds', 'McDonald''s App', 'McDonald''s mobile app rewards', 0.8000, 50, 50000),
        ('subway', 'Subway Rewards', 'Subway loyalty rewards program', 1.2000, 75, 75000),
        ('dunkin', 'Dunkin'' Rewards', 'Dunkin'' Donuts rewards program', 0.9000, 60, 60000),
        ('pizza_hut', 'Pizza Hut Rewards', 'Pizza Hut loyalty program', 1.1000, 80, 80000)
        ON CONFLICT (name) DO NOTHING;
        
        RAISE NOTICE 'Default loyalty networks inserted successfully';
    ELSE
        RAISE NOTICE 'loyalty_networks table does not exist or has different structure - skipping default data insertion';
    END IF;
END $$;

-- 21. Add helpful comments
COMMENT ON TABLE public.loyalty_networks IS 'Third-party loyalty network configurations';
COMMENT ON TABLE public.user_loyalty_links IS 'User connections to loyalty networks';
COMMENT ON TABLE public.loyalty_otp_sessions IS 'OTP verification sessions for loyalty linking';
COMMENT ON TABLE public.loyalty_point_conversions IS 'Point conversion transactions';
COMMENT ON TABLE public.loyalty_point_balances IS 'Point balance snapshots';
COMMENT ON FUNCTION public.generate_loyalty_otp IS 'Generates OTP for loyalty account verification';
COMMENT ON FUNCTION public.verify_loyalty_otp IS 'Verifies OTP and creates loyalty link';
COMMENT ON FUNCTION public.get_user_loyalty_links IS 'Retrieves user''s linked loyalty accounts';
COMMENT ON FUNCTION public.convert_loyalty_points IS 'Converts loyalty points to platform tokens';
COMMENT ON FUNCTION public.update_loyalty_point_balance IS 'Updates user''s loyalty point balance';
COMMENT ON FUNCTION public.cleanup_expired_loyalty_otp_sessions IS 'Cleans up expired OTP sessions';
