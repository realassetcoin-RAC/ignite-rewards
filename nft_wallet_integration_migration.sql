-- Migration for NFT Wallet Integration
-- Supports both Custodial and Non-Custodial NFTs

-- 1. Create NFT Purchase Transactions table
CREATE TABLE IF NOT EXISTS public.nft_purchase_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- 'credit_card', 'crypto', 'usdt'
    transaction_hash VARCHAR(100),
    is_custodial BOOLEAN NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create NFT Verification Logs table
CREATE TABLE IF NOT EXISTS public.nft_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_id VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    verification_status VARCHAR(20) NOT NULL, -- 'pending', 'verified', 'failed'
    verification_method VARCHAR(50), -- 'blockchain_query', 'metadata_check', 'manual'
    metadata JSONB,
    error_message TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create NFT Benefits Tracking table
CREATE TABLE IF NOT EXISTS public.nft_benefits_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_id UUID NOT NULL REFERENCES public.user_loyalty_cards(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL, -- 'earn_on_spend', 'upgrade_bonus', 'evolution_earnings', 'auto_staking'
    benefit_amount DECIMAL(15,2) NOT NULL,
    benefit_percentage DECIMAL(5,4),
    transaction_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Wallet Connections table
CREATE TABLE IF NOT EXISTS public.wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    wallet_type VARCHAR(20) NOT NULL, -- 'phantom', 'metamask', 'solflare', 'other'
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address)
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_nft_purchase_transactions_user ON public.nft_purchase_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_purchase_transactions_nft_type ON public.nft_purchase_transactions(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_nft_purchase_transactions_status ON public.nft_purchase_transactions(status);
CREATE INDEX IF NOT EXISTS idx_nft_purchase_transactions_custodial ON public.nft_purchase_transactions(is_custodial);

CREATE INDEX IF NOT EXISTS idx_nft_verification_logs_user ON public.nft_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_verification_logs_token ON public.nft_verification_logs(token_id);
CREATE INDEX IF NOT EXISTS idx_nft_verification_logs_wallet ON public.nft_verification_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_verification_logs_status ON public.nft_verification_logs(verification_status);

CREATE INDEX IF NOT EXISTS idx_nft_benefits_tracking_user ON public.nft_benefits_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_benefits_tracking_nft ON public.nft_benefits_tracking(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_benefits_tracking_type ON public.nft_benefits_tracking(benefit_type);
CREATE INDEX IF NOT EXISTS idx_nft_benefits_tracking_status ON public.nft_benefits_tracking(status);

CREATE INDEX IF NOT EXISTS idx_wallet_connections_user ON public.wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_address ON public.wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_type ON public.wallet_connections(wallet_type);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_primary ON public.wallet_connections(is_primary);

-- 6. Enable RLS for new tables
ALTER TABLE public.nft_purchase_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_benefits_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for nft_purchase_transactions
CREATE POLICY "Users can view their own purchase transactions" ON public.nft_purchase_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own purchase transactions" ON public.nft_purchase_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view all purchase transactions" ON public.nft_purchase_transactions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 8. Create RLS policies for nft_verification_logs
CREATE POLICY "Users can view their own verification logs" ON public.nft_verification_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own verification logs" ON public.nft_verification_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view all verification logs" ON public.nft_verification_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 9. Create RLS policies for nft_benefits_tracking
CREATE POLICY "Users can view their own benefits tracking" ON public.nft_benefits_tracking
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own benefits tracking" ON public.nft_benefits_tracking
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view all benefits tracking" ON public.nft_benefits_tracking
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 10. Create RLS policies for wallet_connections
CREATE POLICY "Users can view their own wallet connections" ON public.wallet_connections
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own wallet connections" ON public.wallet_connections
    FOR ALL USING (user_id = auth.uid());

-- 11. Create triggers for updated_at
CREATE TRIGGER update_nft_purchase_transactions_updated_at 
    BEFORE UPDATE ON public.nft_purchase_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_connections_updated_at 
    BEFORE UPDATE ON public.wallet_connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Create function to get user's total NFT benefits
CREATE OR REPLACE FUNCTION get_user_nft_benefits(user_uuid UUID)
RETURNS TABLE (
    total_earn_on_spend_ratio DECIMAL(5,4),
    total_upgrade_bonus_ratio DECIMAL(5,4),
    total_evolution_earnings_ratio DECIMAL(5,4),
    has_auto_staking BOOLEAN,
    nft_count INTEGER,
    custodial_count INTEGER,
    non_custodial_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(nt.earn_on_spend_ratio), 0) as total_earn_on_spend_ratio,
        COALESCE(SUM(nt.upgrade_bonus_ratio), 0) as total_upgrade_bonus_ratio,
        COALESCE(SUM(nt.evolution_earnings_ratio), 0) as total_evolution_earnings_ratio,
        BOOL_OR(nt.auto_staking_duration != 'None') as has_auto_staking,
        COUNT(ulc.id)::INTEGER as nft_count,
        COUNT(CASE WHEN ulc.is_custodial = true THEN 1 END)::INTEGER as custodial_count,
        COUNT(CASE WHEN ulc.is_custodial = false THEN 1 END)::INTEGER as non_custodial_count
    FROM public.user_loyalty_cards ulc
    JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
    WHERE ulc.user_id = user_uuid 
    AND ulc.is_verified = true
    AND nt.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to verify NFT ownership
CREATE OR REPLACE FUNCTION verify_nft_ownership(
    user_uuid UUID,
    token_id_param VARCHAR(100),
    contract_address_param VARCHAR(42) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    ownership_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO ownership_count
    FROM public.user_loyalty_cards
    WHERE user_id = user_uuid 
    AND token_id = token_id_param
    AND (contract_address_param IS NULL OR contract_address = contract_address_param)
    AND is_verified = true;
    
    RETURN ownership_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 15. Insert sample data for testing (optional)
INSERT INTO public.nft_purchase_transactions (
    user_id, nft_type_id, amount, payment_method, is_custodial, status
) VALUES
-- Sample custodial purchase
((SELECT id FROM auth.users LIMIT 1), 
 (SELECT id FROM public.nft_types WHERE is_custodial = true LIMIT 1), 
 100.00, 'credit_card', true, 'completed'),
-- Sample non-custodial purchase
((SELECT id FROM auth.users LIMIT 1), 
 (SELECT id FROM public.nft_types WHERE is_custodial = false LIMIT 1), 
 500.00, 'crypto', false, 'completed')
ON CONFLICT DO NOTHING;

-- Migration completed successfully
SELECT 'NFT Wallet Integration migration completed successfully!' as status;







