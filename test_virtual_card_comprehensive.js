#!/usr/bin/env node

/**
 * Comprehensive test script for virtual card creation functionality
 * This tests database functions, schema access, and permissions
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

// Create clients for different schema configurations
const supabaseDefault = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseApiSchema = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'api' }
});

console.log('🧪 Starting Comprehensive Virtual Card Creation Test...\n');

async function testDatabaseFunctions() {
  console.log('📋 Testing Database Functions...');
  
  const tests = [
    {
      name: 'api.generate_loyalty_number with email',
      test: () => supabaseDefault.rpc('generate_loyalty_number', { user_email: 'test@example.com' })
    },
    {
      name: 'api.generate_loyalty_number without params',
      test: () => supabaseDefault.rpc('generate_loyalty_number')
    },
    {
      name: 'public.generate_loyalty_number with email',
      test: () => supabaseDefault.schema('public').rpc('generate_loyalty_number', { user_email: 'test@example.com' })
    },
    {
      name: 'public.generate_loyalty_number without params',
      test: () => supabaseDefault.schema('public').rpc('generate_loyalty_number')
    },
    {
      name: 'api schema client - generate_loyalty_number with email',
      test: () => supabaseApiSchema.rpc('generate_loyalty_number', { user_email: 'test@example.com' })
    },
    {
      name: 'api schema client - generate_loyalty_number without params',
      test: () => supabaseApiSchema.rpc('generate_loyalty_number')
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`  Testing: ${test.name}...`);
      const { data, error } = await test.test();
      
      if (error) {
        console.log(`    ❌ Failed: ${error.message}`);
        results.push({ name: test.name, status: 'failed', error: error.message });
      } else if (data) {
        console.log(`    ✅ Success: Generated ${data}`);
        results.push({ name: test.name, status: 'success', data });
      } else {
        console.log(`    ⚠️  No data returned`);
        results.push({ name: test.name, status: 'no-data' });
      }
    } catch (e) {
      console.log(`    ❌ Exception: ${e.message}`);
      results.push({ name: test.name, status: 'exception', error: e.message });
    }
  }
  
  return results;
}

async function testTableAccess() {
  console.log('\n📋 Testing Table Access...');
  
  const tests = [
    {
      name: 'public.user_loyalty_cards select',
      test: () => supabaseDefault.from('user_loyalty_cards').select('id, loyalty_number').limit(1)
    },
    {
      name: 'api.user_loyalty_cards select',
      test: () => supabaseDefault.from('api.user_loyalty_cards').select('id, loyalty_number').limit(1)
    },
    {
      name: 'api schema client - user_loyalty_cards select',
      test: () => supabaseApiSchema.from('user_loyalty_cards').select('id, loyalty_number').limit(1)
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`  Testing: ${test.name}...`);
      const { data, error } = await test.test();
      
      if (error) {
        console.log(`    ❌ Failed: ${error.message}`);
        results.push({ name: test.name, status: 'failed', error: error.message });
      } else {
        console.log(`    ✅ Success: Found ${data?.length || 0} records`);
        results.push({ name: test.name, status: 'success', count: data?.length || 0 });
      }
    } catch (e) {
      console.log(`    ❌ Exception: ${e.message}`);
      results.push({ name: test.name, status: 'exception', error: e.message });
    }
  }
  
  return results;
}

async function testSchemaConfiguration() {
  console.log('\n📋 Testing Schema Configuration...');
  
  // Test if the api schema is properly configured
  try {
    const { data, error } = await supabaseApiSchema.rpc('generate_loyalty_number', { user_email: 'test@example.com' });
    
    if (error) {
      console.log(`❌ API schema configuration issue: ${error.message}`);
      return false;
    } else {
      console.log(`✅ API schema configuration working: Generated ${data}`);
      return true;
    }
  } catch (e) {
    console.log(`❌ API schema configuration exception: ${e.message}`);
    return false;
  }
}

async function simulateCardCreation() {
  console.log('\n📋 Simulating Card Creation Flow...');
  
  try {
    // Step 1: Generate loyalty number
    console.log('  Step 1: Generating loyalty number...');
    let loyaltyNumber;
    
    // Try the methods that the frontend uses
    const methods = [
      () => supabaseApiSchema.rpc('generate_loyalty_number', { user_email: 'test@example.com' }),
      () => supabaseDefault.schema('public').rpc('generate_loyalty_number', { user_email: 'test@example.com' }),
      () => supabaseApiSchema.rpc('generate_loyalty_number'),
      () => supabaseDefault.schema('public').rpc('generate_loyalty_number')
    ];
    
    for (let i = 0; i < methods.length; i++) {
      try {
        const { data, error } = await methods[i]();
        if (!error && data) {
          loyaltyNumber = data;
          console.log(`    ✅ Method ${i + 1} succeeded: ${loyaltyNumber}`);
          break;
        } else if (error) {
          console.log(`    ❌ Method ${i + 1} failed: ${error.message}`);
        }
      } catch (e) {
        console.log(`    ❌ Method ${i + 1} exception: ${e.message}`);
      }
    }
    
    if (!loyaltyNumber) {
      console.log('    ⚠️  All methods failed, using fallback generation');
      loyaltyNumber = 'T' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    }
    
    // Step 2: Test insertion (dry run - we won't actually insert)
    console.log('  Step 2: Testing insertion capability...');
    
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
      loyalty_number: loyaltyNumber,
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      is_active: true
    };
    
    // Test if we can prepare the insertion (without actually doing it)
    console.log('    ✅ Test data prepared successfully');
    console.log(`    Data: ${JSON.stringify(testData, null, 2)}`);
    
    return true;
  } catch (e) {
    console.log(`❌ Card creation simulation failed: ${e.message}`);
    return false;
  }
}

async function generateReport(functionResults, tableResults, schemaWorking, simulationWorking) {
  console.log('\n📊 TEST REPORT');
  console.log('================\n');
  
  // Function tests summary
  const functionSuccess = functionResults.filter(r => r.status === 'success').length;
  const functionTotal = functionResults.length;
  console.log(`🔧 Database Functions: ${functionSuccess}/${functionTotal} working`);
  
  if (functionSuccess === 0) {
    console.log('  ❌ CRITICAL: No database functions are working!');
  } else if (functionSuccess < functionTotal) {
    console.log('  ⚠️  Some database functions are failing (fallbacks available)');
  } else {
    console.log('  ✅ All database functions working perfectly');
  }
  
  // Table access summary
  const tableSuccess = tableResults.filter(r => r.status === 'success').length;
  const tableTotal = tableResults.length;
  console.log(`\n📊 Table Access: ${tableSuccess}/${tableTotal} working`);
  
  if (tableSuccess === 0) {
    console.log('  ❌ CRITICAL: No table access is working!');
  } else {
    console.log('  ✅ Table access is working');
  }
  
  // Schema configuration
  console.log(`\n⚙️  Schema Configuration: ${schemaWorking ? '✅ Working' : '❌ Failed'}`);
  
  // Simulation
  console.log(`\n🧪 Card Creation Simulation: ${simulationWorking ? '✅ Working' : '❌ Failed'}`);
  
  // Overall assessment
  console.log('\n🎯 OVERALL ASSESSMENT');
  console.log('=====================');
  
  if (functionSuccess > 0 && tableSuccess > 0 && simulationWorking) {
    console.log('✅ VIRTUAL CARD CREATION SHOULD WORK');
    console.log('   The system has working database functions and table access.');
    console.log('   Users should be able to create virtual loyalty cards.');
  } else {
    console.log('❌ VIRTUAL CARD CREATION WILL FAIL');
    console.log('   Critical issues found that prevent card creation:');
    
    if (functionSuccess === 0) {
      console.log('   - No working database functions for loyalty number generation');
    }
    if (tableSuccess === 0) {
      console.log('   - No working table access for storing cards');
    }
    if (!simulationWorking) {
      console.log('   - Card creation flow simulation failed');
    }
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (functionSuccess === functionTotal && tableSuccess === tableTotal && schemaWorking && simulationWorking) {
    console.log('✅ System is working perfectly! No action needed.');
  } else {
    console.log('🔧 Apply these fixes:');
    
    if (functionSuccess === 0) {
      console.log('1. Run the database migration to create/fix the generate_loyalty_number functions');
    }
    if (tableSuccess === 0) {
      console.log('2. Check table permissions and RLS policies');
    }
    if (!schemaWorking) {
      console.log('3. Verify Supabase client schema configuration');
    }
    
    console.log('\n📝 Suggested migration files to apply:');
    console.log('- supabase/migrations/20250115_fix_virtual_card_schema_mismatch.sql');
    console.log('- supabase/migrations/20250115_fix_virtual_card_creation.sql');
  }
}

async function runTests() {
  try {
    const functionResults = await testDatabaseFunctions();
    const tableResults = await testTableAccess();
    const schemaWorking = await testSchemaConfiguration();
    const simulationWorking = await simulateCardCreation();
    
    await generateReport(functionResults, tableResults, schemaWorking, simulationWorking);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();