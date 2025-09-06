-- Fix loyalty_transactions table schema conflicts and inconsistencies
-- This migration consolidates the table structure and fixes cross-schema issues

-- First, check if the old api.loyalty_transactions table exists and drop it if it does
-- (This handles the case where the old schema was created)
DO $$
BEGIN
  -- Drop the old api.loyalty_transactions table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'loyalty_transactions') THEN
    DROP TABLE api.loyalty_transactions CASCADE;
    RAISE NOTICE 'Dropped old api.loyalty_transactions table';
  END IF;
END $$;

-- Ensure the public.loyalty_transactions table exists with the correct structure
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

-- Enable RLS for loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Merchants can view their transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Merchants can create transactions" ON public.loyalty_transactions;

-- Create proper RLS policies for loyalty_transactions
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_merchant_id ON public.loyalty_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty_number ON public.loyalty_transactions(loyalty_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_date ON public.loyalty_transactions(transaction_date);

-- Add helpful comments
COMMENT ON TABLE public.loyalty_transactions IS 'Stores loyalty point transactions between users and merchants';
COMMENT ON COLUMN public.loyalty_transactions.user_id IS 'Reference to the user who earned the points';
COMMENT ON COLUMN public.loyalty_transactions.merchant_id IS 'Reference to the merchant where the transaction occurred';
COMMENT ON COLUMN public.loyalty_transactions.loyalty_number IS 'The loyalty card number used for the transaction';
COMMENT ON COLUMN public.loyalty_transactions.points_earned IS 'Number of loyalty points earned from this transaction';
COMMENT ON COLUMN public.loyalty_transactions.transaction_reference IS 'Optional reference number for the transaction';

-- Create a function to safely create loyalty transactions
CREATE OR REPLACE FUNCTION public.create_loyalty_transaction(
  p_user_id UUID,
  p_merchant_id UUID,
  p_loyalty_number TEXT,
  p_transaction_amount DECIMAL(10,2),
  p_points_earned INTEGER DEFAULT 0,
  p_transaction_reference TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_id UUID;
BEGIN
  -- Validate that the merchant exists and the user has access
  IF NOT EXISTS (
    SELECT 1 FROM api.merchants m 
    WHERE m.id = p_merchant_id 
    AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Merchant not found or access denied';
  END IF;

  -- Validate that the loyalty number exists
  IF NOT EXISTS (
    SELECT 1 FROM api.user_loyalty_cards ulc
    WHERE ulc.loyalty_number = p_loyalty_number
    AND ulc.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid loyalty number for user';
  END IF;

  -- Insert the transaction
  INSERT INTO public.loyalty_transactions (
    user_id,
    merchant_id,
    loyalty_number,
    transaction_amount,
    points_earned,
    transaction_reference
  ) VALUES (
    p_user_id,
    p_merchant_id,
    p_loyalty_number,
    p_transaction_amount,
    p_points_earned,
    p_transaction_reference
  ) RETURNING id INTO transaction_id;

  -- Update user points balance
  INSERT INTO public.user_points (user_id, total_points, available_points, lifetime_points)
  VALUES (p_user_id, p_points_earned, p_points_earned, p_points_earned)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_points = user_points.total_points + p_points_earned,
    available_points = user_points.available_points + p_points_earned,
    lifetime_points = user_points.lifetime_points + p_points_earned,
    updated_at = now();

  RETURN transaction_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_loyalty_transaction TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.create_loyalty_transaction IS 'Safely creates a loyalty transaction and updates user points balance';
