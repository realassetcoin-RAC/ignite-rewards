# Step-by-Step Health Check Fix Instructions

## Problem
You're getting a connection timeout error when trying to run the large SQL script. This is because the script is too complex to run all at once.

## Solution
I've broken down the fix into 4 smaller, manageable parts that you can run separately.

## Step-by-Step Instructions

### Step 1: Fix DAO Organizations Table
1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg/sql
2. Copy and paste the contents of `fix_health_check_errors_part1.sql`
3. Click **"Run"**
4. Wait for it to complete successfully

### Step 2: Fix DAO Proposals Table
1. In the same SQL Editor, copy and paste the contents of `fix_health_check_errors_part2.sql`
2. Click **"Run"**
3. Wait for it to complete successfully

### Step 3: Fix Transaction Type Column
1. In the same SQL Editor, copy and paste the contents of `fix_health_check_errors_part3.sql`
2. Click **"Run"**
3. Wait for it to complete successfully

### Step 4: Verify the Fixes
1. In the same SQL Editor, copy and paste the contents of `fix_health_check_errors_part4.sql`
2. Click **"Run"**
3. Check the output in the "Results" tab - you should see green checkmarks (✅)

### Step 5: Test the Health Checks
1. Go back to your admin dashboard
2. Navigate to the Health tab
3. Refresh the page
4. All three health checks should now show green (✅) status

## What Each Part Does

### Part 1: DAO Organizations
- Creates the `api.dao_organizations` table
- Sets up security policies
- Adds sample data
- **Fixes**: "Could not find the table 'api.dao_organizations' in the schema cache"

### Part 2: DAO Proposals  
- Creates the `api.dao_proposals` table
- Sets up security policies and indexes
- **Fixes**: "Could not find the table 'api.dao_proposals' in the schema cache"

### Part 3: Transaction Type Column
- Fixes the `loyalty_transactions` table structure conflicts
- Adds `transaction_type` column to `public.loyalty_transactions` table
- Creates a view in `api` schema for compatibility
- Supports manual entry types
- **Fixes**: "column loyalty_transactions.transaction_type does not exist"

### Part 4: Verification
- Checks that all tables and columns exist
- Provides confirmation that fixes are working

## Expected Results

After completing all 4 steps, your health dashboard should show:

- ✅ **DAO System**: "DAO system accessible"
- ✅ **User DAO Access**: "User DAO access working"  
- ✅ **Merchant Reward Generator**: "Manual reward generation ready"

## Troubleshooting

If you encounter any errors:

1. **Check the error message** in the SQL Editor results
2. **Make sure you're running the parts in order** (1, 2, 3, 4)
3. **Wait for each part to complete** before moving to the next
4. **Check the verification output** in Part 4 for any remaining issues

## Files Created

- `fix_health_check_errors_part1.sql` - DAO Organizations table
- `fix_health_check_errors_part2.sql` - DAO Proposals table  
- `fix_health_check_errors_part3.sql` - Transaction type column
- `fix_health_check_errors_part4.sql` - Verification queries
- `STEP_BY_STEP_FIX_INSTRUCTIONS.md` - This instruction file

The step-by-step approach should resolve the timeout issues and successfully fix all three health check errors.
