-- ===========================================
-- FIX RLS POLICIES FOR ANONYMOUS ACCESS
-- ===========================================
-- This script fixes RLS policies to allow anonymous access for testing

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can create their own merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can update their own merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can view their own loyalty cards" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can create their own loyalty cards" ON public.user_loyalty_cards;
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;

-- Step 2: Create permissive policies for testing
-- Allow anonymous access to read NFT types
CREATE POLICY "Allow anonymous read access to NFT types" ON public.nft_types 
FOR SELECT USING (true);

-- Allow anonymous access to read NFT collections
CREATE POLICY "Allow anonymous read access to NFT collections" ON public.nft_collections 
FOR SELECT USING (true);

-- Allow anonymous access to read minting control
CREATE POLICY "Allow anonymous read access to minting control" ON public.nft_minting_control 
FOR SELECT USING (true);

-- Allow anonymous access to read profiles (for testing)
CREATE POLICY "Allow anonymous read access to profiles" ON public.profiles 
FOR SELECT USING (true);

-- Allow anonymous access to read merchants
CREATE POLICY "Allow anonymous read access to merchants" ON public.merchants 
FOR SELECT USING (true);

-- Allow anonymous access to read user loyalty cards
CREATE POLICY "Allow anonymous read access to user loyalty cards" ON public.user_loyalty_cards 
FOR SELECT USING (true);

-- Allow anonymous access to read user points
CREATE POLICY "Allow anonymous read access to user points" ON public.user_points 
FOR SELECT USING (true);

-- Allow anonymous access to read loyalty transactions
CREATE POLICY "Allow anonymous read access to loyalty transactions" ON public.loyalty_transactions 
FOR SELECT USING (true);

-- Allow anonymous access to read merchant subscription plans
CREATE POLICY "Allow anonymous read access to merchant subscription plans" ON public.merchant_subscription_plans 
FOR SELECT USING (true);

-- Allow anonymous access to read referral campaigns
CREATE POLICY "Allow anonymous read access to referral campaigns" ON public.referral_campaigns 
FOR SELECT USING (true);

-- Step 3: Verification
SELECT 'RLS policies updated for anonymous access!' as status;

-- Test the policies by trying to read from each table
SELECT 'Testing NFT types access...' as test, COUNT(*) as count FROM public.nft_types;
SELECT 'Testing NFT collections access...' as test, COUNT(*) as count FROM public.nft_collections;
SELECT 'Testing minting control access...' as test, COUNT(*) as count FROM public.nft_minting_control;

