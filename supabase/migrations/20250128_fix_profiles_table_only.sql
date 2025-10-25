-- Fix profiles table for MFA functionality - Supabase version
-- This migration only creates the profiles table with the is_active column

-- First, create the app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'merchant', 'admin');
    END IF;
END $$;

-- Create the profiles table if it doesn't exist
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

-- Add the is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add MFA columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'totp_secret') THEN
        ALTER TABLE public.profiles ADD COLUMN totp_secret TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'mfa_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'backup_codes') THEN
        ALTER TABLE public.profiles ADD COLUMN backup_codes TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'mfa_setup_completed_at') THEN
        ALTER TABLE public.profiles ADD COLUMN mfa_setup_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE schemaname = 'public' 
                   AND tablename = 'profiles' 
                   AND policyname = 'Enable read access for users') THEN
        CREATE POLICY "Enable read access for users" ON public.profiles
        FOR SELECT TO authenticated
        USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE schemaname = 'public' 
                   AND tablename = 'profiles' 
                   AND policyname = 'Enable insert access for users') THEN
        CREATE POLICY "Enable insert access for users" ON public.profiles  
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE schemaname = 'public' 
                   AND tablename = 'profiles' 
                   AND policyname = 'Enable update access for users') THEN
        CREATE POLICY "Enable update access for users" ON public.profiles
        FOR UPDATE TO authenticated  
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_mfa_enabled ON public.profiles(mfa_enabled) WHERE mfa_enabled = TRUE;

-- Create updated_at trigger function if it doesn't exist
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
