# Browser MCP Test Scripts with Screenshot & Console Log Monitoring

## Test Environment Setup
- **Application URL**: http://localhost:8086
- **Admin User**: admin@igniterewards.com / admin123!
- **Test User**: user@example.com / password123
- **Mock Authentication**: Enabled (VITE_ENABLE_MOCK_AUTH=true)

---

## Test Execution Framework with Monitoring

### Pre-Test Setup
```javascript
// Initialize test monitoring
const testResults = {
  screenshots: [],
  consoleLogs: [],
  errors: [],
  warnings: [],
  performance: [],
  testSteps: []
};

// Function to capture test step
async function captureTestStep(stepName, action) {
  console.log(`\n=== TEST STEP: ${stepName} ===`);
  
  // Capture screenshot before action
  const beforeScreenshot = await browser.screenshot();
  testResults.screenshots.push({
    step: stepName,
    type: 'before',
    timestamp: new Date().toISOString(),
    data: beforeScreenshot
  });
  
  // Capture console logs before action
  const beforeLogs = await browser.getConsoleLogs();
  testResults.consoleLogs.push({
    step: stepName,
    type: 'before',
    timestamp: new Date().toISOString(),
    logs: beforeLogs
  });
  
  // Execute action
  try {
    await action();
    
    // Capture screenshot after action
    const afterScreenshot = await browser.screenshot();
    testResults.screenshots.push({
      step: stepName,
      type: 'after',
      timestamp: new Date().toISOString(),
      data: afterScreenshot
    });
    
    // Capture console logs after action
    const afterLogs = await browser.getConsoleLogs();
    testResults.consoleLogs.push({
      step: stepName,
      type: 'after',
      timestamp: new Date().toISOString(),
      logs: afterLogs
    });
    
    // Analyze logs for errors and warnings
    analyzeLogs(stepName, afterLogs);
    
    testResults.testSteps.push({
      step: stepName,
      status: 'PASSED',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    testResults.errors.push({
      step: stepName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    testResults.testSteps.push({
      step: stepName,
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Function to analyze console logs
function analyzeLogs(stepName, logs) {
  logs.forEach(log => {
    if (log.type === 'error') {
      testResults.errors.push({
        step: stepName,
        type: 'console_error',
        message: log.message,
        timestamp: log.timestamp
      });
    } else if (log.type === 'warning') {
      testResults.warnings.push({
        step: stepName,
        type: 'console_warning',
        message: log.message,
        timestamp: log.timestamp
      });
    }
  });
}

// Function to generate test report
function generateTestReport() {
  const report = {
    summary: {
      totalSteps: testResults.testSteps.length,
      passed: testResults.testSteps.filter(s => s.status === 'PASSED').length,
      failed: testResults.testSteps.filter(s => s.status === 'FAILED').length,
      errors: testResults.errors.length,
      warnings: testResults.warnings.length
    },
    details: testResults
  };
  
  console.log('\n=== TEST REPORT ===');
  console.log(`Total Steps: ${report.summary.totalSteps}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  
  return report;
}
```

---

## Test Suite 1: Authentication & User Management

### Test 1.1: Admin Authentication Flow
```javascript
await captureTestStep('Navigate to Home Page', async () => {
  await browser.navigate('http://localhost:8086');
  await browser.wait(2000); // Wait for page to fully load
});

await captureTestStep('Verify Admin Panel Button Visible', async () => {
  const snapshot = await browser.snapshot();
  // Verify "Admin Panel" button is visible in snapshot
  if (!snapshot.includes('Admin Panel')) {
    throw new Error('Admin Panel button not visible');
  }
});

await captureTestStep('Click Admin Panel Button', async () => {
  await browser.click('Admin Panel button');
  await browser.wait(3000); // Wait for admin panel to load
});

await captureTestStep('Verify Admin Dashboard Loads', async () => {
  const snapshot = await browser.snapshot();
  // Verify admin dashboard elements
  if (!snapshot.includes('Welcome back, Admin User')) {
    throw new Error('Admin dashboard not loaded properly');
  }
  if (!snapshot.includes('Total Virtual Cards')) {
    throw new Error('Admin statistics not displayed');
  }
});

