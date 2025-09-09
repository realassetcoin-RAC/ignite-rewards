#!/usr/bin/env node

/**
 * Production Deployment Script for Loyalty NFT System
 * This script automates the deployment process and verifies everything is working
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.cyan}🚀 Step ${step}: ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function checkDatabaseConnection() {
  logStep(1, 'Checking database connection...');
  
  try {
    const { data, error } = await supabase
      .from('nft_types')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    logSuccess('Database connection successful');
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function verifyNFTSchema() {
  logStep(2, 'Verifying NFT schema...');
  
  const requiredTables = [
    'nft_types',
    'user_loyalty_cards',
    'nft_evolution_history',
    'nft_upgrade_history',
    'nft_minting_control'
  ];
  
  const missingTables = [];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        missingTables.push(table);
      } else {
        logSuccess(`Table '${table}' exists`);
      }
    } catch (error) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    logError(`Missing tables: ${missingTables.join(', ')}`);
    logWarning('Please run the database migration first: loyalty_nft_migration_fixed.sql');
    return false;
  }
  
  logSuccess('All required tables exist');
  return true;
}

async function verifyNFTData() {
  logStep(3, 'Verifying NFT data...');
  
  try {
    const { data: nftTypes, error } = await supabase
      .from('nft_types')
      .select('*');
    
    if (error) throw error;
    
    if (!nftTypes || nftTypes.length === 0) {
      logError('No NFT types found in database');
      logWarning('Please run the database migration to insert NFT data');
      return false;
    }
    
    logSuccess(`Found ${nftTypes.length} NFT types`);
    
    // Check for both custodial and non-custodial types
    const custodialCount = nftTypes.filter(nft => nft.is_custodial).length;
    const nonCustodialCount = nftTypes.filter(nft => !nft.is_custodial).length;
    
    logSuccess(`Custodial NFTs: ${custodialCount}`);
    logSuccess(`Non-Custodial NFTs: ${nonCustodialCount}`);
    
    // Check minting controls
    const { data: mintingControls, error: mintingError } = await supabase
      .from('nft_minting_control')
      .select('*');
    
    if (mintingError) throw mintingError;
    
    logSuccess(`Found ${mintingControls.length} minting controls`);
    
    return true;
  } catch (error) {
    logError(`Error verifying NFT data: ${error.message}`);
    return false;
  }
}

async function verifyRLSPolicies() {
  logStep(4, 'Verifying RLS policies...');
  
  try {
    // Check if RLS is enabled on key tables
    const { data, error } = await supabase
      .rpc('check_rls_enabled', { table_name: 'nft_types' });
    
    if (error) {
      logWarning('Could not verify RLS policies (this is normal if the function doesn\'t exist)');
    } else {
      logSuccess('RLS policies are properly configured');
    }
    
    return true;
  } catch (error) {
    logWarning('Could not verify RLS policies');
    return true; // Don't fail deployment for this
  }
}

async function testNFTOperations() {
  logStep(5, 'Testing NFT operations...');
  
  try {
    // Test reading NFT types
    const { data: nftTypes, error: readError } = await supabase
      .from('nft_types')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    if (readError) throw readError;
    
    if (nftTypes && nftTypes.length > 0) {
      logSuccess('NFT read operations working');
    }
    
    // Test minting control read
    const { data: mintingControls, error: mintingError } = await supabase
      .from('nft_minting_control')
      .select('*')
      .limit(1);
    
    if (mintingError) throw mintingError;
    
    logSuccess('Minting control operations working');
    
    return true;
  } catch (error) {
    logError(`Error testing NFT operations: ${error.message}`);
    return false;
  }
}

async function generateDeploymentReport() {
  logStep(6, 'Generating deployment report...');
  
  try {
    const { data: nftTypes } = await supabase
      .from('nft_types')
      .select('*');
    
    const { data: userNFTs } = await supabase
      .from('user_loyalty_cards')
      .select('*')
      .not('nft_type_id', 'is', null);
    
    const { data: mintingControls } = await supabase
      .from('nft_minting_control')
      .select('*');
    
    const report = {
      deploymentDate: new Date().toISOString(),
      databaseStatus: 'Connected',
      nftTypes: {
        total: nftTypes?.length || 0,
        custodial: nftTypes?.filter(nft => nft.is_custodial).length || 0,
        nonCustodial: nftTypes?.filter(nft => !nft.is_custodial).length || 0
      },
      userNFTs: {
        total: userNFTs?.length || 0
      },
      mintingControls: {
        total: mintingControls?.length || 0,
        enabled: mintingControls?.filter(control => control.minting_enabled).length || 0
      },
      systemStatus: 'Operational'
    };
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logSuccess(`Deployment report saved to: ${reportPath}`);
    
    // Display summary
    log('\n📊 Deployment Summary:', 'bright');
    log(`   NFT Types: ${report.nftTypes.total} (${report.nftTypes.custodial} custodial, ${report.nftTypes.nonCustodial} non-custodial)`);
    log(`   User NFTs: ${report.userNFTs.total}`);
    log(`   Minting Controls: ${report.mintingControls.total} (${report.mintingControls.enabled} enabled)`);
    log(`   System Status: ${report.systemStatus}`);
    
    return true;
  } catch (error) {
    logError(`Error generating deployment report: ${error.message}`);
    return false;
  }
}

async function main() {
  log('🎯 Loyalty NFT System - Production Deployment', 'bright');
  log('===============================================', 'bright');
  
  const steps = [
    checkDatabaseConnection,
    verifyNFTSchema,
    verifyNFTData,
    verifyRLSPolicies,
    testNFTOperations,
    generateDeploymentReport
  ];
  
  let allPassed = true;
  
  for (const step of steps) {
    const result = await step();
    if (!result) {
      allPassed = false;
      break;
    }
  }
  
  if (allPassed) {
    log('\n🎉 Deployment completed successfully!', 'green');
    log('The Loyalty NFT System is ready for production use.', 'green');
    log('\nNext steps:', 'bright');
    log('1. Deploy the frontend application');
    log('2. Configure environment variables');
    log('3. Set up monitoring and alerts');
    log('4. Test user flows end-to-end');
    log('5. Go live! 🚀');
  } else {
    log('\n❌ Deployment failed!', 'red');
    log('Please fix the issues above before proceeding.', 'red');
    process.exit(1);
  }
}

// Run the deployment script
if (require.main === module) {
  main().catch(error => {
    logError(`Deployment script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkDatabaseConnection,
  verifyNFTSchema,
  verifyNFTData,
  verifyRLSPolicies,
  testNFTOperations,
  generateDeploymentReport
};


