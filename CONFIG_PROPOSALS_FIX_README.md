# Config Proposals DAO Integration Fix

## Issue Description

The config proposals (showing "Proposal Pending DAO Approval" with distribution interval and max rewards) are not appearing in the DAO dashboard due to restrictive Row Level Security (RLS) policies on the `config_proposals` table.

## Root Cause

The `config_proposals` table exists but has RLS policies that prevent the frontend from accessing the data, resulting in "permission denied" errors.

## Solution Implemented

### 1. Frontend Integration ✅
- Updated `DAODashboard.tsx` to load config proposals alongside regular DAO proposals
- Added `loadConfigProposals()` function that transforms config proposals into DAO proposal format
- Enhanced status display to show "Pending DAO Approval" for config proposals
- Added special handling for config proposal statuses and icons

### 2. Database Permissions Fix 🔧
- Created `fix_config_proposals_permissions.sql` with proper RLS policies
- This script needs to be run manually in the Supabase database

## How to Apply the Fix

### Step 1: Run the Database Migration
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_config_proposals_permissions.sql`
4. Click "Run" to execute the script
5. Verify the test query at the end returns results

### Step 2: Verify the Fix
1. Refresh your DAO dashboard
2. Config proposals should now appear in the proposals list
3. They will show as "Pending DAO Approval" with a clock icon
4. The proposals will display the distribution interval and max rewards information

## What the Fix Does

### Frontend Changes
- **Config Proposal Loading**: Automatically loads config proposals from the database
- **Status Mapping**: Maps config proposal statuses to DAO proposal format
- **Visual Integration**: Shows config proposals alongside regular DAO proposals
- **Special Status Display**: Shows "Pending DAO Approval" instead of "draft" for config proposals

### Database Changes
- **Permissive RLS Policies**: Allows anyone to view config proposals (for transparency)
- **Admin Controls**: Admins can create, update, and delete config proposals
- **User Permissions**: Authenticated users can create config proposals
- **Proper Grants**: Grants necessary permissions to all user roles

## Expected Result

After applying the fix:
1. ✅ Config proposals appear in the DAO dashboard
2. ✅ "Proposal Pending DAO Approval" shows with correct styling
3. ✅ Distribution interval and max rewards are displayed
4. ✅ Users can create new config proposals
5. ✅ Admins can manage all config proposals

## Files Modified

- `src/pages/DAODashboard.tsx` - Added config proposal integration
- `src/types/dao.ts` - Extended ProposalStatus type
- `fix_config_proposals_permissions.sql` - Database migration script
- `CONFIG_PROPOSALS_FIX_README.md` - This documentation

## Testing

Run the test script to verify the integration:
```bash
node test_config_proposals_integration.js
```

This will test:
1. Database access to config_proposals table
2. Config proposal transformation
3. Integration with DAO dashboard

## Troubleshooting

If you still see issues after applying the fix:

1. **Permission Errors**: Ensure you ran the SQL script as a database admin
2. **Table Not Found**: Verify the `api.config_proposals` table exists
3. **RLS Issues**: Check that RLS is enabled on the table
4. **Frontend Errors**: Check browser console for any JavaScript errors

## Next Steps

Once the fix is applied:
1. Test creating a new config proposal
2. Verify it appears in the DAO dashboard
3. Test the approval workflow
4. Monitor for any additional issues