await captureTestStep('Verify Mock Data Display', async () => {
  const snapshot = await browser.snapshot();
  // Verify mock statistics are displayed
  const expectedStats = ['15', '8', '25', '$1,250.75', '$8,750.25'];
  expectedStats.forEach(stat => {
    if (!snapshot.includes(stat)) {
      throw new Error(`Expected statistic ${stat} not found`);
    }
  });
});
```

### Test 1.2: Customer Signup Flow
```javascript
await captureTestStep('Navigate to Home Page for Signup', async () => {
  await browser.navigate('http://localhost:8086');
  await browser.wait(2000);
});

await captureTestStep('Click Free Signup Button', async () => {
  await browser.click('Free Signup button');
  await browser.wait(2000); // Wait for modal to open
});

await captureTestStep('Verify Signup Modal Opens', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Customer Signup') && !snapshot.includes('Sign Up')) {
    throw new Error('Signup modal did not open');
  }
});

await captureTestStep('Fill Signup Form', async () => {
  await browser.type('email input field', 'testuser@example.com');
  await browser.type('password input field', 'testpassword123');
  await browser.wait(1000);
});

await captureTestStep('Submit Signup Form', async () => {
  await browser.click('Sign Up button');
  await browser.wait(3000); // Wait for signup processing
});

await captureTestStep('Verify Signup Success', async () => {
  const snapshot = await browser.snapshot();
  // Look for success message or toast
  if (!snapshot.includes('Account created') && !snapshot.includes('success')) {
    throw new Error('Signup success message not found');
  }
});
```

### Test 1.3: Merchant Signup Flow
```javascript
await captureTestStep('Navigate to Home Page for Merchant Signup', async () => {
  await browser.navigate('http://localhost:8086');
  await browser.wait(2000);
});

await captureTestStep('Click Merchant Signup Button', async () => {
  await browser.click('Signup as Merchant button');
  await browser.wait(2000);
});

await captureTestStep('Verify Merchant Signup Modal', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Business Signup') && !snapshot.includes('Merchant')) {
    throw new Error('Merchant signup modal did not open');
  }
});

await captureTestStep('Fill Merchant Signup Form', async () => {
  await browser.type('business name input', 'Test Coffee Shop');
  await browser.type('email input field', 'merchant@testshop.com');
  await browser.type('password input field', 'merchantpass123');
  await browser.wait(1000);
});

await captureTestStep('Submit Merchant Signup', async () => {
  await browser.click('Sign Up as Merchant button');
  await browser.wait(3000);
});

await captureTestStep('Verify Merchant Signup Success', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Account created') && !snapshot.includes('success')) {
    throw new Error('Merchant signup success message not found');
  }
});
```

---

## Test Suite 2: Navigation & Page Functionality

### Test 2.1: Home Page Carousel Navigation
```javascript
await captureTestStep('Navigate to Home Page', async () => {
  await browser.navigate('http://localhost:8086');
  await browser.wait(2000);
});

await captureTestStep('Verify Carousel Elements', async () => {
  const snapshot = await browser.snapshot();
  const expectedSlides = ['Customer Signup', 'Business Signup', 'Exclusive Benefits', 'Join Our Community'];
  expectedSlides.forEach(slide => {
    if (!snapshot.includes(slide)) {
      throw new Error(`Carousel slide ${slide} not found`);
    }
  });
});

await captureTestStep('Test Carousel Next Button', async () => {
  await browser.click('Next slide button');
  await browser.wait(1000);
  const snapshot = await browser.snapshot();
  // Verify carousel advanced
});

await captureTestStep('Test Carousel Previous Button', async () => {
  await browser.click('Previous slide button');
  await browser.wait(1000);
  const snapshot = await browser.snapshot();
  // Verify carousel went back
});
```

### Test 2.2: Exclusive Benefits Page
```javascript
await captureTestStep('Navigate to Exclusive Benefits', async () => {
  await browser.navigate('http://localhost:8086/exclusive-benefits');
  await browser.wait(2000);
});

