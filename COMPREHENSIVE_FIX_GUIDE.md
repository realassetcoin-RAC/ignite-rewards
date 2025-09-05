# Comprehensive Database Fix Guide

## 🚨 Issues Identified

You're experiencing two critical database issues:

### 1. Plan Saving Error: "Failed to save plan: the schema must be one of the following:api"
### 2. Virtual Card Creation Failures

## 🔍 Root Cause Analysis

### Plan Saving Issue
**Problem**: The `merchant_subscription_plans` table structure doesn't match what the application expects.

**Specific Issues**:
- ❌ Migration creates `price` column, but app expects `price_monthly`
- ❌ Migration creates `duration_days` column, but app expects `trial_days`
- ❌ Only SELECT RLS policies exist, missing INSERT/UPDATE/DELETE policies
- ❌ Missing INSERT/UPDATE/DELETE permissions for authenticated users

### Virtual Card Creation Issue
**Problem**: Multiple conflicting table definitions and missing functions.

**Specific Issues**:
- ❌ Old migration has wrong table structure (user_id, card_number, balance)
- ❌ App expects different structure (card_name, card_type, pricing_type)
- ❌ Missing or inconsistent `has_role` function for RLS policies
- ❌ Schema conflicts between different migration files

## ✅ Comprehensive Solution

The fix addresses both issues with a single comprehensive SQL script that:

### 1. **Ensures Required Enums Exist**
- Creates all necessary ENUM types (app_role, card_type, pricing_type, etc.)
- Handles cases where enums already exist

### 2. **Recreates Tables with Correct Structure**
- `profiles` table for user management and admin roles
- `merchant_subscription_plans` with correct columns (price_monthly, trial_days)
- `virtual_cards` with proper structure matching TypeScript types

### 3. **Implements Comprehensive RLS Policies**
- SELECT policies for viewing data
- INSERT/UPDATE/DELETE policies for admin operations
- Proper role-based access control

### 4. **Creates Required Helper Functions**
- `has_role()` function for RLS policy compatibility
- `update_updated_at_column()` function for automatic timestamps

### 5. **Sets Up Proper Permissions**
- Grants for authenticated and anonymous users
- Sequence permissions for auto-generated IDs
- Function execution permissions

### 6. **Adds Performance Indexes**
- Indexes on frequently queried columns
- Optimized for admin dashboard operations

### 7. **Inserts Default Data**
- Sample subscription plans (Basic, Premium, Enterprise)
- Sample virtual cards for testing

## 🛠️ How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)
1. **Open your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy the entire contents of `comprehensive_database_fix.sql`**
4. **Paste into the SQL Editor**
5. **Click "Run" to execute**

### Option 2: Using the Script
```bash
./apply_comprehensive_fix.sh
```

### Option 3: Supabase CLI
```bash
# Copy SQL to a new migration
cp comprehensive_database_fix.sql supabase/migrations/$(date +%Y%m%d_%H%M%S)_comprehensive_fix.sql

# Apply the migration
supabase db push
```

## 🧪 Verification Steps

After applying the fix, verify it worked:

### 1. **Database Verification**
```sql
-- Check tables exist
SELECT COUNT(*) FROM public.merchant_subscription_plans;
SELECT COUNT(*) FROM public.virtual_cards;
SELECT COUNT(*) FROM public.profiles;

-- Check your admin role
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
```

### 2. **Application Testing**
- ✅ Go to admin dashboard → Shop tab
- ✅ Try creating a new subscription plan
- ✅ Try creating a new virtual card
- ✅ Verify no console errors appear

### 3. **Expected Results**
- ✅ No more "schema must be one of the following:api" errors
- ✅ Plan creation succeeds and saves to database
- ✅ Virtual card creation works without page reload
- ✅ Admin dashboard loads all data correctly

## 🔧 Troubleshooting

### If you still see errors:

#### 1. **Check Your Admin Role**
```sql
-- Ensure your user has admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid() AND email = 'your-email@example.com';
```

#### 2. **Clear Browser Cache**
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Clear application cache
- Close and reopen browser

#### 3. **Check Browser Console**
- Open developer tools (F12)
- Look for JavaScript errors
- Check network tab for failed API calls

#### 4. **Verify Table Structure**
```sql
-- Check table structures match expectations
\d public.merchant_subscription_plans
\d public.virtual_cards
\d public.profiles
```

#### 5. **Check RLS Policies**
```sql
-- Verify RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('merchant_subscription_plans', 'virtual_cards', 'profiles')
ORDER BY tablename, policyname;
```

## 📋 What This Fix Does

### Tables Created/Fixed:
1. **`public.profiles`** - User profiles with role management
2. **`public.merchant_subscription_plans`** - Subscription plans with correct column names
3. **`public.virtual_cards`** - Virtual cards with proper structure

### Policies Created:
- **SELECT**: View own data + admin can view all
- **INSERT**: Admin can create new records
- **UPDATE**: Admin can modify existing records
- **DELETE**: Admin can remove records

### Functions Created:
- **`has_role(uuid, text)`** - Check user roles for RLS
- **`update_updated_at_column()`** - Auto-update timestamps

### Default Data:
- **3 subscription plans**: Basic ($29.99), Premium ($79.99), Enterprise ($199.99)
- **3 virtual cards**: Standard, Premium, Enterprise cards

## 🎯 Key Benefits

✅ **Fixes Both Issues**: Addresses plan saving AND virtual card creation  
✅ **Future-Proof**: Consistent table structures and permissions  
✅ **Performance**: Optimized with proper indexes  
✅ **Security**: Comprehensive RLS policies  
✅ **Maintainable**: Clear, documented structure  

## 🔄 Rollback Plan

If you need to rollback (unlikely):
1. **Backup current data** before applying
2. **Drop the recreated tables** if needed
3. **Restore from backup** if necessary

## 📞 Support

The fix includes comprehensive verification and should resolve both issues completely. If you continue experiencing problems:

1. **Run the verification SQL** to check database state
2. **Check browser console** for specific error messages  
3. **Verify user permissions** and admin role assignment
4. **Ensure all migrations applied successfully**

## ✨ Success Indicators

You'll know the fix worked when:
- ✅ No "schema must be one of the following:api" errors
- ✅ Plan creation and editing works smoothly
- ✅ Virtual card creation succeeds without page reloads
- ✅ Admin dashboard loads all data without errors
- ✅ Browser console shows no database-related errors

The fix is designed to be idempotent and safe to run multiple times.