#!/usr/bin/env node

/**
 * CHECK EXISTING TABLES
 * Checks what tables already exist in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingTables() {
  console.log('🔍 Checking Existing Tables...');
  console.log('==============================');
  
  const tablesToCheck = [
    'contact_tickets',
    'issue_categories', 
    'chatbot_conversations',
    'dao_organizations',
    'dao_proposals',
    'dao_members',
    'dao_votes',
    'marketplace_listings',
    'marketplace_investments',
    'nft_card_tiers',
    'rewards_config',
    'config_proposals',
    'anonymous_users',
    'user_wallets',
    'user_rewards',
    'notional_earnings',
    'rewards_history',
    'vesting_schedules'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('schema cache')) {
          missingTables.push(tableName);
          console.log(`❌ ${tableName} - Missing`);
        } else {
          console.log(`⚠️  ${tableName} - Error: ${error.message}`);
        }
      } else {
        existingTables.push(tableName);
        console.log(`✅ ${tableName} - Exists`);
      }
    } catch (err) {
      missingTables.push(tableName);
      console.log(`❌ ${tableName} - Missing (${err.message})`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n❌ Missing tables:');
    missingTables.forEach(table => console.log(`   - ${table}`));
  }
  
  if (existingTables.length > 0) {
    console.log('\n✅ Existing tables:');
    existingTables.forEach(table => console.log(`   - ${table}`));
  }
  
  return { existingTables, missingTables };
}

// Run the check
checkExistingTables().catch(error => {
  console.error('❌ Table check failed:', error);
  process.exit(1);
});