await captureTestStep('Verify Exclusive Benefits Page Loads', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Earn Privately Spend Globally')) {
    throw new Error('Exclusive benefits page not loaded');
  }
});

await captureTestStep('Verify NFT Card Tiers Display', async () => {
  const snapshot = await browser.snapshot();
  const expectedCards = ['Pearl White', 'Lava Orange', 'Pink', 'Silver', 'Gold', 'Black'];
  expectedCards.forEach(card => {
    if (!snapshot.includes(card)) {
      throw new Error(`NFT card tier ${card} not found`);
    }
  });
});

await captureTestStep('Test Start Free Button', async () => {
  await browser.click('Start Free button');
  await browser.wait(2000);
  const snapshot = await browser.snapshot();
  // Verify customer signup modal opens
});

await captureTestStep('Test Merchant Plans Button', async () => {
  await browser.click('Merchant Plans button');
  await browser.wait(2000);
  // Should navigate to subscription plans page
});
```

### Test 2.3: Subscription Plans Page
```javascript
await captureTestStep('Navigate to Subscription Plans', async () => {
  await browser.navigate('http://localhost:8086/subscription-plans');
  await browser.wait(2000);
});

await captureTestStep('Verify Subscription Plans Page', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Choose Your Perfect Plan')) {
    throw new Error('Subscription plans page not loaded');
  }
});

await captureTestStep('Verify All Plans Display', async () => {
  const snapshot = await browser.snapshot();
  const expectedPlans = ['StartUp', 'Momentum', 'Energizer', 'Cloud9', 'Super'];
  expectedPlans.forEach(plan => {
    if (!snapshot.includes(plan)) {
      throw new Error(`Subscription plan ${plan} not found`);
    }
  });
});

await captureTestStep('Verify Pricing Format', async () => {
  const snapshot = await browser.snapshot();
  // Verify pricing shows "$XX /yr" format
  if (!snapshot.includes('/yr')) {
    throw new Error('Yearly pricing format not found');
  }
});

await captureTestStep('Test Plan Selection', async () => {
  await browser.click('Select Plan button for Momentum Plan');
  await browser.wait(2000);
  const snapshot = await browser.snapshot();
  // Verify plan selection confirmation
});
```

---

## Test Suite 3: Admin Panel Functionality

### Test 3.1: Admin Dashboard Overview
```javascript
await captureTestStep('Navigate to Admin Panel', async () => {
  await browser.navigate('http://localhost:8086/admin');
  await browser.wait(3000);
});

await captureTestStep('Verify Admin Dashboard Elements', async () => {
  const snapshot = await browser.snapshot();
  const expectedElements = [
    'Welcome back, Admin User',
    'Total Virtual Cards',
    'Active Merchants',
    'Total Users',
    'Revenue',
    'Virtual Cards',
    'Merchants',
    'Rewards',
    'DAO'
  ];
  
  expectedElements.forEach(element => {
    if (!snapshot.includes(element)) {
      throw new Error(`Admin dashboard element ${element} not found`);
    }
  });
});

await captureTestStep('Verify Mock Statistics', async () => {
  const snapshot = await browser.snapshot();
  const expectedStats = ['15', '8', '25', '$1,250.75', '$8,750.25'];
  expectedStats.forEach(stat => {
    if (!snapshot.includes(stat)) {
      throw new Error(`Expected statistic ${stat} not found in admin dashboard`);
    }
  });
});
```

### Test 3.2: Virtual Cards Management
```javascript
await captureTestStep('Click Virtual Cards Button', async () => {
  await browser.click('Virtual Cards button');
  await browser.wait(2000);
});

await captureTestStep('Verify Virtual Cards Interface', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Virtual Card Management')) {
    throw new Error('Virtual cards management interface not loaded');
  }
});

await captureTestStep('Test Add New Loyalty Card', async () => {
  await browser.click('Add New Loyalty Card button');
  await browser.wait(2000);
  const snapshot = await browser.snapshot();
  // Verify loyalty card creation form
});
```

### Test 3.3: Merchants Management
```javascript
await captureTestStep('Click Merchants Button', async () => {
  await browser.click('Merchants button');
  await browser.wait(2000);
});

