-- =============================================================================
-- FIX MISSING STATUS COLUMNS
-- =============================================================================
-- 
-- This script adds missing "status" columns to tables that commonly need them
-- in admin dashboard contexts.
--
-- INSTRUCTIONS:
-- 1. First run check_table_schemas.sql to see what's missing
-- 2. Go to your Supabase dashboard (https://supabase.com/dashboard)
-- 3. Select your project
-- 4. Go to the SQL Editor
-- 5. Copy and paste this entire script
-- 6. Click "RUN" to execute
--
-- =============================================================================

-- Fix 1: Add status column to merchants table if it exists but lacks status
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchants') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'api' AND table_name = 'merchants' AND column_name = 'status') THEN
            ALTER TABLE api.merchants ADD COLUMN status TEXT DEFAULT 'active';
            RAISE NOTICE '✅ Added status column to merchants table';
        ELSE
            RAISE NOTICE '✅ merchants table already has status column';
        END IF;
    ELSE
        RAISE NOTICE '❌ merchants table does not exist - creating it';
        
        -- Create merchants table with status column
        CREATE TABLE api.merchants (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            description TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
            subscription_plan_id UUID REFERENCES api.merchant_subscription_plans(id),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE api.merchants ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Anyone can view active merchants" ON api.merchants FOR SELECT TO authenticated, anon USING (status = 'active');
        CREATE POLICY "Admins can view all merchants" ON api.merchants FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM api.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
        CREATE POLICY "Admins can insert merchants" ON api.merchants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM api.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
        CREATE POLICY "Admins can update merchants" ON api.merchants FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM api.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
        CREATE POLICY "Admins can delete merchants" ON api.merchants FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM api.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
        
        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchants TO authenticated;
        GRANT SELECT ON api.merchants TO anon;
        
        RAISE NOTICE '✅ Created merchants table with status column';
    END IF;
END $$;

-- Fix 2: Add status column to virtual_cards table if it exists but lacks status
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'virtual_cards') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'api' AND table_name = 'virtual_cards' AND column_name = 'status') THEN
            ALTER TABLE api.virtual_cards ADD COLUMN status TEXT DEFAULT 'active';
            RAISE NOTICE '✅ Added status column to virtual_cards table';
        ELSE
            RAISE NOTICE '✅ virtual_cards table already has status column';
        END IF;
    END IF;
END $$;

-- Fix 3: Ensure merchant_subscription_plans has is_active (not status)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans' AND column_name = 'is_active') THEN
            ALTER TABLE api.merchant_subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
            RAISE NOTICE '✅ Added is_active column to merchant_subscription_plans table';
        ELSE
            RAISE NOTICE '✅ merchant_subscription_plans table already has is_active column';
        END IF;
    END IF;
END $$;

-- Fix 4: Create indexes on status columns
CREATE INDEX IF NOT EXISTS idx_merchants_status ON api.merchants(status);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON api.virtual_cards(status);

-- Fix 5: Update any existing records to have proper status values
UPDATE api.merchants SET status = 'active' WHERE status IS NULL;
UPDATE api.virtual_cards SET status = 'active' WHERE status IS NULL;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
    merchants_has_status boolean := false;
    virtual_cards_has_status boolean := false;
    plans_has_is_active boolean := false;
BEGIN
    -- Check merchants table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'api' AND table_name = 'merchants' AND column_name = 'status'
    ) INTO merchants_has_status;
    
    -- Check virtual_cards table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'api' AND table_name = 'virtual_cards' AND column_name = 'status'
    ) INTO virtual_cards_has_status;
    
    -- Check subscription plans table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans' AND column_name = 'is_active'
    ) INTO plans_has_is_active;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 STATUS COLUMN FIX RESULTS:';
    RAISE NOTICE '';
    RAISE NOTICE '✅ merchants.status: %', CASE WHEN merchants_has_status THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '✅ virtual_cards.status: %', CASE WHEN virtual_cards_has_status THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '✅ merchant_subscription_plans.is_active: %', CASE WHEN plans_has_is_active THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '';
    
END $$;