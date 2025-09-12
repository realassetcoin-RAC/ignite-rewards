# Quick DAO Setup - Fix for Test Data Issues

## 🚨 Current Issues
1. **Test data not loading** - The frontend setup button isn't working
2. **Admin dashboard showing "unknown" tags** - TestDataGenerator creating invalid data
3. **Database tables missing** - DAO tables need to be created first

## ✅ Quick Fix Solution

### Step 1: Create DAO Tables (Required First)
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `manual-dao-setup.sql`
4. Click **Run** to execute the script
5. You should see a summary showing:
   - 1 DAO Organization
   - 4 DAO Members  
   - 5 DAO Proposals
   - 6 DAO Votes

### Step 2: Update User IDs (Optional)
After creating the test data, you may want to update the user IDs to match your actual users:

```sql
-- Get your current user ID
SELECT id, email FROM auth.users LIMIT 5;

-- Update the first member to use your user ID (replace with your actual user ID)
UPDATE public.dao_members 
SET user_id = 'YOUR_USER_ID_HERE'
WHERE id = '650e8400-e29b-41d4-a716-446655440001';
```

### Step 3: Test the DAO Functionality
1. Go to your application
2. Navigate to **DAO Voting** page
3. You should now see:
   - **2 Active proposals** (ready for voting)
   - **1 Passed proposal** (with vote results)
   - **1 Rejected proposal** (with vote results)
   - **1 Draft proposal** (not yet active)

## 🔧 What Was Fixed

### 1. Database Tables
- Created all required DAO tables with proper structure
- Added Row Level Security (RLS) policies
- Set up proper foreign key relationships

### 2. Test Data Quality
- Used proper categories: `governance`, `treasury`, `technical`, `community`, `partnership`, `marketing`, `general`
- Used proper voting types: `simple_majority`, `super_majority`, `unanimous`, `weighted`, `quadratic`
- Added all required fields: `full_description`, `participation_rate`, `treasury_impact_amount`, `tags`
- Created realistic vote counts and participation rates

### 3. Admin Dashboard Fix
- Updated TestDataGenerator to use valid categories and voting types
- Added proper field mapping for all proposal fields
- Fixed the "unknown" tag issue

## 🧪 Testing the Setup

### Test 1: View Proposals
- Go to DAO Voting page
- You should see 5 proposals with different statuses
- 2 should be "Active" and available for voting

### Test 2: Vote on Proposals
- Click on an active proposal
- Use Approve/Reject/Abstain buttons
- Your vote should be recorded

### Test 3: View Vote Results
- Check historical proposals (passed/rejected)
- You should see actual vote counts and results

### Test 4: Create New Proposals
- Use the "Create Proposal" functionality
- Proposals should be saved to the database

## 🐛 Troubleshooting

### If you still see "No proposals found":
1. Check browser console for errors
2. Verify the SQL script ran successfully
3. Refresh the page
4. Check that you're signed in

### If voting doesn't work:
1. Make sure you're signed in
2. Check that your user ID is in the dao_members table
3. Verify the proposal is in "active" status

### If you see database errors:
1. Make sure you ran the `manual-dao-setup.sql` script
2. Check that all tables were created
3. Verify RLS policies are in place

## 📊 Test Data Summary

| Component | Count | Details |
|-----------|-------|---------|
| DAO Organizations | 1 | RAC Rewards DAO |
| DAO Members | 4 | 1 admin, 3 regular members |
| DAO Proposals | 5 | 2 active, 1 passed, 1 rejected, 1 draft |
| DAO Votes | 6 | Real votes on historical proposals |

## 🎯 Next Steps

1. **Run the SQL script** to create tables and test data
2. **Test the DAO functionality** by voting on proposals
3. **Create new proposals** to test the full workflow
4. **Update user IDs** if needed to match your actual users

The DAO functionality should now work properly with realistic test data that displays correctly in the UI!
