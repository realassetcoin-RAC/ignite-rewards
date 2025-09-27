-- Add Evolution 3D NFTs Support
-- This script creates the necessary tables and functions for evolution 3D NFT system

-- 1. Create evolution 3D NFTs table
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
    animation_url VARCHAR(500), -- 3D model or animation URL
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create evolution requirements table
CREATE TABLE IF NOT EXISTS public.evolution_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES public.nft_types(id) ON DELETE CASCADE,
    evolution_level INTEGER NOT NULL,
    investment_required DECIMAL(18,8) NOT NULL,
    special_requirements JSONB DEFAULT '{}',
    rewards JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create evolution history table
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

-- 4. Enable RLS on tables
ALTER TABLE public.evolution_3d_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_history ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for evolution_3d_nfts
CREATE POLICY "Users can view their own evolution NFTs" ON public.evolution_3d_nfts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own evolution NFTs" ON public.evolution_3d_nfts
FOR ALL USING (user_id = auth.uid());

-- 6. Create RLS policies for evolution_requirements
CREATE POLICY "Anyone can view evolution requirements" ON public.evolution_requirements
FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage evolution requirements" ON public.evolution_requirements
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 7. Create RLS policies for evolution_history
CREATE POLICY "Users can view their own evolution history" ON public.evolution_history
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own evolution history" ON public.evolution_history
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evolution_3d_nfts_user_id ON public.evolution_3d_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_3d_nfts_original_nft_id ON public.evolution_3d_nfts(original_nft_id);
CREATE INDEX IF NOT EXISTS idx_evolution_3d_nfts_evolution_level ON public.evolution_3d_nfts(evolution_level);
CREATE INDEX IF NOT EXISTS idx_evolution_requirements_nft_type_id ON public.evolution_requirements(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_evolution_requirements_evolution_level ON public.evolution_requirements(evolution_level);
CREATE INDEX IF NOT EXISTS idx_evolution_history_user_id ON public.evolution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_history_evolution_nft_id ON public.evolution_history(evolution_nft_id);

-- 9. Create function to check evolution eligibility
CREATE OR REPLACE FUNCTION public.check_evolution_eligibility(
    p_user_id UUID,
    p_nft_type_id UUID,
    p_target_level INTEGER
)
RETURNS TABLE (
    is_eligible BOOLEAN,
    current_investment DECIMAL(18,8),
    required_investment DECIMAL(18,8),
    missing_investment DECIMAL(18,8)
) AS $$
DECLARE
    v_current_investment DECIMAL(18,8) := 0;
    v_required_investment DECIMAL(18,8) := 0;
    v_missing_investment DECIMAL(18,8) := 0;
    v_is_eligible BOOLEAN := FALSE;
BEGIN
    -- Get user's current total investment
    SELECT COALESCE(SUM(investment_amount), 0) INTO v_current_investment
    FROM public.user_fractional_investments
    WHERE user_id = p_user_id;
    
    -- Get required investment for target level
    SELECT investment_required INTO v_required_investment
    FROM public.evolution_requirements
    WHERE nft_type_id = p_nft_type_id 
    AND evolution_level = p_target_level;
    
    v_missing_investment := GREATEST(0, v_required_investment - v_current_investment);
    v_is_eligible := (v_current_investment >= v_required_investment);
    
    current_investment := v_current_investment;
    required_investment := v_required_investment;
    missing_investment := v_missing_investment;
    is_eligible := v_is_eligible;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to evolve NFT
CREATE OR REPLACE FUNCTION public.evolve_nft(
    p_user_id UUID,
    p_evolution_nft_id UUID,
    p_target_level INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_evolution_nft RECORD;
    v_requirements RECORD;
    v_current_investment DECIMAL(18,8);
    v_eligibility RECORD;
BEGIN
    -- Get evolution NFT details
    SELECT * INTO v_evolution_nft
    FROM public.evolution_3d_nfts
    WHERE id = p_evolution_nft_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evolution NFT not found';
    END IF;
    
    -- Check eligibility
    SELECT * INTO v_eligibility
    FROM public.check_evolution_eligibility(p_user_id, v_evolution_nft.original_nft_id, p_target_level);
    
    IF NOT v_eligibility.is_eligible THEN
        RAISE EXCEPTION 'Not eligible for evolution. Missing investment: %', v_eligibility.missing_investment;
    END IF;
    
    -- Get evolution requirements
    SELECT * INTO v_requirements
    FROM public.evolution_requirements
    WHERE nft_type_id = v_evolution_nft.original_nft_id 
    AND evolution_level = p_target_level;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evolution requirements not found';
    END IF;
    
    -- Update evolution NFT
    UPDATE public.evolution_3d_nfts
    SET 
        evolution_level = p_target_level,
        is_evolved = TRUE,
        evolved_at = NOW(),
        current_investment = v_eligibility.current_investment,
        updated_at = NOW()
    WHERE id = p_evolution_nft_id;
    
    -- Create evolution history record
    INSERT INTO public.evolution_history (
        user_id,
        evolution_nft_id,
        from_level,
        to_level,
        evolution_type,
        investment_amount,
        rewards_earned
    ) VALUES (
        p_user_id,
        p_evolution_nft_id,
        v_evolution_nft.evolution_level,
        p_target_level,
        v_evolution_nft.evolution_type,
        v_requirements.investment_required,
        v_requirements.rewards
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to generate 3D NFT metadata
CREATE OR REPLACE FUNCTION public.generate_3d_nft_metadata(
    p_rarity VARCHAR(50),
    p_evolution_level INTEGER,
    p_special_effects TEXT[]
)
RETURNS JSONB AS $$
DECLARE
    v_metadata JSONB;
    v_attributes JSONB;
    v_properties JSONB;
BEGIN
    -- Generate attributes based on rarity and level
    v_attributes := jsonb_build_array(
        jsonb_build_object('trait_type', 'Rarity', 'value', p_rarity),
        jsonb_build_object('trait_type', 'Evolution Level', 'value', p_evolution_level),
        jsonb_build_object('trait_type', 'Power Level', 'value', p_evolution_level * 10),
        jsonb_build_object('trait_type', 'Special Ability', 'value', 
            CASE p_evolution_level
                WHEN 1 THEN 'Basic Power'
                WHEN 2 THEN 'Enhanced Power'
                WHEN 3 THEN 'Advanced Power'
                WHEN 4 THEN 'Master Power'
                WHEN 5 THEN 'Legendary Power'
                ELSE 'Ultimate Power'
            END
        )
    );
    
    -- Generate properties
    v_properties := jsonb_build_object(
        'evolution_stage', 
        CASE 
            WHEN p_evolution_level <= 3 THEN 'Basic Evolution'
            WHEN p_evolution_level <= 6 THEN 'Advanced Evolution'
            WHEN p_evolution_level <= 9 THEN 'Master Evolution'
            ELSE 'Legendary Evolution'
        END,
        'special_effects', to_jsonb(p_special_effects),
        'rarity_multiplier', 
        CASE p_rarity
            WHEN 'Common' THEN 1.0
            WHEN 'Less Common' THEN 1.2
            WHEN 'Rare' THEN 1.5
            WHEN 'Very Rare' THEN 2.0
            ELSE 1.0
        END * (1 + p_evolution_level * 0.1)
    );
    
    -- Combine into metadata
    v_metadata := jsonb_build_object(
        'attributes', v_attributes,
        'properties', v_properties,
        'generated_at', NOW(),
        'version', '1.0'
    );
    
    RETURN v_metadata;
END;
$$ LANGUAGE plpgsql;

-- 12. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_evolution_eligibility(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evolve_nft(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_3d_nft_metadata(VARCHAR, INTEGER, TEXT[]) TO authenticated;

-- 13. Insert evolution requirements for each NFT type
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
    jsonb_build_object(
        'min_holding_period', '30 days',
        'required_transactions', level * 5
    ),
    jsonb_build_object(
        'bonus_points', level * 100,
        'special_abilities', jsonb_build_array(
            'Enhanced Earning Rate',
            'Priority Support',
            'Exclusive Access'
        )
    )
FROM public.nft_types nt
CROSS JOIN generate_series(1, 10) AS level
WHERE nt.is_active = TRUE
ON CONFLICT DO NOTHING;

-- 14. Add comments
COMMENT ON TABLE public.evolution_3d_nfts IS '3D evolved NFTs with enhanced properties and special effects';
COMMENT ON TABLE public.evolution_requirements IS 'Requirements for evolving NFTs to different levels';
COMMENT ON TABLE public.evolution_history IS 'History of all NFT evolution events';
COMMENT ON COLUMN public.evolution_3d_nfts.animation_url IS 'URL to 3D model or animation file';
COMMENT ON COLUMN public.evolution_3d_nfts.metadata IS 'JSON metadata containing attributes and properties';
COMMENT ON COLUMN public.evolution_requirements.investment_required IS 'Minimum investment required for evolution';

RAISE NOTICE 'Evolution 3D NFTs support added successfully';