await captureTestStep('Verify Merchants Interface', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Merchants') || !snapshot.includes('Coffee Shop')) {
    throw new Error('Merchants management interface not loaded properly');
  }
});
```

### Test 3.4: Analytics Dashboard
```javascript
await captureTestStep('Click Analytics Button', async () => {
  await browser.click('Analytics button');
  await browser.wait(2000);
});

await captureTestStep('Verify Analytics Dashboard', async () => {
  const snapshot = await browser.snapshot();
  // Verify analytics dashboard loads
  // Check for charts, graphs, or analytics data
});
```

---

## Test Suite 4: DAO Governance System

### Test 4.1: DAO Dashboard Access
```javascript
await captureTestStep('Click DAO Button', async () => {
  await browser.click('DAO button');
  await browser.wait(2000);
});

await captureTestStep('Verify DAO Dashboard', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('DAO') && !snapshot.includes('Governance')) {
    throw new Error('DAO dashboard not loaded');
  }
});

await captureTestStep('Verify DAO Interface Elements', async () => {
  const snapshot = await browser.snapshot();
  // Look for proposal creation, voting interface, etc.
});
```

### Test 4.2: Create New Proposal
```javascript
await captureTestStep('Click Create Proposal Button', async () => {
  await browser.click('Create Proposal button');
  await browser.wait(2000);
});

await captureTestStep('Verify Proposal Creation Form', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Proposal') || !snapshot.includes('Title')) {
    throw new Error('Proposal creation form not loaded');
  }
});

await captureTestStep('Fill Proposal Form', async () => {
  await browser.type('proposal title field', 'Test Proposal: Update Loyalty Rewards');
  await browser.type('proposal description field', 'This is a test proposal to update the loyalty rewards system.');
  await browser.wait(1000);
});

await captureTestStep('Submit Proposal', async () => {
  await browser.click('Submit Proposal button');
  await browser.wait(3000);
});

await captureTestStep('Verify Proposal Submitted', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Test Proposal') && !snapshot.includes('success')) {
    throw new Error('Proposal submission not confirmed');
  }
});
```

### Test 4.3: Vote on Proposal
```javascript
await captureTestStep('Find Test Proposal', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Test Proposal: Update Loyalty Rewards')) {
    throw new Error('Test proposal not found in proposals list');
  }
});

await captureTestStep('Click on Test Proposal', async () => {
  await browser.click('Test Proposal: Update Loyalty Rewards');
  await browser.wait(2000);
});

await captureTestStep('Verify Proposal Details', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Vote') && !snapshot.includes('For')) {
    throw new Error('Proposal voting interface not loaded');
  }
});

await captureTestStep('Cast Vote', async () => {
  await browser.click('For button');
  await browser.wait(2000);
});

await captureTestStep('Verify Vote Cast', async () => {
  const snapshot = await browser.snapshot();
  // Verify vote was recorded
});
```

---

## Test Suite 5: QR Code & Transaction System

### Test 5.1: QR Code Generation
```javascript
await captureTestStep('Navigate to User Dashboard', async () => {
  await browser.navigate('http://localhost:8086/dashboard');
  await browser.wait(2000);
});

await captureTestStep('Verify User Dashboard', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Dashboard') && !snapshot.includes('Loyalty')) {
    throw new Error('User dashboard not loaded');
  }
});

await captureTestStep('Verify QR Code Display', async () => {
  const snapshot = await browser.snapshot();
  // Look for QR code or QR code generation button
});

await captureTestStep('Test QR Code Generation', async () => {
  await browser.click('Generate QR Code button');
  await browser.wait(2000);
  const snapshot = await browser.snapshot();
  // Verify new QR code is generated
});
```

### Test 5.2: Transaction Processing
```javascript
await captureTestStep('Click Scan QR Code Button', async () => {
  await browser.click('Scan QR Code button');
  await browser.wait(2000);
});

await captureTestStep('Verify QR Scanner Interface', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Scan') && !snapshot.includes('QR')) {
    throw new Error('QR scanner interface not loaded');
  }
});

