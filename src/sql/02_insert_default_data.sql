-- Insert Default Data for Requirements Compliance
-- Run this script after creating tables to populate with default data

-- Insert default referral campaign
INSERT INTO public.referral_campaigns (name, points_per_referral, max_referrals_per_user, is_active) VALUES
('Welcome Campaign', 100, 10, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default loyalty networks
INSERT INTO public.loyalty_networks (network_name, display_name, description, conversion_rate, is_active) VALUES
('starbucks_rewards', 'Starbucks Rewards', 'Convert your Starbucks Stars to PointBridge tokens', 1.0000, true),
('airlines_miles', 'Airlines Miles', 'Convert airline miles to PointBridge tokens', 0.8000, true),
('hotel_points', 'Hotel Points', 'Convert hotel loyalty points to PointBridge tokens', 0.9000, true),
('retail_rewards', 'Retail Rewards', 'Convert retail store points to PointBridge tokens', 1.1000, true)
ON CONFLICT (network_name) DO NOTHING;

-- Insert default asset initiatives
INSERT INTO public.asset_initiatives (name, description, category, icon, is_active) VALUES
('Environmental Conservation', 'Support environmental protection and conservation efforts', 'environmental', '🌱', true),
('Education for All', 'Provide educational opportunities for underprivileged children', 'social', '📚', true),
('Economic Development', 'Support local economic development and entrepreneurship', 'economic', '💼', true),
('Healthcare Access', 'Improve healthcare access in underserved communities', 'health', '🏥', true),
('Clean Water Initiative', 'Provide clean water access to communities in need', 'environmental', '💧', true),
('Digital Literacy', 'Promote digital literacy and technology education', 'social', '💻', true),
('Sustainable Agriculture', 'Support sustainable farming practices', 'economic', '🚜', true),
('Mental Health Support', 'Provide mental health resources and support', 'health', '🧠', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default feature controls
INSERT INTO public.admin_feature_controls (feature_name, description, is_enabled, subscription_plans) VALUES
('discount_codes', 'Allow merchants to create discount codes', true, ARRAY['premium', 'enterprise']),
('custom_nft', 'Allow merchants to upload custom NFT cards', true, ARRAY['premium', 'enterprise']),
('advanced_analytics', 'Provide advanced analytics and reporting', true, ARRAY['premium', 'enterprise']),
('email_marketing', 'Allow merchants to send marketing emails', true, ARRAY['basic', 'premium', 'enterprise']),
('api_access', 'Provide API access for integrations', true, ARRAY['enterprise']),
('priority_support', 'Provide priority customer support', true, ARRAY['premium', 'enterprise']),
('white_label', 'Allow white-label customization', true, ARRAY['enterprise']),
('multi_location', 'Support multiple business locations', true, ARRAY['premium', 'enterprise'])
ON CONFLICT (feature_name) DO NOTHING;

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables) VALUES
(
    'referral_welcome',
    'Welcome to PointBridge - You''ve Earned {{points_awarded}} Points!',
    '<h1>Welcome to PointBridge!</h1>
    <p>Hello {{user_email}},</p>
    <p>You''ve been referred by {{referrer_name}} and have earned <strong>{{points_awarded}} bonus points</strong>!</p>
    <p>Start earning more rewards by shopping with our partner merchants.</p>
    <p>Best regards,<br>The PointBridge Team</p>',
    'Welcome to PointBridge!\n\nHello {{user_email}},\n\nYou''ve been referred by {{referrer_name}} and have earned {{points_awarded}} bonus points!\n\nStart earning more rewards by shopping with our partner merchants.\n\nBest regards,\nThe PointBridge Team',
    ARRAY['referrer_name', 'points_awarded', 'user_email']
),
(
    'loyalty_linking',
    'Loyalty Account Linked - {{network_name}}',
    '<h1>Loyalty Account Successfully Linked</h1>
    <p>Hello {{user_email}},</p>
    <p>Your {{network_name}} account ({{mobile_number}}) has been successfully linked to PointBridge.</p>
    <p>You can now transfer your loyalty points between platforms.</p>
    <p>Best regards,<br>The PointBridge Team</p>',
    'Loyalty Account Successfully Linked\n\nHello {{user_email}},\n\nYour {{network_name}} account ({{mobile_number}}) has been successfully linked to PointBridge.\n\nYou can now transfer your loyalty points between platforms.\n\nBest regards,\nThe PointBridge Team',
    ARRAY['network_name', 'mobile_number', 'user_email']
),
(
    'transfer_completion',
    'Points Transfer Completed - {{network_name}}',
    '<h1>Points Transfer Completed</h1>
    <p>Hello {{user_email}},</p>
    <p>Your points transfer from {{network_name}} has been completed successfully.</p>
    <p>You have received <strong>{{points_transferred}} points</strong> in your PointBridge account.</p>
    <p>Best regards,<br>The PointBridge Team</p>',
    'Points Transfer Completed\n\nHello {{user_email}},\n\nYour points transfer from {{network_name}} has been completed successfully.\n\nYou have received {{points_transferred}} points in your PointBridge account.\n\nBest regards,\nThe PointBridge Team',
    ARRAY['network_name', 'points_transferred', 'user_email']
),
(
    'nft_upgrade',
    'NFT Upgrade Successful - {{new_nft_name}}',
    '<h1>NFT Upgrade Successful!</h1>
    <p>Hello {{user_email}},</p>
    <p>Your loyalty NFT has been successfully upgraded from {{old_nft_name}} to {{new_nft_name}}.</p>
    <p>Upgrade cost: <strong>${{upgrade_price}} USDT</strong></p>
    <p>New features will apply to future transactions only.</p>
    <p>Best regards,<br>The PointBridge Team</p>',
    'NFT Upgrade Successful!\n\nHello {{user_email}},\n\nYour loyalty NFT has been successfully upgraded from {{old_nft_name}} to {{new_nft_name}}.\n\nUpgrade cost: ${{upgrade_price}} USDT\n\nNew features will apply to future transactions only.\n\nBest regards,\nThe PointBridge Team',
    ARRAY['old_nft_name', 'new_nft_name', 'upgrade_price', 'user_email']
),
(
    'point_release',
    'Points Released - {{points_released}} Points Available',
    '<h1>Points Released</h1>
    <p>Hello {{user_email}},</p>
    <p>Your points from the transaction on {{transaction_date}} have been released after the 30-day delay period.</p>
    <p>You now have <strong>{{points_released}} additional points</strong> available in your account.</p>
    <p>Best regards,<br>The PointBridge Team</p>',
    'Points Released\n\nHello {{user_email}},\n\nYour points from the transaction on {{transaction_date}} have been released after the 30-day delay period.\n\nYou now have {{points_released}} additional points available in your account.\n\nBest regards,\nThe PointBridge Team',
    ARRAY['points_released', 'transaction_date', 'user_email']
)
ON CONFLICT (name) DO NOTHING;
