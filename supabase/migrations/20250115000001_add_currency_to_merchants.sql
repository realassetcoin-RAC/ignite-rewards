-- Add currency field to merchants table
-- This allows merchants to configure their preferred currency symbol

-- Add currency field to merchants table
DO $$
BEGIN
  -- Check and add currency if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'currency') THEN
    ALTER TABLE public.merchants ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
  
  -- Check and add currency_symbol if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'currency_symbol') THEN
    ALTER TABLE public.merchants ADD COLUMN currency_symbol TEXT DEFAULT '$';
  END IF;
END $$;

-- Update existing merchants to have default currency values
UPDATE public.merchants 
SET currency = 'USD', currency_symbol = '$' 
WHERE currency IS NULL OR currency_symbol IS NULL;

-- Add comment to document the fields
COMMENT ON COLUMN public.merchants.currency IS 'ISO currency code (e.g., USD, EUR, GBP)';
COMMENT ON COLUMN public.merchants.currency_symbol IS 'Currency symbol to display (e.g., $, €, £)';
