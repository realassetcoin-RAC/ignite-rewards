-- Database Migration: Create Missing Tables for Requirements Compliance
-- Run this script to create all missing tables for the requirements

-- Referral Campaigns Table
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    points_per_referral INTEGER NOT NULL DEFAULT 100,
    max_referrals_per_user INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.referral_campaigns(id) ON DELETE CASCADE,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Referral Settlements Table
CREATE TABLE IF NOT EXISTS public.referral_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.referral_campaigns(id) ON DELETE CASCADE,
    points_awarded INTEGER NOT NULL,
    settlement_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Loyalty Networks Table
CREATE TABLE IF NOT EXISTS public.loyalty_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    conversion_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    minimum_conversion INTEGER NOT NULL DEFAULT 100,
    maximum_conversion INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_mobile_verification BOOLEAN NOT NULL DEFAULT true,
    supported_countries TEXT[] DEFAULT '{}',
    api_endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Loyalty Links Table
CREATE TABLE IF NOT EXISTS public.loyalty_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES public.loyalty_networks(id) ON DELETE CASCADE,
    mobile_number VARCHAR(20) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_conversion TIMESTAMP WITH TIME ZONE,
    total_converted INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, network_id),
    UNIQUE(network_id, mobile_number)
);

-- OTP Codes Table
CREATE TABLE IF NOT EXISTS public.loyalty_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(20) NOT NULL,
    network_id UUID NOT NULL REFERENCES public.loyalty_networks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Wallets Table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    address VARCHAR(255) NOT NULL UNIQUE,
    seed_phrase TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Discount Codes Table
CREATE TABLE IF NOT EXISTS public.merchant_discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Custom NFTs Table
CREATE TABLE IF NOT EXISTS public.merchant_custom_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    benefits TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Feature Controls Table
CREATE TABLE IF NOT EXISTS public.admin_feature_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    subscription_plans TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Point Release Delays Table
CREATE TABLE IF NOT EXISTS public.point_release_delays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.loyalty_transactions(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL,
    release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_released BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Asset Initiatives Table
CREATE TABLE IF NOT EXISTS public.asset_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('environmental', 'social', 'economic', 'health')),
    icon VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Asset Selections Table
CREATE TABLE IF NOT EXISTS public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- NFT Upgrade Payments Table
CREATE TABLE IF NOT EXISTS public.nft_upgrade_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_nft_id UUID NOT NULL,
    target_nft_id UUID NOT NULL,
    amount_usdt DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_intent_id VARCHAR(255),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Email Notifications Log Table
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    variables JSONB,
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer ON public.referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_links_user ON public.loyalty_links(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_links_network ON public.loyalty_links(network_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_mobile ON public.loyalty_otp_codes(mobile_number);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_merchant ON public.merchant_discount_codes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_custom_nfts_merchant ON public.merchant_custom_nfts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_point_release_delays_user ON public.point_release_delays(user_id);
CREATE INDEX IF NOT EXISTS idx_point_release_delays_release_date ON public.point_release_delays(release_date);
CREATE INDEX IF NOT EXISTS idx_email_notifications_to_email ON public.email_notifications(to_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);

-- Enable RLS
ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_custom_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_feature_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_release_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_asset_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_upgrade_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
