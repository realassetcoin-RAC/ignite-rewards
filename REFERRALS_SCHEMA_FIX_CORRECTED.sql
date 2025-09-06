-- CORRECTED Fix for referrals tab error: "Could not find the table 'api.user_referrals' in the schema cache"
-- This ensures the user_referrals table exists in the public schema with proper permissions
-- Updated to use api.profiles instead of public.profiles

-- 1. Ensure the public schema exists and is accessible
CREATE SCHEMA IF NOT EXISTS public;

-- 2. Create referral_campaigns table if it doesn't exist (dependency for user_referrals)
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

-- 3. Create merchants table in public schema if it doesn't exist (dependency for user_referrals)
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Drop and recreate user_referrals table to ensure it's in the correct schema
DROP TABLE IF EXISTS public.user_referrals CASCADE;

CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES public.merchants(id),
  campaign_id UUID REFERENCES public.referral_campaigns(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  reward_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Enable Row Level Security
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- 6. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can update referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can delete referrals" ON public.user_referrals;

-- 7. Create comprehensive RLS policies for user_referrals (using api.profiles)
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

-- 8. Create policies for referral_campaigns
DROP POLICY IF EXISTS "Anyone can view campaigns" ON public.referral_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.referral_campaigns;

CREATE POLICY "Anyone can view campaigns" ON public.referral_campaigns
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage campaigns" ON public.referral_campaigns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Create policies for merchants
DROP POLICY IF EXISTS "Users can view merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can create merchants" ON public.merchants;
DROP POLICY IF EXISTS "Users can update their merchants" ON public.merchants;
DROP POLICY IF EXISTS "Admins can manage merchants" ON public.merchants;

CREATE POLICY "Users can view merchants" ON public.merchants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create merchants" ON public.merchants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their merchants" ON public.merchants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage merchants" ON public.merchants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. Grant necessary permissions
GRANT ALL ON public.user_referrals TO authenticated;
GRANT ALL ON public.referral_campaigns TO authenticated;
GRANT ALL ON public.merchants TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON public.user_referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON public.referral_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_merchants_user ON public.merchants(user_id);

-- 12. Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_referrals_updated_at ON public.user_referrals;
CREATE TRIGGER update_user_referrals_updated_at
  BEFORE UPDATE ON public.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_campaigns_updated_at ON public.referral_campaigns;
CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON public.referral_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Insert default data if tables are empty
DO $$
BEGIN
  -- Insert default referral campaign
  IF NOT EXISTS (SELECT 1 FROM public.referral_campaigns LIMIT 1) THEN
    INSERT INTO public.referral_campaigns (name, description, reward_points, start_date, end_date) VALUES
    ('Launch Campaign', 'Earn 10 points for each merchant referral with successful payment', 10, now(), now() + interval '1 year');
  END IF;
END $$;

-- 15. Verify the tables are accessible and in the correct schema
DO $$
DECLARE
  referrals_count INTEGER;
  campaigns_count INTEGER;
  merchants_count INTEGER;
BEGIN
  -- Test query on user_referrals
  SELECT COUNT(*) INTO referrals_count FROM public.user_referrals;
  RAISE NOTICE 'user_referrals table accessible in public schema, count: %', referrals_count;

  -- Test query on referral_campaigns  
  SELECT COUNT(*) INTO campaigns_count FROM public.referral_campaigns;
  RAISE NOTICE 'referral_campaigns table accessible in public schema, count: %', campaigns_count;

  -- Test query on merchants
  SELECT COUNT(*) INTO merchants_count FROM public.merchants;
  RAISE NOTICE 'merchants table accessible in public schema, count: %', merchants_count;
  
  -- Check schema configuration
  RAISE NOTICE 'All tables are in the public schema and accessible';
  
  -- Verify the table is not in api schema
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_referrals') THEN
    RAISE NOTICE 'WARNING: user_referrals table also exists in api schema - this may cause conflicts';
  ELSE
    RAISE NOTICE 'CONFIRMED: user_referrals table only exists in public schema';
  END IF;
END $$;

-- 16. Add helpful comments
COMMENT ON TABLE public.user_referrals IS 'Stores user referral information and tracking - accessible via public.user_referrals';
COMMENT ON TABLE public.referral_campaigns IS 'Manages referral campaigns and reward configurations';
COMMENT ON TABLE public.merchants IS 'Stores merchant information for referral tracking';

-- 17. Final verification query for the frontend
-- This should return the table structure that the frontend expects
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_referrals'
ORDER BY ordinal_position;
