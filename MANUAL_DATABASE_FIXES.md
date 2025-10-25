# Manual Database Fixes for UAT Deployment

## 🚨 Critical Issues Identified

Based on the analysis, these database issues need to be fixed before UAT deployment:

1. **Missing columns in `merchant_subscription_plans`**:
   - `plan_number` (INTEGER)
   - `email_limit` (INTEGER)
   - `monthly_points` (INTEGER)
   - `monthly_transactions` (INTEGER)

2. **Missing function**: `public.can_use_mfa(user_id)`

3. **Missing table**: `public.issue_categories`

## 🔧 Manual Fix Instructions

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase project: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Execute This SQL Script

Copy and paste the following SQL script into the Supabase SQL Editor and execute it:

```sql
-- Fix Database Schema Issues for UAT Deployment
-- Execute this script in Supabase SQL Editor

-- 1. Add missing columns to merchant_subscription_plans
DO $$
BEGIN
    -- Add plan_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'plan_number'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN plan_number INTEGER DEFAULT 1;
        RAISE NOTICE 'Added plan_number column';
    END IF;

    -- Add email_limit column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'email_limit'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN email_limit INTEGER DEFAULT 1;
        RAISE NOTICE 'Added email_limit column';
    END IF;

    -- Add monthly_points column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'monthly_points'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN monthly_points INTEGER DEFAULT 100;
        RAISE NOTICE 'Added monthly_points column';
    END IF;

    -- Add monthly_transactions column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_subscription_plans' 
        AND column_name = 'monthly_transactions'
    ) THEN
        ALTER TABLE public.merchant_subscription_plans 
        ADD COLUMN monthly_transactions INTEGER DEFAULT 100;
        RAISE NOTICE 'Added monthly_transactions column';
    END IF;
END
$$;

-- 2. Update existing plans with proper values
UPDATE public.merchant_subscription_plans 
SET 
    plan_number = CASE 
        WHEN plan_name ILIKE '%startup%' THEN 1
        WHEN plan_name ILIKE '%momentum%' THEN 2
        WHEN plan_name ILIKE '%energizer%' THEN 3
        WHEN plan_name ILIKE '%cloud9%' THEN 4
        WHEN plan_name ILIKE '%super%' THEN 5
        ELSE 1
    END,
    email_limit = CASE 
        WHEN plan_name ILIKE '%startup%' THEN 1
        WHEN plan_name ILIKE '%momentum%' THEN 2
        WHEN plan_name ILIKE '%energizer%' THEN 3
        WHEN plan_name ILIKE '%cloud9%' THEN 5
        WHEN plan_name ILIKE '%super%' THEN 10
        ELSE 1
    END,
    monthly_points = CASE 
        WHEN plan_name ILIKE '%startup%' THEN 100
        WHEN plan_name ILIKE '%momentum%' THEN 500
        WHEN plan_name ILIKE '%energizer%' THEN 1000
        WHEN plan_name ILIKE '%cloud9%' THEN 2500
        WHEN plan_name ILIKE '%super%' THEN 5000
        ELSE 100
    END,
    monthly_transactions = CASE 
        WHEN plan_name ILIKE '%startup%' THEN 100
        WHEN plan_name ILIKE '%momentum%' THEN 500
        WHEN plan_name ILIKE '%energizer%' THEN 1000
        WHEN plan_name ILIKE '%cloud9%' THEN 2500
        WHEN plan_name ILIKE '%super%' THEN 5000
        ELSE 100
    END;

-- 3. Create can_use_mfa function
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

-- 4. Create issue_categories table
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

-- 5. Enable RLS and create policies for issue_categories
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

-- 6. Verify the fixes
SELECT 
    'merchant_subscription_plans' as table_name,
    COUNT(*) as row_count,
    string_agg(DISTINCT column_name, ', ') as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'merchant_subscription_plans'

UNION ALL

SELECT 
    'issue_categories' as table_name,
    COUNT(*) as row_count,
    string_agg(DISTINCT column_name, ', ') as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'issue_categories';
```

### Step 3: Verify the Fixes

After executing the SQL script, run this verification query:

```sql
-- Verification Query
SELECT 
    'Subscription Plans' as component,
    COUNT(*) as count,
    'Columns: ' || string_agg(DISTINCT column_name, ', ') as details
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'merchant_subscription_plans'

UNION ALL

SELECT 
    'Issue Categories' as component,
    COUNT(*) as count,
    'Categories: ' || string_agg(name, ', ') as details
FROM public.issue_categories

UNION ALL

SELECT 
    'MFA Function' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'can_use_mfa'
    ) THEN 1 ELSE 0 END as count,
    'Function exists' as details;
```

## ✅ Expected Results

After running the fixes, you should see:

1. **merchant_subscription_plans** table with all required columns
2. **issue_categories** table with 8 default categories
3. **can_use_mfa** function working properly
4. No more console errors in the admin panel

## 🚀 Next Steps

Once the database fixes are complete:

1. **Test the admin panel** - Refresh and check for errors
2. **Deploy to Vercel** - Proceed with UAT deployment
3. **Verify UAT functionality** - Test all features

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Verify all SQL statements executed successfully
3. Test the admin panel functionality

---

**Execute this script in Supabase SQL Editor to fix all database issues before UAT deployment!**

