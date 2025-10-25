-- PERMANENT FIX FOR TERMS_PRIVACY_ACCEPTANCE TABLE
-- This SQL will fix the schema mismatch that causes the console warning
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing table (this will remove any existing data)
DROP TABLE IF EXISTS public.terms_privacy_acceptance CASCADE;

-- Step 2: Create the table with the correct schema that matches the service
CREATE TABLE public.terms_privacy_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version VARCHAR(50) NOT NULL DEFAULT '1.0',
  privacy_version VARCHAR(50) NOT NULL DEFAULT '1.0',
  terms_accepted BOOLEAN DEFAULT FALSE,
  privacy_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Step 3: Enable Row Level Security
ALTER TABLE public.terms_privacy_acceptance ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view own terms acceptance" ON public.terms_privacy_acceptance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own terms acceptance" ON public.terms_privacy_acceptance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own terms acceptance" ON public.terms_privacy_acceptance
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 5: Create an index for better performance
CREATE INDEX idx_terms_privacy_acceptance_user_id ON public.terms_privacy_acceptance(user_id);

-- Step 6: Verify the table was created correctly
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'terms_privacy_acceptance'
ORDER BY ordinal_position;




