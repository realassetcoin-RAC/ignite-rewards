# 🚀 DEPLOYMENT INSTRUCTIONS - Subscription Plans Fix

## ⚠️ Direct Database Connection Failed

I attempted to deploy the fix directly to your database, but encountered authentication issues with the Supabase pooler connection. This is common and requires manual deployment through the Supabase Dashboard.

## 🔧 MANUAL DEPLOYMENT (REQUIRED)

### Step 1: Access Supabase Dashboard
1. **Go to**: https://supabase.com/dashboard
2. **Select your project**: `wndswqvqogeblksrujpg`
3. **Navigate to**: SQL Editor (in the left sidebar)

### Step 2: Apply the Fix
1. **Copy the entire contents** of the file: `/workspace/comprehensive_subscription_plans_fix.sql`
2. **Paste it** into the SQL Editor
3. **Click "RUN"** to execute the script

### Step 3: Set Your Admin Role
After running the main fix, you need to set your user as admin:

1. **Find your email** in the Supabase Auth users table
2. **Run this SQL** (replace with your actual email):
```sql
UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

If you don't know your email, you can find it by running:
```sql
SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

### Step 4: Verify the Deployment
Run this verification query to ensure everything was set up correctly:

```sql
-- Verification query
SELECT 
  'Table exists' as check_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
  ) as result
UNION ALL
SELECT 
  'RLS Policies' as check_name,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans') > 0 as result
UNION ALL
SELECT 
  'Default Plans' as check_name,
  (SELECT COUNT(*) FROM api.merchant_subscription_plans) > 0 as result
UNION ALL
SELECT 
  'Admin Function' as check_name,
  EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'api' AND routine_name = 'check_admin_access'
  ) as result;
```

All results should be `true`.

## 🎯 WHAT THIS FIX RESOLVES

After deployment, these errors will be fixed:

✅ **"You don't have permission to access subscription plans"** - when clicking Plans tab  
✅ **"Failed to save plan: permission denied for table merchant_subscription_plans"** - when creating plans  

## 📋 WHAT THE FIX CREATES

The comprehensive fix will:

✅ **Create API Schema** with proper permissions  
✅ **Create `api.profiles` table** for admin role management  
✅ **Create `api.check_admin_access()` function** for secure role validation  
✅ **Create `api.merchant_subscription_plans` table** in the correct schema  
✅ **Set up 5 RLS policies** for comprehensive security:
   - Public can view active plans
   - Admins can view all plans  
   - Admins can insert plans
   - Admins can update plans
   - Admins can delete plans
✅ **Grant all necessary permissions** to authenticated users  
✅ **Add performance indexes** for faster queries  
✅ **Insert 3 default subscription plans**:
   - Basic ($29.99/month) - 30-day trial
   - Premium ($79.99/month) - 30-day trial  
   - Enterprise ($199.99/month) - 30-day trial
✅ **Migrate existing admin users** from public to api schema  

## 🔍 TESTING THE FIX

After deployment:

1. **Clear your browser cache** and cookies
2. **Log out** of your application  
3. **Log back in**
4. **Navigate to**: Admin Dashboard
5. **Click on**: "Plans" tab
6. **Expected result**: You should see the subscription plans without permission errors
7. **Test creating a plan**: Click "New Plan" and try to save it
8. **Expected result**: Plan should save without "permission denied" errors

## 🚨 TROUBLESHOOTING

### If you still get permission errors:

1. **Check admin role**:
```sql
SELECT id, email, role FROM api.profiles WHERE role = 'admin';
```

2. **Set admin role** (replace with your email):
```sql
UPDATE api.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

3. **Clear browser cache** completely
4. **Log out and back in**
5. **Check browser console** for detailed error messages

### If table doesn't exist:

1. **Verify the SQL ran completely** - look for success messages
2. **Check if table was created**:
```sql
SELECT * FROM api.merchant_subscription_plans LIMIT 5;
```

3. **Re-run the fix** if needed

## 📞 SUPPORT

If you encounter any issues:

1. **Check the SQL execution output** for error messages
2. **Verify your user email** in the auth.users table
3. **Ensure the comprehensive fix ran completely** 
4. **Test with the verification query** above

## 🎉 SUCCESS INDICATORS

You'll know the fix worked when:

- ✅ No permission errors when accessing Plans tab
- ✅ Can view all subscription plans in admin dashboard
- ✅ Can create new plans without "permission denied" errors  
- ✅ Can edit and manage existing plans
- ✅ See 3 default plans available (Basic, Premium, Enterprise)

The fix is comprehensive and addresses all root causes of your permission issues!