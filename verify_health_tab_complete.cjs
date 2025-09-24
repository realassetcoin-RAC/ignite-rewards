#!/usr/bin/env node

/**
 * Complete Health Tab Verification Script
 * 
 * This script performs a comprehensive check of all health tab components
 * to verify that the HEALTH_TAB_FIX.sql has resolved all issues.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyHealthTabComplete() {
  console.log('🔍 COMPREHENSIVE HEALTH TAB VERIFICATION');
  console.log('==========================================\n');
  
  const results = {
    tables: {},
    rpcs: {},
    features: {},
    summary: { total: 0, ok: 0, warn: 0, error: 0 }
  };

  // Test all tables that the health tab monitors
  const tables = [
    'profiles', 'merchants', 'virtual_cards', 'loyalty_transactions', 
    'user_loyalty_cards', 'user_points', 'user_referrals', 'user_wallets',
    'merchant_cards', 'merchant_subscriptions', 'merchant_subscription_plans',
    'referral_campaigns', 'transaction_qr_codes', 'subscribers',
    // DAO System Tables
    'dao_organizations', 'dao_members', 'dao_proposals', 'dao_votes',
    'dao_treasury', 'dao_transactions', 'dao_proposal_comments', 'dao_proposal_attachments',
    'loyalty_change_requests', 'loyalty_change_approvals'
  ];

  console.log('📋 TESTING DATABASE TABLES:');
  console.log('----------------------------');
  
  for (const table of tables) {
    try {
      const start = performance.now();
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      const latencyMs = performance.now() - start;
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('permission denied')) {
          console.log(`⚠️  ${table}: WARNING - ${error.message}`);
          results.tables[table] = { status: 'warn', message: error.message, latencyMs };
          results.summary.warn++;
        } else {
          console.log(`❌ ${table}: ERROR - ${error.message}`);
          results.tables[table] = { status: 'error', message: error.message, latencyMs };
          results.summary.error++;
        }
      } else {
        console.log(`✅ ${table}: OK - Count accessible (${count ?? 0}) - ${Math.round(latencyMs)}ms`);
        results.tables[table] = { status: 'ok', message: `Count accessible (${count ?? 0})`, latencyMs };
        results.summary.ok++;
      }
      results.summary.total++;
    } catch (error) {
      console.log(`❌ ${table}: EXCEPTION - ${error.message}`);
      results.tables[table] = { status: 'error', message: error.message, latencyMs: null };
      results.summary.error++;
      results.summary.total++;
    }
  }

  // Test RPC functions
  const rpcs = [
    { name: 'is_admin', test: () => supabase.rpc('is_admin') },
    { name: 'check_admin_access', test: () => supabase.rpc('check_admin_access') },
    { name: 'can_use_mfa', test: () => supabase.rpc('can_use_mfa', { user_id: '00000000-0000-0000-0000-000000000000' }) },
    { name: 'get_current_user_profile', test: () => supabase.rpc('get_current_user_profile') },
    { name: 'generate_loyalty_number', test: () => supabase.rpc('generate_loyalty_number') },
    { name: 'generate_referral_code', test: () => supabase.rpc('generate_referral_code') }
  ];

  console.log('\n🔧 TESTING RPC FUNCTIONS:');
  console.log('--------------------------');
  
  for (const rpc of rpcs) {
    try {
      const start = performance.now();
      const { data, error } = await rpc.test();
      const latencyMs = performance.now() - start;
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.log(`⚠️  ${rpc.name}: WARNING - ${error.message}`);
          results.rpcs[rpc.name] = { status: 'warn', message: error.message, latencyMs };
          results.summary.warn++;
        } else {
          console.log(`❌ ${rpc.name}: ERROR - ${error.message}`);
          results.rpcs[rpc.name] = { status: 'error', message: error.message, latencyMs };
          results.summary.error++;
        }
      } else {
        console.log(`✅ ${rpc.name}: OK - Response: ${JSON.stringify(data)} - ${Math.round(latencyMs)}ms`);
        results.rpcs[rpc.name] = { status: 'ok', message: `Response: ${JSON.stringify(data)}`, latencyMs };
        results.summary.ok++;
      }
      results.summary.total++;
    } catch (error) {
      console.log(`❌ ${rpc.name}: EXCEPTION - ${error.message}`);
      results.rpcs[rpc.name] = { status: 'error', message: error.message, latencyMs: null };
      results.summary.error++;
      results.summary.total++;
    }
  }

  // Test feature-specific functionality
  const features = [
    {
      name: 'DAO System',
      test: () => supabase.from('dao_organizations').select('id').limit(1)
    },
    {
      name: 'Rewards Manager',
      test: () => supabase.from('loyalty_transactions').select('id').limit(1)
    },
    {
      name: 'User DAO Access',
      test: () => supabase.from('dao_proposals').select('id').limit(1)
    },
    {
      name: 'Merchant Reward Generator',
      test: () => supabase.from('loyalty_transactions').select('transaction_type').eq('transaction_type', 'manual_entry').limit(1)
    }
  ];

  console.log('\n🎯 TESTING FEATURE FUNCTIONALITY:');
  console.log('----------------------------------');
  
  for (const feature of features) {
    try {
      const start = performance.now();
      const { data, error } = await feature.test();
      const latencyMs = performance.now() - start;
      
      if (error) {
        console.log(`❌ ${feature.name}: ERROR - ${error.message}`);
        results.features[feature.name] = { status: 'error', message: error.message, latencyMs };
        results.summary.error++;
      } else {
        console.log(`✅ ${feature.name}: OK - ${Math.round(latencyMs)}ms`);
        results.features[feature.name] = { status: 'ok', message: 'Feature accessible', latencyMs };
        results.summary.ok++;
      }
      results.summary.total++;
    } catch (error) {
      console.log(`❌ ${feature.name}: EXCEPTION - ${error.message}`);
      results.features[feature.name] = { status: 'error', message: error.message, latencyMs: null };
      results.summary.error++;
      results.summary.total++;
    }
  }

  // Test storage buckets
  console.log('\n💾 TESTING STORAGE BUCKETS:');
  console.log('----------------------------');
  
  try {
    const start = performance.now();
    const { data, error } = await supabase.storage.from("public-assets").list("", { limit: 1 });
    const latencyMs = performance.now() - start;
    
    if (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log(`⚠️  public-assets: WARNING - ${error.message}`);
        results.summary.warn++;
      } else {
        console.log(`❌ public-assets: ERROR - ${error.message}`);
        results.summary.error++;
      }
    } else {
      console.log(`✅ public-assets: OK - ${Array.isArray(data) ? data.length : 0} objects visible - ${Math.round(latencyMs)}ms`);
      results.summary.ok++;
    }
    results.summary.total++;
  } catch (error) {
    console.log(`❌ public-assets: EXCEPTION - ${error.message}`);
    results.summary.error++;
    results.summary.total++;
  }

  // Final summary
  console.log('\n📊 FINAL VERIFICATION SUMMARY:');
  console.log('===============================');
  console.log(`Total Checks: ${results.summary.total}`);
  console.log(`✅ OK: ${results.summary.ok}`);
  console.log(`⚠️  Warnings: ${results.summary.warn}`);
  console.log(`❌ Errors: ${results.summary.error}`);
  
  if (results.summary.warn === 0 && results.summary.error === 0) {
    console.log('\n🎉 ALL HEALTH TAB ISSUES RESOLVED!');
    console.log('   The admin dashboard health tab should now show all green checkmarks.');
    console.log('   No more warnings or errors should appear.');
  } else if (results.summary.error === 0) {
    console.log('\n⚠️  SOME WARNINGS REMAIN:');
    console.log('   These are typically non-critical issues that don\'t affect core functionality.');
    console.log('   The health tab should show mostly green with some yellow warnings.');
  } else {
    console.log('\n❌ ISSUES STILL EXIST:');
    console.log('   Some components are still failing. Check the error messages above.');
    console.log('   You may need to re-run the HEALTH_TAB_FIX.sql script.');
  }

  // Detailed breakdown
  if (results.summary.warn > 0 || results.summary.error > 0) {
    console.log('\n🔍 DETAILED ISSUE BREAKDOWN:');
    console.log('-----------------------------');
    
    // Show table issues
    Object.entries(results.tables).forEach(([table, result]) => {
      if (result.status !== 'ok') {
        console.log(`${result.status === 'warn' ? '⚠️' : '❌'} Table ${table}: ${result.message}`);
      }
    });
    
    // Show RPC issues
    Object.entries(results.rpcs).forEach(([rpc, result]) => {
      if (result.status !== 'ok') {
        console.log(`${result.status === 'warn' ? '⚠️' : '❌'} RPC ${rpc}: ${result.message}`);
      }
    });
    
    // Show feature issues
    Object.entries(results.features).forEach(([feature, result]) => {
      if (result.status !== 'ok') {
        console.log(`${result.status === 'warn' ? '⚠️' : '❌'} Feature ${feature}: ${result.message}`);
      }
    });
  }

  return results;
}

// Run the verification
verifyHealthTabComplete().catch(console.error);


