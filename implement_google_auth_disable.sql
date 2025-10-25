-- =============================================================================
-- GOOGLE AUTHENTICATION DISABLE FUNCTIONALITY
-- =============================================================================
-- This script adds functionality to disable Google/email authentication for users
-- who have verified their seed phrase backup

-- =============================================================================
-- 1. ADD GOOGLE AUTH DISABLE COLUMN TO PROFILES TABLE
-- =============================================================================

-- Add column to track if Google auth is disabled
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_auth_disabled BOOLEAN DEFAULT FALSE;

-- Add column to track when Google auth was disabled
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_auth_disabled_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- 2. CREATE FUNCTION TO DISABLE GOOGLE AUTH
-- =============================================================================

CREATE OR REPLACE FUNCTION disable_google_auth(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_backup BOOLEAN;
    has_wallet BOOLEAN;
BEGIN
    -- Check if user has verified seed phrase backup
    SELECT EXISTS(
        SELECT 1 FROM public.wallet_backup_verification 
        WHERE user_id = user_uuid 
        AND verification_status = 'verified'
    ) INTO has_backup;
    
    -- Check if user has an active wallet
    SELECT EXISTS(
        SELECT 1 FROM public.user_solana_wallets 
        WHERE user_id = user_uuid 
        AND is_active = true
    ) INTO has_wallet;
    
    -- Only allow disabling if user has both wallet and verified backup
    IF NOT (has_backup AND has_wallet) THEN
        RAISE EXCEPTION 'User must have verified seed phrase backup before disabling Google authentication';
    END IF;
    
    -- Update profile to disable Google auth
    UPDATE public.profiles 
    SET 
        google_auth_disabled = true,
        google_auth_disabled_at = NOW()
    WHERE id = user_uuid;
    
    -- Check if update was successful
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'User profile not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. CREATE FUNCTION TO ENABLE GOOGLE AUTH
-- =============================================================================

CREATE OR REPLACE FUNCTION enable_google_auth(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update profile to enable Google auth
    UPDATE public.profiles 
    SET 
        google_auth_disabled = false,
        google_auth_disabled_at = NULL
    WHERE id = user_uuid;
    
    -- Check if update was successful
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'User profile not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. CREATE FUNCTION TO CHECK GOOGLE AUTH STATUS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_google_auth_status(user_uuid UUID)
RETURNS TABLE(
    google_auth_disabled BOOLEAN,
    google_auth_disabled_at TIMESTAMP WITH TIME ZONE,
    can_disable BOOLEAN,
    has_verified_backup BOOLEAN,
    has_active_wallet BOOLEAN
) AS $$
DECLARE
    has_backup BOOLEAN;
    has_wallet BOOLEAN;
    profile_record RECORD;
BEGIN
    -- Get profile information
    SELECT google_auth_disabled, google_auth_disabled_at
    INTO profile_record
    FROM public.profiles 
    WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Check if user has verified seed phrase backup
    SELECT EXISTS(
        SELECT 1 FROM public.wallet_backup_verification 
        WHERE user_id = user_uuid 
        AND verification_status = 'verified'
    ) INTO has_backup;
    
    -- Check if user has an active wallet
    SELECT EXISTS(
        SELECT 1 FROM public.user_solana_wallets 
        WHERE user_id = user_uuid 
        AND is_active = true
    ) INTO has_wallet;
    
    RETURN QUERY SELECT 
        profile_record.google_auth_disabled,
        profile_record.google_auth_disabled_at,
        (has_backup AND has_wallet AND NOT profile_record.google_auth_disabled),
        has_backup,
        has_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. CREATE FUNCTION TO VALIDATE LOGIN METHOD
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_login_method(user_uuid UUID, login_method TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    auth_status RECORD;
BEGIN
    -- Get Google auth status
    SELECT * INTO auth_status FROM get_google_auth_status(user_uuid);
    
    -- If Google auth is disabled, only allow seed phrase login
    IF auth_status.google_auth_disabled AND login_method = 'google' THEN
        RETURN FALSE;
    END IF;
    
    -- If Google auth is enabled, allow both methods
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION disable_google_auth(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION enable_google_auth(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION get_google_auth_status(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION validate_login_method(UUID, TEXT) TO postgres;

-- Grant permissions on profiles table
GRANT SELECT, UPDATE ON public.profiles TO postgres;

-- =============================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for Google auth status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_auth_disabled 
ON public.profiles (google_auth_disabled);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_id_google_auth 
ON public.profiles (id, google_auth_disabled);

-- =============================================================================
-- 8. UPDATE EXISTING USERS
-- =============================================================================

-- Set Google auth as enabled for all existing users
UPDATE public.profiles 
SET google_auth_disabled = false 
WHERE google_auth_disabled IS NULL;

-- =============================================================================
-- 9. TEST THE IMPLEMENTATION
-- =============================================================================

-- Test the functions
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    auth_status RECORD;
    can_disable BOOLEAN;
BEGIN
    -- Test getting auth status
    SELECT * INTO auth_status FROM get_google_auth_status(test_user_id);
    
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'GOOGLE AUTH DISABLE FUNCTIONALITY IMPLEMENTED';
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Test User ID: %', test_user_id;
    RAISE NOTICE 'Google Auth Disabled: %', auth_status.google_auth_disabled;
    RAISE NOTICE 'Has Verified Backup: %', auth_status.has_verified_backup;
    RAISE NOTICE 'Has Active Wallet: %', auth_status.has_active_wallet;
    RAISE NOTICE 'Can Disable Google Auth: %', auth_status.can_disable;
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Functions Available:';
    RAISE NOTICE '- disable_google_auth(user_uuid)';
    RAISE NOTICE '- enable_google_auth(user_uuid)';
    RAISE NOTICE '- get_google_auth_status(user_uuid)';
    RAISE NOTICE '- validate_login_method(user_uuid, login_method)';
    RAISE NOTICE '===============================================================================';
END $$;
