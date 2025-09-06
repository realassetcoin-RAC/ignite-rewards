# 🛠️ Solution: "You don't have permission to access subscription plans" Error

## 🔍 Problem Identified
When clicking the **"Plans" tab** (referred to as "shops tab") in the admin dashboard, you encounter:
> "You don't have permission to access subscription plans. Please contact an Administrator"

## 🎯 Root Cause
The `merchant_subscription_plans` table exists in the database but lacks proper **Row Level Security (RLS) policies** for admin users to access it. The table permissions are not correctly configured for the `api` schema that your Supabase client uses.

## ✅ Complete Solution

### Step 1: Apply Database Fix (Required)
You need to apply the SQL fix in your **Supabase Dashboard**:

1. Go to your **Supabase Dashboard** at https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the entire contents of `/workspace/MANUAL_SUBSCRIPTION_PLANS_FIX.sql`
5. Paste it into the SQL editor
6. Click **"RUN"** to execute the script

### Step 2: Verify Admin Role (Important)
After applying the database fix, ensure your user has admin privileges:

1. In Supabase Dashboard, go to **Database → Tables**
2. Find the `api.profiles` table
3. Locate your user record (by email or user ID)
4. Make sure the `role` column is set to `'admin'`
5. If not, update it: `UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';`

### Step 3: Test the Fix
1. Log out and log back into your application
2. Navigate to the Admin Dashboard
3. Click on the **"Plans"** tab
4. You should now see the subscription plans without permission errors

## 🔧 What the Fix Does

The SQL script will:

✅ **Create the subscription plans table** in the correct `api` schema  
✅ **Enable Row Level Security (RLS)** with proper policies  
✅ **Grant permissions** for admin users to manage plans  
✅ **Allow public access** to active plans for regular users  
✅ **Add performance indexes** for faster queries  
✅ **Insert default plans**: Basic ($29.99), Premium ($79.99), Enterprise ($199.99)  

## 📋 RLS Policies Created

The fix creates 5 security policies:

1. **"Anyone can view active plans"** - Public users can see active subscription plans
2. **"Admins can view all plans"** - Admin users can see all plans (active and inactive)
3. **"Admins can insert plans"** - Admin users can create new plans
4. **"Admins can update plans"** - Admin users can modify existing plans
5. **"Admins can delete plans"** - Admin users can remove plans

## 🚨 Troubleshooting

If you still get permission errors after applying the fix:

### Issue 1: User doesn't have admin role
**Solution**: Update your user role in the database:
```sql
UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Issue 2: Browser cache
**Solution**: Clear your browser cache and cookies, then log in again

### Issue 3: Table not created properly
**Solution**: Check if the table exists:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans';
```

### Issue 4: RLS policies missing
**Solution**: Check if policies exist:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
```
Should return 5 policies.

## 🎉 Expected Result

After applying this fix:
- ✅ The "Plans" tab in admin dashboard will load without errors
- ✅ Admin users can view, create, edit, and manage subscription plans
- ✅ The table will have 3 default subscription plans pre-loaded
- ✅ All permission checks will work correctly

## 📁 Files to Use

- **Main Fix**: `/workspace/MANUAL_SUBSCRIPTION_PLANS_FIX.sql`
- **Alternative**: `/workspace/fix_subscription_plans_permissions.sql`
- **Diagnostic**: `/workspace/diagnose_permission_error.sql` (to check current state)

---

**⚡ Quick Fix Summary**: Apply the SQL script in Supabase Dashboard → SQL Editor, ensure your user has `role = 'admin'` in `api.profiles` table, then test the Plans tab.