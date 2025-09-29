-- Create Missing Dashboard Tables
-- This script creates the missing tables identified in the dashboard component test

-- 1. Create referral_settlements table
CREATE TABLE IF NOT EXISTS public.referral_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    settlement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create user_rewards table
CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    solana_address TEXT NOT NULL,
    total_earned DECIMAL(18,6) NOT NULL DEFAULT 0,
    total_claimed DECIMAL(18,6) NOT NULL DEFAULT 0,
    pending_vesting DECIMAL(18,6) NOT NULL DEFAULT 0,
    last_claim_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create notional_earnings table
CREATE TABLE IF NOT EXISTS public.notional_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    merchant_id UUID REFERENCES public.merchants(merchant_id) ON DELETE SET NULL,
    amount DECIMAL(18,6) NOT NULL,
    vesting_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    vesting_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'vesting' CHECK (status IN ('vesting', 'vested', 'cancelled', 'claimed')),
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create rewards_history table
CREATE TABLE IF NOT EXISTS public.rewards_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    anonymous_user_id TEXT,
    transaction_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('earned', 'vested', 'claimed', 'cancelled', 'distributed')),
    amount DECIMAL(18,6) NOT NULL,
    previous_balance DECIMAL(18,6) NOT NULL DEFAULT 0,
    new_balance DECIMAL(18,6) NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create vesting_schedules table
CREATE TABLE IF NOT EXISTS public.vesting_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notional_earning_id UUID NOT NULL REFERENCES public.notional_earnings(id) ON DELETE CASCADE,
    vesting_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    vesting_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(18,6) NOT NULL,
    vested_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create user_nfts table
CREATE TABLE IF NOT EXISTS public.user_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    nft_address TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Enable Row Level Security for all tables
ALTER TABLE public.referral_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notional_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vesting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for referral_settlements
CREATE POLICY "Users can view their own referral settlements" ON public.referral_settlements
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- 9. Create RLS policies for user_rewards
CREATE POLICY "Users can view their own rewards" ON public.user_rewards
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own rewards" ON public.user_rewards
    FOR UPDATE USING (auth.uid() = user_id);

-- 10. Create RLS policies for notional_earnings
CREATE POLICY "Users can view their own notional earnings" ON public.notional_earnings
    FOR SELECT USING (auth.uid() = user_id);

-- 11. Create RLS policies for rewards_history
CREATE POLICY "Users can view their own rewards history" ON public.rewards_history
    FOR SELECT USING (auth.uid() = user_id);

-- 12. Create RLS policies for vesting_schedules
CREATE POLICY "Users can view their own vesting schedules" ON public.vesting_schedules
    FOR SELECT USING (auth.uid() = user_id);

-- 13. Create RLS policies for user_nfts
CREATE POLICY "Users can view their own NFTs" ON public.user_nfts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own NFTs" ON public.user_nfts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own NFTs" ON public.user_nfts
    FOR UPDATE USING (auth.uid() = user_id);

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_settlements_referrer_id ON public.referral_settlements(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_settlements_referred_user_id ON public.referral_settlements(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_settlements_status ON public.referral_settlements(status);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_solana_address ON public.user_rewards(solana_address);

CREATE INDEX IF NOT EXISTS idx_notional_earnings_user_id ON public.notional_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_notional_earnings_status ON public.notional_earnings(status);
CREATE INDEX IF NOT EXISTS idx_notional_earnings_vesting_end_date ON public.notional_earnings(vesting_end_date);

CREATE INDEX IF NOT EXISTS idx_rewards_history_user_id ON public.rewards_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_history_event_type ON public.rewards_history(event_type);
CREATE INDEX IF NOT EXISTS idx_rewards_history_created_at ON public.rewards_history(created_at);

CREATE INDEX IF NOT EXISTS idx_vesting_schedules_user_id ON public.vesting_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_notional_earning_id ON public.vesting_schedules(notional_earning_id);
CREATE INDEX IF NOT EXISTS idx_vesting_schedules_vesting_end_date ON public.vesting_schedules(vesting_end_date);

CREATE INDEX IF NOT EXISTS idx_user_nfts_user_id ON public.user_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nfts_nft_type_id ON public.user_nfts(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_user_nfts_nft_address ON public.user_nfts(nft_address);

-- 15. Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_referral_settlements_updated_at
    BEFORE UPDATE ON public.referral_settlements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_rewards_updated_at
    BEFORE UPDATE ON public.user_rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notional_earnings_updated_at
    BEFORE UPDATE ON public.notional_earnings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vesting_schedules_updated_at
    BEFORE UPDATE ON public.vesting_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_nfts_updated_at
    BEFORE UPDATE ON public.user_nfts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Insert some sample data for testing
INSERT INTO public.user_rewards (user_id, solana_address, total_earned, total_claimed, pending_vesting)
SELECT 
    p.id,
    'So11111111111111111111111111111111111111112', -- SOL token address
    1000.000000,
    500.000000,
    500.000000
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_rewards ur WHERE ur.user_id = p.id)
LIMIT 5;

-- Insert sample notional earnings
INSERT INTO public.notional_earnings (user_id, transaction_id, amount, vesting_start_date, vesting_end_date, status)
SELECT 
    p.id,
    'tx_' || substr(md5(random()::text), 1, 10),
    100.000000,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    'vesting'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.notional_earnings ne WHERE ne.user_id = p.id)
LIMIT 5;

COMMIT;
