-- Local PostgreSQL Database Setup Script
-- This script sets up the local database for the RAC Rewards application

-- Create database if it doesn't exist
-- Note: You may need to run this manually: CREATE DATABASE rac_rewards;

-- Connect to the rac_rewards database
-- \c rac_rewards;

-- Create schema if needed
CREATE SCHEMA IF NOT EXISTS public;

-- Set search path
SET search_path TO public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the main tables (from 01_create_missing_tables.sql)
-- Referral Campaigns
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  points_per_referral integer NOT NULL,
  max_referrals_per_user integer NOT NULL,
  is_active boolean DEFAULT TRUE,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User Wallets
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_address text NOT NULL,
  seed_phrase_encrypted text,
  is_custodial boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Point Release Delays
CREATE TABLE IF NOT EXISTS public.point_release_delays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  points_amount integer NOT NULL,
  release_date timestamp with time zone NOT NULL,
  is_released boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT now(),
  released_at timestamp with time zone
);

-- Loyalty Networks
CREATE TABLE IF NOT EXISTS public.loyalty_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  logo_url text,
  conversion_rate numeric(10,4) NOT NULL,
  minimum_conversion integer DEFAULT 0,
  maximum_conversion integer,
  is_active boolean DEFAULT TRUE,
  requires_mobile_verification boolean DEFAULT TRUE,
  supported_countries text[] DEFAULT '{}',
  api_endpoint text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Asset Initiatives
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  is_active boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Merchant Custom NFTs
CREATE TABLE IF NOT EXISTS public.merchant_custom_nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  benefits text[],
  is_active boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Discount Codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  code text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) NOT NULL,
  minimum_amount numeric(10,2),
  maximum_discount numeric(10,2),
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT TRUE,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(merchant_id, code)
);

-- Admin Feature Controls
CREATE TABLE IF NOT EXISTS public.admin_feature_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL UNIQUE,
  description text,
  is_enabled boolean DEFAULT TRUE,
  subscription_plans text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Loyalty OTP Codes
CREATE TABLE IF NOT EXISTS public.loyalty_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number text NOT NULL,
  network_id uuid NOT NULL,
  user_id uuid NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT now()
);

-- Email Notifications
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  notification_type text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Ecommerce Webhooks
CREATE TABLE IF NOT EXISTS public.ecommerce_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  webhook_url text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT TRUE,
  last_used timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON public.referral_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_point_release_delays_user_id ON public.point_release_delays(user_id);
CREATE INDEX IF NOT EXISTS idx_point_release_delays_release_date ON public.point_release_delays(release_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_networks_active ON public.loyalty_networks(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_custom_nfts_merchant_id ON public.merchant_custom_nfts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_merchant_id ON public.discount_codes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_codes_mobile ON public.loyalty_otp_codes(mobile_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_otp_codes_expires ON public.loyalty_otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);

-- Insert default data (from 02_insert_default_data.sql)
INSERT INTO public.referral_campaigns (name, points_per_referral, max_referrals_per_user, is_active)
VALUES
  ('Default Referral Campaign', 100, 10, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.loyalty_networks (network_name, display_name, description, conversion_rate, minimum_conversion, maximum_conversion, is_active, requires_mobile_verification, supported_countries)
VALUES
  ('starbucks', 'Starbucks Rewards', 'Earn stars and redeem rewards', 1.0, 0, 1000, TRUE, TRUE, ARRAY['US', 'CA']),
  ('mcdonalds', 'McDonald''s App', 'Get exclusive deals and rewards', 1.0, 0, 500, TRUE, TRUE, ARRAY['US', 'CA']),
  ('subway', 'Subway Rewards', 'Earn points on every purchase', 1.0, 0, 750, TRUE, TRUE, ARRAY['US', 'CA'])
ON CONFLICT (network_name) DO NOTHING;

INSERT INTO public.asset_initiatives (name, description, category, is_active)
VALUES
  ('Environmental Conservation', 'Support environmental protection initiatives', 'Environment', TRUE),
  ('Education Support', 'Fund educational programs and scholarships', 'Education', TRUE),
  ('Healthcare Access', 'Improve healthcare access in underserved communities', 'Healthcare', TRUE),
  ('Community Development', 'Support local community development projects', 'Community', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_feature_controls (feature_name, description, is_enabled, subscription_plans)
VALUES
  ('discount_codes', 'Allow merchants to create and manage discount codes', TRUE, ARRAY['premium', 'enterprise']),
  ('custom_nft', 'Allow merchants to upload custom loyalty NFT cards', TRUE, ARRAY['premium', 'enterprise']),
  ('advanced_analytics', 'Provide detailed analytics and reporting', TRUE, ARRAY['enterprise']),
  ('email_marketing', 'Send automated email campaigns to customers', TRUE, ARRAY['premium', 'enterprise']),
  ('api_access', 'Provide API access for third-party integrations', TRUE, ARRAY['enterprise'])
ON CONFLICT (feature_name) DO NOTHING;

-- Create a function to get table list (for verification)
CREATE OR REPLACE FUNCTION get_table_list()
RETURNS TABLE(table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON FUNCTION get_table_list() TO postgres;

-- Display completion message
SELECT 'Database setup completed successfully!' as status;
