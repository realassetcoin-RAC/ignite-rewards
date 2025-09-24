# 🧪 Testing Guide for Rewards Application

## 📋 Quick Start

This guide provides everything you need to set up and execute comprehensive testing for the rewards application.

## 📁 Files Overview

### 1. `comprehensive-test-data.sql`
- **Purpose**: Creates all test data for the application
- **Contains**: 10 test users, 5 test merchants, 12 NFT types, sample transactions
- **Usage**: Run this script in your Supabase SQL editor

### 2. `comprehensive-testing-script.md`
- **Purpose**: Detailed testing procedures for all application features
- **Contains**: 47 test cases across 10 categories
- **Usage**: Follow the step-by-step testing procedures

### 3. `test-data-documentation.md`
- **Purpose**: Complete documentation of all test data
- **Contains**: User credentials, merchant details, NFT specifications
- **Usage**: Reference for understanding test data structure

## 🚀 Setup Instructions

### Step 1: Create Test Data
```sql
-- Copy and paste the entire content of comprehensive-test-data.sql
-- into your Supabase SQL editor and execute
```

### Step 2: Verify Setup
```sql
-- Run this verification query
SELECT 'Test Users' as category, COUNT(*) as count 
FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
UNION ALL
SELECT 'Merchants', COUNT(*) 
FROM api.merchants WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
)
UNION ALL
SELECT 'NFT Types', COUNT(*) 
FROM public.nft_types WHERE is_active = true;
```

### Step 3: Execute Tests
1. Open `comprehensive-testing-script.md`
2. Follow the testing procedures systematically
3. Document results in the provided tracking tables
4. Report any issues found

## 🔑 Test Credentials

### Admin Access
- **Email**: `admin.test@rewardsapp.com`
- **Password**: `TestAdmin123!`
- **Access**: Full system administration

### Regular Users
| User | Email | Password | NFT Type | Points |
|------|-------|----------|----------|--------|
| John Smith | `user1.test@rewardsapp.com` | `TestUser123!` | Pearl White | 150 |
| Sarah Johnson | `user2.test@rewardsapp.com` | `TestUser123!` | Lava Orange | 300 |
| Mike Davis | `user3.test@rewardsapp.com` | `TestUser123!` | Pink | 300 |
| Emily Wilson | `user4.test@rewardsapp.com` | `TestUser123!` | Silver | 500 |
| David Brown | `user5.test@rewardsapp.com` | `TestUser123!` | Gold | 750 |
| Lisa Anderson | `user6.test@rewardsapp.com` | `TestUser123!` | Black | 1000 |
| Robert Taylor | `user7.test@rewardsapp.com` | `TestUser123!` | Pearl White (Non-Custodial) | 200 |
| Jennifer Martinez | `user8.test@rewardsapp.com` | `TestUser123!` | Gold (Non-Custodial) | 800 |
| Michael Garcia | `user9.test@rewardsapp.com` | `TestUser123!` | Multiple NFTs | 1200 |

### Test Merchants
| Business | Owner | Plan | Monthly Price | Features |
|----------|-------|------|---------------|----------|
| TechStart Solutions | user1 | StartUp | $20 | Basic features |
| Cafe Delight | user2 | Momentum | $50 | Advanced features |
| Fashion Forward | user3 | Energizer | $100 | Premium features |
| Health & Wellness | user4 | Cloud9 | $250 | Enterprise features |
| Luxury Auto | user5 | Super | $500 | Ultimate features |

## 🎯 Testing Categories

### 1. Authentication & Authorization (5 tests)
- User login/logout
- Role-based access control
- Session management
- Security testing

### 2. NFT Management (8 tests)
- NFT display and information
- NFT purchase (custodial/non-custodial)
- NFT upgrades and evolution
- NFT transfers

### 3. Loyalty System (6 tests)
- Point earning with different ratios
- Point redemption
- Transaction processing
- QR code functionality

### 4. Merchant Operations (6 tests)
- Subscription plan features
- Transaction management
- Customer management
- Analytics and reporting

### 5. Admin Functions (6 tests)
- User management
- System configuration
- NFT and plan management
- System reporting

### 6. Integration Testing (4 tests)
- Cross-user interactions
- Multi-merchant transactions
- System performance
- Concurrent user testing

### 7. Error Handling (4 tests)
- Input validation
- System error handling
- Edge case testing
- Recovery testing

### 8. Mobile Responsiveness (2 tests)
- Mobile interface testing
- Mobile transaction processing

### 9. Security Testing (4 tests)
- Authentication security
- Data encryption
- SQL injection protection
- Access control

### 10. Performance Testing (2 tests)
- Load testing
- Database performance

## 📊 Test Execution Tracking

### Progress Tracking
Use the tracking tables in `comprehensive-testing-script.md` to:
- Mark test completion status
- Document issues found
- Track resolution progress
- Calculate pass rates

### Issue Reporting
For each issue found:
1. Document in the Critical Issues table
2. Assign severity level (Critical/High/Medium/Low)
3. Assign to appropriate team member
4. Track resolution status

## 🔧 Troubleshooting

### Common Issues

#### Test Data Not Created
```sql
-- Check if users exist
SELECT email FROM auth.users WHERE email LIKE '%test@rewardsapp.com';

-- If empty, re-run the comprehensive-test-data.sql script
```

#### Login Issues
- Verify email addresses are correct
- Check password format (TestUser123!)
- Ensure users are confirmed in auth system

#### NFT Display Issues
```sql
-- Check NFT types
SELECT nft_name, rarity, is_active FROM public.nft_types WHERE is_active = true;
```

#### Transaction Issues
```sql
-- Check loyalty cards
SELECT loyalty_number, full_name FROM api.user_loyalty_cards;

-- Check user points
SELECT user_id, total_points FROM public.user_points;
```

## 🧹 Cleanup

### After Testing Completion
```sql
-- Clean up test data (optional)
DELETE FROM public.loyalty_transactions WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
);
DELETE FROM public.user_points WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
);
DELETE FROM api.user_loyalty_cards WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
);
DELETE FROM api.merchants WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%test@rewardsapp.com'
);
DELETE FROM api.profiles WHERE email LIKE '%test@rewardsapp.com';
DELETE FROM auth.users WHERE email LIKE '%test@rewardsapp.com';
```

## 📞 Support

### Documentation
- **Test Data**: `test-data-documentation.md`
- **Testing Procedures**: `comprehensive-testing-script.md`
- **Database Schema**: Check existing migration files

### Getting Help
- Review the documentation files first
- Check the troubleshooting section
- Verify test data setup with provided queries
- Contact development team for technical issues

## ✅ Success Criteria

### Test Completion Checklist
- [ ] All 47 test cases executed
- [ ] All critical issues resolved
- [ ] Performance benchmarks met
- [ ] Security requirements satisfied
- [ ] Mobile compatibility verified
- [ ] Documentation updated
- [ ] Test data cleaned up
- [ ] Production deployment approved

### Quality Gates
- **Pass Rate**: Minimum 95% for all test categories
- **Critical Issues**: Zero critical issues remaining
- **Performance**: Response times within acceptable limits
- **Security**: All security tests passing
- **Mobile**: All mobile tests passing

---

*This testing guide provides comprehensive coverage of the rewards application. Follow the procedures systematically and document all results for proper tracking and resolution.*
