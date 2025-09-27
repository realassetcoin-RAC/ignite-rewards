-- Add Google Authentication Disable Support
-- This script adds the necessary database fields and functions for Google auth disable functionality

-- 1. Add Google auth disable fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_auth_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_auth_disabled_at TIMESTAMP WITH TIME ZONE;

-- 2. Add comments to explain the new fields
COMMENT ON COLUMN public.profiles.google_auth_disabled IS 'Whether Google authentication is disabled for this user (seed phrase only login)';
COMMENT ON COLUMN public.profiles.google_auth_disabled_at IS 'Timestamp when Google authentication was disabled';

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_google_auth_disabled ON public.profiles(google_auth_disabled) WHERE google_auth_disabled = TRUE;

-- 4. Create function to check if user can use Google auth
CREATE OR REPLACE FUNCTION public.can_use_google_auth(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_disabled BOOLEAN;
BEGIN
    SELECT google_auth_disabled INTO is_disabled
    FROM public.profiles
    WHERE id = user_id;
    
    -- Return TRUE if Google auth is NOT disabled
    RETURN COALESCE(NOT is_disabled, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to disable Google auth for a user
CREATE OR REPLACE FUNCTION public.disable_google_auth(
    user_id UUID,
    seed_phrase TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    wallet_exists BOOLEAN;
    current_seed_phrase TEXT;
BEGIN
    -- Verify the user has a custodial wallet with the provided seed phrase
    SELECT EXISTS(
        SELECT 1 FROM public.user_wallets 
        WHERE user_id = disable_google_auth.user_id 
        AND wallet_type = 'custodial'
        AND seed_phrase = disable_google_auth.seed_phrase
    ) INTO wallet_exists;
    
    IF NOT wallet_exists THEN
        RAISE EXCEPTION 'Invalid seed phrase or wallet not found';
    END IF;
    
    -- Update profile to disable Google auth
    UPDATE public.profiles 
    SET 
        google_auth_disabled = TRUE,
        google_auth_disabled_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to re-enable Google auth for a user
CREATE OR REPLACE FUNCTION public.enable_google_auth(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update profile to enable Google auth
    UPDATE public.profiles 
    SET 
        google_auth_disabled = FALSE,
        google_auth_disabled_at = NULL
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to authenticate user with seed phrase
CREATE OR REPLACE FUNCTION public.authenticate_with_seed_phrase(seed_phrase TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    can_login BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find user by seed phrase
    SELECT 
        uw.user_id,
        p.email,
        p.full_name,
        p.google_auth_disabled
    INTO user_record
    FROM public.user_wallets uw
    JOIN public.profiles p ON uw.user_id = p.id
    WHERE uw.seed_phrase = authenticate_with_seed_phrase.seed_phrase
    AND uw.wallet_type = 'custodial';
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Return user info if Google auth is disabled (seed phrase login enabled)
    IF user_record.google_auth_disabled THEN
        user_id := user_record.user_id;
        email := user_record.email;
        full_name := user_record.full_name;
        can_login := TRUE;
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION public.can_use_google_auth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_google_auth(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_google_auth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_with_seed_phrase(TEXT) TO anon;

-- 9. Create RLS policy for seed phrase authentication
CREATE POLICY "Users can authenticate with their own seed phrase" ON public.user_wallets
FOR SELECT USING (
    seed_phrase = current_setting('request.jwt.claims', true)::json->>'seed_phrase'
    OR auth.uid() = user_id
);

-- 10. Insert test data for development
DO $$
BEGIN
    -- Update existing test users to have Google auth enabled by default
    UPDATE public.profiles 
    SET google_auth_disabled = FALSE 
    WHERE google_auth_disabled IS NULL;
    
    RAISE NOTICE 'Google authentication disable support added successfully';
END $$;
