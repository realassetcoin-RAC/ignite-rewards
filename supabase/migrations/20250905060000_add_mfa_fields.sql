-- Add MFA fields to user profiles
-- This migration adds TOTP-based MFA support for email/social authentication users

-- Add MFA fields to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mfa_setup_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for MFA-enabled users for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_mfa_enabled ON profiles(mfa_enabled) WHERE mfa_enabled = TRUE;

-- Add comment explaining the MFA fields
COMMENT ON COLUMN profiles.totp_secret IS 'Base32-encoded TOTP secret for authenticator apps';
COMMENT ON COLUMN profiles.mfa_enabled IS 'Whether MFA is enabled for this user (email/social auth only)';
COMMENT ON COLUMN profiles.backup_codes IS 'Array of backup codes for MFA recovery';
COMMENT ON COLUMN profiles.mfa_setup_completed_at IS 'Timestamp when MFA setup was completed';

-- Create a function to check if user can use MFA (email/social auth only)
CREATE OR REPLACE FUNCTION can_use_mfa(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_auth_methods TEXT[];
BEGIN
    -- Get user's authentication methods from auth.users
    SELECT COALESCE(
        ARRAY(
            SELECT DISTINCT 
                CASE 
                    WHEN provider = 'email' THEN 'email'
                    WHEN provider = 'google' THEN 'google'
                    WHEN provider = 'github' THEN 'github'
                    ELSE provider
                END
            FROM auth.identities 
            WHERE user_id = can_use_mfa.user_id
        ), 
        '{}'
    ) INTO user_auth_methods;
    
    -- Check if user has email or social auth (not wallet-based)
    RETURN (
        'email' = ANY(user_auth_methods) OR 
        'google' = ANY(user_auth_methods) OR 
        'github' = ANY(user_auth_methods)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    -- Generate 10 backup codes
    FOR i IN 1..10 LOOP
        -- Generate 8-character alphanumeric code
        code := upper(
            substring(
                encode(gen_random_bytes(6), 'base64') 
                from 1 for 8
            )
        );
        -- Replace non-alphanumeric characters
        code := regexp_replace(code, '[^A-Z0-9]', 'X', 'g');
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- Create a function to enable MFA for a user
CREATE OR REPLACE FUNCTION enable_mfa(
    user_id UUID,
    totp_secret TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    can_use BOOLEAN;
    backup_codes TEXT[];
BEGIN
    -- Check if user can use MFA
    SELECT can_use_mfa(user_id) INTO can_use;
    
    IF NOT can_use THEN
        RAISE EXCEPTION 'User cannot use MFA - only available for email/social authentication';
    END IF;
    
    -- Generate backup codes
    SELECT generate_backup_codes() INTO backup_codes;
    
    -- Update user profile with MFA settings
    UPDATE profiles 
    SET 
        totp_secret = enable_mfa.totp_secret,
        mfa_enabled = TRUE,
        backup_codes = backup_codes,
        mfa_setup_completed_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to disable MFA for a user
CREATE OR REPLACE FUNCTION disable_mfa(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user profile to disable MFA
    UPDATE profiles 
    SET 
        totp_secret = NULL,
        mfa_enabled = FALSE,
        backup_codes = '{}',
        mfa_setup_completed_at = NULL
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify backup code
CREATE OR REPLACE FUNCTION verify_backup_code(
    user_id UUID,
    code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_backup_codes TEXT[];
    code_index INTEGER;
BEGIN
    -- Get user's backup codes
    SELECT backup_codes INTO user_backup_codes
    FROM profiles 
    WHERE id = user_id AND mfa_enabled = TRUE;
    
    -- Check if code exists in backup codes
    SELECT array_position(user_backup_codes, upper(code)) INTO code_index;
    
    IF code_index IS NOT NULL THEN
        -- Remove the used backup code
        UPDATE profiles 
        SET backup_codes = array_remove(backup_codes, upper(code))
        WHERE id = user_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to regenerate backup codes
CREATE OR REPLACE FUNCTION regenerate_backup_codes(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    new_codes TEXT[];
BEGIN
    -- Generate new backup codes
    SELECT generate_backup_codes() INTO new_codes;
    
    -- Update user's backup codes
    UPDATE profiles 
    SET backup_codes = new_codes
    WHERE id = user_id AND mfa_enabled = TRUE;
    
    RETURN new_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_use_mfa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION enable_mfa(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION disable_mfa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_backup_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_backup_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_backup_codes() TO authenticated;