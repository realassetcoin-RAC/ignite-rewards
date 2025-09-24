# Comprehensive Browser MCP Test Scripts for RAC Rewards Application

## Test Environment Setup
- **Application URL**: http://localhost:8086
- **Admin User**: admin@igniterewards.com / admin123!
- **Test User**: user@example.com / password123
- **Mock Authentication**: Enabled (VITE_ENABLE_MOCK_AUTH=true)

---

## Test Suite 1: Authentication & User Management

### Test 1.1: Admin Authentication Flow
```javascript
// Navigate to home page
await browser.navigate('http://localhost:8086');

// Check if admin panel button is visible (should be visible for authenticated admin)
await browser.snapshot();
// Look for "Admin Panel" button in snapshot

// Click Admin Panel button
await browser.click('Admin Panel button');

// Verify admin dashboard loads
await browser.snapshot();
// Verify: "Welcome back, Admin User" heading is visible
// Verify: Mock statistics are displayed (15 cards, 8 merchants, 25 users)
// Verify: All admin panel buttons are visible (Virtual Cards, Merchants, Rewards, etc.)
```

### Test 1.2: Customer Signup Flow
```javascript
// Navigate to home page
await browser.navigate('http://localhost:8086');

// Click "Free Signup" button in carousel
await browser.click('Free Signup button');

// Verify signup modal opens
await browser.snapshot();
// Verify: Customer signup modal is visible
// Verify: Email and password fields are present
// Verify: "Sign Up" button is visible

// Fill signup form
await browser.type('email input field', 'testuser@example.com');
await browser.type('password input field', 'testpassword123');

// Click Sign Up button
await browser.click('Sign Up button');

// Verify success message
await browser.snapshot();
// Verify: Success toast appears
// Verify: "Account created and verified automatically for testing" message
```

### Test 1.3: Merchant Signup Flow
```javascript
// Navigate to home page
await browser.navigate('http://localhost:8086');

// Click "Signup as Merchant" button in carousel
await browser.click('Signup as Merchant button');

// Verify merchant signup modal opens
await browser.snapshot();
// Verify: Merchant signup modal is visible
// Verify: Business name, email, password fields are present
// Verify: "Sign Up as Merchant" button is visible

// Fill merchant signup form
await browser.type('business name input', 'Test Coffee Shop');
await browser.type('email input field', 'merchant@testshop.com');
await browser.type('password input field', 'merchantpass123');

// Click Sign Up as Merchant button
await browser.click('Sign Up as Merchant button');

// Verify success message
await browser.snapshot();
// Verify: Success toast appears
// Verify: Account created message
```

---

## Test Suite 2: Navigation & Page Functionality

### Test 2.1: Home Page Navigation
```javascript
// Navigate to home page
await browser.navigate('http://localhost:8086');

// Test carousel navigation
await browser.snapshot();
// Verify: All 4 carousel slides are visible
// Verify: "Customer Signup", "Business Signup", "Exclusive Benefits", "Join Our Community" slides

// Click "Next slide" button
await browser.click('Next slide button');
await browser.wait(1000);
await browser.snapshot();
// Verify: Carousel advances to next slide

// Click "Previous slide" button
await browser.click('Previous slide button');
await browser.wait(1000);
await browser.snapshot();
// Verify: Carousel goes back to previous slide
```

### Test 2.2: Exclusive Benefits Page
```javascript
// Navigate to exclusive benefits page
await browser.navigate('http://localhost:8086/exclusive-benefits');

// Verify page loads correctly
await browser.snapshot();
// Verify: "Earn Privately Spend Globally" heading is visible
// Verify: All 6 NFT card tiers are displayed (Pearl White, Lava Orange, Pink, Silver, Gold, Black)
// Verify: Each card shows correct pricing and features
// Verify: "Start Free" and "Merchant Plans" buttons are visible

// Test "Start Free" button (should trigger customer signup)
await browser.click('Start Free button');
await browser.snapshot();
// Verify: Customer signup modal opens
// Close modal and continue testing

// Test "Merchant Plans" button
await browser.click('Merchant Plans button');
// Verify: Navigates to subscription plans page
```

### Test 2.3: Subscription Plans Page
```javascript
// Navigate to subscription plans page
await browser.navigate('http://localhost:8086/subscription-plans');

// Verify page loads correctly
await browser.snapshot();
// Verify: "Choose Your Perfect Plan" heading is visible
// Verify: All 5 subscription plans are displayed (StartUp, Momentum, Energizer, Cloud9, Super)
// Verify: Pricing format shows "$XX /yr" with correct formatting
// Verify: "Select Plan" buttons are visible for each plan

// Test plan selection
await browser.click('Select Plan button for Momentum Plan');
await browser.snapshot();
// Verify: Plan selection confirmation appears
// Verify: Selected plan details are displayed
```

---

## Test Suite 3: Admin Panel Functionality

