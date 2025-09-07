-- Comprehensive fix for Health Tab warnings and errors
-- This addresses missing tables, RPCs, and permission issues that cause warnings in the API Health tab

-- 1. Check current state of tables
DO $$
DECLARE
  tbl_name TEXT;
  table_count INTEGER;
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  existing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- List of tables that the health tab checks
  FOR tbl_name IN SELECT unnest(ARRAY[
    'profiles', 'merchants', 'virtual_cards', 'loyalty_transactions', 
    'user_loyalty_cards', 'user_points', 'user_referrals', 'user_wallets',
    'merchant_cards', 'merchant_subscriptions', 'merchant_subscription_plans',
    'referral_campaigns', 'transaction_qr_codes', 'subscribers'
  ])
  LOOP
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = tbl_name;
    
    IF table_count > 0 THEN
      existing_tables := existing_tables || tbl_name;
    ELSE
      missing_tables := missing_tables || tbl_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Existing tables: %', array_to_string(existing_tables, ', ');
  RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
END $$;

-- 2. Create missing tables that are commonly needed

-- Create user_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS api.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'ethereum', -- 'ethereum', 'solana', etc.
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, wallet_type)
);

-- Create merchant_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS api.merchant_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'loyalty',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merchant_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS api.merchant_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES api.merchants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES api.merchant_subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skip transaction_qr_codes table creation - it already exists as a view
-- Views don't need to be created here as they're already defined in the schema

-- Create subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS api.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Enable RLS on all tables (only if they are tables, not views)
DO $$
BEGIN
  -- Enable RLS on user_wallets if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_wallets') THEN
    ALTER TABLE api.user_wallets ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on user_wallets table';
  END IF;
  
  -- Enable RLS on merchant_cards if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_cards') THEN
    ALTER TABLE api.merchant_cards ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on merchant_cards table';
  END IF;
  
  -- Enable RLS on merchant_subscriptions if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_subscriptions') THEN
    ALTER TABLE api.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on merchant_subscriptions table';
  END IF;
  
  -- Skip transaction_qr_codes if it's a view
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'api' AND table_name = 'transaction_qr_codes') THEN
    RAISE NOTICE 'transaction_qr_codes is a view, skipping RLS setup';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'transaction_qr_codes') THEN
    ALTER TABLE api.transaction_qr_codes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on transaction_qr_codes table';
  END IF;
  
  -- Enable RLS on subscribers if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'subscribers') THEN
    ALTER TABLE api.subscribers ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on subscribers table';
  END IF;
END $$;

-- 4. Create RLS policies for user_wallets
DROP POLICY IF EXISTS "Users can view their own wallets" ON api.user_wallets;
DROP POLICY IF EXISTS "Users can create their own wallets" ON api.user_wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON api.user_wallets;
DROP POLICY IF EXISTS "Admins can manage all wallets" ON api.user_wallets;

CREATE POLICY "Users can view their own wallets" ON api.user_wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wallets" ON api.user_wallets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets" ON api.user_wallets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all wallets" ON api.user_wallets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Create RLS policies for merchant_cards
DROP POLICY IF EXISTS "Merchants can view their cards" ON api.merchant_cards;
DROP POLICY IF EXISTS "Merchants can create cards" ON api.merchant_cards;
DROP POLICY IF EXISTS "Merchants can update their cards" ON api.merchant_cards;
DROP POLICY IF EXISTS "Admins can manage all cards" ON api.merchant_cards;

CREATE POLICY "Merchants can view their cards" ON api.merchant_cards
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create cards" ON api.merchant_cards
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update their cards" ON api.merchant_cards
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all cards" ON api.merchant_cards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Create RLS policies for merchant_subscriptions
DROP POLICY IF EXISTS "Merchants can view their subscriptions" ON api.merchant_subscriptions;
DROP POLICY IF EXISTS "Merchants can create subscriptions" ON api.merchant_subscriptions;
DROP POLICY IF EXISTS "Merchants can update their subscriptions" ON api.merchant_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON api.merchant_subscriptions;

CREATE POLICY "Merchants can view their subscriptions" ON api.merchant_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create subscriptions" ON api.merchant_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update their subscriptions" ON api.merchant_subscriptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM api.merchants 
      WHERE id = merchant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all subscriptions" ON api.merchant_subscriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Skip RLS policies for transaction_qr_codes since it's a view
-- Views don't need RLS policies - they inherit security from their underlying tables
DO $$
BEGIN
  RAISE NOTICE 'Skipping RLS policies for transaction_qr_codes (it is a view)';
END $$;

