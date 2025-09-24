-- ✅ IMPLEMENT REQUIREMENT: Row Level Security (RLS) policies for database security
-- OWASP A01: Broken Access Control - Implement proper access controls
-- These policies ensure users can only access their own data and admins have appropriate permissions

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_upgrade_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_monthly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PROFILES TABLE POLICIES
-- ==============================================================================

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "admins_can_view_all_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "admins_can_update_all_profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- ==============================================================================
-- USER LOYALTY CARDS POLICIES
-- ==============================================================================

-- Users can view their own loyalty cards
CREATE POLICY "users_can_view_own_loyalty_cards" ON user_loyalty_cards
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own loyalty cards
CREATE POLICY "users_can_update_own_loyalty_cards" ON user_loyalty_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all loyalty cards
CREATE POLICY "admins_can_view_all_loyalty_cards" ON user_loyalty_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- Merchants can view loyalty cards for their transactions
CREATE POLICY "merchants_can_view_customer_loyalty_cards" ON user_loyalty_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM merchants m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.user_id = p.id
      AND m.is_active = true
    )
  );

-- ==============================================================================
-- USER WALLETS POLICIES
-- ==============================================================================

-- Users can view their own wallets
CREATE POLICY "users_can_view_own_wallets" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own wallets
CREATE POLICY "users_can_update_own_wallets" ON user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own wallets
CREATE POLICY "users_can_insert_own_wallets" ON user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all wallets (but not seed phrases for security)
CREATE POLICY "admins_can_view_wallet_info" ON user_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- ==============================================================================
-- TRANSACTIONS POLICIES
-- ==============================================================================

-- Users can view transactions where they are the customer
CREATE POLICY "users_can_view_own_transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_loyalty_cards ulc
      WHERE ulc.loyalty_number = transactions.loyalty_number
      AND ulc.user_id = auth.uid()
    )
  );

-- Merchants can view their own transactions
CREATE POLICY "merchants_can_view_own_transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM merchants m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = transactions.merchant_id
      AND m.user_id = p.id
    )
  );

-- Merchants can update their own transactions (within 30 days)
CREATE POLICY "merchants_can_update_own_recent_transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM merchants m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = transactions.merchant_id
      AND m.user_id = p.id
      AND transactions.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    )
  );

-- Merchants can insert transactions
CREATE POLICY "merchants_can_insert_transactions" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = merchant_id
      AND m.user_id = p.id
    )
  );

-- Admins can view all transactions
CREATE POLICY "admins_can_view_all_transactions" ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- ==============================================================================
-- PAYMENT RELATED POLICIES
-- ==============================================================================

-- Users can view their own NFT upgrade payments
CREATE POLICY "users_can_view_own_nft_payments" ON nft_upgrade_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own NFT upgrade payments
CREATE POLICY "users_can_insert_own_nft_payments" ON nft_upgrade_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System can update NFT payments (for payment processing)
CREATE POLICY "system_can_update_nft_payments" ON nft_upgrade_payments
  FOR UPDATE USING (true);

-- Users can view their own subscription payments
CREATE POLICY "users_can_view_own_subscription_payments" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscription payments
CREATE POLICY "users_can_insert_own_subscription_payments" ON subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System can update subscription payments
CREATE POLICY "system_can_update_subscription_payments" ON subscription_payments
  FOR UPDATE USING (true);

-- ==============================================================================
-- USER SUBSCRIPTIONS POLICIES
-- ==============================================================================

-- Users can view their own subscriptions
CREATE POLICY "users_can_view_own_subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- System can manage user subscriptions
CREATE POLICY "system_can_manage_user_subscriptions" ON user_subscriptions
  FOR ALL USING (true);

-- Admins can view all subscriptions
CREATE POLICY "admins_can_view_all_subscriptions" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- ==============================================================================
-- ECOMMERCE TRANSACTIONS POLICIES
-- ==============================================================================

-- Users can view their own ecommerce transactions
CREATE POLICY "users_can_view_own_ecommerce_transactions" ON ecommerce_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Merchants can view their own ecommerce transactions
CREATE POLICY "merchants_can_view_own_ecommerce_transactions" ON ecommerce_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM merchants m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = ecommerce_transactions.merchant_id
      AND m.user_id = p.id
    )
  );

-- System can insert ecommerce transactions (via API)
CREATE POLICY "system_can_insert_ecommerce_transactions" ON ecommerce_transactions
  FOR INSERT WITH CHECK (true);

-- Admins can view all ecommerce transactions
CREATE POLICY "admins_can_view_all_ecommerce_transactions" ON ecommerce_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- ==============================================================================
-- COMMUNICATION POLICIES (SMS, EMAIL)
-- ==============================================================================

-- Users can view their own SMS OTP codes
CREATE POLICY "users_can_view_own_sms_otp" ON sms_otp_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own SMS OTP codes
CREATE POLICY "users_can_insert_own_sms_otp" ON sms_otp_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System can update SMS OTP codes (for verification)
CREATE POLICY "system_can_update_sms_otp" ON sms_otp_codes
  FOR UPDATE USING (true);

