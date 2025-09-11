# Health Check Errors Fix Instructions

## Overview
The admin dashboard health tab is showing 3 critical errors that need to be resolved:

1. **DAO System Error**: "Could not find the table 'api.dao_organizations' in the schema cache"
2. **User DAO Access Error**: "Could not find the table 'api.dao_proposals' in the schema cache"  
3. **Merchant Reward Generator Error**: "column loyalty_transactions.transaction_type does not exist"

## Solution

### Method 1: Apply via Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg

2. **Navigate to SQL Editor**

3. **Copy and paste the contents of `fix_health_check_errors.sql`** into the SQL editor

4. **Click "Run"** to execute the script

5. **Refresh the admin dashboard** to verify the health checks are now green

### Method 2: Apply via Command Line

If you have the Supabase CLI set up locally:

```bash
# Apply the migration
npx supabase db push

# Or run the SQL directly
npx supabase db reset --db-url "postgresql://postgres:[password]@db.wndswqvqogeblksrujpg.supabase.co:5432/postgres" < fix_health_check_errors.sql
```

### Method 3: Apply via JavaScript Script

```bash
# Run the Node.js script
node apply_health_check_fix.js
```

## What the Fix Does

The comprehensive fix script (`fix_health_check_errors.sql`) will:

### 1. Create Missing DAO Tables
- **`api.dao_organizations`**: Core DAO organization data
- **`api.dao_proposals`**: DAO governance proposals
- Includes proper indexes, RLS policies, and permissions

### 2. Add Missing Column
- **`transaction_type`** column to `loyalty_transactions` table
- Supports values: 'purchase', 'refund', 'cancellation', 'manual_entry', 'bonus', 'adjustment'
- Defaults to 'purchase' for existing records

### 3. Set Up Security
- Row Level Security (RLS) policies for DAO tables
- Proper permissions for authenticated users
- Admin access controls

### 4. Performance Optimization
- Database indexes for efficient queries
- Optimized table structures

## Verification

After applying the fix, the health checks should show:

- ✅ **DAO System**: "DAO system accessible"
- ✅ **User DAO Access**: "User DAO access working"  
- ✅ **Merchant Reward Generator**: "Manual reward generation ready"

## Troubleshooting

If you encounter issues:

1. **Check Supabase logs** in the dashboard for detailed error messages
2. **Verify permissions** - ensure your user has admin access
3. **Check table existence** using the verification queries in the script
4. **Review RLS policies** if access is still denied

## Files Created

- `fix_health_check_errors.sql` - Main fix script
- `apply_health_check_fix.js` - JavaScript application script
- `HEALTH_CHECK_FIX_INSTRUCTIONS.md` - This instruction file

## Next Steps

After applying the fix:

1. **Test the DAO functionality** in the admin panel
2. **Verify manual reward generation** works correctly
3. **Check that all health checks are green**
4. **Monitor for any new issues** in the health dashboard

The fix is designed to be safe and non-destructive, only adding missing tables and columns without affecting existing data.
