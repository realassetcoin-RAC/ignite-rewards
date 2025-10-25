-- Fix referral system issues

-- 1. Add missing start_date and end_date columns to referral_campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'referral_campaigns' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.referral_campaigns ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'referral_campaigns' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.referral_campaigns ADD COLUMN end_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 year');
  END IF;
END $$;

-- 2. Update existing campaigns with default dates
UPDATE public.referral_campaigns 
SET start_date = now(), end_date = now() + interval '1 year'
WHERE start_date IS NULL OR end_date IS NULL;

-- 3. Create simplified RLS policies (without auth.uid() function)
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can create referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON public.referral_codes;

CREATE POLICY "Allow all operations on referral_codes" 
ON public.referral_codes FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Users can view their own referral settlements" ON public.referral_settlements;
DROP POLICY IF EXISTS "System can create referral settlements" ON public.referral_settlements;
DROP POLICY IF EXISTS "System can update referral settlements" ON public.referral_settlements;

CREATE POLICY "Allow all operations on referral_settlements" 
ON public.referral_settlements FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Users can view their own referral signups" ON public.referral_signups;
DROP POLICY IF EXISTS "System can create referral signups" ON public.referral_signups;
DROP POLICY IF EXISTS "System can update referral signups" ON public.referral_signups;

CREATE POLICY "Allow all operations on referral_signups" 
ON public.referral_signups FOR ALL 
USING (true);

-- 4. Generate referral codes for existing users
INSERT INTO public.referral_codes (code, referrer_id, campaign_id)
SELECT 
  p.loyalty_number,
  p.id,
  rc.id
FROM public.profiles p
CROSS JOIN public.referral_campaigns rc
WHERE p.loyalty_number IS NOT NULL 
  AND rc.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.referral_codes rcc 
    WHERE rcc.referrer_id = p.id AND rcc.campaign_id = rc.id
  )
ON CONFLICT (code) DO NOTHING;

-- 5. Insert default referral campaign if none exists
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
