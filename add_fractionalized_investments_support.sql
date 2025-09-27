-- Add Fractionalized Investments Support
-- This script creates the necessary tables and functions for fractionalized investment system

-- 1. Create fractionalized assets table
CREATE TABLE IF NOT EXISTS public.fractionalized_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    total_value DECIMAL(18,8) NOT NULL,
    total_shares INTEGER NOT NULL,
    price_per_share DECIMAL(18,8) NOT NULL,
    category VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_return DECIMAL(5,2) NOT NULL, -- percentage
    min_investment DECIMAL(18,8) NOT NULL DEFAULT 0,
    max_investment DECIMAL(18,8) NOT NULL DEFAULT 1000000,
    current_investment DECIMAL(18,8) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Create user fractional investments table
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

-- 3. Create investment transactions table for tracking
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

-- 4. Enable RLS on tables
ALTER TABLE public.fractionalized_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fractional_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for fractionalized_assets
CREATE POLICY "Anyone can view active fractionalized assets" ON public.fractionalized_assets
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage fractionalized assets" ON public.fractionalized_assets
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. Create RLS policies for user_fractional_investments
CREATE POLICY "Users can view their own investments" ON public.user_fractional_investments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own investments" ON public.user_fractional_investments
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own investments" ON public.user_fractional_investments
FOR UPDATE USING (user_id = auth.uid());

