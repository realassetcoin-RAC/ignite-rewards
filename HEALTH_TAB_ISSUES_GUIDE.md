# Health Tab Issues Resolution Guide

## Overview
The Health Tab in the Admin Panel monitors the status of core database tables and RPC functions. Warnings typically indicate missing tables or permission issues that need to be resolved.

## Common Health Tab Warnings

### 1. **Table Warnings (Status: WARN)**
These occur when tables don't exist or have permission issues:

**Tables Monitored by Health Tab:**
- `profiles` - User profiles and roles
- `merchants` - Merchant information
- `virtual_cards` - Virtual loyalty cards
- `loyalty_transactions` - Transaction history
- `user_loyalty_cards` - User's loyalty cards
- `user_points` - User points balance
- `user_referrals` - Referral system
- `user_wallets` - User wallet addresses
- `merchant_cards` - Merchant card configurations
- `merchant_subscriptions` - Merchant subscription data
- `merchant_subscription_plans` - Available subscription plans
- `referral_campaigns` - Referral campaign configurations
- `transaction_qr_codes` - QR codes for transactions
- `subscribers` - Email subscribers

### 2. **RPC Warnings (Status: WARN)**
These occur when RPC functions don't exist:

**RPC Functions Monitored:**
- `is_admin` - Check if current user is admin
- `check_admin_access` - Verify admin access permissions

## Resolution Steps

### Step 1: Diagnose Current Issues
Run the diagnostic script to see what's missing:

```sql
-- Copy and run the contents of: check_health_tab_status.sql
```

This will show you:
- ✅ Which tables exist and are accessible
- ⚠️ Which tables are missing (will show as warnings)
- ❌ Which tables have permission issues

### Step 2: Apply the Comprehensive Fix
Run the main fix script to resolve all issues:

```sql
-- Copy and run the contents of: HEALTH_TAB_FIX.sql
```

This will:
- ✅ Create all missing tables in the `api` schema
- ✅ Set up proper Row Level Security (RLS) policies
- ✅ Grant necessary permissions to authenticated users
- ✅ Create performance indexes
- ✅ Create missing RPC functions
- ✅ Verify all components are accessible

### Step 3: Verify the Fix
After running the fix, check the Health Tab in your Admin Panel:
1. Navigate to Admin Panel → Health tab
2. Look for the status summary at the top
3. All items should now show as "OK" (green) instead of "WARN" (yellow)

## What the Fix Creates

### New Tables Created:
1. **`api.user_wallets`** - Store user wallet addresses
2. **`api.merchant_cards`** - Merchant card configurations
3. **`api.merchant_subscriptions`** - Merchant subscription data
4. **`api.transaction_qr_codes`** - QR codes for transactions
5. **`api.subscribers`** - Email subscribers

### New RPC Functions Created:
1. **`api.is_admin()`** - Check if current user is admin
2. **`api.check_admin_access()`** - Verify admin access permissions

### Security Features:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Proper policies for user access control
- ✅ Admin-only access for sensitive operations
- ✅ Performance indexes for optimal queries

## Expected Results

After applying the fix:

### Health Tab Status:
- **Total Checks:** 16 (14 tables + 2 RPCs)
- **OK:** 16 (all green)
- **Warnings:** 0
- **Errors:** 0

### Functionality:
- ✅ All admin features work properly
- ✅ User management functions correctly
- ✅ Merchant operations are accessible
- ✅ Referral system is fully functional
- ✅ No more warning messages in Health Tab

## Troubleshooting

### If warnings persist after running the fix:

1. **Check browser cache** - Hard refresh (Ctrl+F5)
2. **Verify script execution** - Look for success messages in SQL output
3. **Check permissions** - Ensure your user has admin role
4. **Review error messages** - Check for any specific error details

### Common Issues:

**"Permission denied" warnings:**
- Solution: The fix script grants proper permissions
- Verify: Check that RLS policies are correctly set up

**"Table does not exist" warnings:**
- Solution: The fix script creates all missing tables
- Verify: Check that tables were created in the `api` schema

**"RPC does not exist" warnings:**
- Solution: The fix script creates missing RPC functions
- Verify: Check that functions exist in the `api` schema

## Files Created

- `HEALTH_TAB_FIX.sql` - Main fix script (run this)
- `check_health_tab_status.sql` - Diagnostic script (optional)
- `HEALTH_TAB_ISSUES_GUIDE.md` - This guide

## Support

If you continue to see issues after running the fix:

1. Check the SQL execution output for any error messages
2. Verify that all tables were created successfully
3. Ensure your user account has admin privileges
4. Contact support with specific error details

The Health Tab should now show all green checkmarks! 🎉
