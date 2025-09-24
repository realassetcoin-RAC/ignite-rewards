# DAO Issues Troubleshooting Guide

## 🚨 **Current Status**
- Supabase connection appears to be up
- Still getting 503 errors and PGRST002 database schema cache errors
- "Setup Test Data" button failing

## 🔍 **Diagnostic Steps**

### Step 1: Test Supabase Connection Directly
Run this SQL script in your Supabase SQL Editor:
```sql
\i test_supabase_connection.sql
```

This will test:
- Basic connectivity
- Table existence
- RLS policies
- Permissions

### Step 2: Check Browser Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try clicking "Setup Test Data" button
4. Look for the actual HTTP requests to Supabase
5. Check the response status codes and error messages

### Step 3: Test Direct API Access
Try accessing your Supabase API directly in a new browser tab:
```
https://wndswqvqogeblksrujpg.supabase.co/rest/v1/dao_organizations?select=*
```

### Step 4: Check Environment Variables
The application is using hardcoded values in `client.ts`:
- URL: `https://wndswqvqogeblksrujpg.supabase.co`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 5: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 🔧 **Potential Issues & Fixes**

### Issue 1: RLS Policies Too Restrictive
**Fix**: Run this SQL to make policies more permissive:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on dao_organizations" ON public.dao_organizations;
DROP POLICY IF EXISTS "Allow all operations on dao_members" ON public.dao_members;
DROP POLICY IF EXISTS "Allow all operations on dao_proposals" ON public.dao_proposals;
DROP POLICY IF EXISTS "Allow all operations on dao_votes" ON public.dao_votes;

-- Create very permissive policies
CREATE POLICY "Allow all operations on dao_organizations" ON public.dao_organizations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on dao_members" ON public.dao_members
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on dao_proposals" ON public.dao_proposals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on dao_votes" ON public.dao_votes
  FOR ALL USING (true) WITH CHECK (true);
```

### Issue 2: Missing Permissions
**Fix**: Grant proper permissions:
```sql
GRANT ALL ON public.dao_organizations TO authenticated;
GRANT ALL ON public.dao_members TO authenticated;
GRANT ALL ON public.dao_proposals TO authenticated;
GRANT ALL ON public.dao_votes TO authenticated;

GRANT SELECT ON public.dao_organizations TO anon;
GRANT SELECT ON public.dao_members TO anon;
GRANT SELECT ON public.dao_proposals TO anon;
GRANT SELECT ON public.dao_votes TO anon;
```

### Issue 3: Schema Cache Issues
**Fix**: Try refreshing the schema cache:
```sql
-- This might help with schema cache issues
SELECT pg_reload_conf();
```

## 🎯 **Next Steps**

1. **Run the diagnostic SQL script** first
2. **Check the browser Network tab** for actual error details
3. **Try the direct API access** test
4. **Apply the RLS/permissions fixes** if needed

## 📞 **If Still Not Working**

If the issue persists:
1. **Check Supabase Status Page**: https://status.supabase.com/
2. **Contact Supabase Support** - This might be a regional issue
3. **Try creating a new Supabase project** as a test

Let me know what the diagnostic script shows and what you see in the Network tab! 🚀