-- 7. Create RLS policies for investment_transactions
CREATE POLICY "Users can view their own transactions" ON public.investment_transactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transactions" ON public.investment_transactions
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fractionalized_assets_category ON public.fractionalized_assets(category);
CREATE INDEX IF NOT EXISTS idx_fractionalized_assets_risk_level ON public.fractionalized_assets(risk_level);
CREATE INDEX IF NOT EXISTS idx_fractionalized_assets_is_active ON public.fractionalized_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_user_fractional_investments_user_id ON public.user_fractional_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fractional_investments_asset_id ON public.user_fractional_investments(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_id ON public.investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_asset_id ON public.investment_transactions(asset_id);

-- 9. Create function to calculate asset performance
CREATE OR REPLACE FUNCTION public.calculate_asset_performance(p_asset_id UUID)
RETURNS TABLE (
    total_invested DECIMAL(18,8),
    current_value DECIMAL(18,8),
    total_return DECIMAL(18,8),
    return_percentage DECIMAL(5,2)
) AS $$
DECLARE
    v_total_invested DECIMAL(18,8) := 0;
    v_current_value DECIMAL(18,8) := 0;
    v_asset_price DECIMAL(18,8);
BEGIN
    -- Get current asset price
    SELECT price_per_share INTO v_asset_price
    FROM public.fractionalized_assets
    WHERE id = p_asset_id;
    
    -- Calculate total invested and current value
    SELECT 
        SUM(investment_amount),
        SUM(shares_purchased * v_asset_price)
    INTO v_total_invested, v_current_value
    FROM public.user_fractional_investments
    WHERE asset_id = p_asset_id;
    
    total_invested := COALESCE(v_total_invested, 0);
    current_value := COALESCE(v_current_value, 0);
    total_return := current_value - total_invested;
    return_percentage := CASE 
        WHEN total_invested > 0 THEN (total_return / total_invested) * 100
        ELSE 0
    END;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to get user portfolio summary
CREATE OR REPLACE FUNCTION public.get_user_portfolio_summary(p_user_id UUID)
RETURNS TABLE (
    total_invested DECIMAL(18,8),
    current_value DECIMAL(18,8),
    total_return DECIMAL(18,8),
    return_percentage DECIMAL(5,2),
    investment_count INTEGER
) AS $$
DECLARE
    v_total_invested DECIMAL(18,8) := 0;
    v_current_value DECIMAL(18,8) := 0;
    v_investment_count INTEGER := 0;
BEGIN
    SELECT 
        SUM(ufi.investment_amount),
        SUM(ufi.shares_purchased * fa.price_per_share),
        COUNT(*)
    INTO v_total_invested, v_current_value, v_investment_count
    FROM public.user_fractional_investments ufi
    JOIN public.fractionalized_assets fa ON ufi.asset_id = fa.id
    WHERE ufi.user_id = p_user_id;
    
    total_invested := COALESCE(v_total_invested, 0);
    current_value := COALESCE(v_current_value, 0);
    total_return := current_value - total_invested;
    return_percentage := CASE 
        WHEN total_invested > 0 THEN (total_return / total_invested) * 100
        ELSE 0
    END;
    investment_count := COALESCE(v_investment_count, 0);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to update asset prices (for market simulation)
CREATE OR REPLACE FUNCTION public.update_asset_prices()
RETURNS BOOLEAN AS $$
DECLARE
    asset_record RECORD;
    new_price DECIMAL(18,8);
    price_change DECIMAL(5,4);
BEGIN
    FOR asset_record IN 
        SELECT id, price_per_share, expected_return, risk_level
        FROM public.fractionalized_assets
        WHERE is_active = TRUE
    LOOP
        -- Simulate price changes based on risk level and expected return
        price_change := (random() - 0.5) * 0.1; -- ±5% random change
        
        -- Adjust based on risk level
        CASE asset_record.risk_level
            WHEN 'high' THEN price_change := price_change * 1.5;
            WHEN 'medium' THEN price_change := price_change * 1.0;
            WHEN 'low' THEN price_change := price_change * 0.5;
        END CASE;
        
        -- Apply expected return bias
        price_change := price_change + (asset_record.expected_return / 100) * 0.01;
        
        new_price := asset_record.price_per_share * (1 + price_change);
        
        -- Ensure price doesn't go below 0.01
        new_price := GREATEST(new_price, 0.01);
        
        UPDATE public.fractionalized_assets
        SET 
            price_per_share = new_price,
            updated_at = NOW()
        WHERE id = asset_record.id;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_asset_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_portfolio_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_asset_prices() TO authenticated;

-- 13. Insert sample fractionalized assets
INSERT INTO public.fractionalized_assets (
    name, description, total_value, total_shares, price_per_share, category,
    risk_level, expected_return, min_investment, max_investment, image_url
) VALUES 
(
    'Tech Innovation Fund',
    'Diversified portfolio of cutting-edge technology companies focusing on AI, blockchain, and renewable energy.',
    10000000,
    1000000,
    10.00,
    'Technology',
    'high',
    15.5,
    100,
    100000,
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400'
),
(
    'Real Estate Investment Trust',
    'Premium commercial and residential real estate properties in major metropolitan areas.',
    50000000,
    5000000,
    10.00,
    'Real Estate',
    'medium',
    8.2,
    50,
    50000,
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
),
(
    'Green Energy Portfolio',
    'Renewable energy projects including solar, wind, and hydroelectric power generation.',
    25000000,
    2500000,
    10.00,
    'Energy',
    'medium',
    12.0,
    25,
    25000,
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400'
),
(
    'Healthcare Innovation Fund',
    'Biotech and pharmaceutical companies developing breakthrough treatments and medical devices.',
    15000000,
    1500000,
    10.00,
    'Healthcare',
    'high',
    18.0,
    200,
    200000,
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'
),
(
    'Sustainable Agriculture Fund',
    'Organic farming, vertical agriculture, and sustainable food production technologies.',
    8000000,
    800000,
    10.00,
    'Agriculture',
    'low',
    6.5,
    25,
    25000,
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400'
),
(
    'Digital Infrastructure Fund',
    'Data centers, cloud computing infrastructure, and digital connectivity solutions.',
    30000000,
    3000000,
    10.00,
    'Infrastructure',
    'low',
    7.8,
    100,
    100000,
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'
)
ON CONFLICT DO NOTHING;

-- 14. Add comments
COMMENT ON TABLE public.fractionalized_assets IS 'Fractionalized investment assets available for NFT holders';
COMMENT ON TABLE public.user_fractional_investments IS 'User investments in fractionalized assets';
COMMENT ON TABLE public.investment_transactions IS 'Transaction history for all investment activities';
COMMENT ON COLUMN public.fractionalized_assets.price_per_share IS 'Current price per share of the asset';
COMMENT ON COLUMN public.fractionalized_assets.expected_return IS 'Expected annual return percentage';
COMMENT ON COLUMN public.user_fractional_investments.current_value IS 'Current market value of the investment';

RAISE NOTICE 'Fractionalized investments support added successfully';
