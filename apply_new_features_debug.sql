-- Debug and Fix Asset Initiatives Table Structure
-- This script will check the actual table structure and fix it properly

-- First, let's see what columns actually exist in the table
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE 'Current asset_initiatives table structure:';
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'asset_initiatives' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
            col_record.column_name, col_record.data_type, col_record.is_nullable, col_record.column_default;
    END LOOP;
END $$;

-- Drop and recreate the table with the correct structure
DROP TABLE IF EXISTS public.asset_initiatives CASCADE;

CREATE TABLE public.asset_initiatives (
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

-- Add unique constraint
ALTER TABLE public.asset_initiatives ADD CONSTRAINT asset_initiatives_name_key UNIQUE (name);

-- Enable RLS
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active asset initiatives" ON public.asset_initiatives
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage asset initiatives" ON public.asset_initiatives
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create indexes
CREATE INDEX idx_asset_initiatives_category ON public.asset_initiatives(category);
CREATE INDEX idx_asset_initiatives_is_active ON public.asset_initiatives(is_active);

-- Now insert test data
INSERT INTO public.asset_initiatives (
    name, description, category, impact_score, risk_level, expected_return,
    min_investment, max_investment, current_funding, target_funding,
    is_active, image_url, website_url
) VALUES (
    'Test Asset Initiative',
    'A test asset initiative for development purposes.',
    'technology', 8, 'medium', 12.0, 100, 100000, 0, 100000,
    TRUE, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    'https://example.com'
);

-- Verify the insert worked
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count FROM public.asset_initiatives WHERE name = 'Test Asset Initiative';
    IF test_count > 0 THEN
        RAISE NOTICE '✓ Test asset initiative inserted successfully';
    ELSE
        RAISE NOTICE '✗ Failed to insert test asset initiative';
    END IF;
END $$;

-- Now let's add the other features
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

-- 2. User Asset Selections
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

ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own asset selections" ON public.user_asset_selections
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own asset selections" ON public.user_asset_selections
FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);

-- 3. Fractionalized Investments
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

ALTER TABLE public.fractionalized_assets ADD CONSTRAINT fractionalized_assets_name_key UNIQUE (name);
ALTER TABLE public.fractionalized_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fractionalized assets" ON public.fractionalized_assets
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage fractionalized assets" ON public.fractionalized_assets
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_fractionalized_assets_category ON public.fractionalized_assets(category);
CREATE INDEX idx_fractionalized_assets_is_active ON public.fractionalized_assets(is_active);

-- 4. Evolution 3D NFTs
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

ALTER TABLE public.evolution_3d_nfts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evolution NFTs" ON public.evolution_3d_nfts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own evolution NFTs" ON public.evolution_3d_nfts
FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_evolution_3d_nfts_user_id ON public.evolution_3d_nfts(user_id);

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
