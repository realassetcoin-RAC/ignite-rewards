# 🚨 Fix: "Could not find the table 'api.merchant_subscription_plans' in the schema cache"

## Problem Analysis

The error occurs because of a **schema mismatch**:
- Your Supabase client is configured to use the `api` schema
- The `merchant_subscription_plans` table exists in the `public` schema
- The client looks for `api.merchant_subscription_plans` but finds `public.merchant_subscription_plans`

## 🎯 Solution Options

### Option 1: Create Table in API Schema (RECOMMENDED)

This option creates the table in the `api` schema to match your client configuration.

**Steps:**
1. Run the automated fix script:
   ```bash
   ./apply_merchant_subscription_plans_fix.sh
   ```

2. Or manually apply the SQL fix:
   ```bash
   # Set your database URL
   export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   
   # Apply the fix
   node scripts/run-sql.cjs /workspace/fix_merchant_subscription_plans_schema.sql
   ```

**What this does:**
- ✅ Creates `api.merchant_subscription_plans` table
- ✅ Sets up proper RLS policies
- ✅ Migrates existing data from `public` schema
- ✅ Adds default subscription plans
- ✅ Updates foreign key constraints
- ✅ Sets proper permissions

### Option 2: Change Client Configuration

If you prefer to use the `public` schema, update your client configuration:

**File:** `src/integrations/supabase/client.ts`
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'  // Changed from 'api' to 'public'
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    }
  }
});
```

**Note:** This option requires ensuring all your tables are in the `public` schema and may affect other parts of your application.

## 🔍 Root Cause Details

### Current State:
- **Client Configuration:** `schema: 'api'` in `src/integrations/supabase/client.ts`
- **Table Location:** `public.merchant_subscription_plans` (from migrations)
- **Expected by Client:** `api.merchant_subscription_plans`

### Migration Files Show:
- `supabase/migrations/*.sql` create tables in `public` schema
- Your client expects `api` schema
- This creates a mismatch that causes the "schema cache" error

## 🚀 Quick Fix (Automated)

1. **Run the fix script:**
   ```bash
   ./apply_merchant_subscription_plans_fix.sh
   ```

2. **Provide your database URL when prompted:**
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

4. **Test the subscription plans functionality**

## 🧪 Manual Verification

After applying the fix, you can verify it worked:

1. **Check table exists:**
   ```sql
   SELECT * FROM api.merchant_subscription_plans;
   ```

2. **Test in your application:**
   - Navigate to the admin dashboard
   - Try to view/create subscription plans
   - Should work without the schema cache error

## 📋 Troubleshooting

### If the fix doesn't work:

1. **Check your DATABASE_URL format:**
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```

2. **Verify permissions:**
   - Ensure your database user has CREATE permissions
   - Check that RLS policies are properly configured

3. **Check client configuration:**
   - Ensure `src/integrations/supabase/client.ts` still has `schema: 'api'`

4. **Clear browser cache and restart dev server**

### Common Issues:

- **"Permission denied"**: Check your database user permissions
- **"Connection refused"**: Verify DATABASE_URL and network connectivity
- **"Function does not exist"**: Ensure `public.check_admin_access()` function exists

## 🎉 Expected Results

After applying the fix:
- ✅ No more "schema cache" errors
- ✅ Subscription plans load correctly
- ✅ Can create, edit, and manage plans
- ✅ Admin dashboard works properly
- ✅ All existing functionality preserved

## 📞 Need Help?

If you encounter any issues:
1. Check the error messages in browser console
2. Verify database connectivity
3. Ensure all migrations have been applied
4. Check RLS policies and permissions

The fix is designed to be safe and non-destructive - it preserves existing data and functionality while resolving the schema mismatch.