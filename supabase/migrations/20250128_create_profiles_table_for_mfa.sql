-- Create the profiles table with all necessary columns for MFA functionality
-- This migration creates the complete profiles table structure for Supabase

-- First, create the app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'merchant', 'admin');
    END IF;
END $$;

-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role app_role NOT NULL DEFAULT 'customer'::app_role,
    is_active BOOLEAN DEFAULT TRUE,
    totp_secret TEXT,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[] DEFAULT '{}',
    mfa_setup_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for the columns
COMMENT ON COLUMN public.profiles.id IS 'User ID that references auth.users';
COMMENT ON COLUMN public.profiles.email IS 'User email address';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name';
COMMENT ON COLUMN public.profiles.role IS 'User role in the application';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user profile is active and can use the system';
COMMENT ON COLUMN public.profiles.totp_secret IS 'Base32-encoded TOTP secret for authenticator apps';
COMMENT ON COLUMN public.profiles.mfa_enabled IS 'Whether MFA is enabled for this user (email/social auth only)';
COMMENT ON COLUMN public.profiles.backup_codes IS 'Array of backup codes for MFA recovery';
COMMENT ON COLUMN public.profiles.mfa_setup_completed_at IS 'Timestamp when MFA setup was completed';

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for users" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable insert access for users" ON public.profiles  
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for users" ON public.profiles
FOR UPDATE TO authenticated  
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_mfa_enabled ON public.profiles(mfa_enabled) WHERE mfa_enabled = TRUE;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create MFA functions
CREATE OR REPLACE FUNCTION public.can_use_mfa(user_id UUID)
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
CREATE OR REPLACE FUNCTION public.generate_backup_codes()
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
CREATE OR REPLACE FUNCTION public.enable_mfa(
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
    UPDATE public.profiles 
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
CREATE OR REPLACE FUNCTION public.disable_mfa(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user profile to disable MFA
    UPDATE public.profiles 
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
CREATE OR REPLACE FUNCTION public.verify_backup_code(
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
    FROM public.profiles 
    WHERE id = user_id AND mfa_enabled = TRUE;
    
    -- Check if code exists in backup codes
    SELECT array_position(user_backup_codes, upper(code)) INTO code_index;
    
    IF code_index IS NOT NULL THEN
        -- Remove the used backup code
        UPDATE public.profiles 
        SET backup_codes = array_remove(backup_codes, upper(code))
        WHERE id = user_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to regenerate backup codes
CREATE OR REPLACE FUNCTION public.regenerate_backup_codes(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    new_codes TEXT[];
BEGIN
    -- Generate new backup codes
    SELECT generate_backup_codes() INTO new_codes;
    
    -- Update user's backup codes
    UPDATE public.profiles 
    SET backup_codes = new_codes
    WHERE id = user_id AND mfa_enabled = TRUE;
    
    RETURN new_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.can_use_mfa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_mfa(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_mfa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_backup_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_backup_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_backup_codes() TO authenticated;
