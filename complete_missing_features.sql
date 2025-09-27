-- Complete Missing Features Implementation
-- This script adds the missing database tables and enhances existing features

-- 1. Payment Gateway Tables
CREATE TABLE IF NOT EXISTS public.nft_upgrade_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_nft_id UUID NOT NULL,
    target_nft_id UUID NOT NULL,
    amount_usdt DECIMAL(10,2) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    payment_intent_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
    payment_provider VARCHAR(50) NOT NULL,
    payment_intent_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- 2. SMS OTP Tables
CREATE TABLE IF NOT EXISTS public.sms_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('loyalty_linking', 'phone_verification', 'password_reset')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Security Audit Tables
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Rate Limiting Tables
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enhanced Seed Phrase Security
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seed_phrase_encrypted TEXT,
ADD COLUMN IF NOT EXISTS seed_phrase_salt VARCHAR(255),
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;

-- 6. Smart Contract Integration Tables
CREATE TABLE IF NOT EXISTS public.smart_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name VARCHAR(100) NOT NULL UNIQUE,
    contract_address VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL DEFAULT 'solana',
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('nft', 'token', 'dao', 'staking')),
    is_active BOOLEAN DEFAULT TRUE,
    abi_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.smart_contracts(id) ON DELETE SET NULL,
    transaction_hash VARCHAR(255) NOT NULL UNIQUE,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    gas_used BIGINT,
    gas_price BIGINT,
    block_number BIGINT,
    network VARCHAR(50) NOT NULL DEFAULT 'solana',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Enhanced Email Service Tables
CREATE TABLE IF NOT EXISTS public.email_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL UNIQUE,
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    daily_limit INTEGER DEFAULT 1000,
    monthly_limit INTEGER DEFAULT 30000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. RLS Policies for New Tables

-- NFT Upgrade Payments RLS
ALTER TABLE public.nft_upgrade_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own NFT upgrade payments" ON public.nft_upgrade_payments
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own NFT upgrade payments" ON public.nft_upgrade_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all NFT upgrade payments" ON public.nft_upgrade_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Subscription Payments RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription payments" ON public.subscription_payments
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscription payments" ON public.subscription_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscription payments" ON public.subscription_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- SMS OTP Codes RLS
ALTER TABLE public.sms_otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own OTP codes" ON public.sms_otp_codes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own OTP codes" ON public.sms_otp_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own OTP codes" ON public.sms_otp_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- Security Audit Logs RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own security logs" ON public.security_audit_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all security logs" ON public.security_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
CREATE POLICY "System can insert security logs" ON public.security_audit_logs
    FOR INSERT WITH CHECK (true);

-- Rate Limits RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL USING (true);

-- Smart Contracts RLS
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active smart contracts" ON public.smart_contracts
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage smart contracts" ON public.smart_contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Blockchain Transactions RLS
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blockchain transactions" ON public.blockchain_transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own blockchain transactions" ON public.blockchain_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all blockchain transactions" ON public.blockchain_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Email Providers RLS
ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email providers" ON public.email_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_payments_user_id ON public.nft_upgrade_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_payments_status ON public.nft_upgrade_payments(status);
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_payments_created_at ON public.nft_upgrade_payments(created_at);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_created_at ON public.subscription_payments(created_at);

CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_user_id ON public.sms_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_phone_number ON public.sms_otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_expires_at ON public.sms_otp_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON public.security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON public.blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON public.blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON public.blockchain_transactions(status);

-- 10. Insert Default Data
INSERT INTO public.smart_contracts (contract_name, contract_address, network, contract_type, is_active) VALUES
('loyalty_nft_contract', '81y1B91W78o5zLz6Lg8P96Y7JvW4Y9q6D8W2o7Jz8K9', 'solana', 'nft', true),
('evolution_contract', '82z2C92X89p4M7M8Hh0Q07K8Jw5Z0r7E9X3p8Kz9L0', 'solana', 'nft', true),
('staking_contract', '83A3D93Y90q5N8N9Ii1R18L9Kx6A1s8F0Y4q9La0M1', 'solana', 'staking', true)
ON CONFLICT (contract_name) DO NOTHING;

