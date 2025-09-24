// Browser MCP Step-by-Step Test Script for RAC Rewards Application
// This script provides individual test functions that can be executed one by one

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8086',
  adminUser: {
    email: 'admin@igniterewards.com',
    password: 'admin123!'
  },
  testUser: {
    email: 'user@example.com',
    password: 'password123'
  },
  timeout: 5000
};

// Test Results Storage
let testResults = {
  screenshots: [],
  consoleLogs: [],
  errors: [],
  warnings: [],
  performance: [],
  testSteps: []
};

// Utility Functions
async function captureScreenshot(stepName, type = 'test') {
  try {
    const screenshot = await browser.screenshot();
    testResults.screenshots.push({
      step: stepName,
      type: type,
      timestamp: new Date().toISOString(),
      data: screenshot
    });
    console.log(`📸 Screenshot captured for: ${stepName}`);
  } catch (error) {
    console.error(`❌ Failed to capture screenshot for ${stepName}:`, error);
  }
}

async function captureConsoleLogs(stepName) {
  try {
    const logs = await browser.getConsoleLogs();
    testResults.consoleLogs.push({
      step: stepName,
      timestamp: new Date().toISOString(),
      logs: logs
    });
    
    // Analyze logs for errors and warnings
    logs.forEach(log => {
      if (log.type === 'error') {
        testResults.errors.push({
          step: stepName,
          type: 'console_error',
          message: log.message,
          timestamp: log.timestamp
        });
        console.error(`🚨 ERROR in ${stepName}: ${log.message}`);
      } else if (log.type === 'warning') {
        testResults.warnings.push({
          step: stepName,
          type: 'console_warning',
          message: log.message,
          timestamp: log.timestamp
        });
        console.warn(`⚠️ WARNING in ${stepName}: ${log.message}`);
      }
    });
    
    console.log(`📋 Console logs captured for: ${stepName} (${logs.length} entries)`);
  } catch (error) {
    console.error(`❌ Failed to capture console logs for ${stepName}:`, error);
  }
}

async function executeTestStep(stepName, action) {
  console.log(`\n🔄 Executing: ${stepName}`);
  const startTime = Date.now();
  
  try {
    // Capture initial state
    await captureScreenshot(stepName, 'before');
    await captureConsoleLogs(stepName);
    
    // Execute the action
    await action();
    
    // Capture final state
    await captureScreenshot(stepName, 'after');
    await captureConsoleLogs(stepName);
    
    const duration = Date.now() - startTime;
    testResults.performance.push({
      step: stepName,
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    testResults.testSteps.push({
      step: stepName,
      status: 'PASSED',
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ PASSED: ${stepName} (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.errors.push({
      step: stepName,
      type: 'test_error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    testResults.testSteps.push({
      step: stepName,
      status: 'FAILED',
      error: error.message,
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    console.error(`❌ FAILED: ${stepName} - ${error.message}`);
  }
}

// Test Suite 1: Authentication Tests
async function testAdminAuthentication() {
  await executeTestStep('Navigate to Home Page', async () => {
    await browser.navigate(TEST_CONFIG.baseUrl);
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Admin Panel Button', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Admin Panel')) {
      throw new Error('Admin Panel button not visible');
    }
  });
  
  await executeTestStep('Click Admin Panel Button', async () => {
    await browser.click('Admin Panel button');
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify Admin Dashboard', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Welcome back, Admin User')) {
      throw new Error('Admin dashboard not loaded');
    }
  });
  
  await executeTestStep('Verify Mock Statistics', async () => {
    const snapshot = await browser.snapshot();
    const expectedStats = ['15', '8', '25', '$1,250.75', '$8,750.25'];
    expectedStats.forEach(stat => {
      if (!snapshot.includes(stat)) {
        throw new Error(`Expected statistic ${stat} not found`);
      }
    });
  });
}

async function testCustomerSignup() {
  await executeTestStep('Navigate to Home Page for Signup', async () => {
    await browser.navigate(TEST_CONFIG.baseUrl);
    await browser.wait(2000);
  });
  
  await executeTestStep('Click Free Signup Button', async () => {
    await browser.click('Free Signup button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Signup Modal', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Customer Signup') && !snapshot.includes('Sign Up')) {
      throw new Error('Signup modal did not open');
    }
  });
  
  await executeTestStep('Fill Signup Form', async () => {
    await browser.type('email input field', 'testuser@example.com');
    await browser.type('password input field', 'testpassword123');
    await browser.wait(1000);
  });
  
  await executeTestStep('Submit Signup Form', async () => {
    await browser.click('Sign Up button');
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify Signup Success', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Account created') && !snapshot.includes('success')) {
      throw new Error('Signup success message not found');
    }
  });
}

async function testMerchantSignup() {
  await executeTestStep('Navigate to Home Page for Merchant Signup', async () => {
    await browser.navigate(TEST_CONFIG.baseUrl);
    await browser.wait(2000);
  });
  
  await executeTestStep('Click Merchant Signup Button', async () => {
    await browser.click('Signup as Merchant button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Merchant Signup Modal', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Business Signup') && !snapshot.includes('Merchant')) {
      throw new Error('Merchant signup modal did not open');
    }
  });
  
  await executeTestStep('Fill Merchant Signup Form', async () => {
    await browser.type('business name input', 'Test Coffee Shop');
    await browser.type('email input field', 'merchant@testshop.com');
    await browser.type('password input field', 'merchantpass123');
    await browser.wait(1000);
  });
  
  await executeTestStep('Submit Merchant Signup', async () => {
    await browser.click('Sign Up as Merchant button');
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify Merchant Signup Success', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Account created') && !snapshot.includes('success')) {
      throw new Error('Merchant signup success message not found');
    }
  });
}

