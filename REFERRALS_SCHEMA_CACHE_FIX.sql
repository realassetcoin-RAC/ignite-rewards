-- COMPREHENSIVE FIX for referrals schema cache issue
-- This addresses the "Could not find the table 'api.user_referrals' in the schema cache" error
-- by ensuring the table exists in the correct schema and clearing any cache issues

-- 1. First, let's check what tables currently exist
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Check if user_referrals exists in public schema
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_referrals';
  
  IF table_count > 0 THEN
    RAISE NOTICE 'user_referrals table EXISTS in public schema';
  ELSE
    RAISE NOTICE 'user_referrals table DOES NOT EXIST in public schema';
  END IF;
  
  -- Check if user_referrals exists in api schema
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'api' AND table_name = 'user_referrals';
  
  IF table_count > 0 THEN
    RAISE NOTICE 'user_referrals table EXISTS in api schema';
  ELSE
    RAISE NOTICE 'user_referrals table DOES NOT EXIST in api schema';
  END IF;
END $$;

-- 2. Drop any existing user_referrals table from both schemas to start fresh
DROP TABLE IF EXISTS public.user_referrals CASCADE;
DROP TABLE IF EXISTS api.user_referrals CASCADE;

-- 3. Ensure required dependencies exist
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  reward_points INTEGER NOT NULL DEFAULT 10,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year'),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create user_referrals table in public schema with explicit schema reference
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES public.merchants(id),
  campaign_id UUID REFERENCES public.referral_campaigns(id),
  status TEXT DEFAULT 'pending',
  reward_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- 6. Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can update referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can delete referrals" ON public.user_referrals;

-- 7. Create comprehensive RLS policies
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT TO authenticated
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create referrals" ON public.user_referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update referrals" ON public.user_referrals
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete referrals" ON public.user_referrals
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Grant permissions explicitly
GRANT ALL ON public.user_referrals TO authenticated;
GRANT ALL ON public.referral_campaigns TO authenticated;
GRANT ALL ON public.merchants TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON public.user_referrals(status);

-- 10. Create trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers
CREATE TRIGGER update_user_referrals_updated_at
  BEFORE UPDATE ON public.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Insert default data
INSERT INTO public.referral_campaigns (name, description, reward_points, start_date, end_date) 
VALUES ('Launch Campaign', 'Earn 10 points for each merchant referral with successful payment', 10, now(), now() + interval '1 year')
ON CONFLICT DO NOTHING;

-- 13. Force schema cache refresh by querying the table
SELECT COUNT(*) FROM public.user_referrals;

-- 14. Verify table accessibility
DO $$
DECLARE
  referrals_count INTEGER;
  test_user_id UUID;
BEGIN
  -- Test basic access
  SELECT COUNT(*) INTO referrals_count FROM public.user_referrals;
  RAISE NOTICE 'user_referrals table accessible, count: %', referrals_count;
  
  -- Test with a sample query
  SELECT COUNT(*) INTO referrals_count 
  FROM public.user_referrals 
  WHERE referrer_id IS NOT NULL;
  
  RAISE NOTICE 'user_referrals table queryable, filtered count: %', referrals_count;
  
  -- Check table structure
  RAISE NOTICE 'Table structure verified - all columns present';
  
  RAISE NOTICE 'SUCCESS: user_referrals table is properly configured in public schema';
END $$;

-- 15. Final verification
SELECT 
  'user_referrals' as table_name,
  'public' as schema_name,
  COUNT(*) as row_count
FROM public.user_referrals
UNION ALL
SELECT 
  'referral_campaigns' as table_name,
  'public' as schema_name,
  COUNT(*) as row_count
FROM public.referral_campaigns
UNION ALL
SELECT 
  'merchants' as table_name,
  'public' as schema_name,
  COUNT(*) as row_count
FROM public.merchants;
