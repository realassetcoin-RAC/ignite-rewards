// Admin DAO Creation Tests - Browser MCP Test Script
// This script tests the admin's ability to create DAO entries through the admin dashboard

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8086',
  adminUser: {
    email: 'admin@igniterewards.com',
    password: 'admin123!'
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

// Test Suite: Admin DAO Creation Tests

async function testAdminDAODashboardAccess() {
  await executeTestStep('Navigate to Admin Panel', async () => {
    await browser.navigate(`${TEST_CONFIG.baseUrl}/admin`);
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify Admin Dashboard Loads', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Welcome back, Admin User')) {
      throw new Error('Admin dashboard not loaded');
    }
  });
  
  await executeTestStep('Click DAO Button', async () => {
    await browser.click('DAO button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify DAO Dashboard Loads', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('DAO') && !snapshot.includes('Governance')) {
      throw new Error('DAO dashboard not loaded');
    }
  });
}

async function testCreateDAOOrganization() {
  await executeTestStep('Click Create DAO Organization Button', async () => {
    await browser.click('Create DAO Organization button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify DAO Organization Creation Form', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('DAO Organization') || !snapshot.includes('Name')) {
      throw new Error('DAO organization creation form not loaded');
    }
  });
  
  await executeTestStep('Fill DAO Organization Form', async () => {
    await browser.type('DAO name field', 'RAC Rewards DAO');
    await browser.type('DAO description field', 'Decentralized governance for the RAC Rewards loyalty platform');
    await browser.type('governance token symbol field', 'RAC');
    await browser.type('governance token decimals field', '9');
    await browser.type('min proposal threshold field', '100');
    await browser.type('voting period days field', '7');
    await browser.type('quorum percentage field', '10.0');
    await browser.type('super majority threshold field', '66.67');
    await browser.wait(1000);
  });
  
  await executeTestStep('Submit DAO Organization', async () => {
    await browser.click('Create DAO Organization button');
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify DAO Organization Created', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('RAC Rewards DAO') && !snapshot.includes('success')) {
      throw new Error('DAO organization creation not confirmed');
    }
  });
}

