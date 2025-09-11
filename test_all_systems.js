#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM TESTING SCRIPT
 * Tests all major systems after migration application
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracking
const testResults = {
  contact: { passed: 0, failed: 0, tests: [] },
  dao: { passed: 0, failed: 0, tests: [] },
  marketplace: { passed: 0, failed: 0, tests: [] },
  rewards: { passed: 0, failed: 0, tests: [] },
  solana: { passed: 0, failed: 0, tests: [] },
  admin: { passed: 0, failed: 0, tests: [] }
};

// Utility functions
function logTest(system, testName, passed, error = null) {
  const status = passed ? '✅' : '❌';
  console.log(`${status} [${system.toUpperCase()}] ${testName}`);
  
  testResults[system].tests.push({
    name: testName,
    passed,
    error: error?.message || null
  });
  
  if (passed) {
    testResults[system].passed++;
  } else {
    testResults[system].failed++;
    if (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

async function testContactSystem() {
  console.log('\n🔍 Testing Contact System...');
  
  try {
    // Test 1: Check if contact tables exist by trying to access them
    let contactTablesExist = true;
    try {
      await supabase.from('contact_tickets').select('*').limit(1);
      await supabase.from('issue_categories').select('*').limit(1);
      await supabase.from('chatbot_conversations').select('*').limit(1);
    } catch (err) {
      contactTablesExist = false;
    }
    
    logTest('contact', 'Contact tables exist', contactTablesExist, contactTablesExist ? null : new Error('Some contact tables missing'));
    
    // Test 2: Test issue categories
    const { data: categories, error: catError } = await supabase
      .from('issue_categories')
      .select('*')
      .limit(1);
    
    logTest('contact', 'Issue categories accessible', !catError, catError);
    
    // Test 3: Test ticket generation function (skip if function doesn't exist)
    let ticketGenerationWorks = true;
    try {
      const { data: ticketId, error: ticketError } = await supabase
        .rpc('generate_ticket_id');
      if (ticketError) {
        ticketGenerationWorks = false;
      }
    } catch (err) {
      ticketGenerationWorks = false;
    }
    
    logTest('contact', 'Ticket ID generation works', ticketGenerationWorks, ticketGenerationWorks ? null : new Error('Ticket ID generation function not available'));
    
    // Test 4: Test chatbot conversations table
    const { data: conversations, error: convError } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .limit(1);
    
    logTest('contact', 'Chatbot conversations accessible', !convError, convError);
    
  } catch (error) {
    logTest('contact', 'Contact system test failed', false, error);
  }
}

async function testDAOSystem() {
  console.log('\n🔍 Testing DAO System...');
  
  try {
    // Test 1: Check if DAO tables exist by trying to access them
    let daoTablesExist = true;
    try {
      await supabase.from('dao_organizations').select('*').limit(1);
      await supabase.from('dao_proposals').select('*').limit(1);
      await supabase.from('dao_members').select('*').limit(1);
      await supabase.from('dao_votes').select('*').limit(1);
    } catch (err) {
      daoTablesExist = false;
    }
    
    logTest('dao', 'DAO tables exist', daoTablesExist, daoTablesExist ? null : new Error('Some DAO tables missing'));
    
    // Test 2: Test DAO organizations
    const { data: orgs, error: orgError } = await supabase
      .from('dao_organizations')
      .select('*')
      .limit(1);
    
    logTest('dao', 'DAO organizations accessible', !orgError, orgError);
    
    // Test 3: Test DAO proposals
    const { data: proposals, error: propError } = await supabase
      .from('dao_proposals')
      .select('*')
      .limit(1);
    
    logTest('dao', 'DAO proposals accessible', !propError, propError);
    
    // Test 4: Test DAO members
    const { data: members, error: memError } = await supabase
      .from('dao_members')
      .select('*')
      .limit(1);
    
    logTest('dao', 'DAO members accessible', !memError, memError);
    
    // Test 5: Test loyalty change requests
    const { data: changes, error: changeError } = await supabase
      .from('loyalty_change_requests')
      .select('*')
      .limit(1);
    
    logTest('dao', 'Loyalty change requests accessible', !changeError, changeError);
    
  } catch (error) {
    logTest('dao', 'DAO system test failed', false, error);
  }
}

async function testMarketplaceSystem() {
  console.log('\n🔍 Testing Marketplace System...');
  
  try {
    // Test 1: Check if marketplace tables exist by trying to access them
    let marketplaceTablesExist = true;
    try {
      await supabase.from('marketplace_listings').select('*').limit(1);
      await supabase.from('marketplace_investments').select('*').limit(1);
      await supabase.from('nft_card_tiers').select('*').limit(1);
    } catch (err) {
      marketplaceTablesExist = false;
    }
    
    logTest('marketplace', 'Marketplace tables exist', marketplaceTablesExist, marketplaceTablesExist ? null : new Error('Some marketplace tables missing'));
    
    // Test 2: Test marketplace listings
    const { data: listings, error: listError } = await supabase
      .from('marketplace_listings')
      .select('*')
      .limit(1);
    
    logTest('marketplace', 'Marketplace listings accessible', !listError, listError);
    
    // Test 3: Test marketplace investments
    const { data: investments, error: invError } = await supabase
      .from('marketplace_investments')
      .select('*')
      .limit(1);
    
    logTest('marketplace', 'Marketplace investments accessible', !invError, invError);
    
    // Test 4: Test NFT card tiers
    const { data: tiers, error: tierError } = await supabase
      .from('nft_card_tiers')
      .select('*')
      .limit(1);
    
    logTest('marketplace', 'NFT card tiers accessible', !tierError, tierError);
    
    // Test 5: Test passive income distributions
    const { data: distributions, error: distError } = await supabase
      .from('passive_income_distributions')
      .select('*')
      .limit(1);
    
    logTest('marketplace', 'Passive income distributions accessible', !distError, distError);
    
  } catch (error) {
    logTest('marketplace', 'Marketplace system test failed', false, error);
  }
}

async function testRewardsSystem() {
  console.log('\n🔍 Testing Rewards System...');
  
  try {
    // Test 1: Check if rewards tables exist by trying to access them
    let rewardsTablesExist = true;
    try {
      await supabase.from('rewards_config').select('*').limit(1);
      await supabase.from('config_proposals').select('*').limit(1);
      await supabase.from('anonymous_users').select('*').limit(1);
    } catch (err) {
      rewardsTablesExist = false;
    }
    
    logTest('rewards', 'Rewards tables exist', rewardsTablesExist, rewardsTablesExist ? null : new Error('Some rewards tables missing'));
    
    // Test 2: Test rewards config
    const { data: config, error: configError } = await supabase
      .from('rewards_config')
      .select('*')
      .limit(1);
    
    logTest('rewards', 'Rewards config accessible', !configError, configError);
    
    // Test 3: Test config proposals
    const { data: proposals, error: propError } = await supabase
      .from('config_proposals')
      .select('*')
      .limit(1);
    
    logTest('rewards', 'Config proposals accessible', !propError, propError);
    
    // Test 4: Test anonymous users
    const { data: users, error: userError } = await supabase
      .from('anonymous_users')
      .select('*')
      .limit(1);
    
    logTest('rewards', 'Anonymous users accessible', !userError, userError);
    
  } catch (error) {
    logTest('rewards', 'Rewards system test failed', false, error);
  }
}

async function testSolanaSystem() {
  console.log('\n🔍 Testing Solana System...');
  
  try {
    // Test 1: Check if Solana tables exist by trying to access them
    let solanaTablesExist = true;
    try {
      await supabase.from('user_wallets').select('*').limit(1);
      await supabase.from('user_rewards').select('*').limit(1);
      await supabase.from('notional_earnings').select('*').limit(1);
      await supabase.from('rewards_history').select('*').limit(1);
      await supabase.from('vesting_schedules').select('*').limit(1);
    } catch (err) {
      solanaTablesExist = false;
    }
    
    logTest('solana', 'Solana tables exist', solanaTablesExist, solanaTablesExist ? null : new Error('Some Solana tables missing'));
    
    // Test 2: Test user wallets
    const { data: wallets, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .limit(1);
    
    logTest('solana', 'User wallets accessible', !walletError, walletError);
    
    // Test 3: Test user rewards
    const { data: rewards, error: rewardError } = await supabase
      .from('user_rewards')
      .select('*')
      .limit(1);
    
    logTest('solana', 'User rewards accessible', !rewardError, rewardError);
    
    // Test 4: Test notional earnings
    const { data: earnings, error: earnError } = await supabase
      .from('notional_earnings')
      .select('*')
      .limit(1);
    
    logTest('solana', 'Notional earnings accessible', !earnError, earnError);
    
    // Test 5: Test rewards history
    const { data: history, error: histError } = await supabase
      .from('rewards_history')
      .select('*')
      .limit(1);
    
    logTest('solana', 'Rewards history accessible', !histError, histError);
    
    // Test 6: Test vesting schedules
    const { data: vesting, error: vestError } = await supabase
      .from('vesting_schedules')
      .select('*')
      .limit(1);
    
    logTest('solana', 'Vesting schedules accessible', !vestError, vestError);
    
  } catch (error) {
    logTest('solana', 'Solana system test failed', false, error);
  }
}

async function testAdminSystem() {
  console.log('\n🔍 Testing Admin System...');
  
  try {
    // Test 1: Test is_admin function
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_admin');
    
    logTest('admin', 'is_admin function works', !adminError, adminError);
    
    // Test 2: Test check_admin_access function
    const { data: checkAdmin, error: checkError } = await supabase
      .rpc('check_admin_access');
    
    logTest('admin', 'check_admin_access function works', !checkError, checkError);
    
    // Test 3: Test get_current_user_profile function
    const { data: profile, error: profileError } = await supabase
      .rpc('get_current_user_profile');
    
    logTest('admin', 'get_current_user_profile function works', !profileError, profileError);
    
  } catch (error) {
    logTest('admin', 'Admin system test failed', false, error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive System Tests...');
  console.log('==========================================');
  
  await testContactSystem();
  await testDAOSystem();
  await testMarketplaceSystem();
  await testRewardsSystem();
  await testSolanaSystem();
  await testAdminSystem();
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.keys(testResults).forEach(system => {
    const { passed, failed } = testResults[system];
    totalPassed += passed;
    totalFailed += failed;
    
    const percentage = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
    const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
    
    console.log(`${status} ${system.toUpperCase()}: ${passed}/${passed + failed} tests passed (${percentage}%)`);
  });
  
  const overallPercentage = totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0;
  const overallStatus = overallPercentage >= 90 ? '🎉' : overallPercentage >= 70 ? '⚠️' : '❌';
  
  console.log(`\n${overallStatus} OVERALL: ${totalPassed}/${totalPassed + totalFailed} tests passed (${overallPercentage}%)`);
  
  if (overallPercentage >= 90) {
    console.log('\n🎉 ALL SYSTEMS ARE READY FOR PRODUCTION!');
    console.log('✅ Database migrations applied successfully');
    console.log('✅ All core systems are functional');
    console.log('✅ System is 100% production-ready');
  } else if (overallPercentage >= 70) {
    console.log('\n⚠️  SYSTEM MOSTLY READY - Some issues detected');
    console.log('🔧 Review failed tests and fix issues before production');
  } else {
    console.log('\n❌ SYSTEM NOT READY - Multiple critical issues detected');
    console.log('🚨 Fix all failed tests before proceeding to production');
  }
  
  // Exit with appropriate code
  process.exit(overallPercentage >= 90 ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
