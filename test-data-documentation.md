# 📚 Test Data Documentation for Rewards Application

## 📋 Overview

This document provides comprehensive documentation for the test data created for the rewards application, including user accounts, merchant accounts, NFT types, and testing procedures.

## 🎯 Test Data Purpose

The test data is designed to provide comprehensive coverage of all application features:
- **User Authentication**: Different user roles and permissions
- **NFT Management**: All NFT types with different rarities and properties
- **Loyalty System**: Various point balances and earning ratios
- **Merchant Operations**: All subscription plans and business types
- **Admin Functions**: Full administrative capabilities

---

## 👥 Test Users (10 Users)

### Admin User

**User**: Admin Test User
- **Email**: `admin.test@rewardsapp.com`
- **Password**: `TestAdmin123!`
- **Role**: Admin
- **Access Level**: Full system access
- **Purpose**: Testing admin functions, user management, system configuration

### Regular Users (9 Users)

#### 1. John Smith - Pearl White NFT User
- **Email**: `user1.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Pearl White (Custodial)
- **Point Balance**: 150 points
- **Loyalty Number**: L0000001
- **Earning Ratio**: 1.00% (1 point per $1 spent)
- **Purpose**: Testing basic NFT functionality and standard earning rates

#### 2. Sarah Johnson - Lava Orange NFT User
- **Email**: `user2.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Lava Orange (Custodial)
- **Point Balance**: 300 points
- **Loyalty Number**: L0000002
- **Earning Ratio**: 1.50% (1.5 points per $1 spent)
- **Purpose**: Testing enhanced earning rates for less common NFTs

#### 3. Mike Davis - Pink NFT User
- **Email**: `user3.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Pink (Custodial)
- **Point Balance**: 300 points
- **Loyalty Number**: L0000003
- **Earning Ratio**: 1.50% (1.5 points per $1 spent)
- **Purpose**: Testing another less common NFT type

#### 4. Emily Wilson - Silver NFT User
- **Email**: `user4.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Silver (Custodial)
- **Point Balance**: 500 points
- **Loyalty Number**: L0000004
- **Earning Ratio**: 2.00% (2 points per $1 spent)
- **Purpose**: Testing rare NFT functionality and upgrade capabilities

#### 5. David Brown - Gold NFT User
- **Email**: `user5.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Gold (Custodial)
- **Point Balance**: 750 points
- **Loyalty Number**: L0000005
- **Earning Ratio**: 2.50% (2.5 points per $1 spent)
- **Purpose**: Testing premium NFT features and evolution capabilities

#### 6. Lisa Anderson - Black NFT User
- **Email**: `user6.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Black (Custodial)
- **Point Balance**: 1000 points
- **Loyalty Number**: L0000006
- **Earning Ratio**: 3.00% (3 points per $1 spent)
- **Purpose**: Testing highest tier NFT functionality

#### 7. Robert Taylor - Non-Custodial Pearl White User
- **Email**: `user7.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Pearl White (Non-Custodial)
- **Point Balance**: 200 points
- **Loyalty Number**: L0000007
- **Earning Ratio**: 1.00% (1 point per $1 spent)
- **Purpose**: Testing non-custodial NFT functionality

#### 8. Jennifer Martinez - Non-Custodial Gold User
- **Email**: `user8.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Type**: Gold (Non-Custodial)
- **Point Balance**: 800 points
- **Loyalty Number**: L0000008
- **Earning Ratio**: 2.50% (2.5 points per $1 spent)
- **Purpose**: Testing non-custodial premium NFT features

#### 9. Michael Garcia - Multiple NFTs User
- **Email**: `user9.test@rewardsapp.com`
- **Password**: `TestUser123!`
- **Role**: User
- **NFT Types**: Multiple (for testing portfolio management)
- **Point Balance**: 1200 points
- **Loyalty Number**: L0000009
- **Purpose**: Testing users with multiple NFTs and portfolio features

---

## 🏪 Test Merchants (5 Merchants)

### 1. TechStart Solutions - StartUp Plan
- **Owner**: John Smith (`user1.test@rewardsapp.com`)
- **Business Name**: TechStart Solutions
- **Business Type**: Technology
- **Contact Email**: `merchant1@techstart.com`
- **Phone**: +1-555-0101
- **Address**: 123 Innovation Drive, San Francisco, US
- **Subscription Plan**: StartUp Plan
- **Monthly Price**: $20.00
- **Yearly Price**: $150.00
- **Monthly Points Limit**: 100
- **Monthly Transactions Limit**: 100
- **Features**: Basic loyalty program, email support, basic analytics
- **Purpose**: Testing basic merchant functionality and StartUp plan features

