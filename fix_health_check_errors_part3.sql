-- Part 3: Fix loyalty_transactions table and add transaction_type column
-- This is the third part of the health check fix

-- =====================================================
-- FIX LOYALTY_TRANSACTIONS TABLE STRUCTURE
-- =====================================================

-- First, let's check what exists and clean up any conflicts
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING CURRENT LOYALTY_TRANSACTIONS STRUCTURE ===';
    
    -- Check if api.loyalty_transactions exists and what type it is
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' 
        AND table_name = 'loyalty_transactions'
    ) THEN
        RAISE NOTICE 'api.loyalty_transactions exists as a table';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'api' 
        AND table_name = 'loyalty_transactions'
    ) THEN
        RAISE NOTICE 'api.loyalty_transactions exists as a view';
    ELSE
        RAISE NOTICE 'api.loyalty_transactions does not exist';
    END IF;
    
    -- Check if public.loyalty_transactions exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_transactions'
    ) THEN
        RAISE NOTICE 'public.loyalty_transactions exists as a table';
    ELSE
        RAISE NOTICE 'public.loyalty_transactions does not exist';
    END IF;
END $$;

-- Drop any existing api.loyalty_transactions (table or view) to avoid conflicts
DO $$
BEGIN
    -- Check if it's a view and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'api' 
        AND table_name = 'loyalty_transactions'
    ) THEN
        DROP VIEW api.loyalty_transactions CASCADE;
        RAISE NOTICE 'Dropped api.loyalty_transactions view';
    END IF;
    
    -- Check if it's a table and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' 
        AND table_name = 'loyalty_transactions'
    ) THEN
        DROP TABLE api.loyalty_transactions CASCADE;
        RAISE NOTICE 'Dropped api.loyalty_transactions table';
    END IF;
END $$;

-- Ensure public.loyalty_transactions exists with the correct structure
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

-- Add transaction_type column to public.loyalty_transactions
DO $$
BEGIN
    -- Check if transaction_type column exists in public.loyalty_transactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_transactions' 
        AND column_name = 'transaction_type'
    ) THEN
        ALTER TABLE public.loyalty_transactions 
        ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'purchase' 
        CHECK (transaction_type IN ('purchase', 'refund', 'cancellation', 'manual_entry', 'bonus', 'adjustment'));
        
        RAISE NOTICE 'Added transaction_type column to public.loyalty_transactions';
    ELSE
        RAISE NOTICE 'transaction_type column already exists in public.loyalty_transactions';
    END IF;
END $$;

-- Create a view in api schema that points to the public table
-- This ensures the health check can access it via api.loyalty_transactions
CREATE OR REPLACE VIEW api.loyalty_transactions AS
SELECT 
    id,
    user_id,
    merchant_id,
    loyalty_number,
    transaction_amount,
    points_earned,
    transaction_reference,
    transaction_date,
    created_at,
    transaction_type
FROM public.loyalty_transactions;

-- Enable RLS on the public table
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public.loyalty_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Merchants can view their transactions" ON public.loyalty_transactions;
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

DROP POLICY IF EXISTS "Merchants can create transactions" ON public.loyalty_transactions;
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

-- Grant permissions
GRANT ALL ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
GRANT SELECT ON api.loyalty_transactions TO authenticated;
GRANT SELECT ON api.loyalty_transactions TO service_role;
