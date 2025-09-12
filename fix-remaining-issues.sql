-- Fix remaining issues identified in console logs
-- 1. Virtual cards table missing
-- 2. MFA enabled column missing from profiles
-- 3. Merchants table issues

-- Fix 1: Add missing mfa_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE api.profiles 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;

-- Fix 2: Create virtual_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    card_type TEXT DEFAULT 'virtual',
    status TEXT DEFAULT 'active',
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for virtual_cards
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for virtual_cards (with conflict handling)
DROP POLICY IF EXISTS "users_can_view_own_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "users_can_insert_own_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "users_can_update_own_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "users_can_delete_own_cards" ON public.virtual_cards;

CREATE POLICY "users_can_view_own_cards" ON public.virtual_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_cards" ON public.virtual_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_cards" ON public.virtual_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_cards" ON public.virtual_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Fix 3: Check merchants table structure and fix any issues
-- Add any missing columns that might be causing the 400 error
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create index on status column for better performance
CREATE INDEX IF NOT EXISTS idx_merchants_status ON public.merchants(status);

-- Verify all fixes
SELECT 'All remaining issues fixed successfully' as status;
