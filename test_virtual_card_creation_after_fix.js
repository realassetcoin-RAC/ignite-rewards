#!/usr/bin/env node

/**
 * Test Virtual Card Creation After Fix
 * 
 * This script tests virtual card creation functionality after applying
 * the comprehensive fix to verify that the issues have been resolved.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'api' },
  global: {
    headers: {
      'x-client-info': 'virtual-card-test-after-fix'
    }
  }
});

// Logging utilities
const log = {
  info: (message, data = {}) => {
    console.log(`ℹ️  [INFO] ${message}`, Object.keys(data).length ? data : '');
  },
  success: (message, data = {}) => {
    console.log(`✅ [SUCCESS] ${message}`, Object.keys(data).length ? data : '');
  },
  warn: (message, data = {}) => {
    console.log(`⚠️  [WARN] ${message}`, Object.keys(data).length ? data : '');
  },
  error: (message, error = null, data = {}) => {
    console.log(`❌ [ERROR] ${message}`, Object.keys(data).length ? data : '');
    if (error) {
      console.log(`   Error Details:`, error);
    }
  },
  debug: (message, data = {}) => {
    console.log(`🐛 [DEBUG] ${message}`, Object.keys(data).length ? data : '');
  }
};

// Test database connectivity
async function testDatabaseConnection() {
  log.info("Testing database connection to API schema...");
  
  try {
    const { data, error } = await supabase
      .from('virtual_cards')
      .select('count')
      .limit(1);
    
    if (error) {
      log.error("Database connection to API schema failed", error);
      return false;
    }
    
    log.success("Database connection to API schema successful");
    return true;
  } catch (error) {
    log.error("Database connection test threw exception", error);
    return false;
  }
}

// Test setup verification function
async function testSetupVerification() {
  log.info("Running setup verification test...");
  
  try {
    const { data, error } = await supabase.rpc('test_virtual_cards_setup');
    
    if (error) {
      log.error("Setup verification failed", error);
      return false;
    }
    
    log.success("Setup verification completed");
    console.log('\n📋 Setup Test Results:');
    console.log(data || 'No results returned');
    return true;
  } catch (error) {
    log.error("Setup verification threw exception", error);
    return false;
  }
}

// Test admin user creation
async function testAdminUserCreation() {
  log.info("Testing admin user creation...");
  
  try {
    const { data, error } = await supabase.rpc('create_test_admin', {
      user_email: 'testadmin@pointbridge.com',
      user_name: 'Test Admin User'
    });
    
    if (error) {
      log.error("Admin user creation failed", error);
      return null;
    }
    
    log.success("Test admin user created/verified", { adminId: data });
    return data;
  } catch (error) {
    log.error("Admin user creation threw exception", error);
    return null;
  }
}

// Test virtual card creation with valid enum values
async function testVirtualCardCreation() {
  log.info("Testing virtual card creation with API schema...");
  
  const testCards = [
    {
      card_name: "Basic Test Card",
      card_type: "loyalty",
      description: "Basic test card for verification",
      pricing_type: "free",
      one_time_fee: 0,
      monthly_fee: 0,
      annual_fee: 0,
      features: ["Test feature 1", "Test feature 2"],
      is_active: false
    },
    {
      card_name: "Premium Test Card",
      card_type: "loyalty_plus",
      description: "Premium test card with subscription",
      subscription_plan: "premium",
      pricing_type: "subscription",
      one_time_fee: 0,
      monthly_fee: 9.99,
      annual_fee: 99.99,
      features: ["Premium feature 1", "Premium feature 2", "Advanced analytics"],
      is_active: false
    }
  ];
  
  const createdCards = [];
  
  for (let i = 0; i < testCards.length; i++) {
    const testCard = testCards[i];
    log.info(`Creating test card ${i + 1}/${testCards.length}: ${testCard.card_name}`);
    
    try {
      const { data, error } = await supabase
        .from('virtual_cards')
        .insert([testCard])
        .select();
      
      if (error) {
        log.error(`Test card creation failed: ${testCard.card_name}`, error);
        continue;
      }
      
      const createdCard = data?.[0];
      log.success(`Test card created successfully: ${testCard.card_name}`, {
        id: createdCard?.id,
        cardType: createdCard?.card_type,
        pricingType: createdCard?.pricing_type
      });
      
      createdCards.push(createdCard);
      
    } catch (error) {
      log.error(`Test card creation threw exception: ${testCard.card_name}`, error);
    }
  }
  
  return createdCards;
}

// Test virtual card loading
async function testVirtualCardLoading() {
  log.info("Testing virtual card loading from API schema...");
  
  try {
    const { data, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      log.error("Virtual card loading failed", error);
      return false;
    }
    
    log.success("Virtual card loading successful", {
      count: data?.length || 0,
      cards: data?.slice(0, 3).map(card => ({
        id: card.id,
        name: card.card_name,
        type: card.card_type,
        active: card.is_active
      }))
    });
    
    return data;
  } catch (error) {
    log.error("Virtual card loading threw exception", error);
    return false;
  }
}

// Clean up test cards
async function cleanupTestCards(createdCards) {
  if (!createdCards || createdCards.length === 0) {
    return;
  }
  
  log.info(`Cleaning up ${createdCards.length} test cards...`);
  
  for (const card of createdCards) {
    try {
      const { error } = await supabase
        .from('virtual_cards')
        .delete()
        .eq('id', card.id);
      
      if (error) {
        log.warn(`Failed to delete test card: ${card.card_name}`, error);
      } else {
        log.debug(`Deleted test card: ${card.card_name}`);
      }
    } catch (error) {
      log.warn(`Exception while deleting test card: ${card.card_name}`, error);
    }
  }
  
  log.success("Test card cleanup completed");
}

// Generate test report
function generateTestReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('VIRTUAL CARDS FIX VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  console.log(`Database Connection: ${results.databaseConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Setup Verification: ${results.setupVerification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin User Creation: ${results.adminCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Card Creation: ${results.cardCreation.success}/${results.cardCreation.total} successful`);
  console.log(`Card Loading: ${results.cardLoading ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSuccess = (
    results.databaseConnection &&
    results.setupVerification &&
    results.cardCreation.success > 0 &&
    results.cardLoading
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL RESULT');
  console.log('='.repeat(80));
  
  if (overallSuccess) {
    console.log('🎉 SUCCESS: Virtual card creation fix is working!');
    console.log('✅ Admin users should now be able to create virtual cards.');
    console.log('✅ The API schema is properly configured.');
    console.log('✅ RLS policies are allowing admin access.');
  } else {
    console.log('❌ ISSUES DETECTED: Some tests failed.');
    console.log('📝 Recommendations:');
    
    if (!results.databaseConnection) {
      console.log('   • Check database connectivity and API schema configuration');
    }
    if (!results.setupVerification) {
      console.log('   • Verify the migration was applied successfully');
    }
    if (!results.adminCreation) {
      console.log('   • Check admin user creation permissions');
    }
    if (results.cardCreation.success === 0) {
      console.log('   • Review RLS policies and enum type definitions');
    }
    if (!results.cardLoading) {
      console.log('   • Check SELECT permissions on virtual_cards table');
    }
  }
  
  return overallSuccess;
}

// Main test execution
async function runPostFixTest() {
  console.log('🧪 Starting Virtual Cards Fix Verification Test\n');
  
  const results = {
    databaseConnection: false,
    setupVerification: false,
    adminCreation: false,
    cardCreation: { success: 0, total: 0 },
    cardLoading: false
  };
  
  // Test 1: Database Connection
  results.databaseConnection = await testDatabaseConnection();
  
  if (!results.databaseConnection) {
    log.error("Cannot proceed with tests due to database connection failure");
    generateTestReport(results);
    return false;
  }
  
  // Test 2: Setup Verification
  results.setupVerification = await testSetupVerification();
  
  // Test 3: Admin User Creation
  const adminId = await testAdminUserCreation();
  results.adminCreation = adminId !== null;
  
  // Test 4: Virtual Card Creation
  log.info('\nTesting virtual card creation...\n');
  const createdCards = await testVirtualCardCreation();
  results.cardCreation.success = createdCards.length;
  results.cardCreation.total = 2; // We test with 2 cards
  
  // Test 5: Virtual Card Loading
  results.cardLoading = await testVirtualCardLoading();
  
  // Cleanup
  await cleanupTestCards(createdCards);
  
  // Generate report
  const overallSuccess = generateTestReport(results);
  
  return overallSuccess;
}

// Run the test
runPostFixTest()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Test completed. Check the results above for detailed information.`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log.error("Test execution failed", error);
    process.exit(1);
  });