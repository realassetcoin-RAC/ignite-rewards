# DAO Test Data Setup

This guide explains how to set up comprehensive test data for the DAO functionality in the RAC Rewards application.

## Overview

The test data includes:
- **1 DAO Organization**: RAC Rewards DAO
- **4 DAO Members**: 1 admin, 3 regular members with different voting powers
- **5 DAO Proposals**: 2 active (for voting), 1 passed, 1 rejected, 1 draft
- **6 DAO Votes**: Real votes on passed and rejected proposals

## Setup Instructions

### Option 1: Using the Setup Script (Recommended)

1. **Make the script executable**:
   ```bash
   chmod +x setup-dao-test-data.sh
   ```

2. **Run the setup script**:
   ```bash
   ./setup-dao-test-data.sh
   ```

### Option 2: Manual Setup

1. **Create the test data**:
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres -f create-dao-test-data.sql
   ```

2. **Update with real user IDs**:
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres -f update-dao-test-data-with-real-users.sql
   ```

## Test Data Details

### DAO Organization
- **Name**: RAC Rewards DAO
- **Token**: RAC
- **Voting Period**: 7 days
- **Quorum**: 10%
- **Super Majority**: 66.67%

### DAO Members
| Role | Tokens | Voting Power | Email |
|------|--------|--------------|-------|
| Admin | 10,000 | 10,000 | admin@rac.com |
| Member 1 | 5,000 | 5,000 | member1@rac.com |
| Member 2 | 3,000 | 3,000 | member2@rac.com |
| Member 3 | 2,000 | 2,000 | member3@rac.com |

### DAO Proposals

#### Active Proposals (Can be voted on)
1. **"Increase Loyalty Point Rewards by 20%"**
   - Status: Active
   - Category: Governance
   - Voting Type: Simple Majority
   - Duration: 7 days

2. **"Add Solana USDC as Payment Option"**
   - Status: Active
   - Category: Technical
   - Voting Type: Simple Majority
   - Duration: 7 days

#### Historical Proposals
3. **"Implement Quadratic Voting for Governance"**
   - Status: Passed
   - Category: Governance
   - Result: 2 Yes, 1 No

4. **"Increase Platform Fees by 50%"**
   - Status: Rejected
   - Category: Treasury
   - Result: 1 Yes, 2 No

5. **"Add NFT Rewards for High-Value Customers"**
   - Status: Draft
   - Category: Rewards
   - Not yet active

## Testing the DAO Functionality

### 1. Viewing Proposals
- Navigate to the DAO section
- You should see 5 proposals with different statuses
- 2 active proposals should be available for voting

### 2. Voting on Proposals
- Click on an active proposal
- Use the Approve/Reject/Abstain buttons
- Votes should be recorded and counted properly

### 3. Viewing Vote Results
- Check the vote counts on proposals
- Historical proposals show actual vote results

### 4. Creating New Proposals
- Use the "Create Proposal" functionality
- Proposals should be saved to the database

### 5. Managing Members
- View DAO member list
- Check voting powers and roles

## Troubleshooting

### If you see "No proposals found"
- Make sure the test data was created successfully
- Check that the database connection is working
- Verify that the DAO tables exist

### If voting doesn't work
- Ensure you're logged in as a user
- Check that the user is a DAO member
- Verify that the proposal is in "active" status

### If you see foreign key errors
- The test data should use real user IDs from your auth.users table
- Run the update script to fix user ID references

## Database Schema

The test data uses these tables:
- `dao_organizations` - DAO configuration
- `dao_members` - Member information and voting power
- `dao_proposals` - Proposal details and status
- `dao_votes` - Individual votes on proposals

## Security

- All tables have Row Level Security (RLS) enabled
- Users can only vote with their own user ID
- All data is properly secured with appropriate policies

## Cleanup

To remove test data:
```sql
DELETE FROM public.dao_votes;
DELETE FROM public.dao_proposals;
DELETE FROM public.dao_members;
DELETE FROM public.dao_organizations;
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database connectivity
3. Ensure all SQL scripts ran successfully
4. Check that user IDs match your auth.users table