### 2. Cafe Delight - Momentum Plan
- **Owner**: Sarah Johnson (`user2.test@rewardsapp.com`)
- **Business Name**: Cafe Delight
- **Business Type**: Food & Beverage
- **Contact Email**: `merchant2@cafedelight.com`
- **Phone**: +1-555-0102
- **Address**: 456 Main Street, New York, US
- **Subscription Plan**: Momentum Plan
- **Monthly Price**: $50.00
- **Yearly Price**: $500.00
- **Monthly Points Limit**: 300
- **Monthly Transactions Limit**: 300
- **Features**: Advanced loyalty program, priority support, advanced analytics
- **Purpose**: Testing mid-tier merchant functionality and Momentum plan features

### 3. Fashion Forward - Energizer Plan
- **Owner**: Mike Davis (`user3.test@rewardsapp.com`)
- **Business Name**: Fashion Forward
- **Business Type**: Retail
- **Contact Email**: `merchant3@fashionforward.com`
- **Phone**: +1-555-0103
- **Address**: 789 Fashion Avenue, Los Angeles, US
- **Subscription Plan**: Energizer Plan
- **Monthly Price**: $100.00
- **Yearly Price**: $1,000.00
- **Monthly Points Limit**: 600
- **Monthly Transactions Limit**: 600
- **Features**: Premium loyalty program, 24/7 support, real-time analytics
- **Purpose**: Testing premium merchant functionality and Energizer plan features

### 4. Health & Wellness Center - Cloud9 Plan
- **Owner**: Emily Wilson (`user4.test@rewardsapp.com`)
- **Business Name**: Health & Wellness Center
- **Business Type**: Healthcare
- **Contact Email**: `merchant4@healthwell.com`
- **Phone**: +1-555-0104
- **Address**: 321 Wellness Boulevard, Chicago, US
- **Subscription Plan**: Cloud9 Plan
- **Monthly Price**: $250.00
- **Yearly Price**: $2,500.00
- **Monthly Points Limit**: 1,800
- **Monthly Transactions Limit**: 1,800
- **Features**: Enterprise loyalty program, dedicated support, advanced analytics
- **Purpose**: Testing enterprise merchant functionality and Cloud9 plan features

### 5. Luxury Auto Dealership - Super Plan
- **Owner**: David Brown (`user5.test@rewardsapp.com`)
- **Business Name**: Luxury Auto Dealership
- **Business Type**: Automotive
- **Contact Email**: `merchant5@luxuryauto.com`
- **Phone**: +1-555-0105
- **Address**: 654 Premium Drive, Miami, US
- **Subscription Plan**: Super Plan
- **Monthly Price**: $500.00
- **Yearly Price**: $5,000.00
- **Monthly Points Limit**: 4,000
- **Monthly Transactions Limit**: 4,000
- **Features**: Ultimate loyalty program, VIP support, enterprise analytics
- **Purpose**: Testing highest tier merchant functionality and Super plan features

---

## 🎨 NFT Types (12 Types)

### Custodial NFTs (6 Types)

#### 1. Pearl White NFT (Custodial)
- **Rarity**: Common
- **Price**: $100.00 USDT
- **Mint Quantity**: 1,000
- **Earning Ratio**: 1.00% (0.0100)
- **Upgrade Bonus**: 0.00%
- **Evolution Investment**: $0.00
- **Evolution Earnings**: 0.00%
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Basic NFT testing, standard earning rates

#### 2. Lava Orange NFT (Custodial)
- **Rarity**: Less Common
- **Price**: $500.00 USDT
- **Mint Quantity**: 500
- **Earning Ratio**: 1.50% (0.0150)
- **Upgrade Bonus**: 0.00%
- **Evolution Investment**: $0.00
- **Evolution Earnings**: 0.00%
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Enhanced earning rates testing

#### 3. Pink NFT (Custodial)
- **Rarity**: Less Common
- **Price**: $500.00 USDT
- **Mint Quantity**: 500
- **Earning Ratio**: 1.50% (0.0150)
- **Upgrade Bonus**: 0.00%
- **Evolution Investment**: $0.00
- **Evolution Earnings**: 0.00%
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Alternative less common NFT testing

