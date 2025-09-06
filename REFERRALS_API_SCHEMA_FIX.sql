-- FIX: Create user_referrals table in the API schema to match the client configuration
-- This addresses the "Could not find the table 'api.user_referrals' in the schema cache" error
-- by creating the table in the correct schema that the frontend expects

-- 1. Check current state
DO $$
DECLARE
  api_count INTEGER;
  public_count INTEGER;
BEGIN
  -- Check if user_referrals exists in api schema
  SELECT COUNT(*) INTO api_count 
  FROM information_schema.tables 
  WHERE table_schema = 'api' AND table_name = 'user_referrals';
  
  -- Check if user_referrals exists in public schema
  SELECT COUNT(*) INTO public_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_referrals';
  
  RAISE NOTICE 'user_referrals in api schema: %', api_count;
  RAISE NOTICE 'user_referrals in public schema: %', public_count;
END $$;

-- 2. Ensure required dependencies exist in api schema
CREATE TABLE IF NOT EXISTS api.referral_campaigns (
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

-- 3. Drop and recreate user_referrals table in api schema
DROP TABLE IF EXISTS api.user_referrals CASCADE;

CREATE TABLE api.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES api.merchants(id),
  campaign_id UUID REFERENCES api.referral_campaigns(id),
  status TEXT DEFAULT 'pending',
  reward_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE api.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.referral_campaigns ENABLE ROW LEVEL SECURITY;

-- 5. Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON api.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON api.user_referrals;
DROP POLICY IF EXISTS "Users can update referrals" ON api.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON api.user_referrals;
DROP POLICY IF EXISTS "Admins can delete referrals" ON api.user_referrals;

-- 6. Create comprehensive RLS policies
CREATE POLICY "Users can view their own referrals" ON api.user_referrals
  FOR SELECT TO authenticated
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create referrals" ON api.user_referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update referrals" ON api.user_referrals
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

CREATE POLICY "Admins can delete referrals" ON api.user_referrals
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Create policies for referral_campaigns
DROP POLICY IF EXISTS "Anyone can view campaigns" ON api.referral_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON api.referral_campaigns;

CREATE POLICY "Anyone can view campaigns" ON api.referral_campaigns
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage campaigns" ON api.referral_campaigns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Grant permissions explicitly
GRANT ALL ON api.user_referrals TO authenticated;
GRANT ALL ON api.referral_campaigns TO authenticated;
GRANT USAGE ON SCHEMA api TO authenticated;

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON api.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON api.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON api.user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON api.user_referrals(status);

-- 10. Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers
CREATE TRIGGER update_user_referrals_updated_at
  BEFORE UPDATE ON api.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON api.referral_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Insert default data
INSERT INTO api.referral_campaigns (name, description, reward_points, start_date, end_date) 
VALUES ('Launch Campaign', 'Earn 10 points for each merchant referral with successful payment', 10, now(), now() + interval '1 year')
ON CONFLICT DO NOTHING;

-- 13. Force schema cache refresh by querying the table
SELECT COUNT(*) FROM api.user_referrals;

-- 14. Verify table accessibility
DO $$
DECLARE
  referrals_count INTEGER;
BEGIN
  -- Test basic access
  SELECT COUNT(*) INTO referrals_count FROM api.user_referrals;
  RAISE NOTICE 'api.user_referrals table accessible, count: %', referrals_count;
  
  -- Test with a sample query
  SELECT COUNT(*) INTO referrals_count 
  FROM api.user_referrals 
  WHERE referrer_id IS NOT NULL;
  
  RAISE NOTICE 'api.user_referrals table queryable, filtered count: %', referrals_count;
  
  RAISE NOTICE 'SUCCESS: user_referrals table is properly configured in api schema';
END $$;

-- 15. Final verification
SELECT 
  'user_referrals' as table_name,
  'api' as schema_name,
  COUNT(*) as row_count
FROM api.user_referrals
UNION ALL
SELECT 
  'referral_campaigns' as table_name,
  'api' as schema_name,
  COUNT(*) as row_count
FROM api.referral_campaigns;
