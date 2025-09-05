# Admin Dashboard Error Fixes

This document explains the fixes applied to resolve the admin dashboard errors.

## Issues Fixed

1. **Error loading statistics** - Permission and table existence issues
2. **"Failed to load plans: the schema must be one of the following:api"** - Schema configuration error
3. **"Failed to load referrals: the schema must be one of the following:api"** - Schema configuration error

## Solutions Applied

### 1. Updated Supabase Client Configuration
- Added explicit schema configuration to use 'public' schema
- Added proper headers for client identification
- File: `/src/integrations/supabase/client.ts`

### 2. Improved Error Handling
- Updated error messages to be more descriptive
- Changed statistics loading error from destructive to warning toast
- Added specific handling for schema configuration errors

### 3. Database Migration Script
- Created migration script to ensure all required tables exist
- Added Row Level Security (RLS) policies for admin access
- File: `/src/integrations/supabase/migrations/fix_schema_tables.sql`

## How to Apply the Database Migration

1. **Via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `/src/integrations/supabase/migrations/fix_schema_tables.sql`
   - Paste and run the migration

2. **Via Supabase CLI:**
   ```bash
   supabase db push --db-url "your-database-url"
   ```

## Verification Steps

After applying the fixes:

1. Clear your browser cache and cookies
2. Log in to the admin dashboard
3. Check that statistics load without errors (warnings are acceptable if some data is missing)
4. Navigate to the Shop tab - should load without schema errors
5. Navigate to the Referrals tab - should load without schema errors

## Additional Notes

- The fixes handle missing tables gracefully by showing empty states
- Admin users need proper role assignment in the profiles table
- If errors persist, check:
  - User has 'admin' role in profiles table
  - Database migrations were applied successfully
  - Browser cache has been cleared

## Troubleshooting

If you still see errors:

1. Check browser console for detailed error messages
2. Verify your user has admin role:
   ```sql
   SELECT * FROM profiles WHERE id = 'your-user-id';
   ```
3. Ensure RLS policies are enabled on tables
4. Check Supabase service role permissions