-- Fix RLS policies for virtual_cards and user_referrals tables
-- This migration ensures proper access control for both admin and user features

-- First, drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Admin full access virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Public view active virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins have full access to virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Public can view active virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Admins can manage all virtual cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Everyone can view active virtual cards" ON public.virtual_cards;

-- Create comprehensive virtual_cards policies
CREATE POLICY "Admin full access to virtual_cards" ON public.virtual_cards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view active virtual_cards" ON public.virtual_cards
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fix user_referrals policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.user_referrals;

-- Create comprehensive user_referrals policies
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT TO authenticated
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create their own referrals" ON public.user_referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own referrals" ON public.user_referrals
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all referrals" ON public.user_referrals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure RLS is enabled on both tables
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_virtual_cards_active ON public.virtual_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_api ON api.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_public ON public.profiles(id, role);

-- Grant necessary permissions
GRANT SELECT ON public.virtual_cards TO authenticated;
GRANT ALL ON public.virtual_cards TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_referrals TO authenticated;
GRANT ALL ON public.user_referrals TO service_role;

-- Add helpful comments
COMMENT ON POLICY "Admin full access to virtual_cards" ON public.virtual_cards IS 'Allows admins to perform all operations on virtual cards';
COMMENT ON POLICY "Users can view active virtual_cards" ON public.virtual_cards IS 'Allows all authenticated users to view active virtual cards';
COMMENT ON POLICY "Users can view their own referrals" ON public.user_referrals IS 'Allows users to view referrals they created or were referred by';
COMMENT ON POLICY "Users can create their own referrals" ON public.user_referrals IS 'Allows users to create referral records for themselves';
COMMENT ON POLICY "Users can update their own referrals" ON public.user_referrals IS 'Allows users to update their own referral records';
COMMENT ON POLICY "Admins can manage all referrals" ON public.user_referrals IS 'Allows admins to perform all operations on referral records';