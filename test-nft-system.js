#!/usr/bin/env node

/**
 * NFT System Testing Script
 * Comprehensive testing of all NFT system functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${message ? ` - ${message}` : ''}`);
  
  testResults.tests.push({ name: testName, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testDatabaseConnection() {
  console.log('\n🔗 Testing Database Connection...');
  
  try {
    const { data, error } = await supabase
      .from('nft_types')
      .select('count')
      .limit(1);
    
    logTest('Database Connection', !error, error ? error.message : 'Connected successfully');
    return !error;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

async function testNFTSchema() {
  console.log('\n📋 Testing NFT Schema...');
  
  const requiredTables = [
    'nft_types',
    'user_loyalty_cards', 
    'nft_evolution_history',
    'nft_upgrade_history',
    'nft_minting_control'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      logTest(`Table: ${table}`, !error, error ? error.message : 'Exists');
      if (error) allTablesExist = false;
    } catch (error) {
      logTest(`Table: ${table}`, false, error.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testNFTData() {
  console.log('\n🎯 Testing NFT Data...');
  
  try {
    // Test NFT types
    const { data: nftTypes, error: nftError } = await supabase
      .from('nft_types')
      .select('*');
    
    logTest('NFT Types Data', !nftError && nftTypes && nftTypes.length > 0, 
      nftError ? nftError.message : `Found ${nftTypes.length} NFT types`);
    
    if (nftTypes && nftTypes.length > 0) {
      // Test custodial vs non-custodial
      const custodialCount = nftTypes.filter(nft => nft.is_custodial).length;
      const nonCustodialCount = nftTypes.filter(nft => !nft.is_custodial).length;
      
      logTest('Custodial NFTs', custodialCount > 0, `Found ${custodialCount} custodial NFTs`);
      logTest('Non-Custodial NFTs', nonCustodialCount > 0, `Found ${nonCustodialCount} non-custodial NFTs`);
      
      // Test required fields
      const requiredFields = ['nft_name', 'display_name', 'buy_price_usdt', 'rarity', 'is_custodial'];
      for (const field of requiredFields) {
        const hasField = nftTypes.every(nft => nft[field] !== null && nft[field] !== undefined);
        logTest(`Required Field: ${field}`, hasField, hasField ? 'All records have this field' : 'Some records missing this field');
      }
    }
    
    // Test minting controls
    const { data: mintingControls, error: mintingError } = await supabase
      .from('nft_minting_control')
      .select('*');
    
    logTest('Minting Controls Data', !mintingError && mintingControls && mintingControls.length > 0,
      mintingError ? mintingError.message : `Found ${mintingControls.length} minting controls`);
    
    return !nftError && !mintingError;
  } catch (error) {
    logTest('NFT Data', false, error.message);
    return false;
  }
}

async function testNFTOperations() {
  console.log('\n⚙️ Testing NFT Operations...');
  
  try {
    // Test reading NFT types
    const { data: nftTypes, error: readError } = await supabase
      .from('nft_types')
      .select('*')
      .eq('is_active', true);
    
    logTest('Read NFT Types', !readError, readError ? readError.message : `Read ${nftTypes.length} active NFT types`);
    
    // Test filtering by custodial type
    const { data: custodialNFTs, error: custodialError } = await supabase
      .from('nft_types')
      .select('*')
      .eq('is_custodial', true);
    
    logTest('Filter Custodial NFTs', !custodialError, custodialError ? custodialError.message : `Found ${custodialNFTs.length} custodial NFTs`);
    
    // Test filtering by rarity
    const { data: rareNFTs, error: rareError } = await supabase
      .from('nft_types')
      .select('*')
      .eq('rarity', 'Rare');
    
    logTest('Filter by Rarity', !rareError, rareError ? rareError.message : `Found ${rareNFTs.length} rare NFTs`);
    
    // Test minting control operations
    const { data: mintingControls, error: mintingError } = await supabase
      .from('nft_minting_control')
      .select('*')
      .eq('minting_enabled', true);
    
    logTest('Read Minting Controls', !mintingError, mintingError ? mintingError.message : `Found ${mintingControls.length} enabled minting controls`);
    
    return !readError && !custodialError && !rareError && !mintingError;
  } catch (error) {
    logTest('NFT Operations', false, error.message);
    return false;
  }
}

async function testUserNFTOperations() {
  console.log('\n👤 Testing User NFT Operations...');
  
  try {
    // Test reading user loyalty cards with NFT data
    const { data: userNFTs, error: userError } = await supabase
      .from('user_loyalty_cards')
      .select(`
        *,
        nft_types (*)
      `)
      .not('nft_type_id', 'is', null);
    
    logTest('Read User NFTs', !userError, userError ? userError.message : `Found ${userNFTs.length} user NFTs`);
    
    // Test evolution history
    const { data: evolutionHistory, error: evolutionError } = await supabase
      .from('nft_evolution_history')
      .select('*');
    
    logTest('Read Evolution History', !evolutionError, evolutionError ? evolutionError.message : `Found ${evolutionHistory.length} evolution records`);
    
    // Test upgrade history
    const { data: upgradeHistory, error: upgradeError } = await supabase
      .from('nft_upgrade_history')
      .select('*');
    
    logTest('Read Upgrade History', !upgradeError, upgradeError ? upgradeError.message : `Found ${upgradeHistory.length} upgrade records`);
    
    return !userError && !evolutionError && !upgradeError;
  } catch (error) {
    logTest('User NFT Operations', false, error.message);
    return false;
  }
}

async function testDataIntegrity() {
  console.log('\n🔒 Testing Data Integrity...');
  
  try {
    // Test foreign key relationships
    const { data: userNFTs, error: userError } = await supabase
      .from('user_loyalty_cards')
      .select(`
        *,
        nft_types (*)
      `)
      .not('nft_type_id', 'is', null);
    
    if (!userError && userNFTs) {
      const validRelationships = userNFTs.every(userNFT => userNFT.nft_types !== null);
      logTest('Foreign Key Relationships', validRelationships, 
        validRelationships ? 'All user NFTs have valid NFT type relationships' : 'Some user NFTs have invalid relationships');
    }
    
    // Test data consistency
    const { data: nftTypes } = await supabase
      .from('nft_types')
      .select('*');
    
    if (nftTypes) {
      const validPrices = nftTypes.every(nft => nft.buy_price_usdt >= 0);
      logTest('Price Validation', validPrices, 'All NFT prices are non-negative');
      
      const validRatios = nftTypes.every(nft => nft.earn_on_spend_ratio >= 0 && nft.earn_on_spend_ratio <= 1);
      logTest('Earning Ratio Validation', validRatios, 'All earning ratios are between 0 and 1');
      
      const validQuantities = nftTypes.every(nft => nft.mint_quantity > 0);
      logTest('Mint Quantity Validation', validQuantities, 'All mint quantities are positive');
    }
    
    return true;
  } catch (error) {
    logTest('Data Integrity', false, error.message);
    return false;
  }
}

async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  try {
    const startTime = Date.now();
    
    // Test multiple concurrent queries
    const promises = [
      supabase.from('nft_types').select('*'),
      supabase.from('nft_minting_control').select('*'),
      supabase.from('user_loyalty_cards').select('*').not('nft_type_id', 'is', null),
      supabase.from('nft_evolution_history').select('*'),
      supabase.from('nft_upgrade_history').select('*')
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const allSuccessful = results.every(result => !result.error);
    logTest('Concurrent Queries', allSuccessful, `All queries completed in ${duration}ms`);
    
    const performanceGood = duration < 2000; // Less than 2 seconds
    logTest('Query Performance', performanceGood, `Total time: ${duration}ms (threshold: 2000ms)`);
    
    return allSuccessful && performanceGood;
  } catch (error) {
    logTest('Performance', false, error.message);
    return false;
  }
}

async function generateTestReport() {
  console.log('\n📊 Test Report Summary...');
  
  const totalTests = testResults.passed + testResults.failed;
  const passRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Test Results:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Pass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: parseFloat(passRate)
    },
    tests: testResults.tests
  };
  
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(process.cwd(), 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed test report saved to: ${reportPath}`);
  
  return testResults.failed === 0;
}

async function main() {
  console.log('🧪 NFT System Testing Suite');
  console.log('============================');
  
  const tests = [
    testDatabaseConnection,
    testNFTSchema,
    testNFTData,
    testNFTOperations,
    testUserNFTOperations,
    testDataIntegrity,
    testPerformance,
    generateTestReport
  ];
  
  for (const test of tests) {
    await test();
  }
  
  const allPassed = testResults.failed === 0;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! The NFT system is ready for production.');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues before deploying to production.');
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testDatabaseConnection,
  testNFTSchema,
  testNFTData,
  testNFTOperations,
  testUserNFTOperations,
  testDataIntegrity,
  testPerformance
};