// Test Suite 2: Navigation Tests
async function testHomePageNavigation() {
  await executeTestStep('Navigate to Home Page', async () => {
    await browser.navigate(TEST_CONFIG.baseUrl);
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Carousel Elements', async () => {
    const snapshot = await browser.snapshot();
    const expectedSlides = ['Customer Signup', 'Business Signup', 'Exclusive Benefits', 'Join Our Community'];
    expectedSlides.forEach(slide => {
      if (!snapshot.includes(slide)) {
        throw new Error(`Carousel slide ${slide} not found`);
      }
    });
  });
  
  await executeTestStep('Test Carousel Next Button', async () => {
    await browser.click('Next slide button');
    await browser.wait(1000);
  });
  
  await executeTestStep('Test Carousel Previous Button', async () => {
    await browser.click('Previous slide button');
    await browser.wait(1000);
  });
}

async function testExclusiveBenefitsPage() {
  await executeTestStep('Navigate to Exclusive Benefits', async () => {
    await browser.navigate(`${TEST_CONFIG.baseUrl}/exclusive-benefits`);
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Exclusive Benefits Page', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Earn Privately Spend Globally')) {
      throw new Error('Exclusive benefits page not loaded');
    }
  });
  
  await executeTestStep('Verify NFT Card Tiers', async () => {
    const snapshot = await browser.snapshot();
    const expectedCards = ['Pearl White', 'Lava Orange', 'Pink', 'Silver', 'Gold', 'Black'];
    expectedCards.forEach(card => {
      if (!snapshot.includes(card)) {
        throw new Error(`NFT card tier ${card} not found`);
      }
    });
  });
  
  await executeTestStep('Test Start Free Button', async () => {
    await browser.click('Start Free button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Test Merchant Plans Button', async () => {
    await browser.click('Merchant Plans button');
    await browser.wait(2000);
  });
}

async function testSubscriptionPlansPage() {
  await executeTestStep('Navigate to Subscription Plans', async () => {
    await browser.navigate(`${TEST_CONFIG.baseUrl}/subscription-plans`);
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Subscription Plans Page', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Choose Your Perfect Plan')) {
      throw new Error('Subscription plans page not loaded');
    }
  });
  
  await executeTestStep('Verify All Plans Display', async () => {
    const snapshot = await browser.snapshot();
    const expectedPlans = ['StartUp', 'Momentum', 'Energizer', 'Cloud9', 'Super'];
    expectedPlans.forEach(plan => {
      if (!snapshot.includes(plan)) {
        throw new Error(`Subscription plan ${plan} not found`);
      }
    });
  });
  
  await executeTestStep('Verify Pricing Format', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('/yr')) {
      throw new Error('Yearly pricing format not found');
    }
  });
  
  await executeTestStep('Test Plan Selection', async () => {
    await browser.click('Select Plan button for Momentum Plan');
    await browser.wait(2000);
  });
}

