# DAO Setup Instructions

## Problem
The DAO functionality isn't working because the DAO tables don't exist in your Supabase database. The test data is being generated, but it can't be inserted into tables that don't exist.

## Solution

### Step 1: Create DAO Tables
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup-dao-tables.sql`
4. Click **Run** to execute the script

**Note**: This script will drop any existing DAO tables first to avoid conflicts, then create fresh tables with the correct schema.

This will create all the necessary DAO tables:
- `dao_organizations` - DAO organizations
- `dao_members` - DAO members
- `dao_proposals` - DAO proposals
- `dao_votes` - DAO votes

### Step 2: Generate Test Data
After creating the tables, you can generate test data using the Test Data Manager in your application:

1. Go to **Admin Dashboard** → **Test Data** tab
2. Click **"Generate Test Data"** button
3. The system will now create properly structured DAO test data

### Step 3: Test DAO Functionality
Once the test data is generated, you should be able to:

- ✅ View DAO proposals with proper details
- ✅ See tags displayed correctly (not as "unknown")
- ✅ Vote on active proposals (approve, reject, abstain)
- ✅ View proposal details and voting results
- ✅ See proper voting status and timers

## What Was Fixed

The test data generator has been updated to:

1. **Proper Data Structure**: All DAO data now matches the expected TypeScript interfaces
2. **Complete Fields**: Added all required fields like `execution_time`, `voting_status`, `can_vote`, etc.
3. **Voting Functionality**: Added proper voting data structure with `dao_votes` table
4. **Tag Display**: Fixed tag structure to display properly instead of showing as "unknown"
5. **Extended Fields**: Added UI-specific fields like `dao_name`, `proposer_email`, `user_voting_power`

## Troubleshooting

### Error: "column 'created_at' does not exist"
This error occurs when the DAO tables already exist but with a different schema. The updated `setup-dao-tables.sql` script now handles this by:

1. **Dropping existing tables first** to avoid conflicts
2. **Creating fresh tables** with the correct schema
3. **Dropping existing policies** before creating new ones

If you still get this error:
1. Make sure you're running the **updated** `setup-dao-tables.sql` script
2. Check that the script completed successfully (you should see "DAO tables created successfully!" message)
3. If the error persists, manually drop the tables in Supabase SQL Editor:
   ```sql
   DROP TABLE IF EXISTS public.dao_votes CASCADE;
   DROP TABLE IF EXISTS public.dao_proposals CASCADE;
   DROP TABLE IF EXISTS public.dao_members CASCADE;
   DROP TABLE IF EXISTS public.dao_organizations CASCADE;
   ```
   Then run the setup script again.

### Other Issues
If you still have issues after following these steps:

1. **Check Console**: Look for any error messages in the browser console
2. **Verify Tables**: Make sure the DAO tables were created successfully in Supabase
3. **Clear Data**: Try clearing existing test data and regenerating it
4. **Check Permissions**: Ensure the RLS policies are working correctly

## Files Modified

- `src/utils/testDataGenerator.ts` - Fixed data structure and added DAO votes
- `setup-dao-tables.sql` - New file to create DAO tables
- `DAO-SETUP-INSTRUCTIONS.md` - This instruction file