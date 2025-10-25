-- Create loyalty_providers table if it doesn't exist
-- This table stores information about loyalty program providers

-- =============================================================================
-- 1. CREATE LOYALTY_PROVIDERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.loyalty_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  provider_logo_url TEXT,
  description TEXT,
  conversion_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0,
  minimum_conversion INTEGER NOT NULL DEFAULT 100,
  maximum_conversion INTEGER NOT NULL DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  api_endpoint TEXT,
  requires_phone_verification BOOLEAN DEFAULT false,
  supported_countries TEXT[] DEFAULT ARRAY['US', 'CA', 'UK', 'AU'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.loyalty_providers ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. CREATE RLS POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_read_loyalty_providers" ON public.loyalty_providers;
DROP POLICY IF EXISTS "authenticated_insert_loyalty_providers" ON public.loyalty_providers;
DROP POLICY IF EXISTS "authenticated_update_loyalty_providers" ON public.loyalty_providers;
DROP POLICY IF EXISTS "authenticated_delete_loyalty_providers" ON public.loyalty_providers;

-- Create comprehensive RLS policies
-- Policy 1: Allow everyone to read active loyalty providers
CREATE POLICY "public_read_loyalty_providers" ON public.loyalty_providers
    FOR SELECT
    TO public
    USING (is_active = true);

-- Policy 2: Allow authenticated users to insert loyalty providers
CREATE POLICY "authenticated_insert_loyalty_providers" ON public.loyalty_providers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 3: Allow authenticated users to update loyalty providers
CREATE POLICY "authenticated_update_loyalty_providers" ON public.loyalty_providers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete loyalty providers
CREATE POLICY "authenticated_delete_loyalty_providers" ON public.loyalty_providers
    FOR DELETE
    TO authenticated
    USING (true);

-- =============================================================================
-- 4. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_providers TO authenticated;
GRANT SELECT ON public.loyalty_providers TO anon;
GRANT ALL ON public.loyalty_providers TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================================================
-- 5. CREATE UPDATE TRIGGER
-- =============================================================================

-- Create or replace the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_loyalty_providers_updated_at ON public.loyalty_providers;
CREATE TRIGGER update_loyalty_providers_updated_at
    BEFORE UPDATE ON public.loyalty_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 6. ADD UNIQUE CONSTRAINT (IF NOT EXISTS)
-- =============================================================================

-- Add unique constraint on provider_name to prevent duplicates (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_provider_name' 
        AND conrelid = 'public.loyalty_providers'::regclass
    ) THEN
        ALTER TABLE public.loyalty_providers 
        ADD CONSTRAINT unique_provider_name UNIQUE (provider_name);
        RAISE NOTICE 'Added unique constraint on provider_name';
    ELSE
        RAISE NOTICE 'Unique constraint on provider_name already exists';
    END IF;
END $$;

-- =============================================================================
-- 7. INSERT SAMPLE DATA
-- =============================================================================

-- Insert some sample loyalty providers
INSERT INTO public.loyalty_providers (
  provider_name,
  description,
  conversion_rate,
  minimum_conversion,
  maximum_conversion,
  is_active,
  requires_phone_verification,
  supported_countries
) VALUES 
(
  'Starbucks Rewards',
  'Earn stars for every purchase and redeem for free drinks and food',
  1.0,
  25,
  10000,
  true,
  false,
  ARRAY['US', 'CA', 'UK', 'AU']
),
(
  'Amazon Prime',
  'Earn points on purchases and get exclusive member benefits',
  0.5,
  100,
  50000,
  true,
  true,
  ARRAY['US', 'CA', 'UK', 'DE', 'FR', 'IT', 'ES']
),
(
  'Airlines Miles',
  'Collect miles for flights and redeem for travel rewards',
  2.0,
  500,
  100000,
  true,
  true,
  ARRAY['US', 'CA', 'UK', 'AU', 'DE', 'FR']
)
ON CONFLICT (provider_name) DO NOTHING;

-- =============================================================================
-- 8. VERIFY THE SETUP
-- =============================================================================

-- Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loyalty_providers'
ORDER BY ordinal_position;

-- Check the sample data with all important columns
SELECT 
  id,
  provider_name,
  conversion_rate,
  minimum_conversion,
  maximum_conversion,
  is_active,
  requires_phone_verification,
  supported_countries,
  created_at
FROM public.loyalty_providers 
ORDER BY created_at;
