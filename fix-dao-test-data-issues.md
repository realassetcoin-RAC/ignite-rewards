# Fix DAO Test Data Issues

## Current Status
✅ **DAO tables created successfully** - The `setup-dao-tables.sql` script worked
❌ **Test data insertion failing** - Schema mismatches and missing tables

## Issues Identified

### 1. Schema Mismatches
The test data generator is trying to insert data with fields that don't exist in the database schema.

### 2. Missing Tables
Some tables referenced in the test data generator don't exist:
- `merchants` table doesn't exist
- `marketplace_listings` table doesn't exist

### 3. Supabase Types Not Updated
The DAO tables were created but the Supabase TypeScript types haven't been regenerated, so the client doesn't know about them.

## Solutions Applied

### ✅ Fixed Test Data Generator
I've updated the test data generator to:

1. **Handle missing tables gracefully** - Skip tables that don't exist
2. **Filter data to match schema** - Remove fields that don't exist in the database
3. **Convert data formats** - Transform data to match the actual table schemas
4. **Add proper error handling** - Catch and handle insertion errors

### ✅ Updated Data Mapping
- **Transactions**: Now properly maps to `loyalty_transactions` schema
- **Proposals**: Filters out non-existent fields
- **Votes**: Handles schema mismatches
- **Merchants**: Skips if table doesn't exist

## Next Steps

### Option 1: Regenerate Supabase Types (Recommended)
1. Go to your **Supabase Dashboard**
2. Navigate to **Settings** → **API**
3. Click **"Generate TypeScript types"**
4. Copy the generated types and replace the content in `src/integrations/supabase/types.ts`
5. This will make the DAO tables available to the TypeScript client

### Option 2: Use Direct SQL Insertion
If you prefer to insert data directly via SQL, you can use the `insert-test-data-only.sql` file that contains the raw SQL insertions.

### Option 3: Test with Current Fixes
The updated test data generator should now work better:
1. **DAO data** will be inserted successfully
2. **Transaction data** will be inserted into the correct `loyalty_transactions` table
3. **Missing tables** will be skipped gracefully
4. **Schema mismatches** will be handled properly

## Expected Results After Fixes

When you run the test data generation now, you should see:
- ✅ DAOs inserted successfully
- ✅ Proposals inserted successfully (with filtered data)
- ✅ DAO votes inserted successfully (with filtered data)
- ✅ Transactions inserted successfully (into loyalty_transactions)
- ⚠️ Merchants skipped (table doesn't exist)
- ⚠️ Marketplace listings skipped (table doesn't exist)

## Testing DAO Functionality

After the test data is generated successfully:

1. **Go to the DAO Dashboard** in your application
2. **You should now be able to**:
   - View DAO proposals with proper details
   - See tags displayed correctly
   - Vote on active proposals (approve, reject, abstain)
   - View proposal details and voting results
   - See proper voting status and timers

## Files Modified

- `src/utils/testDataGenerator.ts` - Fixed schema handling and error management
- `fix-dao-test-data-issues.md` - This troubleshooting guide

The DAO functionality should now work properly with the test data!
