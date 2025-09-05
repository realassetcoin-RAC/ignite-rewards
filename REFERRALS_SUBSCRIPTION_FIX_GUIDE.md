# Database Schema Configuration Fix Guide

## Problem Summary

You were experiencing two database schema configuration errors:
1. **Referrals Feature Error**: "Database schema configuration error. The referrals feature may not be properly setup."
2. **Subscription Plans Error**: "Database schema configuration error. The subscription plans feature may not be properly setup."

## Root Cause

The errors were occurring because:
1. The `user_referrals` and `merchant_subscription_plans` tables might not exist in the database
2. If they do exist, they might have incorrect Row Level Security (RLS) policies
3. The tables might not have proper permissions for authenticated users to access them

## Solution Overview

I've created a comprehensive SQL migration (`fix_referrals_subscription_schema.sql`) that:

1. **Creates missing tables** if they don't exist:
   - `user_referrals` - For tracking user referral codes and rewards
   - `merchant_subscription_plans` - For managing subscription plan options
   - `referral_campaigns` - For managing referral campaigns (dependency)

2. **Configures proper RLS policies**:
   - Users can view and manage their own referrals
   - Admins have full access to all referrals and subscription plans
   - All authenticated users can view active subscription plans

3. **Grants necessary permissions**:
   - Authenticated users get appropriate CRUD permissions
   - Service role gets full access for backend operations

4. **Adds performance optimizations**:
   - Creates indexes on frequently queried columns
   - Adds triggers for automatic timestamp updates

## How to Apply the Fix

### Option 1: Using the provided script

1. Run the apply script:
   ```bash
   ./apply_schema_fix.sh
   ```

2. Enter your Supabase database URL when prompted (or set DATABASE_URL environment variable)

### Option 2: Manual application via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `fix_referrals_subscription_schema.sql`
4. Paste and run the SQL

### Option 3: Using psql directly

```bash
psql "your-database-url" -f fix_referrals_subscription_schema.sql
```

## Post-Fix Verification

After applying the fix, verify that:

1. **Referrals Tab** in User Dashboard:
   - Should load without errors
   - Users can view their referral code
   - Users can see their referral history

2. **Admin Panel**:
   - Referral Manager should load and display all referrals
   - Subscription Plan Manager should show the default plans (Basic, Premium, Enterprise)
   - Admins can create/edit subscription plans

## Troubleshooting

If you still see errors after applying the fix:

1. **Check Database Connection**:
   ```sql
   SELECT current_database(), current_schema();
   ```

2. **Verify Tables Exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_referrals', 'merchant_subscription_plans', 'referral_campaigns');
   ```

3. **Check RLS Policies**:
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('user_referrals', 'merchant_subscription_plans');
   ```

4. **Test Permissions**:
   ```sql
   -- As an authenticated user
   SELECT * FROM public.user_referrals LIMIT 1;
   SELECT * FROM public.merchant_subscription_plans LIMIT 1;
   ```

## Additional Notes

- The fix includes default data insertion for subscription plans and a launch referral campaign
- All tables use UUID primary keys for security and scalability
- The referral system is designed to track referred users and reward points
- Subscription plans support monthly pricing, trial periods, and feature lists

## Related Files

- `fix_referrals_subscription_schema.sql` - The main migration file
- `apply_schema_fix.sh` - Bash script to apply the migration
- `src/components/dashboard/ReferralsTab.tsx` - User referrals component
- `src/components/admin/ReferralManager.tsx` - Admin referral management
- `src/components/admin/SubscriptionPlanManager.tsx` - Admin subscription plan management