### Test 3.1: Admin Dashboard Overview
```javascript
// Navigate to admin panel
await browser.navigate('http://localhost:8086/admin');

// Verify admin dashboard loads
await browser.snapshot();
// Verify: "Welcome back, Admin User" heading is visible
// Verify: Mock statistics are displayed:
//   - Total Virtual Cards: 15
//   - Active Merchants: 8
//   - Total Users: 25
//   - Revenue (Selected Range): $1,250.75
//   - All-time Revenue: $8,750.25
// Verify: Top Merchants list shows 4 merchants with realistic data
// Verify: All admin panel buttons are visible and clickable
```

### Test 3.2: Virtual Cards Management
```javascript
// In admin panel, click "Virtual Cards" button
await browser.click('Virtual Cards button');

// Verify virtual cards management interface
await browser.snapshot();
// Verify: Virtual card management section is visible
// Verify: "Add New Loyalty Card" button is present
// Verify: "Create Loyalty Card" button is present

// Test creating a new loyalty card
await browser.click('Add New Loyalty Card button');
await browser.snapshot();
// Verify: Loyalty card creation form appears
// Verify: Card name, description, price fields are present
```

### Test 3.3: Merchants Management
```javascript
// In admin panel, click "Merchants" button
await browser.click('Merchants button');

// Verify merchants management interface
await browser.snapshot();
// Verify: Merchants management section is visible
// Verify: List of merchants is displayed
// Verify: Merchant details (name, email, subscription plan) are shown
// Verify: Edit/Manage buttons are present for each merchant
```

### Test 3.4: Analytics Dashboard
```javascript
// In admin panel, click "Analytics" button
await browser.click('Analytics button');

// Verify analytics dashboard
await browser.snapshot();
// Verify: Analytics dashboard loads
// Verify: Charts and graphs are displayed
// Verify: Transaction statistics are shown
// Verify: User activity metrics are visible
```

---

## Test Suite 4: DAO Governance System

### Test 4.1: DAO Dashboard Access
```javascript
// In admin panel, click "DAO" button
await browser.click('DAO button');

// Verify DAO dashboard loads
await browser.snapshot();
// Verify: DAO governance interface is visible
// Verify: Active proposals list is displayed
// Verify: Voting interface is present
// Verify: Proposal creation form is available
```

### Test 4.2: Create New Proposal
```javascript
// In DAO dashboard, click "Create Proposal" button
await browser.click('Create Proposal button');

// Verify proposal creation form
await browser.snapshot();
// Verify: Proposal creation form is visible
// Verify: Title, description, and voting options fields are present
// Verify: "Submit Proposal" button is visible

// Fill proposal form
await browser.type('proposal title field', 'Test Proposal: Update Loyalty Rewards');
await browser.type('proposal description field', 'This is a test proposal to update the loyalty rewards system for better user experience.');

// Submit proposal
await browser.click('Submit Proposal button');
await browser.snapshot();
// Verify: Proposal submitted successfully
// Verify: Proposal appears in active proposals list
```

### Test 4.3: Vote on Proposal
```javascript
// In DAO dashboard, find the test proposal
await browser.snapshot();
// Verify: Test proposal is visible in active proposals list

// Click on the proposal to view details
await browser.click('Test Proposal: Update Loyalty Rewards');

// Verify proposal details page
await browser.snapshot();
// Verify: Proposal details are displayed
// Verify: Voting options (For/Against/Abstain) are visible
// Verify: Current vote count is shown

// Cast a vote
await browser.click('For button');
await browser.snapshot();
// Verify: Vote cast successfully
// Verify: Vote count updates
// Verify: User's vote is recorded
```

### Test 4.4: Proposal Execution
```javascript
// Wait for proposal to reach quorum (simulate)
// In DAO dashboard, find completed proposal
await browser.snapshot();
// Verify: Completed proposals section is visible
// Verify: Proposal shows "Executed" status

// Click on executed proposal
await browser.click('Executed proposal');

// Verify execution details
await browser.snapshot();
// Verify: Execution details are displayed
// Verify: Final vote count is shown
// Verify: Execution timestamp is visible
```

---

## Test Suite 5: QR Code & Transaction System

### Test 5.1: QR Code Generation
```javascript
// Navigate to user dashboard (simulate logged-in user)
await browser.navigate('http://localhost:8086/dashboard');

// Verify user dashboard loads
await browser.snapshot();
// Verify: User dashboard is visible
// Verify: Loyalty card is displayed
// Verify: QR code is visible
// Verify: "Generate QR Code" button is present

// Test QR code generation
await browser.click('Generate QR Code button');
await browser.snapshot();
// Verify: New QR code is generated
// Verify: QR code is scannable
// Verify: Transaction details are shown
```

### Test 5.2: Transaction Processing
```javascript
// In user dashboard, click "Scan QR Code" button
await browser.click('Scan QR Code button');

// Verify QR scanner interface
await browser.snapshot();
// Verify: QR scanner interface is visible
// Verify: Camera access prompt appears
// Verify: "Manual Entry" option is available

// Test manual transaction entry
await browser.click('Manual Entry button');
await browser.type('merchant code field', 'MERCHANT001');
await browser.type('amount field', '25.50');
await browser.click('Process Transaction button');

// Verify transaction processing
await browser.snapshot();
// Verify: Transaction processed successfully
// Verify: Rewards earned message appears
// Verify: Transaction appears in history
```

