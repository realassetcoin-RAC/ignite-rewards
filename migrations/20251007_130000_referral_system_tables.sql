-- Create missing referral system tables
-- This fixes the broken referral crediting system

-- 1. Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.referral_campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for referral_codes
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer_id ON public.referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_campaign_id ON public.referral_codes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_used ON public.referral_codes(is_used);

-- 2. Create referral_settlements table
CREATE TABLE IF NOT EXISTS public.referral_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.referral_campaigns(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  settlement_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for referral_settlements
CREATE INDEX IF NOT EXISTS idx_referral_settlements_referrer_id ON public.referral_settlements(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_settlements_referred_user_id ON public.referral_settlements(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_settlements_campaign_id ON public.referral_settlements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referral_settlements_status ON public.referral_settlements(status);

-- 3. Create referral_signups table for tracking referral attempts
CREATE TABLE IF NOT EXISTS public.referral_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code VARCHAR(8) NOT NULL,
  referrer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email VARCHAR(255),
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.referral_campaigns(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for referral_signups
CREATE INDEX IF NOT EXISTS idx_referral_signups_referral_code ON public.referral_signups(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer_user_id ON public.referral_signups(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referred_user_id ON public.referral_signups(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_status ON public.referral_signups(status);

-- 4. Add missing columns to referral_campaigns if they don't exist
DO $$
BEGIN
  -- Add points_per_referral column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'referral_campaigns' AND column_name = 'points_per_referral'
  ) THEN
    ALTER TABLE public.referral_campaigns ADD COLUMN points_per_referral INTEGER DEFAULT 100;
  END IF;
  
  -- Add max_referrals_per_user column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'referral_campaigns' AND column_name = 'max_referrals_per_user'
  ) THEN
    ALTER TABLE public.referral_campaigns ADD COLUMN max_referrals_per_user INTEGER DEFAULT 10;
  END IF;
END $$;

-- 5. Enable Row Level Security
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for referral_codes
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can create referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON public.referral_codes;

CREATE POLICY "Users can view their own referral codes" 
ON public.referral_codes FOR SELECT 
USING (referrer_id = auth.uid()::uuid);

CREATE POLICY "Users can create referral codes" 
ON public.referral_codes FOR INSERT 
WITH CHECK (referrer_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own referral codes" 
ON public.referral_codes FOR UPDATE 
USING (referrer_id = auth.uid()::uuid);

-- 7. Create RLS policies for referral_settlements
DROP POLICY IF EXISTS "Users can view their own referral settlements" ON public.referral_settlements;
DROP POLICY IF EXISTS "System can create referral settlements" ON public.referral_settlements;
DROP POLICY IF EXISTS "System can update referral settlements" ON public.referral_settlements;

CREATE POLICY "Users can view their own referral settlements" 
ON public.referral_settlements FOR SELECT 
USING (referrer_id = auth.uid()::uuid OR referred_user_id = auth.uid()::uuid);

CREATE POLICY "System can create referral settlements" 
ON public.referral_settlements FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update referral settlements" 
ON public.referral_settlements FOR UPDATE 
USING (true);

-- 8. Create RLS policies for referral_signups
DROP POLICY IF EXISTS "Users can view their own referral signups" ON public.referral_signups;
DROP POLICY IF EXISTS "System can create referral signups" ON public.referral_signups;
DROP POLICY IF EXISTS "System can update referral signups" ON public.referral_signups;

CREATE POLICY "Users can view their own referral signups" 
ON public.referral_signups FOR SELECT 
USING (referrer_user_id = auth.uid()::uuid OR referred_user_id = auth.uid()::uuid);

CREATE POLICY "System can create referral signups" 
ON public.referral_signups FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update referral signups" 
ON public.referral_signups FOR UPDATE 
USING (true);

-- 9. Create trigger to update updated_at column for referral_settlements
CREATE OR REPLACE FUNCTION update_referral_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_referral_settlements_updated_at ON public.referral_settlements;
CREATE TRIGGER trg_update_referral_settlements_updated_at
  BEFORE UPDATE ON public.referral_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_settlements_updated_at();

-- 10. Insert default referral campaign if none exists
INSERT INTO public.referral_campaigns (name, campaign_name, description, points_per_referral, max_referrals_per_user, is_active, start_date, end_date)
SELECT 
  'Default Referral Campaign',
  'Default Referral Campaign', 
  'Default campaign for user referrals',
  100,
  10,
  true,
  now(),
  now() + interval '1 year'
WHERE NOT EXISTS (SELECT 1 FROM public.referral_campaigns WHERE is_active = true);

-- 11. Create function to generate referral codes for existing users
CREATE OR REPLACE FUNCTION generate_referral_codes_for_existing_users()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  campaign_id UUID;
BEGIN
  -- Get the active campaign
  SELECT id INTO campaign_id FROM public.referral_campaigns WHERE is_active = true LIMIT 1;
  
  IF campaign_id IS NULL THEN
    RAISE NOTICE 'No active referral campaign found';
    RETURN;
  END IF;
  
  -- Generate referral codes for users who don't have them
  FOR user_record IN 
    SELECT p.id, p.loyalty_number 
    FROM public.profiles p 
    WHERE p.loyalty_number IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM public.referral_codes rc 
      WHERE rc.referrer_id = p.id AND rc.campaign_id = campaign_id
    )
  LOOP
    INSERT INTO public.referral_codes (code, referrer_id, campaign_id)
    VALUES (user_record.loyalty_number, user_record.id, campaign_id)
    ON CONFLICT (code) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Generated referral codes for existing users';
END;
$$ LANGUAGE plpgsql;

-- 12. Execute the function to generate referral codes
SELECT generate_referral_codes_for_existing_users();

-- 13. Clean up the function
DROP FUNCTION generate_referral_codes_for_existing_users();
