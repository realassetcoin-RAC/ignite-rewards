-- Award referral points on first successful merchant payment
-- Assumptions:
-- - merchant signups create a user_referrals row with referred_user_id
-- - completing first payment will call this function or insert a record in a payments table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'award_referral_on_first_payment'
  ) THEN
    CREATE OR REPLACE FUNCTION public.award_referral_on_first_payment(p_referred_user_id UUID)
    RETURNS VOID AS $$
    DECLARE
      v_referral RECORD;
      v_campaign RECORD;
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

      -- Get active campaign to determine reward points; fallback to referral's stored points or 10
      SELECT * INTO v_campaign
      FROM public.referral_campaigns
      WHERE is_active = true
        AND now() BETWEEN start_date AND end_date
      ORDER BY created_at DESC
      LIMIT 1;

      -- Update referral to rewarded and assign points
      UPDATE public.user_referrals
      SET status = 'rewarded',
          reward_points = COALESCE(v_campaign.reward_points, user_referrals.reward_points, 10),
          rewarded_at = now(),
          completed_at = COALESCE(completed_at, now())
      WHERE id = v_referral.id;

      -- Increment referrer's points balance
      INSERT INTO public.user_points (user_id, total_points, available_points, lifetime_points)
      VALUES (v_referral.referrer_id, COALESCE(v_campaign.reward_points, 10), COALESCE(v_campaign.reward_points, 10), COALESCE(v_campaign.reward_points, 10))
      ON CONFLICT (user_id) DO UPDATE SET
        total_points = public.user_points.total_points + COALESCE(v_campaign.reward_points, 10),
        available_points = public.user_points.available_points + COALESCE(v_campaign.reward_points, 10),
        lifetime_points = public.user_points.lifetime_points + COALESCE(v_campaign.reward_points, 10),
        updated_at = now();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- Create user_loyalty_cards table and generate_loyalty_number function

CREATE TABLE public.user_loyalty_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loyalty_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_loyalty_cards
ALTER TABLE public.user_loyalty_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_loyalty_cards
CREATE POLICY "Users can view their own loyalty card" 
ON public.user_loyalty_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty card" 
ON public.user_loyalty_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty card" 
ON public.user_loyalty_cards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate loyalty numbers
CREATE OR REPLACE FUNCTION public.generate_loyalty_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loyalty_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 12-digit loyalty number
    loyalty_num := 'LY' || lpad(floor(random() * 1000000000)::text, 10, '0');
    
    -- Check if number already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.user_loyalty_cards 
    WHERE loyalty_number = loyalty_num;
    
    -- Exit loop if number is unique
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN loyalty_num;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_user_loyalty_cards_updated_at
  BEFORE UPDATE ON public.user_loyalty_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();