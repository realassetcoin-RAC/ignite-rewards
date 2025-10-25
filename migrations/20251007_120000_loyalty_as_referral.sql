-- 1) Ensure profiles.loyalty_number exists and is unique
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS loyalty_number varchar(8);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'profiles_loyalty_number_uniq' AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_loyalty_number_uniq UNIQUE (loyalty_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_loyalty_number ON public.profiles(loyalty_number);

-- 2) Trigger to auto-generate loyalty_number on new profiles
CREATE OR REPLACE FUNCTION public.set_profile_loyalty_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.loyalty_number IS NULL OR NEW.loyalty_number = '' THEN
    NEW.loyalty_number := generate_loyalty_number(COALESCE(NEW.email, 'U@example.com'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_profile_loyalty_number'
  ) THEN
    CREATE TRIGGER trg_set_profile_loyalty_number
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_profile_loyalty_number();
  END IF;
END $$;

-- 3) Referral signups: add referral_code (loyalty_number) and FK if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'referral_signups'
  ) THEN
    ALTER TABLE public.referral_signups
      ADD COLUMN IF NOT EXISTS referral_code varchar(8);

    -- Add FK to profiles.loyalty_number if not present
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' 
        AND table_name = 'referral_signups'
        AND constraint_name = 'referral_signups_referral_code_fk'
    ) THEN
      ALTER TABLE public.referral_signups
        ADD CONSTRAINT referral_signups_referral_code_fk
        FOREIGN KEY (referral_code) REFERENCES public.profiles(loyalty_number);
    END IF;

    CREATE INDEX IF NOT EXISTS idx_referral_signups_referral_code ON public.referral_signups(referral_code);

    -- Backfill from referrer_user_id if column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'referral_signups' AND column_name = 'referrer_user_id'
    ) THEN
      UPDATE public.referral_signups r
      SET referral_code = p.loyalty_number
      FROM public.profiles p
      WHERE r.referrer_user_id = p.id AND r.referral_code IS NULL;
    END IF;
  END IF;
END $$;