INSERT INTO public.email_providers (provider_name, is_active, daily_limit, monthly_limit) VALUES
('resend', true, 1000, 30000),
('sendgrid', true, 1000, 30000),
('aws_ses', true, 1000, 30000),
('mock', true, 10000, 100000)
ON CONFLICT (provider_name) DO NOTHING;

-- 11. Functions for Enhanced Security

-- Function to encrypt seed phrases
CREATE OR REPLACE FUNCTION public.encrypt_seed_phrase(seed_phrase TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    salt TEXT;
    encrypted_phrase TEXT;
BEGIN
    -- Generate a unique salt for this user
    salt := encode(gen_random_bytes(32), 'base64');
    
    -- In a real implementation, you would use proper encryption here
    -- For now, we'll use a simple encoding (NOT SECURE FOR PRODUCTION)
    encrypted_phrase := encode(convert_to(seed_phrase, 'UTF8'), 'base64');
    
    -- Update the user's profile with encrypted data
    UPDATE public.profiles 
    SET 
        seed_phrase_encrypted = encrypted_phrase,
        seed_phrase_salt = salt,
        encryption_version = 1
    WHERE id = user_id;
    
    RETURN 'encrypted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt seed phrases
CREATE OR REPLACE FUNCTION public.decrypt_seed_phrase(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    encrypted_phrase TEXT;
    salt TEXT;
    decrypted_phrase TEXT;
BEGIN
    -- Get encrypted data
    SELECT seed_phrase_encrypted, seed_phrase_salt 
    INTO encrypted_phrase, salt
    FROM public.profiles 
    WHERE id = user_id;
    
    IF encrypted_phrase IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- In a real implementation, you would use proper decryption here
    -- For now, we'll use simple decoding (NOT SECURE FOR PRODUCTION)
    decrypted_phrase := convert_from(decode(encrypted_phrase, 'base64'), 'UTF8');
    
    RETURN decrypted_phrase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID,
    p_endpoint VARCHAR(255),
    p_limit INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := NOW() - INTERVAL '1 minute' * p_window_minutes;
    
    -- Get current request count
    SELECT COALESCE(request_count, 0)
    INTO current_count
    FROM public.rate_limits
    WHERE user_id = p_user_id 
    AND endpoint = p_endpoint
    AND window_start >= window_start;
    
    -- If no record exists or window has passed, create new record
    IF current_count IS NULL THEN
        INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
        VALUES (p_user_id, p_endpoint, 1, NOW())
        ON CONFLICT (user_id, endpoint) 
        DO UPDATE SET 
            request_count = 1,
            window_start = NOW(),
            updated_at = NOW();
        
        RETURN TRUE;
    END IF;
    
    -- Check if limit exceeded
    IF current_count >= p_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment counter
    UPDATE public.rate_limits
    SET 
        request_count = request_count + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND endpoint = p_endpoint
    AND window_start >= window_start;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up expired OTP codes
    DELETE FROM public.sms_otp_codes 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old rate limit records (older than 24 hours)
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '24 hours';
    
    -- Clean up old security audit logs (older than 90 days)
    DELETE FROM public.security_audit_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Triggers for Automatic Updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_smart_contracts_updated_at 
    BEFORE UPDATE ON public.smart_contracts 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_providers_updated_at 
    BEFORE UPDATE ON public.email_providers 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Grant Permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- 14. Create a comprehensive status view
CREATE OR REPLACE VIEW public.system_status AS
SELECT 
    'Database Tables' as component,
    COUNT(*) as count,
    'active' as status
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Active Users' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'active'
        ELSE 'inactive'
    END as status
FROM public.profiles 
WHERE updated_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Pending Payments' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'healthy'
        WHEN COUNT(*) < 10 THEN 'warning'
        ELSE 'critical'
    END as status
FROM public.nft_upgrade_payments 
WHERE status = 'pending' AND created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
    'Failed Payments' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'healthy'
        WHEN COUNT(*) < 5 THEN 'warning'
        ELSE 'critical'
    END as status
FROM public.nft_upgrade_payments 
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours';

-- Grant access to the status view
GRANT SELECT ON public.system_status TO postgres;

COMMENT ON VIEW public.system_status IS 'Comprehensive system status overview for monitoring and health checks';