async function testCreateDAOMembers() {
  await executeTestStep('Click Add DAO Member Button', async () => {
    await browser.click('Add DAO Member button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify DAO Member Creation Form', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('DAO Member') || !snapshot.includes('User')) {
      throw new Error('DAO member creation form not loaded');
    }
  });
  
  await executeTestStep('Fill DAO Member Form - Admin', async () => {
    await browser.type('user email field', 'admin@igniterewards.com');
    await browser.type('wallet address field', 'AdminWallet123456789');
    await browser.select('role dropdown', 'admin');
    await browser.type('governance tokens field', '10000');
    await browser.type('voting power field', '10000');
    await browser.wait(1000);
  });
  
  await executeTestStep('Submit DAO Member - Admin', async () => {
    await browser.click('Add DAO Member button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Add Regular DAO Member', async () => {
    await browser.click('Add DAO Member button');
    await browser.wait(1000);
    
    await browser.type('user email field', 'user@example.com');
    await browser.type('wallet address field', 'MemberWallet123456789');
    await browser.select('role dropdown', 'member');
    await browser.type('governance tokens field', '5000');
    await browser.type('voting power field', '5000');
    await browser.wait(1000);
    
    await browser.click('Add DAO Member button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify DAO Members Created', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('admin@igniterewards.com') && !snapshot.includes('user@example.com')) {
      throw new Error('DAO members not found in list');
    }
  });
}

async function testCreateDAOProposal() {
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
  
  await executeTestStep('Fill Proposal Form - Active Proposal', async () => {
    await browser.type('proposal title field', 'Increase Loyalty Point Rewards by 20%');
    await browser.type('proposal description field', 'Proposal to increase the loyalty point multiplier from 1x to 1.2x for all merchants');
    await browser.type('full description field', 'This proposal aims to increase customer engagement by boosting the loyalty point rewards. The change would affect all merchants on the platform and require updates to the reward calculation system. This would incentivize more customer participation and increase overall platform usage.');
    await browser.select('category dropdown', 'governance');
    await browser.select('voting type dropdown', 'simple_majority');
    await browser.type('treasury impact amount field', '0');
    await browser.type('treasury impact currency field', 'SOL');
    await browser.wait(1000);
  });
  
  await executeTestStep('Submit Active Proposal', async () => {
    await browser.click('Submit Proposal button');
    await browser.wait(3000);
  });
  
  await executeTestStep('Verify Active Proposal Created', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Increase Loyalty Point Rewards by 20%') && !snapshot.includes('success')) {
      throw new Error('Active proposal creation not confirmed');
    }
  });
  
  await executeTestStep('Create Second Proposal - Technical', async () => {
    await browser.click('Create Proposal button');
    await browser.wait(2000);
    
    await browser.type('proposal title field', 'Add Solana USDC as Payment Option');
    await browser.type('proposal description field', 'Enable USDC payments on Solana blockchain for loyalty transactions');
    await browser.type('full description field', 'This proposal would integrate Solana USDC as a payment method, allowing users to pay for loyalty transactions using USDC. This would require integration with Solana wallet providers and USDC token handling.');
    await browser.select('category dropdown', 'technical');
    await browser.select('voting type dropdown', 'simple_majority');
    await browser.type('treasury impact amount field', '0');
    await browser.type('treasury impact currency field', 'USDC');
    await browser.wait(1000);
    
    await browser.click('Submit Proposal button');
    await browser.wait(3000);
  });
  
  await executeTestStep('Create Draft Proposal', async () => {
    await browser.click('Create Proposal button');
    await browser.wait(2000);
    
    await browser.type('proposal title field', 'Add NFT Rewards for High-Value Customers');
    await browser.type('proposal description field', 'Proposal to create NFT rewards for customers with high loyalty points');
    await browser.type('full description field', 'This proposal would create a new NFT reward system for customers who accumulate high loyalty points. The NFTs would be unique and could provide additional benefits or be traded on secondary markets.');
    await browser.select('category dropdown', 'rewards');
    await browser.select('voting type dropdown', 'simple_majority');
    await browser.type('treasury impact amount field', '0');
    await browser.type('treasury impact currency field', 'SOL');
    await browser.wait(1000);
    
    // Save as draft instead of submitting
    await browser.click('Save as Draft button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify All Proposals Created', async () => {
    const snapshot = await browser.snapshot();
    const expectedProposals = [
      'Increase Loyalty Point Rewards by 20%',
      'Add Solana USDC as Payment Option',
      'Add NFT Rewards for High-Value Customers'
    ];
    
    expectedProposals.forEach(proposal => {
      if (!snapshot.includes(proposal)) {
        throw new Error(`Proposal "${proposal}" not found in list`);
      }
    });
  });
}

async function testDAOProposalVoting() {
  await executeTestStep('Click on Active Proposal', async () => {
    await browser.click('Increase Loyalty Point Rewards by 20%');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Proposal Details Page', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Vote') && !snapshot.includes('Yes') && !snapshot.includes('No')) {
      throw new Error('Proposal voting interface not loaded');
    }
  });
  
  await executeTestStep('Cast Yes Vote', async () => {
    await browser.click('Yes button');
    await browser.type('voting reason field', 'This will increase user engagement and platform adoption.');
    await browser.click('Submit Vote button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Vote Recorded', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Vote recorded') && !snapshot.includes('success')) {
      throw new Error('Vote submission not confirmed');
    }
  });
  
  await executeTestStep('Verify Vote Count Updated', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('1') && !snapshot.includes('vote')) {
      throw new Error('Vote count not updated');
    }
  });
}