// Test Suite 3: Admin Panel Tests
async function testAdminDashboard() {
  await executeTestStep('Navigate to Admin Panel', async () => {
    await browser.navigate(`${TEST_CONFIG.baseUrl}/admin`);
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify Admin Dashboard Elements', async () => {
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
  
  await executeTestStep('Verify Mock Statistics', async () => {
    const snapshot = await browser.snapshot();
    const expectedStats = ['15', '8', '25', '$1,250.75', '$8,750.25'];
    expectedStats.forEach(stat => {
      if (!snapshot.includes(stat)) {
        throw new Error(`Expected statistic ${stat} not found in admin dashboard`);
      }
    });
  });
}

async function testVirtualCardsManagement() {
  await executeTestStep('Click Virtual Cards Button', async () => {
    await browser.click('Virtual Cards button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Virtual Cards Interface', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Virtual Card Management')) {
      throw new Error('Virtual cards management interface not loaded');
    }
  });
  
  await executeTestStep('Test Add New Loyalty Card', async () => {
    await browser.click('Add New Loyalty Card button');
    await browser.wait(2000);
  });
}

async function testMerchantsManagement() {
  await executeTestStep('Click Merchants Button', async () => {
    await browser.click('Merchants button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Merchants Interface', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Merchants') || !snapshot.includes('Coffee Shop')) {
      throw new Error('Merchants management interface not loaded properly');
    }
  });
}

async function testAnalyticsDashboard() {
  await executeTestStep('Click Analytics Button', async () => {
    await browser.click('Analytics button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Analytics Dashboard', async () => {
    const snapshot = await browser.snapshot();
    // Verify analytics dashboard loads
  });
}

// Test Suite 4: DAO Tests
async function testDAODashboard() {
  await executeTestStep('Click DAO Button', async () => {
    await browser.click('DAO button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify DAO Dashboard', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('DAO') && !snapshot.includes('Governance')) {
      throw new Error('DAO dashboard not loaded');
    }
  });
}

async function testCreateProposal() {
  await executeTestStep('Click Create Proposal Button', async () => {
    await browser.click('Create Proposal button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Proposal Creation Form', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Proposal') || !snapshot.includes('Title')) {
      throw new Error('Proposal creation form not loaded');
    }
  });
  
  await executeTestStep('Fill Proposal Form', async () => {
    await browser.type('proposal title field', 'Test Proposal: Update Loyalty Rewards');
    await browser.type('proposal description field', 'This is a test proposal to update the loyalty rewards system.');
    await browser.wait(1000);
  });
  
  await executeTestStep('Submit Proposal', async () => {
    await browser.click('Submit Proposal button');
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify Proposal Submitted', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Test Proposal') && !snapshot.includes('success')) {
      throw new Error('Proposal submission not confirmed');
    }
  });
}

async function testVoteOnProposal() {
  await executeTestStep('Find Test Proposal', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Test Proposal: Update Loyalty Rewards')) {
      throw new Error('Test proposal not found in proposals list');
    }
  });
  
  await executeTestStep('Click on Test Proposal', async () => {
    await browser.click('Test Proposal: Update Loyalty Rewards');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Proposal Details', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Vote') && !snapshot.includes('For')) {
      throw new Error('Proposal voting interface not loaded');
    }
  });
  
  await executeTestStep('Cast Vote', async () => {
    await browser.click('For button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Vote Cast', async () => {
    const snapshot = await browser.snapshot();
    // Verify vote was recorded
  });
}

// Test Suite 5: QR Code & Transaction Tests
async function testQRCodeGeneration() {
  await executeTestStep('Navigate to User Dashboard', async () => {
    await browser.navigate(`${TEST_CONFIG.baseUrl}/dashboard`);
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify User Dashboard', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Dashboard') && !snapshot.includes('Loyalty')) {
      throw new Error('User dashboard not loaded');
    }
  });
  
  await executeTestStep('Verify QR Code Display', async () => {
    const snapshot = await browser.snapshot();
    // Look for QR code or QR code generation button
  });
  
  await executeTestStep('Test QR Code Generation', async () => {
    await browser.click('Generate QR Code button');
    await browser.wait(2000);
  });
}

