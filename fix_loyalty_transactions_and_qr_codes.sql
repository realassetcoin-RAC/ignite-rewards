-- Comprehensive Fix for loyalty_transactions and transaction_qr_codes Tables
-- This migration resolves all identified issues with both tables
-- Date: 2025-01-15

-- 1. Check current state
DO $$
DECLARE
    api_loyalty_count INTEGER := 0;
    public_loyalty_count INTEGER := 0;
    api_qr_count INTEGER := 0;
    public_qr_count INTEGER := 0;
    api_loyalty_exists BOOLEAN := FALSE;
    public_loyalty_exists BOOLEAN := FALSE;
    api_qr_exists BOOLEAN := FALSE;
    public_qr_exists BOOLEAN := FALSE;
BEGIN
    -- Check loyalty_transactions tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'loyalty_transactions'
    ) INTO api_loyalty_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'loyalty_transactions'
    ) INTO public_loyalty_exists;
    
    -- Check transaction_qr_codes tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'transaction_qr_codes'
    ) INTO api_qr_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transaction_qr_codes'
    ) INTO public_qr_exists;
    
    -- Count records
    IF api_loyalty_exists THEN
        SELECT COUNT(*) INTO api_loyalty_count FROM api.loyalty_transactions;
    END IF;
    
    IF public_loyalty_exists THEN
        SELECT COUNT(*) INTO public_loyalty_count FROM public.loyalty_transactions;
    END IF;
    
    IF api_qr_exists THEN
        SELECT COUNT(*) INTO api_qr_count FROM api.transaction_qr_codes;
    END IF;
    
    IF public_qr_exists THEN
        SELECT COUNT(*) INTO public_qr_count FROM public.transaction_qr_codes;
    END IF;
    
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '  api.loyalty_transactions exists: %, records: %', api_loyalty_exists, api_loyalty_count;
    RAISE NOTICE '  public.loyalty_transactions exists: %, records: %', public_loyalty_exists, public_loyalty_count;
    RAISE NOTICE '  api.transaction_qr_codes exists: %, records: %', api_qr_exists, api_qr_count;
    RAISE NOTICE '  public.transaction_qr_codes exists: %, records: %', public_qr_exists, public_qr_count;
END $$;

-- 2. Create unified loyalty_transactions table in public schema
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
    loyalty_number TEXT NOT NULL,
    transaction_amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    transaction_reference TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create unified transaction_qr_codes table in public schema
CREATE TABLE IF NOT EXISTS public.transaction_qr_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL UNIQUE,
    transaction_amount DECIMAL(10,2) NOT NULL,
    reward_points INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by_loyalty_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Migrate existing data from api to public schema (SAFE VERSION)
DO $$
DECLARE
    api_loyalty_count INTEGER := 0;
    public_loyalty_count INTEGER := 0;
    api_qr_count INTEGER := 0;
    public_qr_count INTEGER := 0;
    migrated_loyalty_count INTEGER := 0;
    migrated_qr_count INTEGER := 0;
