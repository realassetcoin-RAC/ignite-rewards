-- Add Asset Initiatives Support
-- This script creates the necessary tables and functions for asset/initiative selection

-- 1. Create asset initiatives table
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

-- 2. Create user asset selections table
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

-- 3. Enable RLS on tables
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for asset_initiatives
CREATE POLICY "Anyone can view active asset initiatives" ON public.asset_initiatives
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage asset initiatives" ON public.asset_initiatives
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Create RLS policies for user_asset_selections
CREATE POLICY "Users can view their own asset selections" ON public.user_asset_selections
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own asset selections" ON public.user_asset_selections
FOR ALL USING (user_id = auth.uid());

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_category ON public.asset_initiatives(category);
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_impact_score ON public.asset_initiatives(impact_score);
CREATE INDEX IF NOT EXISTS idx_asset_initiatives_is_active ON public.asset_initiatives(is_active);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_user_id ON public.user_asset_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asset_selections_is_active ON public.user_asset_selections(is_active);

-- 7. Create function to get user's current asset selection
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

-- 8. Create function to update asset funding
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

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_asset_selection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_asset_funding(UUID, DECIMAL) TO authenticated;

-- 10. Insert sample asset initiatives
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

-- 11. Add comments
COMMENT ON TABLE public.asset_initiatives IS 'Available asset initiatives for user reward flow selection';
COMMENT ON TABLE public.user_asset_selections IS 'User selections of asset initiatives for reward flow';
COMMENT ON COLUMN public.asset_initiatives.impact_score IS 'Impact score from 1-10 based on social/environmental impact';
COMMENT ON COLUMN public.asset_initiatives.expected_return IS 'Expected annual return percentage';
COMMENT ON COLUMN public.user_asset_selections.is_active IS 'Whether this is the current active selection for the user';

RAISE NOTICE 'Asset initiatives support added successfully';
