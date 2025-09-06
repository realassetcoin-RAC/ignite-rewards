# Subscription Plans Permission Fix Summary

## Issue Description
When selecting the "Plans" tab (which the user referred to as "shops tab") in the admin dashboard, users encountered the error:
> "You don't have permission to access subscription plans. Please contact an Administrator"

## Root Cause Analysis
The issue was caused by:

1. **Missing Database Table**: The `merchant_subscription_plans` table was not properly created in the `api` schema
2. **Incorrect Schema Configuration**: The Supabase client was configured to use the `api` schema, but the table either didn't exist or had incorrect permissions
3. **Missing RLS Policies**: Row Level Security policies were not properly configured for admin access

## Fix Applied

### 1. Database Schema Correction ✅
- Confirmed the Supabase client uses the `api` schema (not `public`)
- Updated all SQL scripts to use `api.merchant_subscription_plans` instead of `public.merchant_subscription_plans`

### 2. Migration File Created ✅
- Created `/workspace/supabase/migrations/20250106000000_fix_merchant_subscription_plans.sql`
- This migration will create the table with proper structure and permissions

### 3. RLS Policies Configured ✅
The following Row Level Security policies were configured:

- **Anyone can view active plans**: Allows all users to see active subscription plans
- **Admins can view all plans**: Allows admins to see all plans (including inactive)
- **Admins can insert plans**: Allows admins to create new plans
- **Admins can update plans**: Allows admins to modify existing plans
- **Admins can delete plans**: Allows admins to remove plans

### 4. Default Data Inserted ✅
Three default subscription plans are created:
- **Basic**: $29.99/month with basic features
- **Premium**: $79.99/month with advanced features  
- **Enterprise**: $199.99/month with full features

### 5. Performance Optimizations ✅
- Added indexes on `is_active` and `name` columns
- Created update trigger for `updated_at` timestamp

## Files Modified

1. **`/workspace/src/integrations/supabase/client.ts`**
   - Confirmed schema is set to `'api'` (this was already correct)

2. **`/workspace/src/components/admin/SubscriptionPlanManager.tsx`**
   - Added enhanced error logging to help debug permission issues

3. **`/workspace/supabase/migrations/20250106000000_fix_merchant_subscription_plans.sql`**
   - New migration file to create the table and configure permissions

4. **`/workspace/fix_subscription_plans_permissions.sql`**
   - Standalone SQL file for manual application if needed

5. **`/workspace/apply_subscription_plans_fix.sh`**
   - Script to apply the fix automatically

6. **`/workspace/test_subscription_plans_fix.js`**
   - Test script to verify the fix works correctly

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
cd /workspace
supabase db push
```

### Option 2: Using the Script
```bash
cd /workspace
./apply_subscription_plans_fix.sh
```

### Option 3: Manual Application
1. Go to your Supabase dashboard
2. Navigate to the SQL editor
3. Copy and paste the contents of `fix_subscription_plans_permissions.sql`
4. Execute the SQL

## Verification Steps

1. **Run the Test Script**:
   ```bash
   cd /workspace
   node test_subscription_plans_fix.js
   ```

2. **Test in the Application**:
   - Log in as an admin user
   - Navigate to Admin Dashboard
   - Click on the "Plans" tab
   - You should now see the subscription plans without permission errors

## Expected Behavior After Fix

- ✅ Admin users can access the "Plans" tab without permission errors
- ✅ Admin users can view all subscription plans (active and inactive)
- ✅ Admin users can create new subscription plans
- ✅ Admin users can edit existing subscription plans
- ✅ Admin users can toggle plan active/inactive status
- ✅ Regular users can view active plans (for signup/selection)

## Troubleshooting

If the issue persists after applying the fix:

1. **Check Migration Status**:
   ```bash
   supabase migration list
   ```

2. **Verify Table Exists**:
   - Go to Supabase dashboard → Database → Tables
   - Look for `merchant_subscription_plans` in the `api` schema

3. **Check RLS Policies**:
   - Go to Supabase dashboard → Authentication → Policies
   - Verify policies exist for `api.merchant_subscription_plans`

4. **Verify Admin Role**:
   - Check that your user has `role = 'admin'` in the `api.profiles` table

## Technical Details

- **Database Schema**: `api`
- **Table Name**: `merchant_subscription_plans`
- **Primary Key**: `id` (UUID)
- **Required Fields**: `name`, `price_monthly`
- **Optional Fields**: `description`, `features`, `trial_days`, `is_active`
- **Timestamps**: `created_at`, `updated_at` (auto-managed)

The fix ensures proper separation of concerns with RLS policies that allow:
- Public read access to active plans
- Admin full CRUD access to all plans
- Proper error handling and logging for debugging