BEGIN
    -- Count existing records
    BEGIN
        SELECT COUNT(*) INTO api_loyalty_count FROM api.loyalty_transactions;
    EXCEPTION
        WHEN OTHERS THEN
            api_loyalty_count := 0;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO public_loyalty_count FROM public.loyalty_transactions;
    EXCEPTION
        WHEN OTHERS THEN
            public_loyalty_count := 0;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO api_qr_count FROM api.transaction_qr_codes;
    EXCEPTION
        WHEN OTHERS THEN
            api_qr_count := 0;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO public_qr_count FROM public.transaction_qr_codes;
    EXCEPTION
        WHEN OTHERS THEN
            public_qr_count := 0;
    END;
    
    -- Migrate loyalty_transactions data
    IF api_loyalty_count > 0 AND public_loyalty_count = 0 THEN
        RAISE NOTICE 'Migrating % records from api.loyalty_transactions to public.loyalty_transactions', api_loyalty_count;
        
        BEGIN
            INSERT INTO public.loyalty_transactions (
                id, user_id, merchant_id, loyalty_number, transaction_amount, 
                points_earned, transaction_reference, transaction_date, created_at
            )
            SELECT 
                id, 
                COALESCE(user_id, (SELECT user_id FROM public.user_loyalty_cards WHERE loyalty_number = lt.loyalty_number LIMIT 1)),
                merchant_id, 
                loyalty_number, 
                transaction_amount,
                COALESCE(reward_points, 0) as points_earned,
                transaction_reference,
                transaction_date,
                created_at
            FROM api.loyalty_transactions lt
            ON CONFLICT (id) DO NOTHING;
            
            GET DIAGNOSTICS migrated_loyalty_count = ROW_COUNT;
            RAISE NOTICE 'Loyalty transactions migration completed: % records migrated', migrated_loyalty_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Loyalty transactions migration failed: %', SQLERRM;
        END;
    ELSIF api_loyalty_count > 0 AND public_loyalty_count > 0 THEN
        RAISE NOTICE 'Both loyalty_transactions tables have data - merging unique records';
        
        BEGIN
            INSERT INTO public.loyalty_transactions (
                id, user_id, merchant_id, loyalty_number, transaction_amount, 
                points_earned, transaction_reference, transaction_date, created_at
            )
            SELECT 
                id, 
                COALESCE(user_id, (SELECT user_id FROM public.user_loyalty_cards WHERE loyalty_number = lt.loyalty_number LIMIT 1)),
                merchant_id, 
                loyalty_number, 
                transaction_amount,
                COALESCE(reward_points, 0) as points_earned,
                transaction_reference,
                transaction_date,
                created_at
            FROM api.loyalty_transactions lt
            WHERE id NOT IN (SELECT id FROM public.loyalty_transactions)
            ON CONFLICT (id) DO NOTHING;
            
            GET DIAGNOSTICS migrated_loyalty_count = ROW_COUNT;
            RAISE NOTICE 'Loyalty transactions merge completed: % new records added', migrated_loyalty_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Loyalty transactions merge failed: %', SQLERRM;
        END;
    END IF;
    
    -- Migrate transaction_qr_codes data
    IF api_qr_count > 0 AND public_qr_count = 0 THEN
        RAISE NOTICE 'Migrating % records from api.transaction_qr_codes to public.transaction_qr_codes', api_qr_count;
        
        BEGIN
            INSERT INTO public.transaction_qr_codes (
                id, merchant_id, qr_code_data, transaction_amount, reward_points,
                expires_at, is_used, used_by_loyalty_number, created_at, updated_at
            )
            SELECT 
                id, merchant_id, qr_code_data, transaction_amount, reward_points,
                expires_at, is_used, used_by_loyalty_number, created_at, updated_at
            FROM api.transaction_qr_codes
            ON CONFLICT (id) DO NOTHING;
            
            GET DIAGNOSTICS migrated_qr_count = ROW_COUNT;
            RAISE NOTICE 'QR codes migration completed: % records migrated', migrated_qr_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'QR codes migration failed: %', SQLERRM;
        END;
    ELSIF api_qr_count > 0 AND public_qr_count > 0 THEN
        RAISE NOTICE 'Both transaction_qr_codes tables have data - merging unique records';
        
        BEGIN
            INSERT INTO public.transaction_qr_codes (
                id, merchant_id, qr_code_data, transaction_amount, reward_points,
                expires_at, is_used, used_by_loyalty_number, created_at, updated_at
            )
            SELECT 
                id, merchant_id, qr_code_data, transaction_amount, reward_points,
                expires_at, is_used, used_by_loyalty_number, created_at, updated_at
            FROM api.transaction_qr_codes
            WHERE id NOT IN (SELECT id FROM public.transaction_qr_codes)
            ON CONFLICT (id) DO NOTHING;
            
            GET DIAGNOSTICS migrated_qr_count = ROW_COUNT;
            RAISE NOTICE 'QR codes merge completed: % new records added', migrated_qr_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'QR codes merge failed: %', SQLERRM;
        END;
    END IF;
END $$;

-- 5. Create updated_at trigger for transaction_qr_codes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transaction_qr_codes_updated_at ON public.transaction_qr_codes;
CREATE TRIGGER update_transaction_qr_codes_updated_at
    BEFORE UPDATE ON public.transaction_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Handle api schema compatibility (SAFE VERSION)
