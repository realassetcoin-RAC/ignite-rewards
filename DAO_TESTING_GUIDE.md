# DAO Governance System Testing Guide

## Overview
This guide provides comprehensive testing procedures for the DAO (Decentralized Autonomous Organization) governance system in the RAC Rewards application.

## DAO System Components

### 1. DAO Organizations
- **RAC Rewards DAO**: Main governance organization
- **Governance Token**: RAC tokens for voting power
- **Voting Parameters**: 7-day voting period, 10% quorum, 66.67% super majority

### 2. DAO Members
- **Admin Members**: Full governance rights and proposal creation
- **Regular Members**: Voting rights based on token holdings
- **Voting Power**: Calculated from governance token holdings

### 3. DAO Proposals
- **Categories**: governance, treasury, technical, community, partnership, marketing, rewards
- **Voting Types**: simple_majority, super_majority, unanimous, weighted, quadratic
- **Statuses**: draft, active, passed, rejected, executed, expired

### 4. DAO Votes
- **Choices**: yes, no, abstain
- **Voting Power**: Based on member's governance tokens
- **Reasons**: Optional explanation for vote choice

## Test Data Setup

### DAO Organization
```sql
-- RAC Rewards DAO
- ID: 550e8400-e29b-41d4-a716-446655440000
- Name: RAC Rewards DAO
- Token: RAC (9 decimals)
- Voting Period: 7 days
- Quorum: 10%
- Super Majority: 66.67%
```

### Test Members
```sql
-- Admin Member
- User ID: admin@igniterewards.com
- Role: admin
- Governance Tokens: 10,000
- Voting Power: 10,000

-- Regular Members
- Member 1: 5,000 tokens, 5,000 voting power
- Member 2: 3,000 tokens, 3,000 voting power
- Member 3: 2,000 tokens, 2,000 voting power
```

### Test Proposals

#### 1. Active Proposal: "Increase Loyalty Point Rewards by 20%"
- **Status**: Active (voting open)
- **Category**: governance
- **Voting Type**: simple_majority
- **Description**: Increase loyalty point multiplier from 1x to 1.2x
- **End Time**: 5 days from now
- **Current Votes**: 0

#### 2. Active Proposal: "Add Solana USDC as Payment Option"
- **Status**: Active (voting open)
- **Category**: technical
- **Voting Type**: simple_majority
- **Description**: Enable USDC payments on Solana blockchain
- **End Time**: 6 days from now
- **Current Votes**: 0

#### 3. Passed Proposal: "Implement Quadratic Voting for Governance"
- **Status**: Passed
- **Category**: governance
- **Voting Type**: super_majority
- **Description**: Change to quadratic voting mechanism
- **Final Results**: 3 votes (2 yes, 1 no) - 75% participation
- **Outcome**: Passed with 66.67% yes votes

#### 4. Draft Proposal: "Add NFT Rewards for High-Value Customers"
- **Status**: Draft
- **Category**: rewards
- **Voting Type**: simple_majority
- **Description**: Create NFT rewards for high loyalty point customers
- **Status**: Not yet submitted for voting

## Browser MCP Testing Procedures

### Test 1: DAO Dashboard Access
```javascript
// Navigate to admin panel
await browser.navigate('http://localhost:8086/admin');

// Click DAO button
await browser.click('DAO button');

// Verify DAO dashboard loads
await browser.snapshot();
// Expected: DAO governance interface with proposals list
```

### Test 2: View Active Proposals
```javascript
// In DAO dashboard, verify active proposals are displayed
await browser.snapshot();
// Expected: 
// - "Increase Loyalty Point Rewards by 20%" (Active)
// - "Add Solana USDC as Payment Option" (Active)
// - Voting status and end times visible
```

### Test 3: Create New Proposal
```javascript
// Click "Create Proposal" button
await browser.click('Create Proposal button');

// Fill proposal form
await browser.type('proposal title field', 'Test Proposal: Update Merchant Fees');
await browser.type('proposal description field', 'This is a test proposal to update merchant transaction fees from 2% to 2.5% to fund platform development.');

// Select category
await browser.select('category dropdown', 'treasury');

// Select voting type
await browser.select('voting type dropdown', 'simple_majority');

// Submit proposal
await browser.click('Submit Proposal button');

// Verify proposal created
await browser.snapshot();
// Expected: Success message and proposal appears in list
```

