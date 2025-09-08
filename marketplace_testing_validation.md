# Marketplace Testing and Validation Guide

## Overview

This document provides comprehensive testing procedures for the Tokenized Asset and Initiative Marketplace feature. The testing covers all functional requirements, edge cases, and integration points.

## Test Environment Setup

### Prerequisites
1. Database migration applied (`marketplace_database_schema.sql`)
2. Frontend components deployed
3. Admin panel accessible
4. DAO system functional
5. NFT card system operational

### Test Data Setup
```sql
-- Insert test NFT tiers
INSERT INTO public.nft_card_tiers (tier_name, display_name, description, investment_multiplier, can_access_premium_listings, can_access_early_listings) VALUES
('test_standard', 'Test Standard', 'Test standard tier', 1.00, false, false),
('test_premium', 'Test Premium', 'Test premium tier', 1.25, true, false),
('test_vip', 'Test VIP', 'Test VIP tier', 1.50, true, true);

-- Insert test marketplace listings
INSERT INTO public.marketplace_listings (title, description, listing_type, total_funding_goal, token_price, expected_return_rate, risk_level, minimum_investment, status, created_by) VALUES
('Test Real Estate', 'Test real estate investment', 'asset', 1000000, 100, 12.5, 'medium', 1000, 'active', 'test_admin_id'),
('Test Startup', 'Test startup equity', 'initiative', 500000, 50, 25.0, 'high', 500, 'active', 'test_admin_id');
```

## Functional Testing

### 1. User Interface Testing

#### 1.1 Marketplace Main Interface
- [ ] **Test Case**: Load marketplace page
  - **Steps**: Navigate to user dashboard → Marketplace tab
  - **Expected**: Page loads with listings, filters, and stats
  - **Validation**: No console errors, all components render

- [ ] **Test Case**: View marketplace listings
  - **Steps**: Browse available listings
  - **Expected**: Listings display with correct information (title, description, funding progress, etc.)
  - **Validation**: All listing data is accurate and formatted correctly

- [ ] **Test Case**: Filter listings
  - **Steps**: Use filter options (type, risk level, amount range)
  - **Expected**: Listings filter correctly based on criteria
  - **Validation**: Only matching listings are displayed

- [ ] **Test Case**: Sort listings
  - **Steps**: Change sort options (newest, return rate, funding amount)
  - **Expected**: Listings reorder according to sort criteria
  - **Validation**: Sort order is correct and persistent

#### 1.2 Investment Modal
- [ ] **Test Case**: Open investment modal
  - **Steps**: Click "Invest Now" on a listing
  - **Expected**: Modal opens with listing details and investment form
  - **Validation**: All fields are populated correctly

- [ ] **Test Case**: Enter investment amount
  - **Steps**: Enter various amounts (valid and invalid)
  - **Expected**: Validation works correctly, error messages appear for invalid amounts
  - **Validation**: Only valid amounts are accepted

- [ ] **Test Case**: NFT multiplier display
  - **Steps**: Open investment modal with NFT card
  - **Expected**: Multiplier is displayed and calculated correctly
  - **Validation**: Effective investment amount reflects multiplier

### 2. Admin Interface Testing

#### 2.1 Marketplace Management
- [ ] **Test Case**: Access marketplace manager
  - **Steps**: Navigate to admin panel → Marketplace tab
  - **Expected**: Admin interface loads with all management options
  - **Validation**: All tabs and functions are accessible

- [ ] **Test Case**: Create new listing
  - **Steps**: Fill out listing creation form
  - **Expected**: Listing is created as draft, DAO proposal is generated
  - **Validation**: Listing appears in admin interface with draft status

- [ ] **Test Case**: Edit existing listing
  - **Steps**: Modify listing details
  - **Expected**: Changes are saved and reflected in interface
  - **Validation**: Updated information is displayed correctly

- [ ] **Test Case**: Delete listing
  - **Steps**: Delete a test listing
  - **Expected**: Listing is removed from interface
  - **Validation**: Listing no longer appears in listings

#### 2.2 NFT Tier Management
- [ ] **Test Case**: View NFT tiers
  - **Steps**: Navigate to NFT Tiers tab
  - **Expected**: All tiers are displayed with correct information
  - **Validation**: Multipliers and permissions are accurate

- [ ] **Test Case**: Edit NFT tier
  - **Steps**: Modify tier settings
  - **Expected**: Changes are saved and applied
  - **Validation**: Updated settings are reflected in user interface

### 3. DAO Integration Testing

