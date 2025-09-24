# Testing Checklist for Schema Migration

## 🧪 **Pre-Migration Testing**

### 1. **Backup Verification**
- [ ] Database backup completed successfully
- [ ] Code backup completed successfully
- [ ] Backup files are accessible and valid

### 2. **Current State Documentation**
- [ ] Document current table schemas
- [ ] Document current RPC functions
- [ ] Document current application functionality
- [ ] Take screenshots of working features

## 🔄 **Migration Testing**

### 1. **Schema Migration Script**
- [ ] Run migration script in development environment
- [ ] Verify all tables moved to public schema
- [ ] Verify no tables remain in api schema
- [ ] Verify all RLS policies created
- [ ] Verify all indexes created
- [ ] Verify all RPC functions updated

### 2. **Application Code Updates**
- [ ] Update MerchantSignupModal.tsx (remove type assertion)
- [ ] Verify all database calls use public schema
- [ ] Verify all RPC calls work without type assertions
- [ ] Update any hardcoded schema references

## 🧪 **Post-Migration Testing**

### 1. **Database Verification**
```sql
-- Run these queries to verify migration success
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

SELECT schemaname, tablename, indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 2. **Loyalty Application Testing**

#### **User Dashboard**
- [ ] Dashboard loads without errors
- [ ] User profile displays correctly
- [ ] Virtual cards display correctly
- [ ] Loyalty transactions display correctly
- [ ] Points balance displays correctly
- [ ] Navigation works correctly

#### **Merchant Dashboard**
- [ ] Dashboard loads without errors
- [ ] Merchant profile displays correctly
- [ ] Subscription plan displays correctly
- [ ] Transaction history displays correctly
- [ ] Settings work correctly

#### **Admin Panel**
- [ ] Admin panel loads without errors
- [ ] Virtual card management works
- [ ] Subscription plan management works
- [ ] Merchant management works
- [ ] DAO management works
- [ ] User management works

#### **Merchant Signup**
- [ ] Signup modal opens correctly
- [ ] Subscription plans load correctly
- [ ] Plan selection works
- [ ] Form submission works
- [ ] Payment processing works
- [ ] Account creation works

### 3. **DAO Voting System Testing**

#### **User DAO Dashboard**
- [ ] Dashboard loads without errors
- [ ] DAO organizations display correctly
- [ ] Proposals display correctly
- [ ] Voting functionality works
- [ ] Member information displays correctly
- [ ] Test data setup works

#### **Admin DAO Dashboard**
- [ ] Dashboard loads without errors
- [ ] DAO management works
- [ ] Proposal management works
- [ ] Member management works
- [ ] Voting management works

#### **DAO Voting**
- [ ] Can view proposals
- [ ] Can vote on proposals
- [ ] Vote results display correctly
- [ ] Voting power calculations work
- [ ] Proposal status updates work

### 4. **Marketplace Testing**
- [ ] Marketplace page loads correctly
- [ ] Listings display correctly
- [ ] Listing creation works
- [ ] Listing editing works
- [ ] Listing deletion works
- [ ] Search functionality works
- [ ] Filtering works

### 5. **RPC Function Testing**

#### **get_valid_subscription_plans**
```typescript
// Test this function
const { data, error } = await supabase.rpc('get_valid_subscription_plans');
console.log('RPC Result:', data, error);
```

#### **create_dao_tables**
```typescript
// Test this function
const { data, error } = await supabase.rpc('create_dao_tables');
console.log('RPC Result:', data, error);
```

#### **create_dao_test_data**
```typescript
// Test this function
const { data, error } = await supabase.rpc('create_dao_test_data');
console.log('RPC Result:', data, error);
```

#### **create_comprehensive_test_data**
```typescript
// Test this function
const { data, error } = await supabase.rpc('create_comprehensive_test_data');
console.log('RPC Result:', data, error);
```

#### **clear_all_test_data**
```typescript
// Test this function
const { data, error } = await supabase.rpc('clear_all_test_data');
console.log('RPC Result:', data, error);
```

### 6. **Database Operations Testing**

#### **SELECT Operations**
- [ ] All table queries work
- [ ] Complex joins work
- [ ] Filtering works
- [ ] Sorting works
- [ ] Pagination works

#### **INSERT Operations**
- [ ] User creation works
- [ ] Merchant creation works
- [ ] Virtual card creation works
- [ ] DAO proposal creation works
- [ ] Marketplace listing creation works

#### **UPDATE Operations**
- [ ] User profile updates work
- [ ] Merchant profile updates work
- [ ] Virtual card updates work
- [ ] DAO proposal updates work
- [ ] Marketplace listing updates work

#### **DELETE Operations**
- [ ] User deletion works
- [ ] Merchant deletion works
- [ ] Virtual card deletion works
- [ ] DAO proposal deletion works
- [ ] Marketplace listing deletion works

### 7. **Performance Testing**
- [ ] Page load times are acceptable
- [ ] Database query performance is good
- [ ] No memory leaks
- [ ] No excessive CPU usage
- [ ] No excessive database connections

### 8. **Security Testing**
- [ ] RLS policies work correctly
- [ ] Users can only access their own data
- [ ] Admins can access admin functions
- [ ] Unauthorized access is blocked
- [ ] SQL injection protection works

### 9. **Error Handling Testing**
- [ ] Database connection errors handled gracefully
- [ ] RPC function errors handled gracefully
- [ ] Network errors handled gracefully
- [ ] User-friendly error messages displayed
- [ ] Error logging works correctly

### 10. **Browser Compatibility Testing**
- [ ] Chrome works correctly
- [ ] Firefox works correctly
- [ ] Safari works correctly
- [ ] Edge works correctly
- [ ] Mobile browsers work correctly

## 🚨 **Common Issues and Solutions**

### Issue 1: "relation does not exist" errors
**Symptoms**: Database queries fail with relation not found
**Solution**: Verify tables exist in public schema
**Check**: Run schema verification queries

### Issue 2: RPC function not found
**Symptoms**: RPC calls fail with function not found
**Solution**: Verify RPC functions exist in public schema
**Check**: Run RPC function verification queries

### Issue 3: Permission denied errors
**Symptoms**: Database operations fail with permission denied
**Solution**: Verify RLS policies are correctly configured
**Check**: Test with different user roles

### Issue 4: Type errors in TypeScript
**Symptoms**: TypeScript compilation errors
**Solution**: Remove unnecessary type assertions, update types
**Check**: Run TypeScript compiler

### Issue 5: Performance issues
**Symptoms**: Slow page loads, slow queries
**Solution**: Check indexes, optimize queries
**Check**: Run performance monitoring

## 📊 **Success Criteria**

The migration is successful when:
- [ ] All tests pass
- [ ] No database errors
- [ ] No application errors
- [ ] All functionality works as expected
- [ ] Performance is maintained or improved
- [ ] Security is maintained
- [ ] User experience is not degraded

## 🔄 **Rollback Plan**

If issues occur:
1. [ ] Stop application
2. [ ] Restore database from backup
3. [ ] Restore code from backup
4. [ ] Restart application
5. [ ] Verify functionality
6. [ ] Document issues
7. [ ] Plan fixes

## 📝 **Testing Documentation**

Document the following:
- [ ] Test results for each component
- [ ] Any issues found and their solutions
- [ ] Performance metrics before and after
- [ ] User feedback
- [ ] Recommendations for future improvements
