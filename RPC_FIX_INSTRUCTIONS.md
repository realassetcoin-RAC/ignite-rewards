# RPC is_admin Error Fix Instructions

## Problem
The RPC `is_admin` function is showing an error status in the health tab with the error:
```
PGRST106: The schema must be one of the following: api
```

## Root Cause
The Supabase instance is configured to only expose the `api` schema, but the RPC functions don't exist in the `api` schema. The health tab is trying to call `is_admin` and `check_admin_access` RPC functions that are missing.

## Solution

### Step 1: Apply the SQL Fix
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL script (or use the contents of `fix_rpc_functions.sql`):

```sql
-- Fix for is_admin RPC error in health tab
-- This script creates the missing RPC functions in the api schema

-- Ensure api schema exists and is accessible
CREATE SCHEMA IF NOT EXISTS api;
GRANT USAGE ON SCHEMA api TO anon, authenticated;

-- Drop existing conflicting functions to avoid ambiguity
DROP FUNCTION IF EXISTS api.is_admin();
DROP FUNCTION IF EXISTS api.is_admin(uuid);
DROP FUNCTION IF EXISTS api.check_admin_access();
DROP FUNCTION IF EXISTS api.check_admin_access(uuid);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.check_admin_access();
DROP FUNCTION IF EXISTS public.check_admin_access(uuid);

-- Create is_admin RPC function in api schema (no parameters)
CREATE OR REPLACE FUNCTION api.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Create check_admin_access RPC function in api schema (no parameters)
CREATE OR REPLACE FUNCTION api.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'api, public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION api.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION api.check_admin_access() TO authenticated;

-- Also create in public schema for backward compatibility (no parameters)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT api.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT api.check_admin_access();
$$;

-- Grant execute permissions on public schema functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
```

4. Click **Run** to execute the script

### Step 2: Verify the Fix
After applying the fix, test the RPC functions by running this in the SQL Editor:

```sql
-- Test the RPC functions
SELECT 'Testing is_admin RPC...' as test;
SELECT api.is_admin() as is_admin_result;

SELECT 'Testing check_admin_access RPC...' as test;
SELECT api.check_admin_access() as check_admin_result;
```

### Step 3: Check Health Tab
1. Go back to your application
2. Navigate to the Admin Dashboard
3. Click on the **Health** tab
4. The RPC `is_admin` should now show as **OK** instead of **ERROR**

## What This Fix Does

1. **Creates the `api` schema** if it doesn't exist
2. **Creates `api.is_admin()` function** that checks if the current user has admin role
3. **Creates `api.check_admin_access()` function** as an alias for the admin check
4. **Grants proper permissions** to authenticated users
5. **Creates backward compatibility functions** in the public schema
6. **Sets proper search paths** to ensure the functions can access the profiles table

## Expected Results

After applying this fix:
- ✅ RPC `is_admin` will show as **OK** in the health tab
- ✅ RPC `check_admin_access` will show as **OK** in the health tab
- ✅ Admin authentication will work properly
- ✅ Health tab will no longer show error status

## Troubleshooting

If you still see errors after applying the fix:

1. **Check if the `api.profiles` table exists**:
   ```sql
   SELECT * FROM api.profiles LIMIT 1;
   ```

2. **Check if you have an admin profile**:
   ```sql
   SELECT id, email, role FROM api.profiles WHERE role = 'admin';
   ```

3. **Verify the functions were created**:
   ```sql
   SELECT routine_name, routine_schema 
   FROM information_schema.routines 
   WHERE routine_name IN ('is_admin', 'check_admin_access');
   ```

If you need to create an admin profile, run:
```sql
-- Replace with your actual user ID and email
INSERT INTO api.profiles (id, email, role, full_name)
VALUES (auth.uid(), 'your-email@example.com', 'admin', 'Admin User')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```
