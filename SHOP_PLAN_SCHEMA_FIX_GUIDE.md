# Shop Plan Schema Fix Guide

## 🚨 Error: "Failed to save plan: the schema must be one of the following:api"

### Problem Description

You're encountering this error when trying to create a new plan under the shop tab. This error indicates a database schema configuration issue where the application is trying to access the `merchant_subscription_plans` table, but there's a mismatch between the expected schema and the actual database configuration.

### Root Cause

The error occurs because:

1. **Schema Mismatch**: The `merchant_subscription_plans` table may be in the wrong schema (api vs public)
2. **Missing Permissions**: The table exists but lacks proper RLS policies or permissions
3. **Table Structure Issues**: The table structure doesn't match what the application expects
4. **Admin Role Issues**: Your user may not have the proper admin role to create plans

## 🔧 Solution

### Option 1: Automated Fix (Recommended)

1. **Run the automated script**:
   ```bash
   ./apply_shop_plan_fix.sh
   ```

2. **Enter your Supabase database URL** when prompted (found in Supabase project settings)

3. **The script will automatically apply all necessary fixes**

### Option 2: Manual Fix via Supabase Dashboard

1. **Open the HTML tool**:
   - Open `shop_plan_fix_tool.html` in your browser
   - Follow the step-by-step instructions

2. **Or apply the SQL directly**:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `fix_shop_plan_schema_error.sql`
   - Click "Run"

### Option 3: Diagnostic First

If you want to understand the current state before applying the fix:

1. **Run the diagnostic script**:
   - Copy and paste the contents of `diagnose_shop_plan_error.sql` into Supabase SQL Editor
   - This will show you exactly what's wrong

2. **Then apply the appropriate fix**

## 📋 What the Fix Does

### 1. **Recreates the Table**
- Drops and recreates `merchant_subscription_plans` in the `public` schema
- Ensures proper table structure with all required columns

### 2. **Sets Up RLS Policies**
- Creates comprehensive Row Level Security policies
- Allows admins to manage plans
- Allows authenticated users to view active plans

### 3. **Grants Permissions**
- Gives authenticated users proper access to the table
- Ensures sequences and other database objects are accessible

### 4. **Creates Indexes**
- Adds performance indexes for common queries
- Improves query speed for plan lookups

### 5. **Inserts Default Data**
- Creates sample subscription plans (Basic, Premium, Enterprise)
- Provides a starting point for your subscription system

### 6. **Ensures Profiles Table**
- Creates or verifies the `profiles` table exists in `public` schema
- Sets up admin role checking functionality

## 🔍 Verification Steps

After applying the fix, verify it worked:

### 1. **Check in Supabase SQL Editor**
```sql
-- These should all return results without errors
SELECT COUNT(*) FROM public.merchant_subscription_plans;
SELECT COUNT(*) FROM public.profiles;
```

### 2. **Check Your User Role**
```sql
-- Make sure you have admin role
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
```

### 3. **Test in Application**
- Refresh your application
- Go to the shop tab
- Try creating a new plan
- The error should be resolved

## 🚨 Troubleshooting

### If you still see errors after applying the fix:

#### 1. **Check User Role**
```sql
-- Ensure your user has admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid() AND email = 'your-email@example.com';
```

#### 2. **Clear Browser Cache**
- Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
- Clear application cache if using a PWA

#### 3. **Check Browser Console**
- Open developer tools (F12)
- Look for any JavaScript errors
- Check network tab for failed API calls

#### 4. **Verify Table Access**
```sql
-- Check if you can access the table
SELECT * FROM public.merchant_subscription_plans LIMIT 1;
```

#### 5. **Check RLS Policies**
```sql
-- Verify RLS policies exist
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'merchant_subscription_plans';
```

## 📁 Files Created

This fix creates several files to help you:

- `fix_shop_plan_schema_error.sql` - The main SQL fix
- `apply_shop_plan_fix.sh` - Automated script to apply the fix
- `diagnose_shop_plan_error.sql` - Diagnostic script to check current state
- `shop_plan_fix_tool.html` - Interactive HTML tool with step-by-step instructions
- `SHOP_PLAN_SCHEMA_FIX_GUIDE.md` - This comprehensive guide

## 🔄 Prevention

To prevent this issue in the future:

1. **Always use public schema** for application tables
2. **Test RLS policies** thoroughly before deployment
3. **Keep table structures consistent** across migrations
4. **Document schema changes** in your migration files
5. **Use proper admin role management**

## 📞 Support

If you continue to experience issues after following this guide:

1. **Run the diagnostic script** to get detailed information about your database state
2. **Check the browser console** for any JavaScript errors
3. **Verify your Supabase configuration** and user permissions
4. **Ensure your application is using the correct Supabase client configuration**

## ✅ Success Indicators

You'll know the fix worked when:

- ✅ No more "schema must be one of the following:api" errors
- ✅ You can successfully create new plans in the shop tab
- ✅ Existing plans are visible and editable
- ✅ Admin functions work properly
- ✅ No errors in browser console

The fix is designed to be idempotent, meaning you can run it multiple times without issues. It preserves existing data where possible and handles both fresh installations and fixing existing broken schemas.