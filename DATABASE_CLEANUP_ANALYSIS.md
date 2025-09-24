# Database Cleanup Analysis for RAC Rewards

## 🔍 Analysis Summary

After analyzing the database structure, I've identified several areas that can be cleaned up to improve performance and reduce complexity.

## 📊 Current Database Structure

### Core Tables (Keep - Essential)
- `public.merchant_subscription_plans` - Core business functionality
- `public.user_referrals` - Referral system
- `public.virtual_cards` - Virtual card system
- `public.merchants` - Merchant management
- `public.profiles` - User profiles
- `public.user_wallets` - Solana wallet integration
- `public.referral_campaigns` - Campaign management

### DAO Tables (Consider for Cleanup)
- `public.dao_organizations` - DAO functionality
- `public.dao_members` - DAO member management
- `public.dao_proposals` - DAO proposal system
- `public.dao_votes` - DAO voting system

### Test Data Functions (Remove - Not needed in production)
- `public.create_dao_test_data()` - Test data generation
- `public.create_comprehensive_test_data()` - Comprehensive test data
- `public.update_test_data_with_real_users()` - Test data updates

## 🧹 Cleanup Opportunities

### 1. Test Data Cleanup
**Issue**: Multiple test data entries with `test_` prefix
**Impact**: Unnecessary storage usage
**Solution**: Remove all test data entries

### 2. Unused Functions
**Issue**: Test data generation functions in production
**Impact**: Security risk and code bloat
**Solution**: Remove test functions

### 3. Duplicate Schema Issues
**Issue**: Tables exist in both `public` and `api` schemas
**Impact**: Confusion and potential conflicts
**Solution**: Consolidate to single schema

### 4. Unused Indexes
**Issue**: Some indexes may not be used
**Impact**: Storage overhead
**Solution**: Remove unused indexes

### 5. Unused Permissions
**Issue**: Excessive permissions on DAO tables
**Impact**: Security risk
**Solution**: Revoke unnecessary permissions

## 📋 Recommended Actions

### Immediate (Safe)
1. ✅ Remove test data entries
2. ✅ Remove test data generation functions
3. ✅ Add performance indexes
4. ✅ Vacuum and analyze tables

### Medium Priority
1. 🔄 Consolidate schema (public vs api)
2. 🔄 Review and remove unused indexes
3. 🔄 Clean up duplicate RLS policies

### Low Priority
1. 📝 Review DAO functionality usage
2. 📝 Consider removing DAO tables if not used
3. 📝 Optimize remaining table structures

## 🚨 Safety Considerations

### Before Running Cleanup
1. **Backup Database**: Always backup before cleanup
2. **Test Environment**: Run cleanup in test environment first
3. **Verify Dependencies**: Check if any code depends on removed items
4. **Monitor Performance**: Watch for any performance impacts

### Safe Operations
- ✅ Removing test data
- ✅ Removing test functions
- ✅ Adding indexes
- ✅ Vacuum operations

### Risky Operations
- ⚠️ Removing tables
- ⚠️ Changing schema structure
- ⚠️ Removing RLS policies
- ⚠️ Changing permissions

## 📈 Expected Benefits

### Performance Improvements
- Reduced storage usage
- Faster queries (better indexes)
- Optimized table statistics

### Security Improvements
- Reduced attack surface
- Cleaner permission structure
- No test data exposure

### Maintenance Benefits
- Cleaner codebase
- Easier debugging
- Reduced complexity

## 🛠️ Implementation

### Step 1: Run Safe Cleanup
```sql
-- Execute safe_database_cleanup.sql
```

### Step 2: Verify Results
```sql
-- Run verification queries
-- Check table sizes
-- Verify no test data remains
```

### Step 3: Monitor
- Monitor application performance
- Check for any errors
- Verify all functionality works

## 📝 Files Created

1. `database_cleanup_script.sql` - Comprehensive cleanup (use with caution)
2. `safe_database_cleanup.sql` - Safe cleanup operations only
3. `DATABASE_CLEANUP_ANALYSIS.md` - This analysis document

## 🎯 Next Steps

1. Review this analysis with your team
2. Decide which cleanup operations to perform
3. Backup your database
4. Run the safe cleanup script first
5. Monitor results and plan further cleanup if needed

## ⚠️ Important Notes

- Always backup before cleanup
- Test in development environment first
- Some operations may require application code updates
- Monitor for any breaking changes
- Consider the impact on existing functionality
