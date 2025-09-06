-- Fix security vulnerability: Restrict merchant access to loyalty cards
-- Only allow merchants to view loyalty cards for customers who have actual transactions with them

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Merchants can view loyalty cards for their transactions" ON public.user_loyalty_cards;

-- Create a secure policy that only allows access to loyalty cards with actual transaction history
CREATE POLICY "Merchants can view loyalty cards with transaction history" ON public.user_loyalty_cards
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.loyalty_transactions lt
    INNER JOIN api.merchants m ON lt.merchant_id = m.id
    WHERE lt.loyalty_number = user_loyalty_cards.loyalty_number 
    AND m.user_id = auth.uid()
  )
);

-- Add helpful comment
COMMENT ON POLICY "Merchants can view loyalty cards with transaction history" ON public.user_loyalty_cards 
IS 'Allows merchants to view only loyalty cards that have actual transaction history with their business, preventing access to unrelated customer data';