#### 4. Silver NFT (Custodial)
- **Rarity**: Rare
- **Price**: $1,000.00 USDT
- **Mint Quantity**: 250
- **Earning Ratio**: 2.00% (0.0200)
- **Upgrade Bonus**: 0.50% (0.0050)
- **Evolution Investment**: $100.00
- **Evolution Earnings**: 1.00% (0.0100)
- **Upgradeable**: Yes
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Rare NFT testing, upgrade functionality

#### 5. Gold NFT (Custodial)
- **Rarity**: Rare
- **Price**: $1,000.00 USDT
- **Mint Quantity**: 250
- **Earning Ratio**: 2.50% (0.0250)
- **Upgrade Bonus**: 0.75% (0.0075)
- **Evolution Investment**: $150.00
- **Evolution Earnings**: 1.50% (0.0150)
- **Upgradeable**: Yes
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Premium NFT testing, evolution functionality

#### 6. Black NFT (Custodial)
- **Rarity**: Very Rare
- **Price**: $2,500.00 USDT
- **Mint Quantity**: 100
- **Earning Ratio**: 3.00% (0.0300)
- **Upgrade Bonus**: 1.00% (0.0100)
- **Evolution Investment**: $200.00
- **Evolution Earnings**: 2.00% (0.0200)
- **Upgradeable**: Yes
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Highest tier NFT testing, maximum features

### Non-Custodial NFTs (6 Types)

#### 7. Pearl White NFT (Non-Custodial)
- **Rarity**: Common
- **Price**: $0.00 USDT (Free)
- **Mint Quantity**: 1,000
- **Earning Ratio**: 1.00% (0.0100)
- **Upgrade Bonus**: 0.00% (Not available)
- **Evolution Investment**: $0.00
- **Evolution Earnings**: 0.00%
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Non-custodial basic NFT testing

#### 8. Lava Orange NFT (Non-Custodial)
- **Rarity**: Less Common
- **Price**: $0.00 USDT (Free)
- **Mint Quantity**: 500
- **Earning Ratio**: 1.50% (0.0150)
- **Upgrade Bonus**: 0.00% (Not available)
- **Evolution Investment**: $0.00
- **Evolution Earnings**: 0.00%
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Non-custodial enhanced earning testing

#### 9. Pink NFT (Non-Custodial)
- **Rarity**: Less Common
- **Price**: $0.00 USDT (Free)
- **Mint Quantity**: 500
- **Earning Ratio**: 1.50% (0.0150)
- **Upgrade Bonus**: 0.00% (Not available)
- **Evolution Investment**: $0.00
- **Evolution Earnings**: 0.00%
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Non-custodial alternative testing

#### 10. Silver NFT (Non-Custodial)
- **Rarity**: Rare
- **Price**: $0.00 USDT (Free)
- **Mint Quantity**: 250
- **Earning Ratio**: 2.00% (0.0200)
- **Upgrade Bonus**: 0.00% (Not available)
- **Evolution Investment**: $100.00
- **Evolution Earnings**: 1.00% (0.0100)
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Non-custodial rare NFT testing

#### 11. Gold NFT (Non-Custodial)
- **Rarity**: Rare
- **Price**: $0.00 USDT (Free)
- **Mint Quantity**: 250
- **Earning Ratio**: 2.50% (0.0250)
- **Upgrade Bonus**: 0.00% (Not available)
- **Evolution Investment**: $150.00
- **Evolution Earnings**: 1.50% (0.0150)
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Non-custodial premium NFT testing

#### 12. Black NFT (Non-Custodial)
- **Rarity**: Very Rare
- **Price**: $0.00 USDT (Free)
- **Mint Quantity**: 100
- **Earning Ratio**: 3.00% (0.0300)
- **Upgrade Bonus**: 0.00% (Not available)
- **Evolution Investment**: $200.00
- **Evolution Earnings**: 2.00% (0.0200)
- **Upgradeable**: No
- **Evolvable**: Yes
- **Fractional Eligible**: Yes
- **Auto-Staking**: Forever
- **Purpose**: Non-custodial highest tier testing

---

## 💰 Subscription Plans (5 Plans)

### 1. StartUp Plan
- **Plan ID**: `startup-plan`
- **Monthly Price**: $20.00
- **Yearly Price**: $150.00
- **Monthly Points**: 100
- **Monthly Transactions**: 100
- **Trial Days**: 7
- **Features**: Basic loyalty program, email support, basic analytics
- **Target**: Small businesses and startups

### 2. Momentum Plan
- **Plan ID**: `momentum-plan`
- **Monthly Price**: $50.00
- **Yearly Price**: $500.00
- **Monthly Points**: 300
- **Monthly Transactions**: 300
- **Trial Days**: 14
- **Features**: Advanced loyalty program, priority support, advanced analytics
- **Target**: Growing businesses