#### 3.1 DAO Proposal Creation
- [ ] **Test Case**: Create listing approval proposal
  - **Steps**: Create new marketplace listing
  - **Expected**: DAO proposal is automatically created
  - **Validation**: Proposal appears in DAO dashboard

- [ ] **Test Case**: Create config change proposal
  - **Steps**: Modify marketplace settings
  - **Expected**: DAO proposal is created for configuration changes
  - **Validation**: Proposal includes all relevant changes

#### 3.2 DAO Voting Process
- [ ] **Test Case**: Vote on proposal
  - **Steps**: Cast vote on marketplace proposal
  - **Expected**: Vote is recorded and counted
  - **Validation**: Vote appears in proposal results

- [ ] **Test Case**: Proposal approval
  - **Steps**: Approve a marketplace proposal
  - **Expected**: Changes are implemented automatically
  - **Validation**: Approved changes take effect in marketplace

### 4. NFT Card Integration Testing

#### 4.1 NFT Status Checking
- [ ] **Test Case**: Check user NFT status
  - **Steps**: Load user with NFT card
  - **Expected**: NFT status is correctly identified
  - **Validation**: Multiplier and permissions are accurate

- [ ] **Test Case**: Investment with NFT multiplier
  - **Steps**: Make investment with NFT card
  - **Expected**: Effective investment amount includes multiplier
  - **Validation**: Token calculation reflects multiplier

#### 4.2 Access Control
- [ ] **Test Case**: Premium listing access
  - **Steps**: Try to access premium listing without premium NFT
  - **Expected**: Access is denied with appropriate message
  - **Validation**: Error message is clear and helpful

- [ ] **Test Case**: Early access listing
  - **Steps**: Try to access early access listing without VIP NFT
  - **Expected**: Access is denied
  - **Validation**: User is informed about early access requirement

### 5. Database Testing

#### 5.1 Data Integrity
- [ ] **Test Case**: Investment recording
  - **Steps**: Make an investment
  - **Expected**: Investment is recorded in database with correct details
  - **Validation**: All fields are populated accurately

- [ ] **Test Case**: Funding progress update
  - **Steps**: Make multiple investments
  - **Expected**: Listing funding progress updates correctly
  - **Validation**: Progress percentage and amounts are accurate

- [ ] **Test Case**: Passive income distribution
  - **Steps**: Create and process passive income distribution
  - **Expected**: Earnings are calculated and distributed correctly
  - **Validation**: User earnings reflect their token share

#### 5.2 Data Relationships
- [ ] **Test Case**: User investment history
  - **Steps**: View user's investment history
  - **Expected**: All investments are displayed with correct details
  - **Validation**: Relationships between tables are maintained

- [ ] **Test Case**: Listing investor list
  - **Steps**: View listing's investor list
  - **Expected**: All investors are listed with their investment amounts
  - **Validation**: Data is consistent across related tables

## Edge Case Testing

### 1. Boundary Conditions
- [ ] **Test Case**: Minimum investment amount
  - **Steps**: Try to invest exactly the minimum amount
  - **Expected**: Investment is accepted
  - **Validation**: No validation errors

- [ ] **Test Case**: Maximum investment amount
  - **Steps**: Try to invest the maximum allowed amount
  - **Expected**: Investment is accepted
  - **Validation**: Amount is processed correctly

- [ ] **Test Case**: Investment exceeding funding goal
  - **Steps**: Try to invest more than remaining funding
  - **Expected**: Investment is rejected with appropriate error
  - **Validation**: Error message is clear

### 2. Time-Based Scenarios
- [ ] **Test Case**: Expired time-bound campaign
  - **Steps**: Try to invest in expired campaign
  - **Expected**: Investment is rejected
  - **Validation**: Campaign status is correctly identified

- [ ] **Test Case**: Campaign ending soon
  - **Steps**: Invest in campaign with little time remaining
  - **Expected**: Investment is processed normally
  - **Validation**: Time calculations are accurate

### 3. Concurrent Operations
- [ ] **Test Case**: Simultaneous investments
  - **Steps**: Make multiple investments simultaneously
  - **Expected**: All investments are processed correctly
  - **Validation**: No data corruption or race conditions

- [ ] **Test Case**: Funding goal reached during investment
  - **Steps**: Make investment that would exceed funding goal
  - **Expected**: Investment is rejected or adjusted
  - **Validation**: Funding goal is respected

## Performance Testing

### 1. Load Testing
- [ ] **Test Case**: Large number of listings
  - **Steps**: Load marketplace with 100+ listings
  - **Expected**: Page loads within acceptable time
  - **Validation**: Performance is maintained

