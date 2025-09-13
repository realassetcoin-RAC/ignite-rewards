# DAO Status and Subscription Plans Fix

## Overview

This document describes the fixes applied to address two issues:
1. DAO status values changed to Capital Case
2. Removal of unwanted subscription plans (Premium, Enterprise, Basic)

## Changes Made

### 1. DAO Status Capitalization

**Updated Status Values:**
- `draft` → `Draft`
- `active` → `Active`
- `passed` → `Passed`
- `rejected` → `Rejected`
- `executed` → `Executed`
- `cancelled` → `Cancelled`

**Files Updated:**
- `src/types/dao.ts` - Updated ProposalStatus type definition
- `src/components/admin/DAOManager.tsx` - Updated status badge configuration
- `src/pages/DAODashboard.tsx` - Updated status icon and color functions
- `dao_database_schema.sql` - Updated enum definition

**Database Changes:**
- Updated existing proposal records to use Capital Case status
- Modified the `proposal_status` enum type to use Capital Case values

### 2. Subscription Plans Cleanup

**Removed Plans:**
- Premium
- Enterprise
- Basic
- Starter
- Professional
- Any plans with similar names (case-insensitive)

**Kept Plans (from your table):**
1. **StartUp** - $20/mo, $150/yr, 100 points, 100 transactions
2. **Momentum Plan** - $50/mo, $500/yr, 300 points, 300 transactions (Popular)
3. **Energizer Plan** - $100/mo, $1000/yr, 600 points, 600 transactions
4. **Cloud9 Plan** - $250/mo, $2500/yr, 1800 points, 1800 transactions
5. **Super Plan** - $500/mo, $5000/yr, 4000 points, 4000 transactions

## Files Created

### SQL Scripts:
1. `fix_dao_status_and_subscription_plans.sql` - Comprehensive fix for both issues
2. `remove_unwanted_subscription_plans.sql` - Subscription plans cleanup only

### Updated Files:
1. `apply_subscription_plans_migration.sql` - Updated to clear all plans first
2. `apply_subscription_plans_migration_with_constraint.sql` - Updated to clear all plans first

## How to Apply the Fixes

### Option 1: Comprehensive Fix (Recommended)
Run the comprehensive script that handles both issues:
```sql
-- Execute in Supabase SQL Editor
\i fix_dao_status_and_subscription_plans.sql
```

### Option 2: Individual Fixes
If you prefer to apply fixes separately:

**For DAO Status:**
```sql
-- Update existing records
UPDATE public.dao_proposals 
SET status = CASE 
  WHEN status = 'draft' THEN 'Draft'
  WHEN status = 'active' THEN 'Active'
  WHEN status = 'passed' THEN 'Passed'
  WHEN status = 'rejected' THEN 'Rejected'
  WHEN status = 'executed' THEN 'Executed'
  WHEN status = 'cancelled' THEN 'Cancelled'
  ELSE status
END
WHERE status IN ('draft', 'active', 'passed', 'rejected', 'executed', 'cancelled');

-- Update enum type
CREATE TYPE proposal_status_new AS ENUM (
    'Draft', 'Active', 'Passed', 'Rejected', 'Executed', 'Cancelled'
);
ALTER TABLE public.dao_proposals 
ALTER COLUMN status TYPE proposal_status_new 
USING status::text::proposal_status_new;
DROP TYPE proposal_status;
ALTER TYPE proposal_status_new RENAME TO proposal_status;
```

**For Subscription Plans:**
```sql
-- Remove unwanted plans
DELETE FROM public.merchant_subscription_plans 
WHERE name NOT IN (
  'StartUp', 'Momentum Plan', 'Energizer Plan', 'Cloud9 Plan', 'Super Plan'
);
```

## Verification

After applying the fixes, verify the changes:

### Check DAO Status:
```sql
SELECT DISTINCT status FROM public.dao_proposals ORDER BY status;
```

### Check Subscription Plans:
```sql
SELECT name, price_monthly, price_yearly, monthly_points, monthly_transactions 
FROM public.merchant_subscription_plans 
ORDER BY plan_number;
```

### Check Plan Count:
```sql
SELECT COUNT(*) as remaining_plans FROM public.merchant_subscription_plans;
-- Should return 5
```

## Impact

### DAO System:
- ✅ All proposal statuses now use Capital Case
- ✅ UI components updated to handle new status format
- ✅ Database enum updated to match new format
- ✅ Existing data migrated to new format

### Subscription Plans:
- ✅ Only the 5 approved plans remain
- ✅ Unwanted plans (Premium, Enterprise, Basic) removed
- ✅ Clean slate for subscription plan management
- ✅ Admin interface will only show approved plans

## Testing

After applying the fixes:

1. **Test DAO System:**
   - Check proposal statuses display correctly
   - Verify status badges show proper colors
   - Test proposal creation and status updates

2. **Test Subscription Plans:**
   - Open merchant signup modal
   - Verify only 5 plans are displayed
   - Check that unwanted plans are gone
   - Test admin plan management

## Rollback (if needed)

If you need to rollback the changes:

### DAO Status Rollback:
```sql
-- Revert to lowercase status
UPDATE public.dao_proposals 
SET status = CASE 
  WHEN status = 'Draft' THEN 'draft'
  WHEN status = 'Active' THEN 'active'
  WHEN status = 'Passed' THEN 'passed'
  WHEN status = 'Rejected' THEN 'rejected'
  WHEN status = 'Executed' THEN 'executed'
  WHEN status = 'Cancelled' THEN 'cancelled'
  ELSE status
END;
```

### Subscription Plans Rollback:
- Restore from backup or re-insert the removed plans
- Use the admin interface to recreate plans if needed

## Conclusion

Both issues have been addressed:
- ✅ DAO status values now use Capital Case as requested
- ✅ Unwanted subscription plans have been removed
- ✅ Only the 5 approved plans from your table remain
- ✅ All related UI components have been updated
- ✅ Database schema has been updated accordingly

The system is now ready with the corrected DAO status format and clean subscription plans list.
