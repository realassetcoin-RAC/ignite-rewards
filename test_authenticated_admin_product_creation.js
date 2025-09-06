#!/usr/bin/env node

/**
 * Test Authenticated Admin Loyalty Card Product Creation
 * This script simulates an authenticated admin creating loyalty card products
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Create Supabase client (same config as frontend - api schema)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'api' }
});

console.log('🔐 Testing Authenticated Admin Loyalty Card Product Creation...');
console.log('===============================================================\n');

// Test data for loyalty card products
const testLoyaltyCardProducts = [
  {
    card_name: "Basic Loyalty Card",
    card_type: "Standard",
    description: "Entry-level loyalty card with basic rewards",
    subscription_plan: "basic",
    pricing_type: "free",
    one_time_fee: 0,
    monthly_fee: 0,
    annual_fee: 0,
    features: ["Basic rewards", "Mobile app access", "Customer support"],
    is_active: true
  },
  {
    card_name: "Premium Loyalty Card", 
    card_type: "Premium",
    description: "Premium loyalty card with enhanced benefits",
    subscription_plan: "premium",
    pricing_type: "subscription",
    one_time_fee: 0,
    monthly_fee: 9.99,
    annual_fee: 99.99,
    features: ["Premium rewards", "Priority support", "Exclusive offers", "Advanced analytics"],
    is_active: true
  },
  {
    card_name: "VIP Loyalty Card", 
    card_type: "VIP",
    description: "Custom VIP loyalty card with exclusive benefits",
    subscription_plan: "premium",
    pricing_type: "one_time",
    one_time_fee: 199.99,
    monthly_fee: 0,
    annual_fee: 0,
    features: ["VIP rewards", "Concierge service", "Exclusive events", "Priority everything"],
    is_active: true
  }
];

// Test database connection
async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('virtual_cards')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Connection failed: ${error.message} (${error.code})`);
      return false;
    }
    
    console.log('   ✅ Database connection successful');
    return true;
  } catch (error) {
    console.log(`   ❌ Connection exception: ${error.message}`);
    return false;
  }
}

// Test virtual_cards table access
async function testVirtualCardsTableAccess() {
  console.log('\n📊 Testing virtual_cards table access...');
  
  try {
    // Test SELECT permission
    const { data: selectData, error: selectError } = await supabase
      .from('virtual_cards')
      .select('id, card_name, card_type, is_active')
      .limit(5);
    
    if (selectError) {
      console.log(`   ❌ SELECT failed: ${selectError.message} (${selectError.code})`);
      return { select: false, insert: false };
    } else {
      console.log(`   ✅ SELECT works: Found ${selectData?.length || 0} existing products`);
      if (selectData && selectData.length > 0) {
        console.log(`   📋 Existing products: ${selectData.map(p => p.card_name).join(', ')}`);
      }
    }
    
    // Test INSERT permission with a test product
    const testProduct = {
      card_name: "TEST_PRODUCT_DELETE_ME",
      card_type: "standard",
      description: "Test product for permission check",
      subscription_plan: "basic",
      pricing_type: "free",
      one_time_fee: 0,
      monthly_fee: 0,
      annual_fee: 0,
      features: ["Test feature"],
      is_active: false
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('virtual_cards')
      .insert([testProduct])
      .select();
    
    if (insertError) {
      console.log(`   ❌ INSERT failed: ${insertError.message} (${insertError.code})`);
      
      // Analyze the error
      if (insertError.code === '42501') {
        console.log('   📝 Permission denied - admin needs proper RLS policy access');
      } else if (insertError.code === '22P02') {
        console.log('   📝 Invalid enum value - check card_type constraints');
      } else if (insertError.code === 'PGRST116') {
        console.log('   📝 Table not accessible - schema configuration issue');
      }
      
      return { select: true, insert: false, error: insertError };
    } else {
      console.log(`   ✅ INSERT works: Created test product with ID ${insertData?.[0]?.id}`);
      
      // Clean up test product
      if (insertData?.[0]?.id) {
        await supabase
          .from('virtual_cards')
          .delete()
          .eq('id', insertData[0].id);
        console.log('   🧹 Test product cleaned up');
      }
      
      return { select: true, insert: true };
    }
  } catch (error) {
    console.log(`   ❌ Table access exception: ${error.message}`);
    return { select: false, insert: false, error };
  }
}

// Test loyalty card product creation (what admin does)
async function testLoyaltyCardProductCreation(productData, index) {
  console.log(`\n💳 Testing loyalty card product creation ${index + 1}/${testLoyaltyCardProducts.length}: ${productData.card_name}`);
  
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('virtual_cards')
      .insert([productData])
      .select();
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.log(`   ❌ Product creation failed: ${error.message} (${error.code}) - ${duration}ms`);
      
      // Provide specific guidance based on error
      if (error.code === '42501') {
        console.log('   🔧 Fix: Admin needs INSERT permission on virtual_cards table');
        console.log('   📋 RLS Policy: "Admins can manage all virtual cards" may be missing');
      } else if (error.code === '22P02') {
        console.log('   🔧 Fix: Invalid enum value - check card_type or pricing_type values');
        console.log(`   📋 Attempted values: card_type="${productData.card_type}", pricing_type="${productData.pricing_type}"`);
      } else if (error.code === '23505') {
        console.log('   🔧 Fix: Duplicate product name - use unique card names');
      } else if (error.code === 'PGRST301') {
        console.log('   🔧 Fix: Schema access issue - check Supabase client configuration');
      }
      
      return { success: false, error, duration };
    }
    
    const createdProduct = data?.[0];
    console.log(`   ✅ Product created successfully: ${productData.card_name}`);
    console.log(`   📋 Product ID: ${createdProduct?.id}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   💰 Pricing: ${productData.pricing_type === 'free' ? 'Free' : `$${productData.monthly_fee || productData.one_time_fee}`}`);
    
    return { success: true, data: createdProduct, duration };
  } catch (error) {
    console.log(`   ❌ Product creation exception: ${error.message}`);
    return { success: false, error, duration: 0 };
  }
}

// Test loading created products
async function testLoadingLoyaltyCardProducts() {
  console.log('\n📋 Testing loyalty card product loading...');
  
  try {
    const { data, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log(`   ❌ Loading failed: ${error.message} (${error.code})`);
      return false;
    }
    
    console.log(`   ✅ Successfully loaded ${data?.length || 0} active loyalty card products`);
    
    if (data && data.length > 0) {
      console.log('   📋 Available products:');
      data.slice(0, 3).forEach((product, i) => {
        const pricing = product.pricing_type === 'free' ? 'Free' : 
                       product.pricing_type === 'subscription' ? `$${product.monthly_fee}/mo` :
                       `$${product.one_time_fee} one-time`;
        console.log(`      ${i + 1}. ${product.card_name} (${product.card_type}) - ${pricing}`);
      });
    } else {
      console.log('   ⚠️  No active loyalty card products found - users cannot create individual cards');
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Loading exception: ${error.message}`);
    return false;
  }
}

// Check admin authentication status
async function checkAdminAuthentication() {
  console.log('\n👤 Checking admin authentication status...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log(`   ❌ Auth check failed: ${error.message}`);
      return { authenticated: false, isAdmin: false };
    }
    
    if (user) {
      console.log(`   ✅ User authenticated: ${user.email}`);
      console.log(`   📋 User ID: ${user.id}`);
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.log(`   ⚠️  Could not check admin status: ${profileError.message}`);
        return { authenticated: true, isAdmin: false, user };
      }
      
      const isAdmin = profile?.role === 'admin';
      console.log(`   ${isAdmin ? '✅' : '❌'} Admin status: ${isAdmin ? 'ADMIN' : 'NOT ADMIN'}`);
      console.log(`   📋 Role: ${profile?.role || 'unknown'}`);
      console.log(`   📋 Name: ${profile?.full_name || 'Not set'}`);
      
      return { authenticated: true, isAdmin, user, profile };
    } else {
      console.log('   ❌ No authenticated user found');
      return { authenticated: false, isAdmin: false };
    }
  } catch (error) {
    console.log(`   ❌ Auth exception: ${error.message}`);
    return { authenticated: false, isAdmin: false, error };
  }
}

// Main test execution
async function main() {
  try {
    console.log('🎯 Simulating authenticated admin creating loyalty card products...\n');
    
    const results = {
      databaseConnection: false,
      tableAccess: { select: false, insert: false },
      authentication: { authenticated: false, isAdmin: false },
      productCreation: [],
      productLoading: false,
      errors: []
    };
    
    // Test 1: Database Connection
    results.databaseConnection = await testDatabaseConnection();
    if (!results.databaseConnection) {
      console.log('\n❌ Stopping tests - database connection failed');
      return results;
    }
    
    // Test 2: Authentication Check
    results.authentication = await checkAdminAuthentication();
    
    // Test 3: Table Access
    results.tableAccess = await testVirtualCardsTableAccess();
    
    // Test 4: Product Creation (the main issue)
    console.log('\n🏭 Testing loyalty card product creation (what admin does)...');
    console.log('================================================================');
    
    for (let i = 0; i < testLoyaltyCardProducts.length; i++) {
      const result = await testLoyaltyCardProductCreation(testLoyaltyCardProducts[i], i);
      results.productCreation.push(result);
      
      if (!result.success) {
        results.errors.push({
          operation: 'product_creation',
          product: testLoyaltyCardProducts[i].card_name,
          error: result.error
        });
      }
      
      // Add delay between creations
      if (i < testLoyaltyCardProducts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Test 5: Product Loading
    results.productLoading = await testLoadingLoyaltyCardProducts();
    
    // Final Results
    console.log('\n📊 AUTHENTICATED ADMIN LOYALTY CARD PRODUCT CREATION TEST RESULTS');
    console.log('==================================================================');
    
    console.log(`🔌 Database Connection: ${results.databaseConnection ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`👤 Authentication: ${results.authentication.authenticated ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED'}`);
    console.log(`🔐 Admin Status: ${results.authentication.isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);
    console.log(`📊 Table SELECT: ${results.tableAccess.select ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`📝 Table INSERT: ${results.tableAccess.insert ? '✅ WORKING' : '❌ FAILED'}`);
    
    const successfulCreations = results.productCreation.filter(r => r.success).length;
    console.log(`🏭 Product Creation: ${successfulCreations}/${testLoyaltyCardProducts.length} successful`);
    console.log(`📋 Product Loading: ${results.productLoading ? '✅ WORKING' : '❌ FAILED'}`);
    
    // Error Summary
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      results.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.operation}: ${err.error?.message || 'Unknown error'} (${err.error?.code || 'No code'})`);
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (!results.authentication.authenticated) {
      console.log('❌ CRITICAL: Admin must be authenticated to create products');
      console.log('   → Admin needs to log in to the admin dashboard first');
    } else if (!results.authentication.isAdmin) {
      console.log('❌ CRITICAL: User needs admin role to create products');
      console.log('   → Update user role to "admin" in profiles table');
    } else if (!results.tableAccess.insert) {
      console.log('❌ CRITICAL: Admin cannot insert into virtual_cards table');
      console.log('   → Check RLS policies: "Admins can manage all virtual cards"');
      console.log('   → Verify has_role() function exists and works');
    } else if (successfulCreations === 0) {
      console.log('❌ CRITICAL: No products could be created');
      console.log('   → Check enum constraints on card_type and pricing_type');
      console.log('   → Verify table schema matches frontend expectations');
    } else if (successfulCreations < testLoyaltyCardProducts.length) {
      console.log('⚠️  PARTIAL: Some products failed to create');
      console.log('   → Check specific error messages above');
    } else {
      console.log('✅ SUCCESS: Admin can create loyalty card products!');
      console.log('   → Users can now create individual loyalty cards from these products');
    }
    
    // Next Steps
    console.log('\n🎯 NEXT STEPS FOR ADMIN:');
    console.log('========================');
    console.log('1. Admin logs into admin dashboard');
    console.log('2. Admin navigates to "Loyalty Cards" section'); 
    console.log('3. Admin clicks "Add New Loyalty Card" (product creation)');
    console.log('4. Admin fills out product details (name, type, pricing, features)');
    console.log('5. Admin clicks "Create Card" to create the product template');
    console.log('6. Users can now create individual loyalty cards from this product');
    
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main()
  .then(results => {
    const hasErrors = results.errors?.length > 0 || !results.databaseConnection;
    console.log(`\n${hasErrors ? '❌' : '✅'} Test completed. ${hasErrors ? 'Issues found' : 'All systems working'}.`);
    process.exit(hasErrors ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });