# Referrals Tab Error Fix Guide

## Problem
The referrals tab is showing an error toast message:
> "Failed to load referrals: Could not find the table 'api.user_referrals' in the schema cache"

## Root Cause
The error occurs because:
1. The `user_referrals` table is expected to be in the `public` schema
2. The table may not exist or may be in the wrong schema (`api` instead of `public`)
3. The table may lack proper Row Level Security (RLS) policies
4. The authenticated user may not have proper permissions to access the table

## Solution

### Option 1: Apply the SQL Fix (Recommended)

1. **Copy the SQL Fix**
   - Open the file `REFERRALS_SCHEMA_FIX.sql` in this directory
   - Copy all the contents

2. **Execute in Supabase**
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Paste the SQL content
   - Click "Run" to execute

3. **Verify the Fix**
   - The script will output verification messages
   - Check that all tables are created in the `public` schema
   - Confirm that RLS policies are properly set up

### Option 2: Reset Database (If you don't have important data)

If you don't have important data to preserve:

```bash
# Reset the database to apply all migrations
supabase db reset --linked
```

### Option 3: Manual Fix Steps

If you prefer to apply the fix manually:

1. **Create the user_referrals table in public schema**
2. **Set up Row Level Security policies**
3. **Grant proper permissions to authenticated users**
4. **Create necessary indexes**
5. **Insert default data**

## What the Fix Does

The `REFERRALS_SCHEMA_FIX.sql` script:

1. **Creates Required Tables**
   - `public.user_referrals` - Main referrals table
   - `public.referral_campaigns` - Campaign configuration
   - `public.merchants` - Merchant information

2. **Sets Up Security**
   - Enables Row Level Security (RLS)
   - Creates comprehensive policies for user access
   - Grants proper permissions to authenticated users

3. **Optimizes Performance**
   - Creates indexes on frequently queried columns
   - Sets up triggers for automatic timestamp updates

4. **Provides Default Data**
   - Inserts a default referral campaign
   - Ensures the system is ready to use

5. **Verifies the Fix**
   - Tests table accessibility
   - Confirms schema configuration
   - Reports any issues

## Expected Results

After applying the fix:

1. **No More Error Messages**
   - The referrals tab should load without errors
   - Users can view their referral codes and history

2. **Full Functionality**
   - Users can generate referral codes
   - Referral tracking works properly
   - Admin users can manage referrals

3. **Proper Security**
   - Users can only see their own referrals
   - Admins have full access
   - Data is protected by RLS policies

## Troubleshooting

### If the error persists:

1. **Check Table Existence**
   ```sql
   SELECT table_schema, table_name 
   FROM information_schema.tables 
   WHERE table_name = 'user_referrals';
   ```

2. **Verify Permissions**
   ```sql
   SELECT * FROM information_schema.table_privileges 
   WHERE table_name = 'user_referrals';
   ```

3. **Check RLS Policies**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'user_referrals';
   ```

4. **Test Table Access**
   ```sql
   SELECT COUNT(*) FROM public.user_referrals;
   ```

### Common Issues:

- **Table in wrong schema**: Ensure the table is in `public` schema, not `api`
- **Missing permissions**: Run the GRANT statements in the fix script
- **RLS blocking access**: Check that RLS policies allow authenticated users
- **Schema cache issues**: Restart your Supabase project or clear the cache

## Files Created

- `REFERRALS_SCHEMA_FIX.sql` - Main fix script
- `fix_referrals_schema_error.sql` - Alternative fix script
- `apply_referrals_schema_fix.js` - Node.js script to prepare the fix
- `REFERRALS_ERROR_FIX_GUIDE.md` - This guide

## Support

If you continue to experience issues:

1. Check the Supabase logs for detailed error messages
2. Verify your database connection and authentication
3. Ensure all dependencies (profiles table, auth.users) exist
4. Contact support with the specific error messages you're seeing

## Notes

- This fix will recreate the `user_referrals` table, so any existing data will be lost
- If you have important referral data, back it up before applying the fix
- The fix is designed to be safe and non-destructive to other parts of your system
- All changes are made in the `public` schema to ensure compatibility with the frontend code
