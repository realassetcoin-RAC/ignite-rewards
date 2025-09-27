-- Create merchant custom NFT table with discount codes
-- This table stores custom NFTs created by merchants with discount codes

CREATE TABLE IF NOT EXISTS public.merchant_custom_nfts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid REFERENCES public.merchants(id) NOT NULL,
    nft_name text NOT NULL,
    description text NOT NULL,
    image_url text,
    discount_code text NOT NULL UNIQUE,
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
    min_purchase_amount numeric(10, 2) DEFAULT 0,
    max_uses integer DEFAULT 0 CHECK (max_uses >= 0),
    current_uses integer DEFAULT 0 CHECK (current_uses >= 0),
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    qr_code_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.merchant_custom_nfts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Merchants can view their own custom NFTs" ON public.merchant_custom_nfts
    FOR SELECT USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Merchants can insert their own custom NFTs" ON public.merchant_custom_nfts
    FOR INSERT WITH CHECK (merchant_id IN (
        SELECT id FROM public.merchants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Merchants can update their own custom NFTs" ON public.merchant_custom_nfts
    FOR UPDATE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Merchants can delete their own custom NFTs" ON public.merchant_custom_nfts
    FOR DELETE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE user_id = auth.uid()
    ));

-- Allow public read access for active NFTs (for customers to view)
CREATE POLICY "Public can view active custom NFTs" ON public.merchant_custom_nfts
    FOR SELECT USING (is_active = true AND valid_until > now());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_merchant_id ON public.merchant_custom_nfts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_discount_code ON public.merchant_custom_nfts(discount_code);
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_active ON public.merchant_custom_nfts(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_created_at ON public.merchant_custom_nfts(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_merchant_custom_nft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_merchant_custom_nft_updated_at
    BEFORE UPDATE ON public.merchant_custom_nfts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_merchant_custom_nft_updated_at();

-- Create function to validate discount codes
CREATE OR REPLACE FUNCTION public.validate_discount_code(p_discount_code text)
RETURNS boolean AS $$
BEGIN
    -- Check if discount code is already in use
    IF EXISTS (SELECT 1 FROM public.merchant_custom_nfts WHERE discount_code = p_discount_code) THEN
        RETURN false;
    END IF;
    
    -- Check if discount code format is valid (alphanumeric, 3-20 characters)
    IF p_discount_code !~ '^[A-Z0-9]{3,20}$' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment NFT usage
CREATE OR REPLACE FUNCTION public.increment_nft_usage(p_nft_id uuid)
RETURNS boolean AS $$
DECLARE
    v_max_uses integer;
    v_current_uses integer;
BEGIN
    -- Get current usage data
    SELECT max_uses, current_uses INTO v_max_uses, v_current_uses
    FROM public.merchant_custom_nfts
    WHERE id = p_nft_id AND is_active = true AND valid_until > now();
    
    -- Check if NFT exists and is valid
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if max uses reached (0 means unlimited)
    IF v_max_uses > 0 AND v_current_uses >= v_max_uses THEN
        RETURN false;
    END IF;
    
    -- Increment usage
    UPDATE public.merchant_custom_nfts
    SET current_uses = current_uses + 1
    WHERE id = p_nft_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_custom_nfts TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_discount_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_nft_usage(uuid) TO authenticated;

-- Insert sample data for testing (optional)
DO $$
BEGIN
    -- Only insert if no data exists
    IF NOT EXISTS (SELECT 1 FROM public.merchant_custom_nfts LIMIT 1) THEN
        -- Insert sample custom NFT for testing
        INSERT INTO public.merchant_custom_nfts (
            merchant_id,
            nft_name,
            description,
            image_url,
            discount_code,
            discount_type,
            discount_value,
            min_purchase_amount,
            max_uses,
            valid_from,
            valid_until,
            is_active
        ) VALUES (
            (SELECT id FROM public.merchants LIMIT 1), -- Use first merchant
            'VIP Member Card',
            'Exclusive VIP membership card with special discounts and benefits.',
            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
            'VIP2024',
            'percentage',
            15.00,
            50.00,
            100,
            now(),
            now() + interval '1 year',
            true
        );
    END IF;
END $$;