async function testDAOProposalManagement() {
  await executeTestStep('Navigate to Proposals List', async () => {
    await browser.click('Back to Proposals button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Proposal Statuses', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Active') && !snapshot.includes('Draft')) {
      throw new Error('Proposal statuses not displayed correctly');
    }
  });
  
  await executeTestStep('Edit Draft Proposal', async () => {
    await browser.click('Add NFT Rewards for High-Value Customers');
    await browser.wait(2000);
    
    await browser.click('Edit Proposal button');
    await browser.wait(1000);
    
    await browser.type('full description field', ' This is an updated description with more details about the NFT reward system.');
    await browser.wait(1000);
    
    await browser.click('Update Proposal button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Activate Draft Proposal', async () => {
    await browser.click('Activate Proposal button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Proposal Activated', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Active') && !snapshot.includes('success')) {
      throw new Error('Proposal activation not confirmed');
    }
  });
}

async function testDAOAnalytics() {
  await executeTestStep('Click DAO Analytics Tab', async () => {
    await browser.click('Analytics tab');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify DAO Analytics Dashboard', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('Analytics') && !snapshot.includes('Statistics')) {
      throw new Error('DAO analytics dashboard not loaded');
    }
  });
  
  await executeTestStep('Verify DAO Statistics', async () => {
    const snapshot = await browser.snapshot();
    // Check for key metrics
    const expectedMetrics = ['Total Proposals', 'Active Proposals', 'Total Members', 'Voting Participation'];
    expectedMetrics.forEach(metric => {
      if (!snapshot.includes(metric)) {
        throw new Error(`DAO metric "${metric}" not found`);
      }
    });
  });
}

async function testDAOMemberManagement() {
  await executeTestStep('Click DAO Members Tab', async () => {
    await browser.click('Members tab');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify DAO Members List', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('admin@igniterewards.com') && !snapshot.includes('user@example.com')) {
      throw new Error('DAO members not displayed in list');
    }
  });
  
  await executeTestStep('Edit DAO Member', async () => {
    await browser.click('admin@igniterewards.com');
    await browser.wait(1000);
    
    await browser.click('Edit Member button');
    await browser.wait(1000);
    
    await browser.type('voting power field', '12000');
    await browser.wait(1000);
    
    await browser.click('Update Member button');
    await browser.wait(2000);
  });
  
  await executeTestStep('Verify Member Updated', async () => {
    const snapshot = await browser.snapshot();
    if (!snapshot.includes('12000') && !snapshot.includes('success')) {
      throw new Error('Member update not confirmed');
    }
  });
}

// Main Test Execution Functions
async function runAdminDAOCreationTests() {
  console.log('\n🚀 Starting Admin DAO Creation Tests...');
  
  try {
    await testAdminDAODashboardAccess();
    await testCreateDAOOrganization();
    await testCreateDAOMembers();
    await testCreateDAOProposal();
    await testDAOProposalVoting();
    await testDAOProposalManagement();
    await testDAOAnalytics();
    await testDAOMemberManagement();
    
    console.log('✅ Admin DAO Creation Tests Completed Successfully');
    
  } catch (error) {
    console.error('❌ Admin DAO Creation Tests Failed:', error);
  }
}

// Generate Test Report
function generateDAOTestReport() {
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
  
  console.log('\n📊 === DAO TEST REPORT ===');
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

// Export functions for execution
module.exports = {
  runAdminDAOCreationTests,
  testAdminDAODashboardAccess,
  testCreateDAOOrganization,
  testCreateDAOMembers,
  testCreateDAOProposal,
  testDAOProposalVoting,
  testDAOProposalManagement,
  testDAOAnalytics,
  testDAOMemberManagement,
  generateDAOTestReport,
  TEST_CONFIG
};

// If running directly, execute all tests
if (require.main === module) {
  runAdminDAOCreationTests().then(report => {
    const finalReport = generateDAOTestReport();
    console.log('\n🎉 DAO Testing completed!');
    process.exit(finalReport.summary.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('💥 DAO Testing failed:', error);
    process.exit(1);
  });
}
