# Application Code Updates Required

## 🔄 **Required Code Changes After Schema Migration**

After running the comprehensive schema migration, the following application code updates are required to ensure everything works correctly.

## 📋 **Files That Need Updates**

### 1. **MerchantSignupModal.tsx**
**Current Issue**: Uses `as any` type assertion for RPC call
**Required Change**: Remove type assertion since RPC function is now properly defined

```typescript
// BEFORE (line 136)
const { data, error } = await supabase
  .rpc('get_valid_subscription_plans' as any);

// AFTER
const { data, error } = await supabase
  .rpc('get_valid_subscription_plans');
```

### 2. **SubscriptionPlanManager.tsx**
**Current Issue**: May have schema reference issues
**Required Change**: Ensure all table references use public schema

```typescript
// VERIFY this is correct (should be public schema)
const { data, error } = await supabase
  .from('merchant_subscription_plans')  // Should be public schema
  .select('*')
  .order('created_at', { ascending: false });
```

### 3. **VirtualCardManager.tsx**
**Current Issue**: May have schema reference issues
**Required Change**: Ensure all table references use public schema

```typescript
// VERIFY this is correct (should be public schema)
const { data, error } = await supabase
  .from('virtual_cards')  // Should be public schema
  .select('*');
```

### 4. **DAOService.ts**
**Current Issue**: May have schema reference issues
**Required Change**: Ensure all table references use public schema

```typescript
// VERIFY these are correct (should be public schema)
const { data, error } = await supabase
  .from('dao_organizations')  // Should be public schema
  .select('*');

const { data, error } = await supabase
  .from('dao_members')  // Should be public schema
  .select('*');

const { data, error } = await supabase
  .from('dao_proposals')  // Should be public schema
  .select('*');

const { data, error } = await supabase
  .from('dao_votes')  // Should be public schema
  .select('*');
```

### 5. **Test Data Services**
**Current Issue**: May have schema reference issues
**Required Change**: Ensure all table references use public schema

#### **comprehensiveTestDataService.ts**
```typescript
// VERIFY these are correct (should be public schema)
const { data, error } = await supabase
  .from('dao_organizations')  // Should be public schema
  .select('*');
```

#### **directTestDataService.ts**
```typescript
// VERIFY these are correct (should be public schema)
const { data, error } = await supabase
  .from('loyalty_transactions')  // Should be public schema
  .delete();

const { data, error } = await supabase
  .from('user_referrals')  // Should be public schema
  .delete();
```

## 🔍 **Verification Steps**

### 1. **Check All Database Calls**
Search for all `supabase.from()` calls and verify they use the correct schema:

```bash
# Search for all database table references
grep -r "supabase\.from(" src/ --include="*.ts" --include="*.tsx"
```

### 2. **Check RPC Function Calls**
Search for all `supabase.rpc()` calls and verify they don't use type assertions:

```bash
# Search for all RPC calls
grep -r "supabase\.rpc(" src/ --include="*.ts" --include="*.tsx"
```

### 3. **Check Schema References**
Search for any hardcoded schema references:

```bash
# Search for schema references
grep -r "api\." src/ --include="*.ts" --include="*.tsx"
grep -r "public\." src/ --include="*.ts" --include="*.tsx"
```

## 🧪 **Testing Checklist**

After making the code changes, test the following:

### 1. **Loyalty Application**
- [ ] User dashboard loads correctly
- [ ] Merchant dashboard loads correctly
- [ ] Admin panel loads correctly
- [ ] Virtual card creation works
- [ ] Subscription plan management works
- [ ] Merchant signup works

### 2. **DAO Voting System**
- [ ] DAO dashboard loads correctly
- [ ] User DAO dashboard loads correctly
- [ ] DAO voting works
- [ ] Proposal creation works
- [ ] Member management works

### 3. **Marketplace**
- [ ] Marketplace page loads correctly
- [ ] Listing creation works
- [ ] Listing viewing works

### 4. **RPC Functions**
- [ ] `get_valid_subscription_plans()` works
- [ ] `create_dao_tables()` works
- [ ] `create_dao_test_data()` works
- [ ] `create_comprehensive_test_data()` works
- [ ] `clear_all_test_data()` works

### 5. **Database Operations**
- [ ] All SELECT operations work
- [ ] All INSERT operations work
- [ ] All UPDATE operations work
- [ ] All DELETE operations work

## 🚨 **Common Issues and Solutions**

### Issue 1: "relation does not exist" errors
**Cause**: Table references wrong schema
**Solution**: Ensure all table references use public schema

### Issue 2: RPC function not found
**Cause**: RPC function not properly defined
**Solution**: Verify RPC function exists in public schema

### Issue 3: Permission denied errors
**Cause**: RLS policies not properly configured
**Solution**: Verify RLS policies are correctly set up

### Issue 4: Type errors in TypeScript
**Cause**: Type assertions or incorrect types
**Solution**: Remove unnecessary type assertions, update types

## 📝 **Code Update Script**

Create a script to automatically update common issues:

```bash
#!/bin/bash
# update_schema_references.sh

# Remove type assertions from RPC calls
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.rpc('get_valid_subscription_plans' as any)/\.rpc('get_valid_subscription_plans')/g"

# Verify no api schema references remain
echo "Checking for api schema references..."
grep -r "api\." src/ --include="*.ts" --include="*.tsx" || echo "No api schema references found"

echo "Schema reference updates complete!"
```

## ⚠️ **Important Notes**

1. **Backup First**: Always backup your code before making changes
2. **Test Thoroughly**: Test all functionality after making changes
3. **Incremental Updates**: Make changes incrementally and test each one
4. **Monitor Logs**: Watch for any error messages in the console
5. **Rollback Plan**: Have a rollback plan ready if issues occur

## 🎯 **Success Criteria**

The migration is successful when:
- [ ] All database operations work without errors
- [ ] All RPC functions work correctly
- [ ] All application components load and function properly
- [ ] No schema-related errors in console
- [ ] All tests pass
- [ ] Performance is maintained or improved