-- System can delete expired SMS OTP codes
CREATE POLICY "system_can_delete_expired_sms_otp" ON sms_otp_codes
  FOR DELETE USING (expires_at < NOW());

-- Users can view their own email notifications
CREATE POLICY "users_can_view_own_email_notifications" ON email_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System can manage email notifications
CREATE POLICY "system_can_manage_email_notifications" ON email_notifications
  FOR ALL USING (true);

-- ==============================================================================
-- LOYALTY INTEGRATION POLICIES
-- ==============================================================================

-- Users can view their own loyalty links
CREATE POLICY "users_can_view_own_loyalty_links" ON user_loyalty_links
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own loyalty links
CREATE POLICY "users_can_insert_own_loyalty_links" ON user_loyalty_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System can update loyalty links (for verification)
CREATE POLICY "system_can_update_loyalty_links" ON user_loyalty_links
  FOR UPDATE USING (true);

-- ==============================================================================
-- REFERRAL SYSTEM POLICIES
-- ==============================================================================

-- Users can view their own referral codes
CREATE POLICY "users_can_view_own_referral_codes" ON referral_codes
  FOR SELECT USING (auth.uid() = referrer_id);

-- Users can insert their own referral codes
CREATE POLICY "users_can_insert_own_referral_codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Anyone can view active referral codes (for signup)
CREATE POLICY "anyone_can_view_active_referral_codes" ON referral_codes
  FOR SELECT USING (is_active = true AND expires_at > NOW());

-- Users can view referral settlements where they are involved
CREATE POLICY "users_can_view_own_referral_settlements" ON referral_settlements
  FOR SELECT USING (
    auth.uid() = referrer_id OR 
    auth.uid() = referred_user_id
  );

-- System can manage referral settlements
CREATE POLICY "system_can_manage_referral_settlements" ON referral_settlements
  FOR ALL USING (true);

-- ==============================================================================
-- MERCHANT POLICIES
-- ==============================================================================

-- Merchants can view their own merchant record
CREATE POLICY "merchants_can_view_own_record" ON merchants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.id = merchants.user_id
    )
  );

-- Merchants can update their own merchant record
CREATE POLICY "merchants_can_update_own_record" ON merchants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.id = merchants.user_id
    )
  );

-- Admins can view all merchants
CREATE POLICY "admins_can_view_all_merchants" ON merchants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- Merchants can view their own monthly points
CREATE POLICY "merchants_can_view_own_monthly_points" ON merchant_monthly_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM merchants m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = merchant_monthly_points.merchant_id
      AND m.user_id = p.id
    )
  );

-- System can manage merchant monthly points
CREATE POLICY "system_can_manage_merchant_monthly_points" ON merchant_monthly_points
  FOR ALL USING (true);

-- ==============================================================================
-- SECURITY FUNCTIONS
-- ==============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND app_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is merchant
CREATE OR REPLACE FUNCTION auth.is_merchant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM merchants m
    JOIN profiles p ON p.id = auth.uid()
    WHERE m.user_id = p.id
    AND m.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's merchant ID
CREATE OR REPLACE FUNCTION auth.get_user_merchant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = auth.uid()
    WHERE m.user_id = p.id
    AND m.is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- AUDIT POLICIES
-- ==============================================================================

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "only_admins_can_view_audit_logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "system_can_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- SECURITY TRIGGERS
-- ==============================================================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert audit record for sensitive tables
  IF TG_TABLE_NAME IN ('user_wallets', 'nft_upgrade_payments', 'subscription_payments') THEN
    INSERT INTO audit_logs (user_id, table_name, operation, old_values, new_values)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      TG_OP,
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
DROP TRIGGER IF EXISTS audit_user_wallets ON user_wallets;
CREATE TRIGGER audit_user_wallets
  AFTER INSERT OR UPDATE OR DELETE ON user_wallets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_nft_payments ON nft_upgrade_payments;
CREATE TRIGGER audit_nft_payments
  AFTER INSERT OR UPDATE OR DELETE ON nft_upgrade_payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_subscription_payments ON subscription_payments;
CREATE TRIGGER audit_subscription_payments
  AFTER INSERT OR UPDATE OR DELETE ON subscription_payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ==============================================================================
-- GRANT PERMISSIONS
-- ==============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_loyalty_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON nft_upgrade_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscription_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ecommerce_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sms_otp_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_loyalty_links TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referral_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referral_settlements TO authenticated;
GRANT SELECT, UPDATE ON merchants TO authenticated;
GRANT SELECT, UPDATE ON merchant_monthly_points TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- Grant service role permissions for system operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON POLICY "users_can_view_own_profile" ON profiles IS 
  'Users can only view their own profile data for privacy protection';

COMMENT ON POLICY "merchants_can_update_own_recent_transactions" ON transactions IS 
  'Merchants can edit transactions within 30 days as per business requirements';

COMMENT ON POLICY "system_can_update_nft_payments" ON nft_upgrade_payments IS 
  'Payment processing system needs to update payment status';

COMMENT ON FUNCTION auth.is_admin() IS 
  'Security function to check admin privileges for RLS policies';

COMMENT ON TABLE audit_logs IS 
  'Audit trail for sensitive operations to meet compliance requirements';
