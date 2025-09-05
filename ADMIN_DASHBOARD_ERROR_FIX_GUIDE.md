# Admin Dashboard Error Fix Guide

## Overview
This guide addresses the following errors in the admin dashboard:
1. Error loading statistics when the admin dashboard loads
2. "Failed to load plans" error when the Shop tab is selected
3. "Failed to load referrals" error when the Referrals tab is selected

## Root Causes Identified

### 1. Database Permissions Issues
- Missing or incorrect Row Level Security (RLS) policies on tables
- Admin access functions not properly configured
- Tables not granting proper permissions to authenticated users

### 2. Missing Admin Functions
- `public.is_admin()` function may be missing or misconfigured
- `public.check_admin_access()` function may not exist

### 3. Error Handling
- Components were throwing errors instead of gracefully handling failures
- No fallback values when queries fail

## Fixes Applied

### 1. Database Fixes (SQL)
Created `fix_admin_dashboard_errors.sql` which:
- Creates/updates admin access functions (`is_admin()`, `check_admin_access()`)
- Fixes RLS policies for `merchant_subscription_plans` table
- Fixes RLS policies for `user_referrals` table
- Ensures admin profile exists and has proper role
- Grants necessary permissions to authenticated users

### 2. Frontend Fixes
Updated the following components with better error handling:
- **SubscriptionPlanManager.tsx**: Added graceful error handling for plan loading
- **ReferralManager.tsx**: Added graceful error handling for referral loading
- **AdminPanel.tsx**: Modified loadStats to continue even if some queries fail
- **AdminDashboard.tsx**: Modified loadStats to show partial data when available

### 3. Utility Functions
Created `adminDashboardErrorFix.ts` with:
- Enhanced error logging
- Safe data fetching with fallbacks
- Database connectivity testing
- Table access debugging

## How to Apply the Fixes

### Step 1: Apply Database Fixes
```bash
# Make sure you have a .env file with SUPABASE_DB_URL
./apply_admin_fixes.sh
```

If you don't have the database URL, you can also apply the fixes through Supabase Dashboard:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of `fix_admin_dashboard_errors.sql`
4. Run the SQL

### Step 2: Deploy Frontend Changes
The frontend changes have already been applied to:
- `/src/components/admin/SubscriptionPlanManager.tsx`
- `/src/components/admin/ReferralManager.tsx`
- `/src/pages/AdminPanel.tsx`
- `/src/pages/AdminDashboard.tsx`

Build and deploy your application:
```bash
npm run build
# Deploy to your hosting platform
```

### Step 3: Test the Fixes
1. Clear your browser cache
2. Sign out and sign back in as admin
3. Navigate to the admin dashboard
4. Check that statistics load (even if some show 0)
5. Click on the Shop tab - should show plans or empty state
6. Click on the Referrals tab - should show referrals or empty state

## Debugging Tips

### Check Browser Console
Open browser developer tools and check for:
- Network errors (403 Forbidden = permission issues)
- Console errors with table names

### Test Database Access
In your browser console, you can run:
```javascript
// Import and run debug function
import { debugTables } from '@/utils/adminDashboardErrorFix';
await debugTables();
```

This will show which tables are accessible and which have permission issues.

### Verify Admin Status
Check if the current user is recognized as admin:
```javascript
import { verifyAdminAccess } from '@/utils/adminDashboardErrorFix';
const isAdmin = await verifyAdminAccess();
console.log('Is admin:', isAdmin);
```

## Common Issues and Solutions

### Issue: Still getting "permission denied" errors
**Solution**: 
1. Make sure the SQL fixes were applied successfully
2. Check that the admin user's email matches what's in the database
3. Verify RLS is enabled on all admin tables

### Issue: Tables show as "does not exist"
**Solution**:
1. Run database migrations to create missing tables
2. Check if tables exist in correct schema (public vs api)

### Issue: Admin not recognized
**Solution**:
1. Ensure the user's profile has `role = 'admin'`
2. Check that the email matches 'realassetcoin@gmail.com' or update the SQL script

## Prevention
To prevent similar issues in the future:
1. Always test admin features after database migrations
2. Implement proper error boundaries in React components
3. Use graceful degradation for non-critical data
4. Log errors to monitoring service for early detection

## Support
If issues persist after applying these fixes:
1. Check Supabase logs for database errors
2. Verify all migrations have been applied
3. Ensure the frontend build includes all updates
4. Contact support with specific error messages from console