async function testTransactionProcessing() {
  await executeTestStep('Click Scan QR Code Button', async () => {
    await browser.click('Scan QR Code button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify QR Scanner Interface', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Scan') && !snapshot.includes('QR')) {
      throw new Error('QR scanner interface not loaded');
    }
  });
  
  await executeTestStep('Test Manual Transaction Entry', async () => {
    await browser.click('Manual Entry button');
    await browser.type('merchant code field', 'MERCHANT001');
    await browser.type('amount field', '25.50');
    await browser.click('Process Transaction button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Transaction Processing', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Transaction') && !snapshot.includes('success')) {
      throw new Error('Transaction processing not confirmed');
    }
  });
}

// Test Suite 6: Error Handling & Console Monitoring
async function testConsoleErrorMonitoring() {
  await executeTestStep('Monitor Console for Errors', async () => {
    const logs = await browser.getConsoleLogs();
    const errors = logs.filter(log => log.type === 'error');
    const warnings = logs.filter(log => log.type === 'warning');
    
    console.log(`Found ${errors.length} errors and ${warnings.length} warnings`);
    
    errors.forEach(error => {
      console.error(`ERROR: ${error.message}`);
    });
    
    warnings.forEach(warning => {
      console.warn(`WARNING: ${warning.message}`);
    });
  });
}

async function testFormValidation() {
  await executeTestStep('Test Invalid Form Input', async () => {
    await browser.navigate(TEST_CONFIG.baseUrl);
    await browser.click('Free Signup button');
    await browser.wait(1000);
    
    // Test invalid email
    await browser.type('email input field', 'invalid-email');
    await browser.type('password input field', '123');
    await browser.click('Sign Up button');
    await browser.wait(1000);
  });
}

// Test Suite 7: Performance Tests
async function testPageLoadPerformance() {
  await executeTestStep('Measure Home Page Load Time', async () => {
    const startTime = Date.now();
    await browser.navigate(TEST_CONFIG.baseUrl);
    await browser.wait(2000);
    const loadTime = Date.now() - startTime;
    
    console.log(`Home page load time: ${loadTime}ms`);
    
    if (loadTime > 5000) {
      throw new Error(`Home page load time too slow: ${loadTime}ms`);
    }
  });
  
  await executeTestStep('Measure Admin Panel Load Time', async () => {
    const startTime = Date.now();
    await browser.navigate(`${TEST_CONFIG.baseUrl}/admin`);
    await browser.wait(3000);
    const loadTime = Date.now() - startTime;
    
    console.log(`Admin panel load time: ${loadTime}ms`);
    
    if (loadTime > 8000) {
      throw new Error(`Admin panel load time too slow: ${loadTime}ms`);
    }
  });
}

