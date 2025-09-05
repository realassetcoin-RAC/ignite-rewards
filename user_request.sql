-- 0) Ensure api schema exists
CREATE SCHEMA IF NOT EXISTS api;

-- 1) Minimal api.profiles view -> maps to public.profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('v','r')
      AND c.relname = 'profiles'
      AND n.nspname = 'api'
  ) THEN
    EXECUTE $v$
      CREATE VIEW api.profiles AS
      SELECT p.id, p.email, p.full_name, p.role, p.created_at, p.updated_at
      FROM public.profiles p
    $v$;
  END IF;
END$$;

-- 2) Create api.check_admin_access() wrapper searched by PostgREST
CREATE OR REPLACE FUNCTION api.check_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO api, public
AS $$
DECLARE
  is_admin_user boolean := false;
  user_role text;
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Method A: use public.is_admin if present
  BEGIN
    SELECT public.is_admin(user_id) INTO is_admin_user;
    IF is_admin_user THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Method B: api.profiles
  BEGIN
    SELECT role::text INTO user_role
    FROM api.profiles
    WHERE id = user_id
    LIMIT 1;
    IF FOUND AND user_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Method C: public.profiles
  BEGIN
    SELECT role::text INTO user_role
    FROM public.profiles
    WHERE id = user_id OR user_id = user_id
    LIMIT 1;
    IF FOUND AND user_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Method D: known admin email
  BEGIN
    PERFORM 1
    FROM auth.users
    WHERE id = user_id AND email = 'realassetcoin@gmail.com'
    LIMIT 1;
    IF FOUND THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION api.check_admin_access(uuid) TO anon, authenticated;

-- 3) Create api.get_current_user_profile() wrapper searched by PostgREST
CREATE OR REPLACE FUNCTION api.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  totp_secret text,
  mfa_enabled boolean,
  backup_codes text[],
  mfa_setup_completed_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO api, public
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- api.profiles first
  BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::text, p.created_at, p.updated_at,
           NULL::text, false, ARRAY[]::text[], NULL::timestamptz
    FROM api.profiles p
    WHERE p.id = current_user_id
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- fallback to public.profiles
  BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::text, p.created_at, p.updated_at,
           NULL::text, false, ARRAY[]::text[], NULL::timestamptz
    FROM public.profiles p
    WHERE p.id = current_user_id OR p.user_id = current_user_id
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- final fallback: synthesize from auth.users
  BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    IF user_email IS NOT NULL THEN
      RETURN QUERY
      SELECT current_user_id,
             user_email,
             COALESCE(split_part(user_email, '@', 1), 'User'),
             'user'::text,
             now(), now(),
             NULL::text, false, ARRAY[]::text[], NULL::timestamptz;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION api.get_current_user_profile() TO anon, authenticated;

-- 4) Ensure key profiles exist (fixes profile-related errors)
DO $$
DECLARE
  u RECORD;
  admin_user_id uuid;
BEGIN
  -- Seed admin profile if the admin auth user exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'realassetcoin@gmail.com' LIMIT 1;
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (admin_user_id, 'realassetcoin@gmail.com', 'Admin User', 'admin', now(), now())
    ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();
  END IF;

  -- Backfill profiles for all users (role=user by default)
  FOR u IN SELECT id, email FROM auth.users LOOP
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (u.id, u.email, COALESCE(split_part(u.email, '@', 1), 'User'), 'user', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

-- 5) Referrals schema + RLS (needed for ReferralsTab load)
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  reward_points integer DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view active campaigns"
    ON public.referral_campaigns
    FOR SELECT TO anon, authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage campaigns"
    ON public.referral_campaigns
    FOR ALL TO authenticated
    USING (api.check_admin_access());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  referred_email text,
  referred_user_id uuid REFERENCES auth.users(id),
  merchant_id uuid REFERENCES public.merchants(id),
  campaign_id uuid REFERENCES public.referral_campaigns(id),
  status text DEFAULT 'pending',
  reward_points integer DEFAULT 0,
  completed_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own referrals"
    ON public.user_referrals
    FOR SELECT TO authenticated
    USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create referrals"
    ON public.user_referrals
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = referrer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all referrals"
    ON public.user_referrals
    FOR ALL TO authenticated
    USING (api.check_admin_access());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- helper functions for referrals
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists_check integer;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT COUNT(*) INTO exists_check FROM public.user_referrals WHERE referral_code = code;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_referrals (referrer_id, referral_code)
  VALUES (NEW.id, public.generate_referral_code());
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER create_user_referral_code_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_referral_code();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) Optional: admin access to virtual_cards (if you still see admin table errors)
DO $$ BEGIN
  CREATE POLICY "Admin full access to virtual_cards"
    ON public.virtual_cards
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM api.profiles WHERE id = auth.uid() AND role = 'admin'
      ) OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