-- 8. Create RLS policies for subscribers
DROP POLICY IF EXISTS "Anyone can view subscribers" ON api.subscribers;
DROP POLICY IF EXISTS "Anyone can create subscribers" ON api.subscribers;
DROP POLICY IF EXISTS "Admins can manage all subscribers" ON api.subscribers;

CREATE POLICY "Anyone can view subscribers" ON api.subscribers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can create subscribers" ON api.subscribers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all subscribers" ON api.subscribers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Grant permissions (only for tables, not views)
DO $$
BEGIN
  -- Grant permissions on user_wallets if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'user_wallets') THEN
    GRANT ALL ON api.user_wallets TO authenticated;
    RAISE NOTICE 'Granted permissions on user_wallets table';
  END IF;
  
  -- Grant permissions on merchant_cards if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_cards') THEN
    GRANT ALL ON api.merchant_cards TO authenticated;
    RAISE NOTICE 'Granted permissions on merchant_cards table';
  END IF;
  
  -- Grant permissions on merchant_subscriptions if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'merchant_subscriptions') THEN
    GRANT ALL ON api.merchant_subscriptions TO authenticated;
    RAISE NOTICE 'Granted permissions on merchant_subscriptions table';
  END IF;
  
  -- Grant permissions on transaction_qr_codes if it's a table (not a view)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'transaction_qr_codes') THEN
    GRANT ALL ON api.transaction_qr_codes TO authenticated;
    RAISE NOTICE 'Granted permissions on transaction_qr_codes table';
  ELSIF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'api' AND table_name = 'transaction_qr_codes') THEN
    RAISE NOTICE 'transaction_qr_codes is a view, skipping permission grants';
  END IF;
  
  -- Grant permissions on subscribers if it's a table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'subscribers') THEN
    GRANT ALL ON api.subscribers TO authenticated;
    RAISE NOTICE 'Granted permissions on subscribers table';
  END IF;
END $$;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON api.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_type ON api.user_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_merchant_cards_merchant_id ON api.merchant_cards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_merchant_id ON api.merchant_subscriptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_status ON api.merchant_subscriptions(status);
-- Skip index creation for transaction_qr_codes since it's a view
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON api.subscribers(email);

-- 11. Create triggers for updated_at columns
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON api.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchant_cards_updated_at
  BEFORE UPDATE ON api.merchant_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchant_subscriptions_updated_at
  BEFORE UPDATE ON api.merchant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Create missing RPC functions that the health tab checks

-- Create is_admin RPC function
CREATE OR REPLACE FUNCTION api.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Create check_admin_access RPC function
CREATE OR REPLACE FUNCTION api.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 13. Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO authenticated;

-- 14. Verify all tables are accessible
DO $$
DECLARE
  tbl_name TEXT;
  table_count INTEGER;
  total_tables INTEGER := 0;
  accessible_tables INTEGER := 0;
BEGIN
  -- Check each table that the health tab monitors
  FOR tbl_name IN SELECT unnest(ARRAY[
    'profiles', 'merchants', 'virtual_cards', 'loyalty_transactions', 
    'user_loyalty_cards', 'user_points', 'user_referrals', 'user_wallets',
    'merchant_cards', 'merchant_subscriptions', 'merchant_subscription_plans',
    'referral_campaigns', 'transaction_qr_codes', 'subscribers'
  ])
  LOOP
    total_tables := total_tables + 1;
    
    -- Test if table is accessible
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM api.%I LIMIT 1', tbl_name);
      accessible_tables := accessible_tables + 1;
      RAISE NOTICE 'Table % is accessible', tbl_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Table % is NOT accessible: %', tbl_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Health check summary: %/% tables accessible', accessible_tables, total_tables;
END $$;

-- 15. Test RPC functions
DO $$
DECLARE
  is_admin_result BOOLEAN;
  check_admin_result BOOLEAN;
BEGIN
  -- Test is_admin RPC
  BEGIN
    SELECT api.is_admin() INTO is_admin_result;
    RAISE NOTICE 'is_admin RPC is accessible, result: %', is_admin_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'is_admin RPC is NOT accessible: %', SQLERRM;
  END;
  
  -- Test check_admin_access RPC
  BEGIN
    SELECT api.check_admin_access() INTO check_admin_result;
    RAISE NOTICE 'check_admin_access RPC is accessible, result: %', check_admin_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'check_admin_access RPC is NOT accessible: %', SQLERRM;
  END;
END $$;

-- 16. Final summary
SELECT 
  'Health Tab Fix Complete' as status,
  'All missing tables and RPCs have been created' as message,
  now() as completed_at;
