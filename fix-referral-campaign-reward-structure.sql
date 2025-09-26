-- Fix Referral Campaign Reward Structure
-- Simplified to cover only User-to-User and User-to-Merchant referrals

-- Add new columns to referral_campaigns table for the two referral types
ALTER TABLE public.referral_campaigns 
ADD COLUMN IF NOT EXISTS user_to_user_points INTEGER DEFAULT 10;

ALTER TABLE public.referral_campaigns 
ADD COLUMN IF NOT EXISTS user_to_merchant_points INTEGER DEFAULT 50;

-- Update existing campaigns to use the new structure
-- User-to-User referrals: Standard points (existing reward_points)
-- User-to-Merchant referrals: Higher points (existing reward_points * 5)
UPDATE public.referral_campaigns 
SET 
  user_to_user_points = COALESCE(reward_points, 10),
  user_to_merchant_points = COALESCE(reward_points * 5, 50) -- 5x higher for merchant referrals
WHERE user_to_user_points IS NULL;

-- Add comments to explain the new structure
COMMENT ON COLUMN public.referral_campaigns.user_to_user_points IS 'Points awarded for user referring another user (standard points)';
COMMENT ON COLUMN public.referral_campaigns.user_to_merchant_points IS 'Points awarded for user referring a merchant (higher points)';

-- Create a function to get the appropriate reward points based on referral type
CREATE OR REPLACE FUNCTION public.get_referral_reward_points(
  p_campaign_id UUID,
  p_referred_type TEXT  -- 'user' or 'merchant'
)
RETURNS INTEGER AS $$
DECLARE
  v_campaign RECORD;
  v_reward_points INTEGER;
BEGIN
  -- Get campaign details
  SELECT * INTO v_campaign
  FROM public.referral_campaigns
  WHERE id = p_campaign_id
    AND is_active = true
    AND now() BETWEEN start_date AND end_date;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Determine reward points based on referral type
  IF p_referred_type = 'user' THEN
    v_reward_points := v_campaign.user_to_user_points;
  ELSIF p_referred_type = 'merchant' THEN
    v_reward_points := v_campaign.user_to_merchant_points;
  ELSE
    v_reward_points := 0;
  END IF;
  
  RETURN COALESCE(v_reward_points, 0);
END;
$$ LANGUAGE plpgsql;

-- Create a function to determine if referred user is a merchant
CREATE OR REPLACE FUNCTION public.is_merchant(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is a merchant
  RETURN EXISTS(
    SELECT 1 FROM public.merchants 
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Update the referral settlement function to use the new reward structure
CREATE OR REPLACE FUNCTION public.award_referral_on_first_payment(p_referred_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_referral RECORD;
  v_campaign RECORD;
  v_referred_type TEXT;
  v_reward_points INTEGER;
BEGIN
  -- Find the referral where this user was referred and not yet rewarded
  SELECT * INTO v_referral
  FROM public.user_referrals
  WHERE referred_user_id = p_referred_user_id
    AND status <> 'rewarded'
  ORDER BY created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get active campaign
  SELECT * INTO v_campaign
  FROM public.referral_campaigns
  WHERE id = v_referral.campaign_id
    AND is_active = true
    AND now() BETWEEN start_date AND end_date;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Determine if referred user is a merchant
  IF public.is_merchant(p_referred_user_id) THEN
    v_referred_type := 'merchant';
  ELSE
    v_referred_type := 'user';
  END IF;
  
  -- Get appropriate reward points
  v_reward_points := public.get_referral_reward_points(
    v_campaign.id, 
    v_referred_type
  );

  -- Update referral to rewarded and assign points
  UPDATE public.user_referrals
  SET status = 'rewarded',
      reward_points = v_reward_points,
      rewarded_at = now(),
      completed_at = COALESCE(completed_at, now())
  WHERE id = v_referral.id;

  -- Increment referrer's points balance (if user_points table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_points' AND table_schema = 'public') THEN
    INSERT INTO public.user_points (user_id, points)
    VALUES (v_referral.referrer_id, v_reward_points)
    ON CONFLICT (user_id) 
    DO UPDATE SET points = user_points.points + v_reward_points;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert sample campaigns with the simplified reward structure
INSERT INTO public.referral_campaigns (
  name, 
  description, 
  user_to_user_points,
  user_to_merchant_points,
  max_referrals_per_user,
  start_date, 
  end_date,
  is_active
) VALUES 
(
  'Standard Referral Campaign',
  'Standard rewards for user referrals, higher rewards for merchant referrals',
  10,  -- user to user (standard points)
  50,  -- user to merchant (higher points - 5x)
  10,
  now(),
  now() + interval '1 year',
  true
),
(
  'Premium Referral Campaign',
  'Higher rewards for all referral types',
  20,  -- user to user (higher standard)
  100, -- user to merchant (much higher - 5x)
  5,
  now(),
  now() + interval '6 months',
  true
)
ON CONFLICT DO NOTHING;

-- Verify the new structure
SELECT 
  name,
  user_to_user_points,
  user_to_merchant_points,
  max_referrals_per_user,
  is_active
FROM public.referral_campaigns
ORDER BY created_at DESC;