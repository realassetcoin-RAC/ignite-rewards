# Admin Authentication & Dashboard Loading Fix Guide

This guide provides step-by-step solutions for resolving admin authentication and dashboard loading issues in the PointBridge application.

## 🚨 Quick Fixes

### 1. Browser Console Fix (Immediate)

1. **Login as administrator** (realassetcoin@gmail.com)
2. **Open browser console** (F12 → Console)
3. **Run the diagnostic**:
   ```javascript
   window.adminAuthFix.diagnostic()
   ```
4. **Run the comprehensive fix**:
   ```javascript
   window.adminAuthFix.fix()
   ```

### 2. Database Fix (If Console Fix Doesn't Work)

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the contents of `apply-admin-fix.sql`
3. **Run the script**
4. **Refresh the application**

## 🔍 Detailed Troubleshooting

### Issue 1: "Admin access denied" after login

**Symptoms:**
- User can log in successfully
- Dashboard shows "Admin access denied"
- Diagnostic interface shows failed verification methods

**Solutions:**

1. **Check user role in database**:
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'realassetcoin@gmail.com';
   ```

2. **Update user role if needed**:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'realassetcoin@gmail.com';
   ```

3. **Test admin functions**:
   ```sql
   SELECT public.is_admin();
   SELECT public.check_admin_access();
   ```

### Issue 2: Dashboard tabs showing "Failed to load" errors

**Symptoms:**
- Admin access works
- Individual tabs show loading errors
- Console shows permission errors (PGRST301, 42501)

**Root Causes:**
- Database functions not properly installed
- Row Level Security (RLS) policies blocking access
- Schema permissions issues

**Solutions:**

1. **Apply the admin fix migration**:
   - Run the `apply-admin-fix.sql` script in Supabase SQL Editor

2. **Check RLS policies**:
   ```sql
   -- Disable RLS temporarily for admin tables (if needed)
   ALTER TABLE virtual_cards DISABLE ROW LEVEL SECURITY;
   ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
   ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
   ```

3. **Verify table permissions**:
   ```sql
   -- Grant admin access to key tables
   GRANT ALL ON virtual_cards TO authenticated;
   GRANT ALL ON merchants TO authenticated;
   GRANT ALL ON referrals TO authenticated;
   ```

### Issue 3: RPC functions not found

**Symptoms:**
- Console shows "function not found" errors
- is_admin, check_admin_access functions fail

**Solutions:**

1. **Check if functions exist**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('is_admin', 'check_admin_access', 'get_current_user_profile');
   ```

2. **Recreate functions** using the `apply-admin-fix.sql` script

3. **Verify permissions**:
   ```sql
   GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
   GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
   GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
   ```

## 🛠️ Advanced Diagnostics

### Browser Console Commands

After logging in as admin, use these commands in the browser console:

```javascript
// Quick diagnostic
window.adminAuthFix.diagnostic()

// Comprehensive fix and test
await window.adminAuthFix.fix()

// Test admin access functions
await window.testAdminAccess.testFunctions()

// Full comprehensive test
await window.testAdminAccess.runComprehensive()
```

### Database Diagnostic Queries

```sql
-- Check user profile and role
SELECT 
    u.email,
    u.id,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'realassetcoin@gmail.com';

-- Test admin functions
SELECT public.is_admin() as is_admin_result;
SELECT public.check_admin_access() as check_admin_result;
SELECT * FROM public.get_current_user_profile();

-- Run built-in test
SELECT * FROM public.test_admin_functions();
```

## 🔧 Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| PGRST301 | Permission denied | Update user role to 'admin' |
| PGRST116 | Table not found | Check table exists and permissions |
| 42501 | Insufficient privileges | Grant proper permissions |
| 42883 | Function does not exist | Run the admin fix migration |

## 🚀 Prevention

To prevent these issues in the future:

1. **Always apply migrations** in the correct order
2. **Test admin access** after any database changes
3. **Keep backups** of working database states
4. **Monitor error logs** for early detection

## 📞 Emergency Access

If all else fails and you need immediate admin access:

1. **Use Supabase Dashboard** to directly modify the user role:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'realassetcoin@gmail.com';
   ```

2. **Temporarily disable RLS** on critical tables:
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```

3. **Contact support** with the diagnostic output from the browser console

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] User can log in successfully
- [ ] Admin dashboard loads without errors
- [ ] All tabs load data without permission errors
- [ ] Browser console shows successful admin verification
- [ ] Database functions return expected results

## 📝 Notes

- The `realassetcoin@gmail.com` user is hardcoded as a known admin
- The system has multiple fallback mechanisms for admin verification
- Error boundaries prevent tab failures from crashing the entire dashboard
- All fixes are designed to be non-destructive and reversible