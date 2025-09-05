# Referrals & Subscription Plans Schema Configuration Fix Guide

## Issue Description

You're experiencing database schema configuration errors:
1. **Referrals Feature Error**: "Database schema configuration error. The referrals feature may not be properly set up."
2. **Subscription Plans Error**: "Database schema configuration error. The subscription plans feature may not be properly set up."

These errors occur when the Supabase client tries to query tables that either:
- Don't exist in the expected schema (public)
- Have incorrect table structure
- Have incorrect RLS (Row Level Security) policies

## Root Cause

The error message "schema must be one of the following" indicates that some database migrations may have moved tables to the `api` schema, but the Supabase client is configured to use the `public` schema. This creates a mismatch where the application can't find the required tables.

## Solution

I've created a comprehensive SQL fix that ensures all required tables exist in the `public` schema with the correct structure and permissions.

### Option 1: Using the Automated Script (Recommended)

1. Run the provided script:
   ```bash
   ./apply_referrals_fix.sh
   ```

2. When prompted, enter your Supabase database URL (found in your Supabase project settings under Settings > Database)

3. The script will apply all necessary fixes automatically

### Option 2: Manual Application via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `fix_referrals_subscription_tables.sql`
4. Paste it into the SQL Editor
5. Click "Run"

### Option 3: Using Supabase CLI

1. If you have Supabase CLI installed:
   ```bash
   supabase db push --db-url "your-database-url" < fix_referrals_subscription_tables.sql
   ```

## What the Fix Does

1. **Creates Missing Tables**: Ensures `user_referrals`, `merchant_subscription_plans`, and `referral_campaigns` tables exist in the public schema

2. **Fixes Table Structure**: 
   - Drops tables with incorrect structure and recreates them properly
   - Ensures all required columns exist with correct data types

3. **Sets Up RLS Policies**: 
   - Removes conflicting policies
   - Creates comprehensive policies for user and admin access

4. **Grants Permissions**: Ensures authenticated users have proper access to the tables

5. **Creates Indexes**: Adds performance indexes for common queries

6. **Adds Default Data**: Inserts sample subscription plans and a default referral campaign

## Verification

After applying the fix, verify it worked by:

1. **Check in Supabase SQL Editor**:
   ```sql
   -- These should all return counts without errors
   SELECT COUNT(*) FROM public.user_referrals;
   SELECT COUNT(*) FROM public.merchant_subscription_plans;
   SELECT COUNT(*) FROM public.referral_campaigns;
   ```

2. **In Your Application**:
   - Refresh the page
   - The error messages should be gone
   - You should see the referrals and subscription plans data

## Troubleshooting

If you still see errors after applying the fix:

1. **Check User Role**: Ensure your user has the 'admin' role in the profiles table:
   ```sql
   SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
   ```

2. **Clear Browser Cache**: Sometimes cached data can cause issues

3. **Check Browser Console**: Look for any specific error messages

4. **Verify Table Access**: Run this query to check table permissions:
   ```sql
   SELECT table_schema, table_name, privilege_type 
   FROM information_schema.table_privileges 
   WHERE grantee = 'authenticated' 
   AND table_name IN ('user_referrals', 'merchant_subscription_plans', 'referral_campaigns');
   ```

## Prevention

To prevent this issue in the future:

1. Always ensure new tables are created in the `public` schema
2. Test RLS policies thoroughly before deployment
3. Keep table structures consistent across migrations
4. Document any schema changes in your migration files

## Additional Notes

- The fix is idempotent - running it multiple times won't cause issues
- It preserves existing data where possible
- It handles both fresh installations and fixing existing broken schemas

If you continue to experience issues after following this guide, the problem may be related to your specific Supabase configuration or user permissions.