### Test 5.3: Rewards Earning
```javascript
// In user dashboard, verify rewards section
await browser.snapshot();
// Verify: Rewards section is visible
// Verify: Total points earned is displayed
// Verify: Pending rewards (30-day vesting) are shown
// Verify: Vested rewards are displayed

// Test reward redemption
await browser.click('Redeem Rewards button');
await browser.snapshot();
// Verify: Redemption options are visible
// Verify: Cash conversion option is available
// Verify: Asset investment option is available
```

---

## Test Suite 6: Error Handling & Edge Cases

### Test 6.1: Network Error Handling
```javascript
// Simulate network disconnection
// Navigate to any page
await browser.navigate('http://localhost:8086');

// Verify error handling
await browser.snapshot();
// Verify: Application handles network errors gracefully
// Verify: Error messages are user-friendly
// Verify: Retry mechanisms are available
```

### Test 6.2: Invalid Input Handling
```javascript
// Test invalid email format in signup
await browser.navigate('http://localhost:8086');
await browser.click('Free Signup button');
await browser.type('email input field', 'invalid-email');
await browser.type('password input field', '123');
await browser.click('Sign Up button');

// Verify validation
await browser.snapshot();
// Verify: Email validation error appears
// Verify: Password strength error appears
// Verify: Form submission is prevented
```

### Test 6.3: Session Timeout Handling
```javascript
// Wait for session timeout (simulate)
await browser.wait(300000); // 5 minutes

// Try to perform an action
await browser.click('Admin Panel button');

// Verify session timeout handling
await browser.snapshot();
// Verify: Session timeout warning appears
// Verify: Redirect to login page
// Verify: Session is properly cleared
```

---

## Test Suite 7: Performance & Load Testing

### Test 7.1: Page Load Performance
```javascript
// Test page load times
const startTime = Date.now();
await browser.navigate('http://localhost:8086');
const loadTime = Date.now() - startTime;

// Verify load time is acceptable (< 3 seconds)
console.log(`Home page load time: ${loadTime}ms`);

// Test admin panel load time
const adminStartTime = Date.now();
await browser.navigate('http://localhost:8086/admin');
const adminLoadTime = Date.now() - adminStartTime;

// Verify admin panel loads quickly
console.log(`Admin panel load time: ${adminLoadTime}ms`);
```

### Test 7.2: Large Data Handling
```javascript
// Navigate to admin panel with large dataset
await browser.navigate('http://localhost:8086/admin');

// Test merchants list with many entries
await browser.click('Merchants button');
await browser.snapshot();
// Verify: Large merchant list loads without performance issues
// Verify: Pagination is working correctly
// Verify: Search functionality works with large datasets
```

---

## Test Suite 8: Security & Privacy

### Test 8.1: Data Privacy Verification
```javascript
// Navigate to user dashboard
await browser.navigate('http://localhost:8086/dashboard');

// Verify privacy features
await browser.snapshot();
// Verify: No personal data is displayed unnecessarily
// Verify: User can control data visibility
// Verify: Privacy settings are accessible
```

### Test 8.2: Authentication Security
```javascript
// Test unauthorized access
await browser.navigate('http://localhost:8086/admin');

// Verify access control
await browser.snapshot();
// Verify: Admin panel is only accessible to authenticated admin users
// Verify: Unauthorized users are redirected appropriately
```

---

## Test Execution Instructions

### Prerequisites
1. Ensure application is running on http://localhost:8086
2. Verify Browser MCP is connected and functional
3. Confirm mock authentication is enabled (VITE_ENABLE_MOCK_AUTH=true)

### Execution Order
1. Run Test Suite 1 (Authentication) first
2. Run Test Suite 2 (Navigation) to verify basic functionality
3. Run Test Suite 3 (Admin Panel) for administrative features
4. Run Test Suite 4 (DAO) for governance functionality
5. Run Test Suite 5 (QR & Transactions) for core business logic
6. Run Test Suite 6 (Error Handling) for robustness
7. Run Test Suite 7 (Performance) for optimization
8. Run Test Suite 8 (Security) for compliance

### Success Criteria
- All tests should complete without errors
- All UI elements should be visible and functional
- All mock data should display correctly
- All navigation should work smoothly
- All forms should submit successfully
- All error handling should work appropriately

### Reporting
After each test suite, capture:
- Screenshots of key pages
- Console logs for any errors
- Performance metrics
- User experience observations

---

## Troubleshooting Guide

### Common Issues
1. **Browser MCP Timeout**: Increase timeout values or retry connection
2. **Element Not Found**: Verify page has loaded completely before clicking
3. **Mock Data Issues**: Check if VITE_ENABLE_MOCK_AUTH=true
4. **Navigation Errors**: Verify all routes are properly configured

### Recovery Procedures
1. Refresh browser if stuck on loading
2. Restart Browser MCP connection if timeouts persist
3. Check console logs for JavaScript errors
4. Verify application server is running

This comprehensive test suite covers all major functionality of the RAC Rewards application, including the DAO governance system, and provides detailed scripts for Browser MCP execution.