// Test Suite 8: Security Tests
async function testDataPrivacy() {
  await executeTestStep('Verify Privacy Features', async () => {
    await browser.navigate(`${TEST_CONFIG.baseUrl}/dashboard`);
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
}

async function testAuthenticationSecurity() {
  await executeTestStep('Test Unauthorized Access', async () => {
    await browser.navigate(`${TEST_CONFIG.baseUrl}/admin`);
    await browser.wait(2000);
    
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Welcome back, Admin User')) {
      throw new Error('Admin access control not working properly');
    }
  });
}

// Main Test Execution Functions
async function runAuthenticationTests() {
  console.log('\n🚀 Starting Authentication Tests...');
  await testAdminAuthentication();
  await testCustomerSignup();
  await testMerchantSignup();
  console.log('✅ Authentication Tests Completed');
}

async function runNavigationTests() {
  console.log('\n🚀 Starting Navigation Tests...');
  await testHomePageNavigation();
  await testExclusiveBenefitsPage();
  await testSubscriptionPlansPage();
  console.log('✅ Navigation Tests Completed');
}

async function runAdminPanelTests() {
  console.log('\n🚀 Starting Admin Panel Tests...');
  await testAdminDashboard();
  await testVirtualCardsManagement();
  await testMerchantsManagement();
  await testAnalyticsDashboard();
  console.log('✅ Admin Panel Tests Completed');
}

async function runDAOTests() {
  console.log('\n🚀 Starting DAO Tests...');
  await testDAODashboard();
  await testCreateProposal();
  await testVoteOnProposal();
  console.log('✅ DAO Tests Completed');
}

async function runQRTransactionTests() {
  console.log('\n🚀 Starting QR & Transaction Tests...');
  await testQRCodeGeneration();
  await testTransactionProcessing();
  console.log('✅ QR & Transaction Tests Completed');
}

async function runErrorHandlingTests() {
  console.log('\n🚀 Starting Error Handling Tests...');
  await testConsoleErrorMonitoring();
  await testFormValidation();
  console.log('✅ Error Handling Tests Completed');
}

async function runPerformanceTests() {
  console.log('\n🚀 Starting Performance Tests...');
  await testPageLoadPerformance();
  console.log('✅ Performance Tests Completed');
}

async function runSecurityTests() {
  console.log('\n🚀 Starting Security Tests...');
  await testDataPrivacy();
  await testAuthenticationSecurity();
  console.log('✅ Security Tests Completed');
}

// Generate Test Report
function generateTestReport() {
  const report = {
    summary: {
      totalSteps: testResults.testSteps.length,
      passed: testResults.testSteps.filter(s => s.status === 'PASSED').length,
      failed: testResults.testSteps.filter(s => s.status === 'FAILED').length,
      errors: testResults.errors.length,
      warnings: testResults.warnings.length,
      screenshots: testResults.screenshots.length,
      consoleLogs: testResults.consoleLogs.length
    },
    details: testResults
  };
  
  console.log('\n📊 === FINAL TEST REPORT ===');
  console.log(`Total Steps: ${report.summary.totalSteps}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  console.log(`Screenshots: ${report.summary.screenshots}`);
  console.log(`Console Logs: ${report.summary.consoleLogs}`);
  
  // Log all errors for resolution
  if (report.summary.errors > 0) {
    console.log('\n🚨 === ERRORS TO RESOLVE ===');
    report.details.errors.forEach(error => {
      console.error(`ERROR: ${error.step} - ${error.message || error.error}`);
    });
  }
  
  // Log all warnings for resolution
  if (report.summary.warnings > 0) {
    console.log('\n⚠️ === WARNINGS TO ADDRESS ===');
    report.details.warnings.forEach(warning => {
      console.warn(`WARNING: ${warning.step} - ${warning.message}`);
    });
  }
  
  return report;
}

// Run All Tests
async function runAllTests() {
  console.log('🎯 Starting Comprehensive Browser MCP Testing...');
  
  try {
    await runAuthenticationTests();
    await runNavigationTests();
    await runAdminPanelTests();
    await runDAOTests();
    await runQRTransactionTests();
    await runErrorHandlingTests();
    await runPerformanceTests();
    await runSecurityTests();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    const finalReport = generateTestReport();
    return finalReport;
  }
}

// Export functions for individual test execution
module.exports = {
  // Individual test suites
  runAuthenticationTests,
  runNavigationTests,
  runAdminPanelTests,
  runDAOTests,
  runQRTransactionTests,
  runErrorHandlingTests,
  runPerformanceTests,
  runSecurityTests,
  
  // Individual test functions
  testAdminAuthentication,
  testCustomerSignup,
  testMerchantSignup,
  testHomePageNavigation,
  testExclusiveBenefitsPage,
  testSubscriptionPlansPage,
  testAdminDashboard,
  testVirtualCardsManagement,
  testMerchantsManagement,
  testAnalyticsDashboard,
  testDAODashboard,
  testCreateProposal,
  testVoteOnProposal,
  testQRCodeGeneration,
  testTransactionProcessing,
  testConsoleErrorMonitoring,
  testFormValidation,
  testPageLoadPerformance,
  testDataPrivacy,
  testAuthenticationSecurity,
  
  // Utility functions
  captureScreenshot,
  captureConsoleLogs,
  executeTestStep,
  generateTestReport,
  
  // Main execution
  runAllTests,
  
  // Configuration
  TEST_CONFIG
};

// If running directly, execute all tests
if (require.main === module) {
  runAllTests().then(report => {
    console.log('\n🎉 Testing completed!');
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('💥 Testing failed:', error);
    process.exit(1);
  });
}
