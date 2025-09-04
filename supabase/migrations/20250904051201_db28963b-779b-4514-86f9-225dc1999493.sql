-- Fix security warnings: Set proper search_path for functions

-- Update generate_referral_code function with proper search_path
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character referral code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.user_referrals 
    WHERE referral_code = code;
    
    -- Exit loop if code is unique
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Update create_user_referral_code function with proper search_path
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert referral code for new user
  INSERT INTO public.user_referrals (referrer_id, referral_code)
  VALUES (NEW.id, public.generate_referral_code());
  
  -- Initialize user points
  INSERT INTO public.user_points (user_id, total_points, available_points, lifetime_points)
  VALUES (NEW.id, 0, 0, 0);
  
  RETURN NEW;
END;
$$;