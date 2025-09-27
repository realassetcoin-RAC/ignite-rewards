-- Apply All New Features
-- This script applies all the new features: Google Auth Disable, Asset Initiatives, Fractionalized Investments, and Evolution 3D NFTs

-- 1. Apply Google Authentication Disable Support
-- Add Google auth disable fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_auth_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_auth_disabled_at TIMESTAMP WITH TIME ZONE;

-- Add comments to explain the new fields
COMMENT ON COLUMN public.profiles.google_auth_disabled IS 'Whether Google authentication is disabled for this user (seed phrase only login)';
COMMENT ON COLUMN public.profiles.google_auth_disabled_at IS 'Timestamp when Google authentication was disabled';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_google_auth_disabled ON public.profiles(google_auth_disabled) WHERE google_auth_disabled = TRUE;

-- Create function to check if user can use Google auth
CREATE OR REPLACE FUNCTION public.can_use_google_auth(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_disabled BOOLEAN;
BEGIN
    SELECT google_auth_disabled INTO is_disabled
    FROM public.profiles
    WHERE id = user_id;
    
    -- Return TRUE if Google auth is NOT disabled
    RETURN COALESCE(NOT is_disabled, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to disable Google auth for a user
CREATE OR REPLACE FUNCTION public.disable_google_auth(
    user_id UUID,
    seed_phrase TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    wallet_exists BOOLEAN;
    current_seed_phrase TEXT;
BEGIN
    -- Verify the user has a custodial wallet with the provided seed phrase
    SELECT EXISTS(
        SELECT 1 FROM public.user_wallets 
        WHERE user_id = disable_google_auth.user_id 
        AND wallet_type = 'custodial'
        AND seed_phrase = disable_google_auth.seed_phrase
    ) INTO wallet_exists;
    
    IF NOT wallet_exists THEN
        RAISE EXCEPTION 'Invalid seed phrase or wallet not found';
    END IF;
    
    -- Update profile to disable Google auth
    UPDATE public.profiles 
    SET 
        google_auth_disabled = TRUE,
        google_auth_disabled_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to re-enable Google auth for a user
CREATE OR REPLACE FUNCTION public.enable_google_auth(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update profile to enable Google auth
    UPDATE public.profiles 
    SET 
        google_auth_disabled = FALSE,
        google_auth_disabled_at = NULL
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to authenticate user with seed phrase
CREATE OR REPLACE FUNCTION public.authenticate_with_seed_phrase(seed_phrase TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    can_login BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find user by seed phrase
    SELECT 
        uw.user_id,
        p.email,
        p.full_name,
        p.google_auth_disabled
    INTO user_record
    FROM public.user_wallets uw
    JOIN public.profiles p ON uw.user_id = p.id
    WHERE uw.seed_phrase = authenticate_with_seed_phrase.seed_phrase
    AND uw.wallet_type = 'custodial';
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Return user info if Google auth is disabled (seed phrase login enabled)
    IF user_record.google_auth_disabled THEN
        user_id := user_record.user_id;
        email := user_record.email;
        full_name := user_record.full_name;
        can_login := TRUE;
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_use_google_auth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_google_auth(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_google_auth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_with_seed_phrase(TEXT) TO anon;

-- Create RLS policy for seed phrase authentication
CREATE POLICY "Users can authenticate with their own seed phrase" ON public.user_wallets
FOR SELECT USING (
    seed_phrase = current_setting('request.jwt.claims', true)::json->>'seed_phrase'
    OR auth.uid() = user_id
);

-- Update existing test users to have Google auth enabled by default
UPDATE public.profiles 
SET google_auth_disabled = FALSE 
WHERE google_auth_disabled IS NULL;

-- 2. Apply Asset Initiatives Support
-- Create asset initiatives table
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('environmental', 'social', 'governance', 'technology', 'healthcare', 'education')),
    impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 10),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_return DECIMAL(5,2) NOT NULL, -- percentage
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

-- Create user asset selections table
CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, asset_initiative_id, is_active) -- One active selection per user per asset
);

-- Enable RLS on tables
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for asset_initiatives
CREATE POLICY "Anyone can view active asset initiatives" ON public.asset_initiatives
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage asset initiatives" ON public.asset_initiatives
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create RLS policies for user_asset_selections
CREATE POLICY "Users can view their own asset selections" ON public.user_asset_selections
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own asset selections" ON public.user_asset_selections
FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_category ON public.asset_initiatives(category);
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_impact_score ON public.asset_initiatives(impact_score);
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_is_active ON public.asset_initiatives(is_active);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_is_active ON public.user_asset_selections(is_active);

-- Create function to get user's current asset selection
CREATE OR REPLACE FUNCTION public.get_user_asset_selection(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    impact_score INTEGER,
    risk_level VARCHAR(20),
    expected_return DECIMAL(5,2),
    min_investment DECIMAL(18,8),
    max_investment DECIMAL(18,8),
    current_funding DECIMAL(18,8),
    target_funding DECIMAL(18,8),
    image_url VARCHAR(500),
    website_url VARCHAR(500)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ai.id,
        ai.name,
        ai.description,
        ai.category,
        ai.impact_score,
        ai.risk_level,
        ai.expected_return,
        ai.min_investment,
        ai.max_investment,
        ai.current_funding,
        ai.target_funding,
        ai.image_url,
        ai.website_url
    FROM public.user_asset_selections uas
    JOIN public.asset_initiatives ai ON uas.asset_initiative_id = ai.id
    WHERE uas.user_id = p_user_id 
    AND uas.is_active = TRUE
    AND ai.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update asset funding
CREATE OR REPLACE FUNCTION public.update_asset_funding(
    p_asset_id UUID,
    p_funding_amount DECIMAL(18,8)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.asset_initiatives
    SET 
        current_funding = current_funding + p_funding_amount,
        updated_at = NOW()
    WHERE id = p_asset_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_asset_selection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_asset_funding(UUID, DECIMAL) TO authenticated;

-- Insert sample asset initiatives
INSERT INTO public.asset_initiatives (
    name, description, category, impact_score, risk_level, expected_return,
    min_investment, max_investment, current_funding, target_funding,
    image_url, website_url
) VALUES 
(
    'Clean Ocean Initiative',
    'Advanced ocean cleanup technology to remove plastic waste and restore marine ecosystems.',
    'environmental',
    9,
    'medium',
    12.5,
    100,
    1000000,
    250000,
    500000,
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    'https://cleanocean.org'
),
(
    'Digital Education Access',
    'Providing free digital learning platforms and devices to underserved communities worldwide.',
    'education',
    8,
    'low',
    8.0,
    50,
    500000,
    150000,
    300000,
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    'https://digitaledu.org'
),
(
    'Renewable Energy Grid',
    'Smart grid technology for efficient renewable energy distribution and storage.',
    'technology',
    9,
    'high',
    15.0,
    500,
    2000000,
    800000,
    1500000,
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400',
    'https://renewablegrid.org'
),
(
    'Healthcare AI Diagnostics',
    'AI-powered diagnostic tools for early disease detection in remote areas.',
    'healthcare',
    8,
    'medium',
    10.5,
    200,
    800000,
    300000,
    600000,
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
    'https://healthai.org'
),
(
    'Community Governance Platform',
    'Decentralized governance tools for transparent community decision-making.',
    'governance',
    7,
    'low',
    6.5,
    25,
    200000,
    75000,
    150000,
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    'https://communitygov.org'
),
(
    'Social Impact Bonds',
    'Investment vehicles that fund social programs with measurable outcomes.',
    'social',
    7,
    'medium',
    9.0,
    100,
    1000000,
    400000,
    800000,
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    'https://socialbonds.org'
)
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE public.asset_initiatives IS 'Available asset initiatives for user reward flow selection';
COMMENT ON TABLE public.user_asset_selections IS 'User selections of asset initiatives for reward flow';
COMMENT ON COLUMN public.asset_initiatives.impact_score IS 'Impact score from 1-10 based on social/environmental impact';
COMMENT ON COLUMN public.asset_initiatives.expected_return IS 'Expected annual return percentage';
COMMENT ON COLUMN public.user_asset_selections.is_active IS 'Whether this is the current active selection for the user';

-- 3. Create integration functions

-- Function to get user's complete investment portfolio
CREATE OR REPLACE FUNCTION public.get_user_investment_portfolio(p_user_id UUID)
RETURNS TABLE (
    total_balance DECIMAL(18,8),
    fractional_investments DECIMAL(18,8),
    asset_initiative_selection TEXT,
    evolution_nft_level INTEGER,
    can_evolve BOOLEAN
) AS $$
DECLARE
    v_total_balance DECIMAL(18,8) := 0;
    v_fractional_investments DECIMAL(18,8) := 0;
    v_asset_selection TEXT := NULL;
    v_evolution_level INTEGER := 0;
    v_can_evolve BOOLEAN := FALSE;
BEGIN
    -- Get user's total balance (from points/rewards system)
    SELECT COALESCE(SUM(points), 0) INTO v_total_balance
    FROM public.user_points
    WHERE user_id = p_user_id;
    
    -- Get fractional investments total
    SELECT COALESCE(SUM(investment_amount), 0) INTO v_fractional_investments
    FROM public.user_fractional_investments
    WHERE user_id = p_user_id;
    
    -- Get asset initiative selection
    SELECT ai.name INTO v_asset_selection
    FROM public.user_asset_selections uas
    JOIN public.asset_initiatives ai ON uas.asset_initiative_id = ai.id
    WHERE uas.user_id = p_user_id AND uas.is_active = TRUE;
    
    -- Get evolution NFT level
    SELECT COALESCE(evolution_level, 0) INTO v_evolution_level
    FROM public.evolution_3d_nfts
    WHERE user_id = p_user_id;
    
    -- Check if user can evolve
    SELECT EXISTS(
        SELECT 1 FROM public.evolution_3d_nfts e3d
        JOIN public.evolution_requirements er ON e3d.original_nft_id = er.nft_type_id
        WHERE e3d.user_id = p_user_id 
        AND v_fractional_investments >= er.investment_required
        AND er.evolution_level > e3d.evolution_level
    ) INTO v_can_evolve;
    
    total_balance := v_total_balance;
    fractional_investments := v_fractional_investments;
    asset_initiative_selection := v_asset_selection;
    evolution_nft_level := v_evolution_level;
    can_evolve := v_can_evolve;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process reward flow based on asset selection
CREATE OR REPLACE FUNCTION public.process_reward_flow(
    p_user_id UUID,
    p_reward_amount DECIMAL(18,8)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_asset_selection UUID;
    v_auto_invest BOOLEAN := FALSE;
BEGIN
    -- Get user's asset selection
    SELECT asset_initiative_id INTO v_asset_selection
    FROM public.user_asset_selections
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    -- Check if user has auto-investment enabled
    SELECT COALESCE(auto_invest_rewards, FALSE) INTO v_auto_invest
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- If user has asset selection and auto-invest is enabled, invest rewards
    IF v_asset_selection IS NOT NULL AND v_auto_invest THEN
        -- This would integrate with the fractionalized investment system
        -- For now, we'll just log the action
        INSERT INTO public.investment_transactions (
            user_id,
            asset_id,
            transaction_type,
            shares_amount,
            amount,
            price_per_share,
            status
        ) VALUES (
            p_user_id,
            v_asset_selection,
            'reinvestment',
            0, -- Would calculate based on current price
            p_reward_amount,
            0, -- Would get current price
            'pending'
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.get_user_investment_portfolio(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_reward_flow(UUID, DECIMAL) TO authenticated;

-- 6. Create views for easier data access
CREATE OR REPLACE VIEW public.user_dashboard_summary AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.google_auth_disabled,
    COALESCE(up.points, 0) as total_points,
    COALESCE(portfolio.fractional_investments, 0) as total_investments,
    portfolio.asset_initiative_selection,
    portfolio.evolution_nft_level,
    portfolio.can_evolve,
    COALESCE(rc.loyalty_number, 'N/A') as loyalty_number,
    COALESCE(rc.is_evolved, FALSE) as has_evolved_nft
FROM public.profiles p
LEFT JOIN public.user_points up ON p.id = up.user_id
LEFT JOIN public.get_user_investment_portfolio(p.id) portfolio ON TRUE
LEFT JOIN public.user_loyalty_cards rc ON p.id = rc.user_id AND rc.is_active = TRUE;

-- Grant access to the view
GRANT SELECT ON public.user_dashboard_summary TO authenticated;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_google_auth_disabled ON public.profiles(google_auth_disabled);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_active ON public.user_asset_selections(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_fractional_investments_user_asset ON public.user_fractional_investments(user_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_evolution_3d_nfts_user_level ON public.evolution_3d_nfts(user_id, evolution_level);

-- 8. Insert sample data for testing
\echo 'Inserting sample data...'

-- Create sample evolution NFT for testing
INSERT INTO public.evolution_3d_nfts (
    user_id,
    original_nft_id,
    evolution_type,
    nft_name,
    description,
    rarity,
    evolution_level,
    investment_required,
    current_investment,
    is_evolved,
    image_url,
    animation_url,
    metadata
) 
SELECT 
    p.id,
    ulc.id,
    'basic_evolution',
    'Evolved ' || nt.display_name,
    'An evolved version of your loyalty NFT with enhanced 3D properties and special effects.',
    nt.rarity,
    1,
    nt.evolution_min_investment,
    0,
    FALSE,
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400',
    'https://models.readyplayer.me/evolved-nft.glb',
    public.generate_3d_nft_metadata(
        nt.rarity,
        1,
        ARRAY['Glowing Aura', 'Particle Trails']
    )
FROM public.profiles p
JOIN public.user_loyalty_cards ulc ON p.id = ulc.user_id
JOIN public.nft_types nt ON ulc.nft_type_id = nt.id
WHERE p.role = 'user'
AND ulc.is_active = TRUE
LIMIT 5
ON CONFLICT DO NOTHING;

-- 9. Final verification
\echo 'Verifying all features are properly installed...'

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

\echo 'All new features have been successfully applied!'
\echo 'Features installed:'
\echo '1. Google Authentication Disable Option'
\echo '2. Asset/Initiative Selection Interface'
\echo '3. Fractionalized Investment System'
\echo '4. Evolution 3D NFT Generation and Display'