### 3. Energizer Plan
- **Plan ID**: `energizer-plan`
- **Monthly Price**: $100.00
- **Yearly Price**: $1,000.00
- **Monthly Points**: 600
- **Monthly Transactions**: 600
- **Trial Days**: 21
- **Features**: Premium loyalty program, 24/7 support, real-time analytics
- **Target**: Established businesses
- **Popular**: Yes

### 4. Cloud9 Plan
- **Plan ID**: `cloud9-plan`
- **Monthly Price**: $250.00
- **Yearly Price**: $2,500.00
- **Monthly Points**: 1,800
- **Monthly Transactions**: 1,800
- **Trial Days**: 30
- **Features**: Enterprise loyalty program, dedicated support, advanced analytics
- **Target**: Large businesses

### 5. Super Plan
- **Plan ID**: `super-plan`
- **Monthly Price**: $500.00
- **Yearly Price**: $5,000.00
- **Monthly Points**: 4,000
- **Monthly Transactions**: 4,000
- **Trial Days**: 30
- **Features**: Ultimate loyalty program, VIP support, enterprise analytics
- **Target**: Large enterprises

---

## 🧪 Testing Scenarios

### Authentication Testing
- **Admin Login**: Test full system access
- **User Login**: Test role-based restrictions
- **Invalid Credentials**: Test error handling
- **Session Management**: Test timeout and security

### NFT Management Testing
- **NFT Display**: Verify all types and information
- **NFT Purchase**: Test custodial and non-custodial purchases
- **NFT Upgrades**: Test upgrade functionality (custodial only)
- **NFT Evolution**: Test evolution process and investment
- **NFT Transfers**: Test transfer between users

### Loyalty System Testing
- **Point Earning**: Test different earning ratios
- **Point Redemption**: Test reward redemption
- **Transaction Processing**: Test QR codes and manual entry
- **Point Balances**: Test balance tracking and updates

### Merchant Operations Testing
- **Subscription Features**: Test plan-specific features
- **Transaction Management**: Test transaction creation and history
- **Customer Management**: Test customer database and communication
- **Analytics**: Test reporting and analytics features

### Admin Functions Testing
- **User Management**: Test user administration
- **System Configuration**: Test NFT and plan management
- **Reporting**: Test system reports and exports
- **Security**: Test access controls and permissions

---

## 🔧 Setup Instructions

### 1. Database Setup
```sql
-- Run the comprehensive test data script
\i comprehensive-test-data.sql
```

### 2. Verification
```sql
-- Verify test data creation
SELECT 'Test Users' as category, COUNT(*) as count 
FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
UNION ALL
SELECT 'Merchants', COUNT(*) 
FROM api.merchants WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
);
```

### 3. Test Execution
1. Use the comprehensive testing script (`comprehensive-testing-script.md`)
2. Execute tests systematically by category
3. Document all results and issues
4. Track progress using the provided tracking tables

---

## 📊 Test Data Statistics

- **Total Users**: 10 (1 Admin + 9 Regular Users)
- **Total Merchants**: 5 (All subscription plans covered)
- **Total NFT Types**: 12 (6 Custodial + 6 Non-Custodial)
- **Total Subscription Plans**: 5 (All tiers covered)
- **Total Loyalty Cards**: 9 (One per regular user)
- **Total Point Balances**: 9 (Various amounts for testing)
- **Sample Transactions**: 3 (Different earning ratios)

---

## 🚨 Important Notes

### Security Considerations
- All test passwords are clearly marked as test credentials
- Test data should be isolated from production data
- Clean up test data after testing completion
- Never use test credentials in production

### Data Maintenance
- Test data is designed to be self-contained
- All relationships and constraints are properly maintained
- Test data can be safely deleted without affecting production
- Regular cleanup of test data is recommended

### Testing Best Practices
- Always use the provided test credentials
- Document all test results thoroughly
- Report issues immediately with detailed descriptions
- Maintain test data integrity throughout testing cycles

---

## 📞 Support

For questions about test data or testing procedures:
- **Technical Issues**: Contact development team
- **Test Data Questions**: Refer to this documentation
- **Testing Procedures**: Use the comprehensive testing script
- **Database Issues**: Check SQL scripts and verification queries

---

*This documentation provides complete information about the test data created for comprehensive testing of the rewards application. Keep this document updated as the application evolves.*
