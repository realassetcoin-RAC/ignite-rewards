# Browser MCP Test Execution Guide

## Quick Start

### 1. Prerequisites
- Application running on http://localhost:8086
- Browser MCP connected and functional
- Mock authentication enabled (VITE_ENABLE_MOCK_AUTH=true)

### 2. Execute Individual Test Suites

#### Authentication Tests
```javascript
// Copy and paste this into Browser MCP console
const { runAuthenticationTests } = require('./browser_mcp_step_by_step_tests.js');
runAuthenticationTests();
```

#### Navigation Tests
```javascript
const { runNavigationTests } = require('./browser_mcp_step_by_step_tests.js');
runNavigationTests();
```

#### Admin Panel Tests
```javascript
const { runAdminPanelTests } = require('./browser_mcp_step_by_step_tests.js');
runAdminPanelTests();
```

#### DAO Tests
```javascript
const { runDAOTests } = require('./browser_mcp_step_by_step_tests.js');
runDAOTests();
```

#### QR & Transaction Tests
```javascript
const { runQRTransactionTests } = require('./browser_mcp_step_by_step_tests.js');
runQRTransactionTests();
```

### 3. Execute All Tests
```javascript
const { runAllTests } = require('./browser_mcp_step_by_step_tests.js');
runAllTests();
```

### 4. Execute Individual Tests
```javascript
// Test specific functionality
const { testAdminAuthentication } = require('./browser_mcp_step_by_step_tests.js');
testAdminAuthentication();

const { testCustomerSignup } = require('./browser_mcp_step_by_step_tests.js');
testCustomerSignup();

const { testExclusiveBenefitsPage } = require('./browser_mcp_step_by_step_tests.js');
testExclusiveBenefitsPage();
```

## Manual Test Execution (Step by Step)

### Test 1: Admin Authentication
1. Navigate to http://localhost:8086
2. Verify "Admin Panel" button is visible
3. Click "Admin Panel" button
4. Verify admin dashboard loads with "Welcome back, Admin User"
5. Verify mock statistics are displayed (15 cards, 8 merchants, 25 users)

### Test 2: Customer Signup
1. Navigate to http://localhost:8086
2. Click "Free Signup" button in carousel
3. Verify signup modal opens
4. Fill email: testuser@example.com
5. Fill password: testpassword123
6. Click "Sign Up" button
7. Verify success message appears

### Test 3: Merchant Signup
1. Navigate to http://localhost:8086
2. Click "Signup as Merchant" button
3. Verify merchant signup modal opens
4. Fill business name: Test Coffee Shop
5. Fill email: merchant@testshop.com
6. Fill password: merchantpass123
7. Click "Sign Up as Merchant" button
8. Verify success message appears

### Test 4: Exclusive Benefits Page
1. Navigate to http://localhost:8086/exclusive-benefits
2. Verify page loads with "Earn Privately Spend Globally"
3. Verify all 6 NFT card tiers are displayed
4. Click "Start Free" button
5. Verify customer signup modal opens
6. Click "Merchant Plans" button
7. Verify navigation to subscription plans page

### Test 5: Subscription Plans Page
1. Navigate to http://localhost:8086/subscription-plans
2. Verify "Choose Your Perfect Plan" heading
3. Verify all 5 subscription plans are displayed
4. Verify pricing format shows "$XX /yr"
5. Click "Select Plan" for Momentum plan
6. Verify plan selection confirmation

### Test 6: Admin Panel Features
1. Navigate to http://localhost:8086/admin
2. Verify admin dashboard loads
3. Click "Virtual Cards" button
4. Verify virtual cards management interface
5. Click "Merchants" button
6. Verify merchants management interface
7. Click "Analytics" button
8. Verify analytics dashboard
9. Click "DAO" button
10. Verify DAO governance interface

### Test 7: DAO Governance
1. In admin panel, click "DAO" button
2. Verify DAO dashboard loads
3. Click "Create Proposal" button
4. Fill proposal title: "Test Proposal: Update Loyalty Rewards"
5. Fill description: "This is a test proposal to update the loyalty rewards system"
6. Click "Submit Proposal" button
7. Verify proposal appears in list
8. Click on the proposal
9. Verify voting interface
10. Click "For" button to vote
11. Verify vote is recorded

### Test 8: QR Code & Transactions
1. Navigate to http://localhost:8086/dashboard
2. Verify user dashboard loads
3. Look for QR code or "Generate QR Code" button
4. Click "Generate QR Code" button
5. Verify new QR code is generated
6. Click "Scan QR Code" button
7. Verify QR scanner interface
8. Click "Manual Entry" button
9. Enter merchant code: MERCHANT001
10. Enter amount: 25.50
11. Click "Process Transaction" button
12. Verify transaction processing success

## Error Monitoring

### Console Log Monitoring
After each test step, check the browser console for:
- **Errors**: Red error messages
- **Warnings**: Yellow warning messages
- **Info**: Blue info messages

### Screenshot Capture
The test scripts automatically capture screenshots at each step for:
- Before action execution
- After action execution
- Error states
- Success states

### Performance Monitoring
The test scripts measure:
- Page load times
- Action execution times
- Memory usage
- Network requests

## Troubleshooting

### Common Issues
1. **Browser MCP Timeout**: Increase timeout values or retry connection
2. **Element Not Found**: Verify page has loaded completely
3. **Mock Data Issues**: Check VITE_ENABLE_MOCK_AUTH=true
4. **Navigation Errors**: Verify all routes are configured

### Recovery Procedures
1. Refresh browser if stuck on loading
2. Restart Browser MCP connection if timeouts persist
3. Check console logs for JavaScript errors
4. Verify application server is running

## Test Report Generation

After running tests, the script generates a comprehensive report including:
- Total test steps executed
- Pass/fail counts
- Error and warning details
- Screenshot references
- Performance metrics
- Console log analysis

## Success Criteria

All tests should:
- Complete without errors
- Display all UI elements correctly
- Show mock data properly
- Navigate smoothly between pages
- Submit forms successfully
- Handle errors gracefully
- Meet performance benchmarks

## Next Steps

After successful test execution:
1. Review test report for any issues
2. Address any errors or warnings found
3. Optimize performance if needed
4. Document any new issues discovered
5. Plan additional test scenarios if required
