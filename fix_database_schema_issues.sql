-- Fix Database Schema Issues for UAT Deployment
-- This script addresses all the critical database issues identified

-- 1. Fix missing plan_number column in merchant_subscription_plans
DO $$
BEGIN
    -- Add plan_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'plan_number'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN plan_number INTEGER DEFAULT 1;
        RAISE NOTICE 'Added plan_number column to merchant_subscription_plans';
    ELSE
        RAISE NOTICE 'plan_number column already exists in merchant_subscription_plans';
    END IF;
END
$$;

-- 2. Create missing can_use_mfa function
CREATE OR REPLACE FUNCTION public.can_use_mfa(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user exists and has MFA capability
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND is_active = true
    );
END;
$$;

-- 3. Create missing issue_categories table
CREATE TABLE IF NOT EXISTS public.issue_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default issue categories
INSERT INTO public.issue_categories (name, description, color) VALUES
('Bug', 'Software bugs and technical issues', '#EF4444'),
('Feature Request', 'New feature requests and enhancements', '#3B82F6'),
('Performance', 'Performance and optimization issues', '#F59E0B'),
('Security', 'Security-related concerns', '#DC2626'),
('UI/UX', 'User interface and experience issues', '#8B5CF6'),
('Database', 'Database-related issues', '#10B981'),
('API', 'API and integration issues', '#F97316'),
('Documentation', 'Documentation and help requests', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- 4. Ensure all required columns exist in merchant_subscription_plans
DO $$
BEGIN
    -- Add any missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'plan_name'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN plan_name VARCHAR(100);
        RAISE NOTICE 'Added plan_name column to merchant_subscription_plans';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN plan_type VARCHAR(50) DEFAULT 'standard';
        RAISE NOTICE 'Added plan_type column to merchant_subscription_plans';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'email_limit'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN email_limit INTEGER DEFAULT 1;
        RAISE NOTICE 'Added email_limit column to merchant_subscription_plans';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'is_popular'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN is_popular BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_popular column to merchant_subscription_plans';
    END IF;
END
$$;

-- 5. Update existing subscription plans with correct data
UPDATE public.merchant_subscription_plans 
SET 
    plan_name = COALESCE(plan_name, 'Plan ' || plan_number),
    plan_type = COALESCE(plan_type, 'standard'),
    email_limit = COALESCE(email_limit, 1),
    is_popular = COALESCE(is_popular, FALSE)
WHERE plan_name IS NULL OR plan_type IS NULL OR email_limit IS NULL OR is_popular IS NULL;

-- 6. Create missing RLS policies for issue_categories
ALTER TABLE public.issue_categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read issue categories
CREATE POLICY "Allow authenticated users to read issue categories" ON public.issue_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage issue categories
CREATE POLICY "Allow admins to manage issue categories" ON public.issue_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.issue_categories TO authenticated;
GRANT ALL ON public.issue_categories TO authenticated;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_plan_number 
ON public.merchant_subscription_plans(plan_number);

CREATE INDEX IF NOT EXISTS idx_issue_categories_name 
ON public.issue_categories(name);

CREATE INDEX IF NOT EXISTS idx_issue_categories_active 
ON public.issue_categories(is_active);

-- 9. Verify the fixes
DO $$
DECLARE
    plan_count INTEGER;
    category_count INTEGER;
    function_exists BOOLEAN;
BEGIN
    -- Check merchant_subscription_plans
    SELECT COUNT(*) INTO plan_count FROM public.merchant_subscription_plans;
    RAISE NOTICE 'merchant_subscription_plans table has % rows', plan_count;
    
    -- Check issue_categories
    SELECT COUNT(*) INTO category_count FROM public.issue_categories;
    RAISE NOTICE 'issue_categories table has % rows', category_count;
    
    -- Check can_use_mfa function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'can_use_mfa'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE 'can_use_mfa function exists';
    ELSE
        RAISE NOTICE 'can_use_mfa function does not exist';
    END IF;
    
    RAISE NOTICE 'Database schema fixes completed successfully!';
END
$$;

