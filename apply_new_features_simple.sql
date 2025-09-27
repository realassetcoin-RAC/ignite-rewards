-- Apply New Features - Simplified Version
-- This script applies the 4 new features: Google Auth Disable, Asset Initiatives, Fractionalized Investments, and Evolution 3D NFTs

-- 1. Google Authentication Disable Support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_auth_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_auth_disabled_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_google_auth_disabled ON public.profiles(google_auth_disabled) WHERE google_auth_disabled = TRUE;

CREATE OR REPLACE FUNCTION public.can_use_google_auth(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_disabled BOOLEAN;
BEGIN
    SELECT google_auth_disabled INTO is_disabled
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN COALESCE(NOT is_disabled, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.disable_google_auth(user_id UUID, seed_phrase TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    wallet_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.user_wallets 
        WHERE user_id = disable_google_auth.user_id 
        AND wallet_type = 'custodial'
        AND seed_phrase = disable_google_auth.seed_phrase
    ) INTO wallet_exists;
    
    IF NOT wallet_exists THEN
        RAISE EXCEPTION 'Invalid seed phrase or wallet not found';
    END IF;
    
    UPDATE public.profiles 
    SET google_auth_disabled = TRUE, google_auth_disabled_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.enable_google_auth(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles 
    SET google_auth_disabled = FALSE, google_auth_disabled_at = NULL
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.can_use_google_auth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_google_auth(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_google_auth(UUID) TO authenticated;

-- 2. Asset Initiatives Support
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('environmental', 'social', 'governance', 'technology', 'healthcare', 'education')),
    impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 10),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_return DECIMAL(5,2) NOT NULL,
    min_investment DECIMAL(18,8) NOT NULL DEFAULT 0,
    max_investment DECIMAL(18,8) NOT NULL DEFAULT 1000000,
    current_funding DECIMAL(18,8) NOT NULL DEFAULT 0,
    target_funding DECIMAL(18,8) NOT NULL DEFAULT 1000000,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    website_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add missing columns if they don't exist
ALTER TABLE public.asset_initiatives 
ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 5 CHECK (impact_score >= 1 AND impact_score <= 10),
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS expected_return DECIMAL(5,2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS min_investment DECIMAL(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_investment DECIMAL(18,8) DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS current_funding DECIMAL(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_funding DECIMAL(18,8) DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'asset_initiatives_name_key' 
        AND table_name = 'asset_initiatives'
    ) THEN
        ALTER TABLE public.asset_initiatives ADD CONSTRAINT asset_initiatives_name_key UNIQUE (name);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, asset_initiative_id, is_active)
);

ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active asset initiatives" ON public.asset_initiatives
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage asset initiatives" ON public.asset_initiatives
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own asset selections" ON public.user_asset_selections
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own asset selections" ON public.user_asset_selections
FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_asset_initiatives_category ON public.asset_initiatives(category);
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_is_active ON public.asset_initiatives(is_active);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);

-- 3. Fractionalized Investments Support
CREATE TABLE IF NOT EXISTS public.fractionalized_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    total_value DECIMAL(18,8) NOT NULL,
    total_shares INTEGER NOT NULL,
    price_per_share DECIMAL(18,8) NOT NULL,
    category VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_return DECIMAL(5,2) NOT NULL,
    min_investment DECIMAL(18,8) NOT NULL DEFAULT 0,
    max_investment DECIMAL(18,8) NOT NULL DEFAULT 1000000,
    current_investment DECIMAL(18,8) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add missing columns if they don't exist
ALTER TABLE public.fractionalized_assets 
ADD COLUMN IF NOT EXISTS total_value DECIMAL(18,8) DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS total_shares INTEGER DEFAULT 100000,
ADD COLUMN IF NOT EXISTS price_per_share DECIMAL(18,8) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General',
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS expected_return DECIMAL(5,2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS min_investment DECIMAL(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_investment DECIMAL(18,8) DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS current_investment DECIMAL(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fractionalized_assets_name_key' 
        AND table_name = 'fractionalized_assets'
    ) THEN
        ALTER TABLE public.fractionalized_assets ADD CONSTRAINT fractionalized_assets_name_key UNIQUE (name);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_fractional_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.fractionalized_assets(id) ON DELETE CASCADE,
    shares_purchased INTEGER NOT NULL,
    investment_amount DECIMAL(18,8) NOT NULL,
    purchase_price DECIMAL(18,8) NOT NULL,
    current_value DECIMAL(18,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.investment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.fractionalized_assets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'dividend', 'reinvestment')),
    shares_amount INTEGER NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    price_per_share DECIMAL(18,8) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fractionalized_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fractional_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fractionalized assets" ON public.fractionalized_assets
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage fractionalized assets" ON public.fractionalized_assets
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own investments" ON public.user_fractional_investments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own investments" ON public.user_fractional_investments
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own transactions" ON public.investment_transactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transactions" ON public.investment_transactions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_fractionalized_assets_category ON public.fractionalized_assets(category);
CREATE INDEX IF NOT EXISTS idx_fractionalized_assets_is_active ON public.fractionalized_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_user_fractional_investments_user_id ON public.user_fractional_investments(user_id);

-- 4. Evolution 3D NFTs Support
CREATE TABLE IF NOT EXISTS public.evolution_3d_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_nft_id UUID NOT NULL REFERENCES public.user_loyalty_cards(id) ON DELETE CASCADE,
    evolution_type VARCHAR(100) NOT NULL,
    nft_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rarity VARCHAR(50) NOT NULL,
    evolution_level INTEGER NOT NULL DEFAULT 1,
    investment_required DECIMAL(18,8) NOT NULL,
    current_investment DECIMAL(18,8) NOT NULL DEFAULT 0,
    is_evolved BOOLEAN DEFAULT FALSE,
    evolved_at TIMESTAMP WITH TIME ZONE,
    image_url VARCHAR(500) NOT NULL,
    animation_url VARCHAR(500),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE public.evolution_3d_nfts 
ADD COLUMN IF NOT EXISTS evolution_type VARCHAR(100) DEFAULT 'basic_evolution',
ADD COLUMN IF NOT EXISTS nft_name VARCHAR(255) DEFAULT 'Evolved NFT',
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'An evolved NFT with enhanced properties',
ADD COLUMN IF NOT EXISTS rarity VARCHAR(50) DEFAULT 'common',
ADD COLUMN IF NOT EXISTS evolution_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS investment_required DECIMAL(18,8) DEFAULT 1000,
ADD COLUMN IF NOT EXISTS current_investment DECIMAL(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_evolved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS evolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400',
ADD COLUMN IF NOT EXISTS animation_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.evolution_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    evolution_level INTEGER NOT NULL,
    investment_required DECIMAL(18,8) NOT NULL,
    special_requirements JSONB DEFAULT '{}',
    rewards JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.evolution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evolution_nft_id UUID NOT NULL REFERENCES public.evolution_3d_nfts(id) ON DELETE CASCADE,
    from_level INTEGER NOT NULL,
    to_level INTEGER NOT NULL,
    evolution_type VARCHAR(100) NOT NULL,
    investment_amount DECIMAL(18,8) NOT NULL,
    rewards_earned JSONB DEFAULT '{}',
    evolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.evolution_3d_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evolution NFTs" ON public.evolution_3d_nfts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own evolution NFTs" ON public.evolution_3d_nfts
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view evolution requirements" ON public.evolution_requirements
FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage evolution requirements" ON public.evolution_requirements
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own evolution history" ON public.evolution_history
FOR SELECT USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_evolution_3d_nfts_user_id ON public.evolution_3d_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_requirements_nft_type_id ON public.evolution_requirements(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_evolution_history_user_id ON public.evolution_history(user_id);

-- 5. Fix existing data and Insert Sample Data
-- Update existing NULL values in asset_initiatives BEFORE inserting new data
UPDATE public.asset_initiatives 
SET impact_score = 5 
WHERE impact_score IS NULL;

UPDATE public.asset_initiatives 
SET risk_level = 'medium' 
WHERE risk_level IS NULL;

UPDATE public.asset_initiatives 
SET expected_return = 10.0 
WHERE expected_return IS NULL;

-- Sample Asset Initiatives - Use conditional insert to handle existing table structure
DO $$
BEGIN
    -- Insert only if the record doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Clean Ocean Initiative') THEN
        INSERT INTO public.asset_initiatives (name, description, category, impact_score, risk_level, expected_return, min_investment, max_investment, current_funding, target_funding, is_active, image_url, website_url)
        VALUES ('Clean Ocean Initiative', 'Advanced ocean cleanup technology to remove plastic waste and restore marine ecosystems.', 'environmental', 9, 'medium', 12.5, 100, 1000000, 250000, 500000, TRUE, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400', 'https://cleanocean.org');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Digital Education Access') THEN
        INSERT INTO public.asset_initiatives (name, description, category, impact_score, risk_level, expected_return, min_investment, max_investment, current_funding, target_funding, is_active, image_url, website_url)
        VALUES ('Digital Education Access', 'Providing free digital learning platforms and devices to underserved communities worldwide.', 'education', 8, 'low', 8.0, 50, 500000, 150000, 300000, TRUE, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', 'https://digitaledu.org');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Renewable Energy Grid') THEN
        INSERT INTO public.asset_initiatives (name, description, category, impact_score, risk_level, expected_return, min_investment, max_investment, current_funding, target_funding, is_active, image_url, website_url)
        VALUES ('Renewable Energy Grid', 'Smart grid technology for efficient renewable energy distribution and storage.', 'technology', 9, 'high', 15.0, 500, 2000000, 800000, 1500000, TRUE, 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400', 'https://renewablegrid.org');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Healthcare AI Diagnostics') THEN
        INSERT INTO public.asset_initiatives (name, description, category, impact_score, risk_level, expected_return, min_investment, max_investment, current_funding, target_funding, is_active, image_url, website_url)
        VALUES ('Healthcare AI Diagnostics', 'AI-powered diagnostic tools for early disease detection in remote areas.', 'healthcare', 8, 'medium', 10.5, 200, 800000, 300000, 600000, TRUE, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', 'https://healthai.org');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Community Governance Platform') THEN
        INSERT INTO public.asset_initiatives (name, description, category, impact_score, risk_level, expected_return, min_investment, max_investment, current_funding, target_funding, is_active, image_url, website_url)
        VALUES ('Community Governance Platform', 'Decentralized governance tools for transparent community decision-making.', 'governance', 7, 'low', 6.5, 25, 200000, 75000, 150000, TRUE, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', 'https://communitygov.org');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.asset_initiatives WHERE name = 'Social Impact Bonds') THEN
        INSERT INTO public.asset_initiatives (name, description, category, impact_score, risk_level, expected_return, min_investment, max_investment, current_funding, target_funding, is_active, image_url, website_url)
        VALUES ('Social Impact Bonds', 'Investment vehicles that fund social programs with measurable outcomes.', 'social', 7, 'medium', 9.0, 100, 1000000, 400000, 800000, TRUE, 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400', 'https://socialbonds.org');
    END IF;
END $$;

-- Sample Fractionalized Assets
INSERT INTO public.fractionalized_assets (
    name, description, total_value, total_shares, price_per_share, category,
    risk_level, expected_return, min_investment, max_investment, image_url
) VALUES 
(
    'Tech Innovation Fund',
    'Diversified portfolio of cutting-edge technology companies focusing on AI, blockchain, and renewable energy.',
    10000000, 1000000, 10.00, 'Technology', 'high', 15.5, 100, 100000,
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400'
),
(
    'Real Estate Investment Trust',
    'Premium commercial and residential real estate properties in major metropolitan areas.',
    50000000, 5000000, 10.00, 'Real Estate', 'medium', 8.2, 50, 50000,
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
),
(
    'Green Energy Portfolio',
    'Renewable energy projects including solar, wind, and hydroelectric power generation.',
    25000000, 2500000, 10.00, 'Energy', 'medium', 12.0, 25, 25000,
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400'
),
(
    'Healthcare Innovation Fund',
    'Biotech and pharmaceutical companies developing breakthrough treatments and medical devices.',
    15000000, 1500000, 10.00, 'Healthcare', 'high', 18.0, 200, 200000,
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'
),
(
    'Sustainable Agriculture Fund',
    'Organic farming, vertical agriculture, and sustainable food production technologies.',
    8000000, 800000, 10.00, 'Agriculture', 'low', 6.5, 25, 25000,
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400'
),
(
    'Digital Infrastructure Fund',
    'Data centers, cloud computing infrastructure, and digital connectivity solutions.',
    30000000, 3000000, 10.00, 'Infrastructure', 'low', 7.8, 100, 100000,
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'
)
ON CONFLICT DO NOTHING;

-- Sample Evolution Requirements
INSERT INTO public.evolution_requirements (nft_type_id, evolution_level, investment_required, special_requirements, rewards)
SELECT 
    nt.id,
    level,
    CASE 
        WHEN nt.name = 'pearl_white' THEN level * 100
        WHEN nt.name = 'lava_orange' THEN level * 500
        WHEN nt.name = 'pink' THEN level * 500
        WHEN nt.name = 'silver' THEN level * 1000
        WHEN nt.name = 'gold' THEN level * 1500
        WHEN nt.name = 'black' THEN level * 2500
        ELSE level * 1000
    END,
    jsonb_build_object('min_holding_period', '30 days', 'required_transactions', level * 5),
    jsonb_build_object('bonus_points', level * 100, 'special_abilities', jsonb_build_array('Enhanced Earning Rate', 'Priority Support', 'Exclusive Access'))
FROM public.nft_types nt
CROSS JOIN generate_series(1, 10) AS level
WHERE nt.is_active = TRUE
ON CONFLICT DO NOTHING;

-- Update existing profiles
UPDATE public.profiles 
SET google_auth_disabled = FALSE 
WHERE google_auth_disabled IS NULL;

-- Final verification
DO $$
DECLARE
    feature_count INTEGER := 0;
BEGIN
    -- Check Google auth disable support
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'google_auth_disabled') THEN
        feature_count := feature_count + 1;
        RAISE NOTICE '✓ Google Authentication Disable Support';
    END IF;
    
    -- Check asset initiatives support
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_initiatives') THEN
        feature_count := feature_count + 1;
        RAISE NOTICE '✓ Asset Initiatives Support';
    END IF;
    
    -- Check fractionalized investments support
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fractionalized_assets') THEN
        feature_count := feature_count + 1;
        RAISE NOTICE '✓ Fractionalized Investments Support';
    END IF;
    
    -- Check evolution 3D NFTs support
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evolution_3d_nfts') THEN
        feature_count := feature_count + 1;
        RAISE NOTICE '✓ Evolution 3D NFTs Support';
    END IF;
    
    RAISE NOTICE 'All % features successfully installed!', feature_count;
END $$;