- [ ] **Test Case**: Complex filtering
  - **Steps**: Apply multiple filters simultaneously
  - **Expected**: Results are returned quickly
  - **Validation**: No performance degradation

### 2. Stress Testing
- [ ] **Test Case**: High investment volume
  - **Steps**: Process many investments rapidly
  - **Expected**: System handles load gracefully
  - **Validation**: No errors or timeouts

## Security Testing

### 1. Access Control
- [ ] **Test Case**: Unauthorized admin access
  - **Steps**: Try to access admin functions without admin role
  - **Expected**: Access is denied
  - **Validation**: Proper authentication is enforced

- [ ] **Test Case**: User data isolation
  - **Steps**: Try to access another user's investment data
  - **Expected**: Access is denied
  - **Validation**: Data is properly isolated

### 2. Input Validation
- [ ] **Test Case**: Malicious input
  - **Steps**: Enter malicious data in forms
  - **Expected**: Input is sanitized or rejected
  - **Validation**: No security vulnerabilities

## Integration Testing

### 1. Solana Contract Integration
- [ ] **Test Case**: Contract deployment
  - **Steps**: Deploy marketplace smart contract
  - **Expected**: Contract deploys successfully
  - **Validation**: All functions are accessible

- [ ] **Test Case**: Investment on-chain
  - **Steps**: Make investment through smart contract
  - **Expected**: Investment is recorded on blockchain
  - **Validation**: On-chain data matches frontend

### 2. External API Integration
- [ ] **Test Case**: Third-party data feeds
  - **Steps**: Load real-time asset data
  - **Expected**: Data is fetched and displayed correctly
  - **Validation**: Data is accurate and up-to-date

## User Acceptance Testing

### 1. User Journey Testing
- [ ] **Test Case**: Complete investment flow
  - **Steps**: Browse → Filter → Select → Invest → Confirm
  - **Expected**: Smooth user experience throughout
  - **Validation**: All steps work as expected

- [ ] **Test Case**: Admin management flow
  - **Steps**: Create → Configure → Approve → Monitor
  - **Expected**: Admin can manage marketplace effectively
  - **Validation**: All admin functions work correctly

### 2. Error Handling
- [ ] **Test Case**: Network errors
  - **Steps**: Simulate network failures during operations
  - **Expected**: Appropriate error messages and recovery options
  - **Validation**: User experience is not compromised

- [ ] **Test Case**: Invalid data
  - **Steps**: Submit forms with invalid data
  - **Expected**: Clear error messages and guidance
  - **Validation**: User can correct errors easily

## Test Automation

### 1. Unit Tests
```typescript
// Example test structure
describe('Marketplace Utils', () => {
  test('calculateFundingProgress', () => {
    expect(calculateFundingProgress(500000, 1000000)).toBe(50);
  });
  
  test('validateInvestmentAmount', () => {
    const listing = { minimum_investment: 1000, total_funding_goal: 1000000, current_funding_amount: 500000 };
    expect(validateInvestmentAmount(500, listing, 10000).isValid).toBe(false);
  });
});
```

### 2. Integration Tests
```typescript
describe('Marketplace API', () => {
  test('create listing', async () => {
    const response = await createListing(testListingData);
    expect(response.success).toBe(true);
  });
  
  test('make investment', async () => {
    const response = await makeInvestment(testInvestmentData);
    expect(response.success).toBe(true);
  });
});
```

## Test Data Cleanup

After testing, clean up test data:
```sql
-- Remove test data
DELETE FROM public.marketplace_investments WHERE listing_id IN (SELECT id FROM public.marketplace_listings WHERE title LIKE 'Test%');
DELETE FROM public.marketplace_listings WHERE title LIKE 'Test%';
DELETE FROM public.nft_card_tiers WHERE tier_name LIKE 'test_%';
```

## Reporting

### Test Results Template
- **Test Suite**: [Name]
- **Date**: [Date]
- **Tester**: [Name]
- **Environment**: [Environment]
- **Results**: Pass/Fail/Blocked
- **Issues Found**: [List of issues]
- **Recommendations**: [Improvement suggestions]

### Issue Tracking
- **Severity**: Critical/High/Medium/Low
- **Priority**: P1/P2/P3/P4
- **Status**: Open/In Progress/Resolved/Closed
- **Assignee**: [Developer]
- **Due Date**: [Date]

## Conclusion

This comprehensive testing guide ensures that the Tokenized Asset and Initiative Marketplace feature meets all functional requirements and provides a robust, secure, and user-friendly experience. Regular testing should be performed to maintain quality and catch any regressions.