### Test 4: Vote on Active Proposal
```javascript
// Click on "Increase Loyalty Point Rewards by 20%" proposal
await browser.click('Increase Loyalty Point Rewards by 20%');

// Verify proposal details page
await browser.snapshot();
// Expected: Full proposal details, voting options, current vote count

// Cast a vote
await browser.click('Yes button');

// Add voting reason (optional)
await browser.type('voting reason field', 'This will increase user engagement and platform adoption.');

// Submit vote
await browser.click('Submit Vote button');

// Verify vote recorded
await browser.snapshot();
// Expected: Vote confirmation, updated vote count
```

### Test 5: View Proposal Results
```javascript
// Navigate to "Implement Quadratic Voting for Governance" proposal
await browser.click('Implement Quadratic Voting for Governance');

// Verify proposal results
await browser.snapshot();
// Expected:
// - Status: Passed
// - Final Results: 3 votes (2 yes, 1 no)
// - Participation Rate: 75%
// - Execution status
```

### Test 6: DAO Member Management
```javascript
// In DAO dashboard, click "Members" tab
await browser.click('Members tab');

// Verify member list
await browser.snapshot();
// Expected:
// - Admin member with 10,000 tokens
// - Regular members with varying token amounts
// - Voting power calculations
// - Member roles and status
```

### Test 7: DAO Analytics
```javascript
// Click "Analytics" tab in DAO dashboard
await browser.click('Analytics tab');

// Verify DAO statistics
await browser.snapshot();
// Expected:
// - Total proposals count
// - Voting participation rates
// - Proposal success rates
// - Member activity metrics
```

## Expected Test Results

### ✅ Successful Test Outcomes
1. **DAO Dashboard**: Loads with all governance features
2. **Proposal Creation**: New proposals can be created and submitted
3. **Voting System**: Users can vote on active proposals
4. **Results Display**: Proposal results show accurate vote counts
5. **Member Management**: Member list shows correct token holdings
6. **Analytics**: DAO statistics display correctly

### ⚠️ Potential Issues to Monitor
1. **Voting Power Calculation**: Ensure voting power matches token holdings
2. **Proposal Status Updates**: Verify status changes from active to passed/rejected
3. **Vote Counting**: Confirm vote tallies are accurate
4. **Permission Checks**: Ensure only eligible members can vote
5. **Time-based Logic**: Verify voting periods and execution delays

## Mock Data Verification

### Database Tables
- `dao_organizations`: 1 organization (RAC Rewards DAO)
- `dao_members`: 4 members (1 admin, 3 regular)
- `dao_proposals`: 4 proposals (2 active, 1 passed, 1 draft)
- `dao_votes`: 3 votes (for the passed proposal)

### Key Test Scenarios
1. **Admin Access**: Admin can create proposals and manage DAO
2. **Member Voting**: Members can vote based on their token holdings
3. **Proposal Lifecycle**: Draft → Active → Passed/Rejected → Executed
4. **Vote Aggregation**: Vote counts update correctly
5. **Governance Rules**: Quorum and majority thresholds work properly

## Performance Benchmarks
- **DAO Dashboard Load**: < 3 seconds
- **Proposal Creation**: < 2 seconds
- **Vote Submission**: < 1 second
- **Results Calculation**: < 1 second

## Security Considerations
- **Authentication**: Only authenticated users can access DAO
- **Authorization**: Voting power based on verified token holdings
- **Data Integrity**: Vote counts cannot be manipulated
- **Audit Trail**: All votes and proposals are logged

## Troubleshooting

### Common Issues
1. **DAO Button Not Visible**: Check admin authentication
2. **Proposals Not Loading**: Verify database connection
3. **Voting Failed**: Check user permissions and token holdings
4. **Results Not Updating**: Verify vote aggregation logic

### Debug Steps
1. Check browser console for errors
2. Verify database table contents
3. Confirm user authentication status
4. Validate proposal and vote data

This comprehensive testing guide ensures the DAO governance system functions correctly and provides a robust foundation for decentralized decision-making in the RAC Rewards platform.
