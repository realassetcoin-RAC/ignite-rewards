-- Fix profiles table by adding missing totp_secret column
-- This addresses the console error: "column profiles.totp_secret does not exist"

-- Add totp_secret column to public.profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'totp_secret'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN totp_secret TEXT;
    RAISE NOTICE 'Added totp_secret column to public.profiles';
  ELSE
    RAISE NOTICE 'totp_secret column already exists in public.profiles';
  END IF;
END $$;

-- Add totp_secret column to api.profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'api' AND table_name = 'profiles' AND column_name = 'totp_secret'
  ) THEN
    ALTER TABLE api.profiles ADD COLUMN totp_secret TEXT;
    RAISE NOTICE 'Added totp_secret column to api.profiles';
  ELSE
    RAISE NOTICE 'totp_secret column already exists in api.profiles';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.totp_secret IS 'TOTP secret for two-factor authentication';
COMMENT ON COLUMN api.profiles.totp_secret IS 'TOTP secret for two-factor authentication';
