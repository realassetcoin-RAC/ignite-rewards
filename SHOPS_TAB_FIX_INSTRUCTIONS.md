# Fix for "Shops Tab" Permission Error in Admin Dashboard

## Problem
When clicking the **"Plans" tab** (which you referred to as "shops tab") in the admin dashboard, you encounter this error:
> "You don't have permission to access subscription plans. Please contact an Administrator"

## Root Cause
The `merchant_subscription_plans` table in the database either:
1. Doesn't exist in the correct schema
2. Has incorrect Row Level Security (RLS) policies
3. Missing proper permissions for admin users

## Solution

### Option 1: Manual Fix (Recommended)
1. Go to your **Supabase Dashboard** at https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the entire contents of `MANUAL_SUBSCRIPTION_PLANS_FIX.sql`
5. Paste it into the SQL editor
6. Click **"RUN"** to execute the script

### Option 2: Check Current Status
Run this test to see the current state:
```bash
cd /workspace
node test_subscription_plans_fix.js
```

## What the Fix Does

✅ **Creates the subscription plans table** in the correct `api` schema  
✅ **Sets up Row Level Security (RLS)** with proper policies  
✅ **Grants permissions** for admin users to manage plans  
✅ **Allows public access** to active plans for regular users  
✅ **Adds performance indexes** for faster queries  
✅ **Inserts default plans**: Basic ($29.99), Premium ($79.99), Enterprise ($199.99)  

## Verification Steps

After applying the fix:

1. **Test the application**:
   - Log in as an admin user
   - Go to Admin Dashboard
   - Click the **"Plans"** tab
   - You should now see subscription plans without errors

2. **Check admin permissions**:
   - Make sure your user has `role = 'admin'` in the `api.profiles` table
   - If not, update it in the Supabase dashboard

## Technical Details

- **Table**: `api.merchant_subscription_plans`
- **Schema**: `api` (matches your Supabase client configuration)
- **RLS Policies**: 5 policies for proper access control
- **Admin Check**: Based on `api.profiles.role = 'admin'`

## Troubleshooting

If you still get permission errors after the fix:

1. **Check your admin role**:
   - Go to Supabase Dashboard → Database → Tables
   - Open `api.profiles` table
   - Find your user record
   - Ensure `role` column is set to `'admin'`

2. **Verify the table exists**:
   - In Supabase Dashboard → Database → Tables
   - Look for `merchant_subscription_plans` in the `api` schema

3. **Check RLS policies**:
   - Go to Authentication → Policies
   - Verify there are 5 policies for `api.merchant_subscription_plans`

## Files Created

- `MANUAL_SUBSCRIPTION_PLANS_FIX.sql` - Complete fix script
- `SHOPS_TAB_FIX_INSTRUCTIONS.md` - This guide
- `test_subscription_plans_fix.js` - Test script

The **"Plans" tab** should work perfectly after applying this fix! 🎉