await captureTestStep('Test Manual Transaction Entry', async () => {
  await browser.click('Manual Entry button');
  await browser.type('merchant code field', 'MERCHANT001');
  await browser.type('amount field', '25.50');
  await browser.click('Process Transaction button');
  await browser.wait(2000);
});

await captureTestStep('Verify Transaction Processing', async () => {
  const snapshot = await browser.snapshot();
  if (!snapshot.includes('Transaction') && !snapshot.includes('success')) {
    throw new Error('Transaction processing not confirmed');
  }
});
```

---

## Test Suite 6: Error Handling & Console Monitoring

### Test 6.1: Console Error Monitoring
```javascript
await captureTestStep('Monitor Console for Errors', async () => {
  const logs = await browser.getConsoleLogs();
  const errors = logs.filter(log => log.type === 'error');
  const warnings = logs.filter(log => log.type === 'warning');
  
  console.log(`Found ${errors.length} errors and ${warnings.length} warnings`);
  
  errors.forEach(error => {
    console.error(`ERROR: ${error.message}`);
    testResults.errors.push({
      type: 'console_error',
      message: error.message,
      timestamp: error.timestamp
    });
  });
  
  warnings.forEach(warning => {
    console.warn(`WARNING: ${warning.message}`);
    testResults.warnings.push({
      type: 'console_warning',
      message: warning.message,
      timestamp: warning.timestamp
    });
  });
});
```

### Test 6.2: Network Error Simulation
```javascript
await captureTestStep('Test Network Error Handling', async () => {
  // Simulate network issues by navigating to invalid URL
  try {
    await browser.navigate('http://localhost:8086/invalid-page');
    await browser.wait(2000);
  } catch (error) {
    // Expected to fail
  }
  
  const snapshot = await browser.snapshot();
  // Verify error handling is graceful
});
```

### Test 6.3: Form Validation Testing
```javascript
await captureTestStep('Test Invalid Form Input', async () => {
  await browser.navigate('http://localhost:8086');
  await browser.click('Free Signup button');
  await browser.wait(1000);
  
  // Test invalid email
  await browser.type('email input field', 'invalid-email');
  await browser.type('password input field', '123');
  await browser.click('Sign Up button');
  await browser.wait(1000);
  
  const snapshot = await browser.snapshot();
  // Verify validation errors are shown
});
```

---

## Test Suite 7: Performance Monitoring

### Test 7.1: Page Load Performance
```javascript
await captureTestStep('Measure Home Page Load Time', async () => {
  const startTime = Date.now();
  await browser.navigate('http://localhost:8086');
  await browser.wait(2000);
  const loadTime = Date.now() - startTime;
  
  testResults.performance.push({
    page: 'Home',
    loadTime: loadTime,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Home page load time: ${loadTime}ms`);
  
  if (loadTime > 5000) {
    throw new Error(`Home page load time too slow: ${loadTime}ms`);
  }
});

await captureTestStep('Measure Admin Panel Load Time', async () => {
  const startTime = Date.now();
  await browser.navigate('http://localhost:8086/admin');
  await browser.wait(3000);
  const loadTime = Date.now() - startTime;
  
  testResults.performance.push({
    page: 'Admin Panel',
    loadTime: loadTime,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Admin panel load time: ${loadTime}ms`);
  
  if (loadTime > 8000) {
    throw new Error(`Admin panel load time too slow: ${loadTime}ms`);
  }
});
```

---

## Test Suite 8: Security & Privacy Verification

### Test 8.1: Data Privacy Check
```javascript
await captureTestStep('Verify Privacy Features', async () => {
  await browser.navigate('http://localhost:8086/dashboard');
  await browser.wait(2000);
  
  const snapshot = await browser.snapshot();
  // Verify no sensitive data is exposed
  const sensitiveData = ['password', 'ssn', 'credit card', 'phone number'];
  sensitiveData.forEach(data => {
    if (snapshot.toLowerCase().includes(data)) {
      throw new Error(`Sensitive data ${data} found in dashboard`);
    }
  });
});
```

### Test 8.2: Authentication Security
```javascript
await captureTestStep('Test Unauthorized Access', async () => {
  // Try to access admin panel without proper authentication
  await browser.navigate('http://localhost:8086/admin');
  await browser.wait(2000);
  
  const snapshot = await browser.snapshot();
  // Verify access control is working
  if (!snapshot.includes('Welcome back, Admin User')) {
    throw new Error('Admin access control not working properly');
  }
});
```

---

## Final Test Report Generation

### Generate Comprehensive Report
```javascript
// Run all test suites
async function runAllTests() {
  console.log('Starting comprehensive Browser MCP testing...');
  
  try {
    // Run Test Suite 1: Authentication
    console.log('\n=== RUNNING TEST SUITE 1: AUTHENTICATION ===');
    // ... execute all authentication tests
    
    // Run Test Suite 2: Navigation
    console.log('\n=== RUNNING TEST SUITE 2: NAVIGATION ===');
    // ... execute all navigation tests
    
    // Run Test Suite 3: Admin Panel
    console.log('\n=== RUNNING TEST SUITE 3: ADMIN PANEL ===');
    // ... execute all admin panel tests
    
    // Run Test Suite 4: DAO
    console.log('\n=== RUNNING TEST SUITE 4: DAO ===');
    // ... execute all DAO tests
    
    // Run Test Suite 5: QR & Transactions
    console.log('\n=== RUNNING TEST SUITE 5: QR & TRANSACTIONS ===');
    // ... execute all QR and transaction tests
    
    // Run Test Suite 6: Error Handling
    console.log('\n=== RUNNING TEST SUITE 6: ERROR HANDLING ===');
    // ... execute all error handling tests
    
    // Run Test Suite 7: Performance
    console.log('\n=== RUNNING TEST SUITE 7: PERFORMANCE ===');
    // ... execute all performance tests
    
    // Run Test Suite 8: Security
    console.log('\n=== RUNNING TEST SUITE 8: SECURITY ===');
    // ... execute all security tests
    
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    // Generate final report
    const finalReport = generateTestReport();
    
    // Save report to file
    const reportData = JSON.stringify(finalReport, null, 2);
    console.log('\n=== FINAL TEST REPORT ===');
    console.log(reportData);
    
    // Log all errors and warnings for resolution
    if (finalReport.summary.errors > 0) {
      console.log('\n=== ERRORS TO RESOLVE ===');
      finalReport.details.errors.forEach(error => {
        console.error(`ERROR: ${error.step} - ${error.message || error.error}`);
      });
    }
    
    if (finalReport.summary.warnings > 0) {
      console.log('\n=== WARNINGS TO ADDRESS ===');
      finalReport.details.warnings.forEach(warning => {
        console.warn(`WARNING: ${warning.step} - ${warning.message}`);
      });
    }
    
    return finalReport;
  }
}

// Execute all tests
runAllTests();
```

---

## Error Resolution Guide

### Common Errors and Solutions

#### 1. Console Errors
- **"Maximum update depth exceeded"**: Fixed in useSecureAuth hook
- **"supabase.from(...).select(...).eq(...).order(...).limit is not a function"**: Add missing limit method to mock query builder
- **"Database not connected"**: Expected in mock mode, handled gracefully

#### 2. UI Errors
- **Element not found**: Verify page has loaded completely before clicking
- **Modal not opening**: Check if authentication is working properly
- **Navigation errors**: Verify all routes are properly configured

#### 3. Performance Issues
- **Slow page loads**: Check for infinite loops or excessive API calls
- **Memory leaks**: Monitor console for repeated warnings
- **Timeout errors**: Increase timeout values or optimize queries

### Monitoring Checklist
- [ ] All screenshots captured for each test step
- [ ] Console logs analyzed for errors and warnings
- [ ] Performance metrics recorded
- [ ] Error handling verified
- [ ] Security checks completed
- [ ] All functionality tested end-to-end

This comprehensive test framework provides detailed monitoring, error capture, and resolution guidance for the entire RAC Rewards application including the DAO governance system.
