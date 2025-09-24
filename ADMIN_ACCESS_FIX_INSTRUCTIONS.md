# Admin Access Fix Instructions

## Problem
You're getting an "Admin Access Denied" error when trying to access the admin dashboard. The error shows:
- User: `realassetcoin@gmail.com`
- Role: "Not set"
- Profile Exists: No (red X)
- Admin Status: No (red X)

## Solution Steps

### Step 1: Run the Diagnostic Script
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `diagnose_admin_issue.sql`
4. Run the script to identify the exact problem

### Step 2: Fix the Admin Access
1. In the Supabase SQL Editor, copy and paste the contents of `fix_admin_access_comprehensive.sql`
2. Run the script to fix the admin access issue
3. The script will:
   - Create/update admin functions
   - Create or update the profile for `realassetcoin@gmail.com` with admin role
   - Set up proper RLS policies
   - Verify the fix

### Step 3: Test the Fix
1. Sign out of your application completely
2. Sign back in with `realassetcoin@gmail.com`
3. Try accessing the admin dashboard again

### Step 4: If Still Having Issues
1. Check the browser console for any JavaScript errors
2. Verify your Supabase project settings and API keys
3. Make sure the user `realassetcoin@gmail.com` exists in your Supabase Auth users

## What the Fix Does

The comprehensive fix script will:

1. **Check Current State**: Verify the profiles table structure and existing data
2. **Fix Admin Functions**: Recreate the `is_admin()`, `check_admin_access()`, and `get_current_user_profile()` functions
3. **Create Admin Profile**: Create or update a profile for `realassetcoin@gmail.com` with admin role
4. **Set Up RLS**: Configure proper Row Level Security policies
5. **Verify**: Test all functions and show the results

## Expected Result

After running the fix, you should see:
- ✅ Profile exists for `realassetcoin@gmail.com`
- ✅ Role is set to "admin"
- ✅ Admin Status shows as true
- ✅ Admin dashboard loads successfully

## Files Created

- `diagnose_admin_issue.sql` - Diagnostic script to identify the problem
- `fix_admin_access_comprehensive.sql` - Comprehensive fix script
- `ADMIN_ACCESS_FIX_INSTRUCTIONS.md` - This instruction file

## Need Help?

If you're still having issues after following these steps:
1. Check the browser console for errors
2. Verify your Supabase project is properly configured
3. Make sure you're using the correct email address
4. Check that the user exists in Supabase Auth



