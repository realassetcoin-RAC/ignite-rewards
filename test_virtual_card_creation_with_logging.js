#!/usr/bin/env node

/**
 * Comprehensive Virtual Card Creation Test with Full Logging
 * 
 * This script tests virtual card creation functionality with detailed logging
 * and error tracking to identify and resolve the admin dashboard issues.
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
      'x-client-info': 'virtual-card-test-script'
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
      if (error.stack) {
        console.log(`   Stack Trace:`, error.stack);
      }
    }
  },
  debug: (message, data = {}) => {
    console.log(`🐛 [DEBUG] ${message}`, Object.keys(data).length ? data : '');
  }
};

// Test data for virtual cards
const testVirtualCards = [
  {
    card_name: "Basic Rewards Card",
    card_type: "loyalty",
    description: "A basic loyalty card with standard rewards",
    image_url: "https://example.com/basic-card.jpg",
    subscription_plan: "basic",
    pricing_type: "free",
    one_time_fee: 0,
    monthly_fee: 0,
    annual_fee: 0,
    features: ["Basic rewards", "Mobile app access", "Customer support"],
    is_active: true
  },
  {
    card_name: "Premium Rewards Card",
    card_type: "loyalty_plus",
    description: "Premium loyalty card with enhanced benefits",
    image_url: "https://example.com/premium-card.jpg",
    subscription_plan: "premium",
    pricing_type: "subscription",
    one_time_fee: 0,
    monthly_fee: 9.99,
    annual_fee: 99.99,
    features: ["Premium rewards", "Priority support", "Exclusive offers", "Advanced analytics"],
    is_active: true
  },
  {
    card_name: "Enterprise Card",
    card_type: "loyalty_plus",
    description: "Enterprise-level loyalty card for businesses",
    image_url: "https://example.com/enterprise-card.jpg",
    subscription_plan: "enterprise",
    pricing_type: "one_time",
    one_time_fee: 299.99,
    monthly_fee: 0,
    annual_fee: 0,
    features: ["All premium features", "Custom branding", "API access", "Dedicated account manager"],
    is_active: true
  }
];

// Error tracking
const errors = [];
const trackError = (operation, error, context = {}) => {
  const errorEntry = {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    operation,
    error: {
      message: error?.message || 'Unknown error',
      code: error?.code || error?.status,
      details: error?.details,
      hint: error?.hint
    },
    context,
    originalError: error
  };
  
  errors.push(errorEntry);
  return errorEntry.id;
};

// Database connectivity test
async function testDatabaseConnection() {
  log.info("Testing database connection...");
  
  try {
    const { data, error } = await supabase
      .from('virtual_cards')
      .select('count')
      .limit(1);
    
    if (error) {
      const errorId = trackError('database_connection', error);
      log.error("Database connection failed", error, { errorId });
      return false;
    }
    
    log.success("Database connection successful");
    return true;
  } catch (error) {
    const errorId = trackError('database_connection', error);
    log.error("Database connection test failed", error, { errorId });
    return false;
  }
}

// Test table access and permissions
async function testTableAccess() {
  log.info("Testing virtual_cards table access...");
  
  try {
    // Test SELECT permission
    const { data: selectData, error: selectError } = await supabase
      .from('virtual_cards')
      .select('id, card_name, card_type')
      .limit(5);
    
    if (selectError) {
      const errorId = trackError('table_select', selectError);
      log.error("SELECT permission test failed", selectError, { errorId });
    } else {
      log.success("SELECT permission test passed", { count: selectData?.length || 0 });
    }
    
    // Test INSERT permission (we'll delete this right after)
    const testCard = {
      card_name: "TEST_CARD_DELETE_ME",
      card_type: "test",
      description: "This is a test card that should be deleted immediately",
      pricing_type: "free",
      one_time_fee: 0,
      monthly_fee: 0,
      annual_fee: 0,
      is_active: false
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('virtual_cards')
      .insert([testCard])
      .select();
    
    if (insertError) {
      const errorId = trackError('table_insert', insertError, { testCard });
      log.error("INSERT permission test failed", insertError, { errorId });
      return false;
    } else {
      log.success("INSERT permission test passed", { insertedId: insertData?.[0]?.id });
      
      // Clean up test card
      if (insertData?.[0]?.id) {
        const { error: deleteError } = await supabase
          .from('virtual_cards')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          log.warn("Failed to clean up test card", deleteError);
        } else {
          log.debug("Test card cleaned up successfully");
        }
      }
    }
    
    return true;
  } catch (error) {
    const errorId = trackError('table_access', error);
    log.error("Table access test failed", error, { errorId });
    return false;
  }
}

// Test virtual card creation
async function testVirtualCardCreation(cardData, index) {
  log.info(`Testing virtual card creation ${index + 1}/${testVirtualCards.length}: ${cardData.card_name}`);
  
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('virtual_cards')
      .insert([cardData])
      .select();
    
    const duration = Date.now() - startTime;
    
    if (error) {
      const errorId = trackError('card_creation', error, { cardData, index });
      log.error(`Virtual card creation failed: ${cardData.card_name}`, error, { 
        errorId,
        duration: `${duration}ms`,
        cardType: cardData.card_type,
        pricingType: cardData.pricing_type
      });
      return false;
    }
    
    const createdCard = data?.[0];
    log.success(`Virtual card created successfully: ${cardData.card_name}`, {
      id: createdCard?.id,
      duration: `${duration}ms`,
      cardType: cardData.card_type,
      pricingType: cardData.pricing_type
    });
    
    return createdCard;
  } catch (error) {
    const errorId = trackError('card_creation', error, { cardData, index });
    log.error(`Virtual card creation threw exception: ${cardData.card_name}`, error, { 
      errorId,
      cardType: cardData.card_type 
    });
    return false;
  }
}

// Test virtual card loading
async function testVirtualCardLoading() {
  log.info("Testing virtual card loading...");
  
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    const duration = Date.now() - startTime;
    
    if (error) {
      const errorId = trackError('card_loading', error);
      log.error("Virtual card loading failed", error, { errorId, duration: `${duration}ms` });
      return false;
    }
    
    log.success("Virtual card loading successful", {
      count: data?.length || 0,
      duration: `${duration}ms`,
      cards: data?.slice(0, 3).map(card => ({
        id: card.id,
        name: card.card_name,
        type: card.card_type
      }))
    });
    
    return data;
  } catch (error) {
    const errorId = trackError('card_loading', error);
    log.error("Virtual card loading threw exception", error, { errorId });
    return false;
  }
}

// Test user authentication status
async function testUserAuthentication() {
  log.info("Testing user authentication...");
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      log.warn("User authentication check failed", error);
      return null;
    }
    
    if (user) {
      log.success("User is authenticated", { 
        userId: user.id,
        email: user.email,
        role: user.user_metadata?.role
      });
    } else {
      log.info("No authenticated user found");
    }
    
    return user;
  } catch (error) {
    log.error("User authentication test threw exception", error);
    return null;
  }
}

// Test admin permissions
async function testAdminPermissions() {
  log.info("Testing admin permissions...");
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .single();
    
    if (error) {
      log.warn("Admin permission check failed", error);
      return false;
    }
    
    const isAdmin = profile?.role === 'admin';
    
    if (isAdmin) {
      log.success("User has admin permissions", { 
        role: profile.role,
        name: profile.full_name
      });
    } else {
      log.info("User does not have admin permissions", { 
        role: profile?.role || 'unknown'
      });
    }
    
    return isAdmin;
  } catch (error) {
    log.error("Admin permission test threw exception", error);
    return false;
  }
}

// Generate comprehensive error report
function generateErrorReport() {
  if (errors.length === 0) {
    log.success("No errors encountered during testing! 🎉");
    return;
  }
  
  log.error(`Found ${errors.length} error(s) during testing:`);
  console.log("\n" + "=".repeat(80));
  console.log("COMPREHENSIVE ERROR REPORT");
  console.log("=".repeat(80));
  
  errors.forEach((error, index) => {
    console.log(`\nError ${index + 1}/${errors.length}:`);
    console.log(`  ID: ${error.id}`);
    console.log(`  Time: ${error.timestamp}`);
    console.log(`  Operation: ${error.operation}`);
    console.log(`  Message: ${error.error.message}`);
    
    if (error.error.code) {
      console.log(`  Code: ${error.error.code}`);
    }
    
    if (error.error.details) {
      console.log(`  Details: ${error.error.details}`);
    }
    
    if (error.error.hint) {
      console.log(`  Hint: ${error.error.hint}`);
    }
    
    if (Object.keys(error.context).length > 0) {
      console.log(`  Context:`, error.context);
    }
    
    console.log("  " + "-".repeat(60));
  });
  
  // Error summary by type
  const errorsByType = {};
  errors.forEach(error => {
    const type = error.error.code || 'unknown';
    errorsByType[type] = (errorsByType[type] || 0) + 1;
  });
  
  console.log("\nError Summary by Type:");
  Object.entries(errorsByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} error(s)`);
  });
  
  console.log("\n" + "=".repeat(80));
}

// Main test execution
async function runComprehensiveTest() {
  console.log("🚀 Starting Comprehensive Virtual Card Creation Test with Full Logging\n");
  
  const testResults = {
    databaseConnection: false,
    tableAccess: false,
    userAuthentication: null,
    adminPermissions: false,
    cardCreation: [],
    cardLoading: false,
    totalErrors: 0
  };
  
  // Test 1: Database Connection
  testResults.databaseConnection = await testDatabaseConnection();
  
  if (!testResults.databaseConnection) {
    log.error("Skipping further tests due to database connection failure");
    generateErrorReport();
    return testResults;
  }
  
  // Test 2: Table Access
  testResults.tableAccess = await testTableAccess();
  
  // Test 3: User Authentication
  testResults.userAuthentication = await testUserAuthentication();
  
  // Test 4: Admin Permissions
  testResults.adminPermissions = await testAdminPermissions();
  
  // Test 5: Virtual Card Creation
  log.info(`\nTesting virtual card creation with ${testVirtualCards.length} test cards...\n`);
  
  for (let i = 0; i < testVirtualCards.length; i++) {
    const result = await testVirtualCardCreation(testVirtualCards[i], i);
    testResults.cardCreation.push(result);
    
    // Add delay between creations to avoid rate limiting
    if (i < testVirtualCards.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Test 6: Virtual Card Loading
  testResults.cardLoading = await testVirtualCardLoading();
  
  // Final results
  testResults.totalErrors = errors.length;
  
  console.log("\n" + "=".repeat(80));
  console.log("FINAL TEST RESULTS");
  console.log("=".repeat(80));
  
  console.log(`Database Connection: ${testResults.databaseConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Table Access: ${testResults.tableAccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Authentication: ${testResults.userAuthentication ? '✅ AUTHENTICATED' : '⚠️ NOT AUTHENTICATED'}`);
  console.log(`Admin Permissions: ${testResults.adminPermissions ? '✅ ADMIN' : '⚠️ NOT ADMIN'}`);
  
  const successfulCreations = testResults.cardCreation.filter(result => result !== false).length;
  console.log(`Card Creation: ${successfulCreations}/${testVirtualCards.length} successful`);
  console.log(`Card Loading: ${testResults.cardLoading ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total Errors: ${testResults.totalErrors}`);
  
  // Generate error report
  generateErrorReport();
  
  // Recommendations
  console.log("\n" + "=".repeat(80));
  console.log("RECOMMENDATIONS");
  console.log("=".repeat(80));
  
  if (!testResults.databaseConnection) {
    console.log("❌ Fix database connection issues before proceeding");
  }
  
  if (!testResults.tableAccess) {
    console.log("❌ Grant proper permissions to virtual_cards table");
  }
  
  if (!testResults.userAuthentication) {
    console.log("⚠️ User authentication required for admin operations");
  }
  
  if (!testResults.adminPermissions) {
    console.log("⚠️ Admin role required for virtual card management");
  }
  
  if (successfulCreations < testVirtualCards.length) {
    console.log("❌ Fix virtual card creation issues");
  }
  
  if (testResults.totalErrors === 0) {
    console.log("🎉 All tests passed! Virtual card functionality is working correctly.");
  }
  
  return testResults;
}

// Run the test
runComprehensiveTest()
  .then(results => {
    console.log(`\n✅ Test completed. Check the results above for detailed information.`);
    process.exit(results.totalErrors > 0 ? 1 : 0);
  })
  .catch(error => {
    log.error("Test execution failed", error);
    process.exit(1);
  });