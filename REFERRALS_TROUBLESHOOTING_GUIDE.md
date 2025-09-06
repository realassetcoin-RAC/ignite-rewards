# Referrals Tab Troubleshooting Guide

## Common Issues and Solutions

### 1. **"Could not find the table 'api.user_referrals' in the schema cache"**
**Status:** ✅ Should be fixed with the corrected script
**Solution:** Run `REFERRALS_SCHEMA_FIX_CORRECTED.sql`

### 2. **"relation 'public.profiles' does not exist"**
**Status:** ✅ Fixed in corrected script
**Solution:** The corrected script uses `api.profiles` instead of `public.profiles`

### 3. **Permission denied errors**
**Possible causes:**
- User not authenticated
- RLS policies blocking access
- Missing permissions

**Solutions:**
```sql
-- Check if user is authenticated
SELECT auth.uid();

-- Check user role
SELECT role FROM api.profiles WHERE id = auth.uid();

-- Grant permissions if needed
GRANT ALL ON public.user_referrals TO authenticated;
```

### 4. **Table exists but still getting errors**
**Possible causes:**
- Frontend caching
- Schema cache issues
- RLS policy conflicts

**Solutions:**
- Clear browser cache
- Refresh the page
- Check browser console for JavaScript errors

### 5. **Referrals tab loads but shows no data**
**Possible causes:**
- No referral codes generated
- RLS policies too restrictive
- Data not inserted properly

**Solutions:**
```sql
-- Check if user has referral codes
SELECT * FROM public.user_referrals WHERE referrer_id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_referrals';
```

## Diagnostic Steps

### Step 1: Run the Test Script
Execute `test_referrals_fix.sql` to check:
- Table existence
- Table structure
- RLS policies
- Permissions
- Authentication status

### Step 2: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for any JavaScript errors
4. Check Network tab for failed requests

### Step 3: Verify Authentication
1. Ensure user is logged in
2. Check if user has a profile in `api.profiles`
3. Verify user role is set correctly

### Step 4: Test Database Access
```sql
-- Test basic access
SELECT COUNT(*) FROM public.user_referrals;

-- Test with current user
SELECT * FROM public.user_referrals WHERE referrer_id = auth.uid();
```

## Quick Fixes

### If the referrals tab still shows the original error:
1. **Clear browser cache** and refresh
2. **Check if the script ran completely** - look for success messages
3. **Verify table exists:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'user_referrals';
   ```

### If you see permission errors:
1. **Check user authentication:**
   ```sql
   SELECT auth.uid();
   ```
2. **Verify user has profile:**
   ```sql
   SELECT * FROM api.profiles WHERE id = auth.uid();
   ```
3. **Grant permissions:**
   ```sql
   GRANT ALL ON public.user_referrals TO authenticated;
   ```

### If the tab loads but is empty:
1. **Check if referral codes exist:**
   ```sql
   SELECT COUNT(*) FROM public.user_referrals;
   ```
2. **Create a test referral code:**
   ```sql
   INSERT INTO public.user_referrals (referrer_id, referral_code, status)
   VALUES (auth.uid(), 'TEST123', 'pending');
   ```

## Files to Check

- `REFERRALS_SCHEMA_FIX_CORRECTED.sql` - Main fix script
- `test_referrals_fix.sql` - Diagnostic script
- `src/components/dashboard/ReferralsTab.tsx` - Frontend component
- Browser console for JavaScript errors

## Still Having Issues?

If you're still encountering problems, please provide:
1. **Exact error message** from the browser console
2. **Results from the test script** (`test_referrals_fix.sql`)
3. **Screenshot** of the error if possible
4. **Steps to reproduce** the issue

This will help identify the specific problem and provide a targeted solution.