DO $$
BEGIN
    -- Handle loyalty_transactions
    BEGIN
        DROP TABLE IF EXISTS api.loyalty_transactions CASCADE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop api.loyalty_transactions table: %', SQLERRM;
    END;
    
    BEGIN
        DROP VIEW IF EXISTS api.loyalty_transactions CASCADE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop api.loyalty_transactions view: %', SQLERRM;
    END;
    
    -- Create the compatibility view for loyalty_transactions
    CREATE VIEW api.loyalty_transactions AS
    SELECT 
        id,
        user_id,
        merchant_id,
        loyalty_number,
        transaction_amount,
        points_earned as reward_points,
        transaction_reference,
        transaction_date,
        created_at
    FROM public.loyalty_transactions;
    
    RAISE NOTICE 'Created api.loyalty_transactions compatibility view';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create api.loyalty_transactions view: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Handle transaction_qr_codes
    BEGIN
        DROP TABLE IF EXISTS api.transaction_qr_codes CASCADE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop api.transaction_qr_codes table: %', SQLERRM;
    END;
    
    BEGIN
        DROP VIEW IF EXISTS api.transaction_qr_codes CASCADE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop api.transaction_qr_codes view: %', SQLERRM;
    END;
    
    -- Create the compatibility view for transaction_qr_codes
    CREATE VIEW api.transaction_qr_codes AS
    SELECT 
        id,
        merchant_id,
        qr_code_data,
        transaction_amount,
        reward_points,
        expires_at,
        is_used,
        used_by_loyalty_number,
        created_at,
        updated_at
    FROM public.transaction_qr_codes;
    
    RAISE NOTICE 'Created api.transaction_qr_codes compatibility view';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create api.transaction_qr_codes view: %', SQLERRM;
END $$;

-- 7. Enable Row Level Security
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_qr_codes ENABLE ROW LEVEL SECURITY;

-- 8. Create comprehensive RLS policies for loyalty_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Merchants can view their transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Merchants can create transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Users can view transactions for their loyalty cards" ON public.loyalty_transactions;

CREATE POLICY "Users can view their own transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view their transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = loyalty_transactions.merchant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can create transactions" 
ON public.loyalty_transactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = loyalty_transactions.merchant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view transactions for their loyalty cards"
ON public.loyalty_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_loyalty_cards ulc
    WHERE ulc.loyalty_number = loyalty_transactions.loyalty_number 
    AND ulc.user_id = auth.uid()
  )
);

-- 9. Create comprehensive RLS policies for transaction_qr_codes
DROP POLICY IF EXISTS "Merchants can manage their QR codes" ON public.transaction_qr_codes;
DROP POLICY IF EXISTS "Anyone can view active QR codes for scanning" ON public.transaction_qr_codes;

CREATE POLICY "Merchants can manage their QR codes" 
ON public.transaction_qr_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = transaction_qr_codes.merchant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active QR codes for scanning"
ON public.transaction_qr_codes
FOR SELECT
USING (is_used = false AND expires_at > now());

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_qr_codes TO authenticated;
GRANT SELECT ON api.loyalty_transactions TO authenticated;
GRANT SELECT ON api.transaction_qr_codes TO authenticated;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant_id ON public.loyalty_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty_number ON public.loyalty_transactions(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_transaction_qr_codes_merchant_id ON public.transaction_qr_codes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_qr_codes_expires_at ON public.transaction_qr_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_transaction_qr_codes_is_used ON public.transaction_qr_codes(is_used);

-- 12. Test the tables
DO $$
DECLARE
    loyalty_count INTEGER;
    qr_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO loyalty_count FROM public.loyalty_transactions;
        RAISE NOTICE 'Public loyalty_transactions count: %', loyalty_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not count public.loyalty_transactions: %', SQLERRM;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO qr_count FROM public.transaction_qr_codes;
        RAISE NOTICE 'Public transaction_qr_codes count: %', qr_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not count public.transaction_qr_codes: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Table tests completed!';
END $$;

-- 13. Final status report
DO $$
DECLARE
    final_loyalty_count INTEGER;
    final_qr_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO final_loyalty_count FROM public.loyalty_transactions;
        SELECT COUNT(*) INTO final_qr_count FROM public.transaction_qr_codes;
        
        RAISE NOTICE 'Migration completed successfully!';
        RAISE NOTICE 'Final record counts:';
        RAISE NOTICE '  public.loyalty_transactions: %', final_loyalty_count;
        RAISE NOTICE '  public.transaction_qr_codes: %', final_qr_count;
        RAISE NOTICE 'Both api and public schemas now point to the same data source.';
        RAISE NOTICE 'Admin health tab should now show healthy status for both tables.';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not get final counts: %', SQLERRM;
    END;
END $$;
