# Referrals & Subscription Plans Configuration Fix

## Problem Description

You're experiencing database schema configuration errors for:
1. **Referrals feature** - "Database schema configuration error. The referrals feature may not be properly setup."
2. **Subscription plans feature** - "Database schema configuration error. The subscription plans feature may not be properly setup."

These errors occur when the Supabase client tries to query tables that either:
- Don't exist in the database
- Have incorrect permissions
- Have misconfigured Row Level Security (RLS) policies

## Root Cause

The error message "schema must be one of the following" typically indicates that:
1. The tables might not exist in the `public` schema
2. The authenticated user doesn't have proper permissions
3. RLS policies are blocking access

## Solution Overview

I've created a comprehensive fix that:
1. Creates all necessary tables if they don't exist
2. Sets up proper RLS policies for authenticated users and admins
3. Grants appropriate permissions
4. Adds necessary indexes for performance
5. Inserts default data for testing

## How to Apply the Fix

### Option 1: Using the Automated Script (Recommended)

1. **Ensure you have PostgreSQL client installed:**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # On macOS
   brew install postgresql
   ```

2. **Run the fix script:**
   ```bash
   ./apply_referrals_subscription_fix.sh
   ```

3. The script will:
   - Check your database connection
   - Show the current state of the tables
   - Apply all necessary fixes
   - Verify the results

### Option 2: Manual Application via Supabase Dashboard

1. **Log in to your Supabase Dashboard**

2. **Navigate to SQL Editor**

3. **Create a new query and paste the contents of `fix_referrals_subscription_configuration.sql`**

4. **Run the query**

5. **Check the output messages for any errors**

### Option 3: Using Supabase CLI

1. **If you have Supabase CLI installed:**
   ```bash
   supabase db push --db-url "$SUPABASE_DB_URL" < fix_referrals_subscription_configuration.sql
   ```

## What the Fix Does

### 1. Creates Missing Tables
- `referral_campaigns` - Manages referral campaign configurations
- `user_referrals` - Tracks user referral codes and statuses
- `merchant_subscription_plans` - Defines available subscription tiers

### 2. Sets Up Security
- Enables Row Level Security (RLS) on all tables
- Creates policies that allow:
  - Users to view/manage their own referrals
  - Admins to manage all data
  - Everyone to view active campaigns and plans

### 3. Adds Performance Optimizations
- Creates indexes on frequently queried columns
- Sets up automatic `updated_at` triggers

### 4. Inserts Default Data
- Basic, Premium, and Enterprise subscription plans
- Sample referral campaigns

## Verification Steps

After applying the fix:

1. **Check the tables exist:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('user_referrals', 'merchant_subscription_plans', 'referral_campaigns');
   ```

2. **Verify in your application:**
   - Navigate to the Admin panel
   - Open Referral Manager
   - Open Subscription Plan Manager
   - Both should load without configuration errors

3. **Test functionality:**
   - Try creating a new subscription plan
   - Try viewing referrals
   - Check that admin users can see all data

## Troubleshooting

### If you still see errors after applying the fix:

1. **Clear browser cache and reload**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

2. **Check browser console for errors**
   - Press F12 and look for any JavaScript errors

3. **Verify your user has admin role:**
   ```sql
   SELECT id, email, role 
   FROM public.profiles 
   WHERE email = 'your-email@example.com';
   ```

4. **Check RLS policies are enabled:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('user_referrals', 'merchant_subscription_plans', 'referral_campaigns');
   ```

### Common Issues and Solutions:

**Issue**: "permission denied for schema public"
**Solution**: Run as database owner or superuser

**Issue**: "relation does not exist"  
**Solution**: The migration might have partially failed. Re-run the entire script.

**Issue**: Still getting configuration errors
**Solution**: 
1. Log out and log back in
2. Check that your auth token has the latest permissions
3. Verify the tables are in the `public` schema

## Next Steps

Once the fix is applied successfully:

1. **For Referrals:**
   - Each new user automatically gets a referral code
   - Users can share their codes to earn points
   - Admins can manage campaigns and view all referrals

2. **For Subscription Plans:**
   - Admins can create/edit subscription tiers
   - Merchants can be assigned to plans
   - Features are stored as JSON for flexibility

## Need Help?

If you continue to experience issues:

1. Check the Supabase logs for detailed error messages
2. Verify your database connection string is correct
3. Ensure you're running the fix with appropriate database permissions

The fix is comprehensive and should resolve all schema configuration errors for both the referrals and subscription plans features.