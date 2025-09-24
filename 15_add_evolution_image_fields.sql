-- Add evolution image fields and subscription/pricing fields to nft_types table
-- This script adds the missing fields for complete NFT management

-- Add evolution image URL field
ALTER TABLE nft_types 
ADD COLUMN IF NOT EXISTS evolution_image_url TEXT;

-- Add subscription and pricing fields if they don't exist
ALTER TABLE nft_types 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS one_time_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS annual_fee DECIMAL(10,2) DEFAULT 0.00;

-- Add image URL field for regular loyalty cards
ALTER TABLE nft_types 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add description field
ALTER TABLE nft_types 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing NFT types with default values
UPDATE nft_types 
SET 
  subscription_plan = 'basic',
  pricing_type = 'free',
  one_time_fee = 0.00,
  monthly_fee = 0.00,
  annual_fee = 0.00,
  image_url = NULL,
  evolution_image_url = NULL,
  description = 'Loyalty NFT card with various benefits and features'
WHERE subscription_plan IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_nft_types_subscription_plan ON nft_types(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_nft_types_pricing_type ON nft_types(pricing_type);

-- Add comments for documentation
COMMENT ON COLUMN nft_types.image_url IS 'URL for regular loyalty card image (PNG/JPG format)';
COMMENT ON COLUMN nft_types.evolution_image_url IS 'URL for evolved NFT image (animated GIF format)';
COMMENT ON COLUMN nft_types.subscription_plan IS 'Required merchant subscription plan (basic, professional, enterprise)';
COMMENT ON COLUMN nft_types.pricing_type IS 'Customer pricing model (free, one-time, monthly, annual)';
COMMENT ON COLUMN nft_types.one_time_fee IS 'One-time upgrade fee for customers';
COMMENT ON COLUMN nft_types.monthly_fee IS 'Monthly subscription fee for customers';
COMMENT ON COLUMN nft_types.annual_fee IS 'Annual subscription fee for customers';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'nft_types' 
  AND column_name IN ('image_url', 'evolution_image_url', 'subscription_plan', 'pricing_type', 'one_time_fee', 'monthly_fee', 'annual_fee', 'description')
ORDER BY column_name;

