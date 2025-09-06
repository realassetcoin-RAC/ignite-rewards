# 🛠️ SUBSCRIPTION PLANS PERMISSION FIX - COMPLETE SOLUTION

## 🔍 **Issues Identified:**

1. **"You don't have permission to access subscription plans"** - when clicking the Plans tab
2. **"Failed to save plan: permission denied for table merchant_subscription_plans"** - when creating plans

## 🎯 **Root Cause:**
Your Supabase client is configured to use the `api` schema, but the `merchant_subscription_plans` table either:
- Doesn't exist in the `api` schema
- Lacks proper Row Level Security (RLS) policies
- Missing admin access functions

## ✅ **COMPLETE FIX - Apply This SQL**

**STEP 1:** Go to your Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `wndswqvqogeblksrujpg`
- Navigate to **SQL Editor**

**STEP 2:** Copy and paste this COMPLETE SQL script:

```sql
-- =============================================================================
-- COMPLETE SUBSCRIPTION PLANS FIX
-- =============================================================================

-- 1. Ensure API schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS api;
GRANT USAGE ON SCHEMA api TO authenticated, anon, service_role;

-- 2. Create the merchant_subscription_plans table in API schema
CREATE TABLE IF NOT EXISTS api.merchant_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE api.merchant_subscription_plans ENABLE ROW LEVEL SECURITY;

-- 4. Create or ensure profiles table exists in API schema
CREATE TABLE IF NOT EXISTS api.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON api.merchant_subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON api.merchant_subscription_plans;

-- 6. Create comprehensive RLS policies for subscription plans

-- Allow anyone to view active plans
CREATE POLICY "Anyone can view active plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Allow admins to view ALL plans
CREATE POLICY "Admins can view all plans" 
ON api.merchant_subscription_plans 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to insert new plans
CREATE POLICY "Admins can insert plans" 
ON api.merchant_subscription_plans 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to update plans
CREATE POLICY "Admins can update plans" 
ON api.merchant_subscription_plans 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete plans
CREATE POLICY "Admins can delete plans" 
ON api.merchant_subscription_plans 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 7. Create RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON api.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON api.profiles;

CREATE POLICY "Users can view own profile" ON api.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON api.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON api.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api.profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'admin'
    )
  );

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA api TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.merchant_subscription_plans TO authenticated, service_role;
GRANT SELECT ON api.merchant_subscription_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO authenticated, service_role;
GRANT SELECT ON api.profiles TO anon;

-- 9. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_active ON api.merchant_subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_subscription_plans_name ON api.merchant_subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON api.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON api.profiles(email);

-- 10. Create update trigger function
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create update triggers
DROP TRIGGER IF EXISTS update_merchant_subscription_plans_updated_at ON api.merchant_subscription_plans;
CREATE TRIGGER update_merchant_subscription_plans_updated_at
  BEFORE UPDATE ON api.merchant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION api.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON api.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON api.profiles
  FOR EACH ROW
  EXECUTE FUNCTION api.update_updated_at_column();

-- 12. Insert default subscription plans (only if they don't exist)
INSERT INTO api.merchant_subscription_plans (name, description, price_monthly, features, trial_days, is_active) 
VALUES
  ('Basic', 'Essential features for small businesses', 29.99, '["Basic analytics", "Customer loyalty tracking", "Email support"]'::jsonb, 30, true),
  ('Premium', 'Advanced features for growing businesses', 79.99, '["Advanced analytics", "Custom branding", "Priority support", "API access"]'::jsonb, 30, true),
  ('Enterprise', 'Full-featured solution for large businesses', 199.99, '["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"]'::jsonb, 30, true)
ON CONFLICT (name) DO NOTHING;

-- 13. Ensure your user has admin role (REPLACE WITH YOUR EMAIL)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO api.profiles (id, email, role) 
SELECT auth.uid(), auth.email(), 'admin'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  email = COALESCE(EXCLUDED.email, api.profiles.email);

-- If the above doesn't work, manually update your user:
-- UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- 14. Verification
SELECT 
  'Subscription Plans Table' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
  'RLS Policies' as component,
  CONCAT('✅ ', COUNT(*), ' policies created') as status
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';

SELECT 
  'Default Plans' as component,
  CONCAT('✅ ', COUNT(*), ' plans available') as status
FROM api.merchant_subscription_plans;

SELECT 
  'Admin Users' as component,
  CONCAT('✅ ', COUNT(*), ' admin users') as status
FROM api.profiles 
WHERE role = 'admin';
```

**STEP 3:** Click **"RUN"** to execute the script

## 🔧 **STEP 4: Verify Your Admin Role**

After running the script, ensure your user has admin privileges:

1. In Supabase Dashboard, go to **Database → Tables**
2. Find the `api.profiles` table
3. Look for your user record (by email)
4. Ensure the `role` column is set to `'admin'`

If your user isn't there or doesn't have admin role, run this SQL (replace with your email):

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- Or insert if not exists:
INSERT INTO api.profiles (id, email, role) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'your-email@example.com',
  'admin'
) ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## 🧪 **STEP 5: Test the Fix**

1. **Clear your browser cache** and cookies
2. **Log out** and **log back in** to your application  
3. Navigate to the **Admin Dashboard**
4. Click on the **"Plans"** tab
5. You should now see subscription plans without permission errors
6. Try **creating a new plan** to test the save functionality

## 🎉 **Expected Results**

After applying this fix:

✅ **Plans tab loads without permission errors**  
✅ **Can view existing subscription plans**  
✅ **Can create new subscription plans**  
✅ **Can edit existing plans**  
✅ **All admin functionality works correctly**

## 🚨 **Troubleshooting**

### If you still get permission errors:

1. **Check your admin role:**
   ```sql
   SELECT id, email, role FROM api.profiles WHERE email = 'your-email@example.com';
   ```

2. **Verify table exists:**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans';
   ```

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
   ```
   Should return 5 policies.

4. **Clear browser cache completely** and try again

### If the table still doesn't work:

There might be a conflict with existing tables. Run this diagnostic:

```sql
-- Check if table exists in public schema
SELECT 'public schema' as location, COUNT(*) as plans
FROM public.merchant_subscription_plans
UNION ALL
SELECT 'api schema' as location, COUNT(*) as plans  
FROM api.merchant_subscription_plans;
```

## 📞 **Need Additional Help?**

If you're still experiencing issues after following these steps:

1. Check the browser console for specific error messages
2. Verify your Supabase project URL and API keys are correct
3. Ensure you're logged in as the user you set as admin
4. Try logging out completely and logging back in

---

**This fix addresses both the permission error when accessing the Plans tab and the save error when creating new subscription plans. The solution creates the proper table structure, RLS policies, and admin access controls needed for the subscription plans feature to work correctly.**