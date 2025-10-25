-- Create local authentication system for Docker PostgreSQL
-- This replaces Supabase authentication with a local system

-- Create auth.users table for local authentication
CREATE TABLE IF NOT EXISTS public.auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auth.sessions table for session management
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON public.auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_access_token ON public.auth_sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token ON public.auth_sessions(refresh_token);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_auth_users_updated_at ON public.auth_users;
CREATE TRIGGER update_auth_users_updated_at
    BEFORE UPDATE ON public.auth_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert test users (with simple password hashes for testing)
-- In production, use proper bcrypt hashing
INSERT INTO public.auth_users (id, email, password_hash, role, is_active, email_verified) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin@igniterewards.com',
    'admin123!', -- Simple hash for testing - in production use bcrypt
    'admin',
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'merchant@test.com',
    'merchant123!', -- Simple hash for testing
    'merchant',
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'customer@test.com',
    'customer123!', -- Simple hash for testing
    'customer',
    true,
    true
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- Insert corresponding profiles
INSERT INTO public.profiles (id, email, full_name, role, is_active) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin@igniterewards.com',
    'Admin User',
    'admin',
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'merchant@test.com',
    'Test Merchant',
    'merchant',
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'customer@test.com',
    'Test Customer',
    'customer',
    true
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create merchants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    business_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    industry TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert test merchant
INSERT INTO public.merchants (user_id, business_name, contact_email, contact_phone, business_address, city, state, zip_code, industry, status, subscription_plan) VALUES
(
    '00000000-0000-0000-0000-000000000002',
    'Test Business',
    'merchant@test.com',
    '+1-555-0123',
    '123 Test Street',
    'Test City',
    'TS',
    '12345',
    'Retail',
    'active',
    'startup-plan'
)
ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW();

-- Apply trigger to merchants table
DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
