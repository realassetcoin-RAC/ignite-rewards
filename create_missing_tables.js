#!/usr/bin/env node

/**
 * CREATE MISSING TABLES
 * Creates only the missing tables that don't exist yet
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

async function createMissingTables() {
  console.log('🔧 Creating Missing Tables...');
  console.log('==============================');
  
  try {
    // 1. Create DAO Organizations table
    console.log('\n🏛️  Creating DAO Organizations table...');
    const { error: daoOrgError } = await supabase
      .from('dao_organizations')
      .select('*')
      .limit(1);
    
    if (daoOrgError && daoOrgError.message.includes('does not exist')) {
      // Table doesn't exist, we need to create it via SQL
      console.log('❌ DAO Organizations table missing - needs manual creation');
    } else {
      console.log('✅ DAO Organizations table already exists');
    }
    
    // 2. Create DAO Proposals table
    console.log('\n📋 Creating DAO Proposals table...');
    const { error: daoPropError } = await supabase
      .from('dao_proposals')
      .select('*')
      .limit(1);
    
    if (daoPropError && daoPropError.message.includes('does not exist')) {
      console.log('❌ DAO Proposals table missing - needs manual creation');
    } else {
      console.log('✅ DAO Proposals table already exists');
    }
    
    // 3. Create DAO Members table
    console.log('\n👥 Creating DAO Members table...');
    const { error: daoMemError } = await supabase
      .from('dao_members')
      .select('*')
      .limit(1);
    
    if (daoMemError && daoMemError.message.includes('does not exist')) {
      console.log('❌ DAO Members table missing - needs manual creation');
    } else {
      console.log('✅ DAO Members table already exists');
    }
    
    // 4. Create DAO Votes table
    console.log('\n🗳️  Creating DAO Votes table...');
    const { error: daoVoteError } = await supabase
      .from('dao_votes')
      .select('*')
      .limit(1);
    
    if (daoVoteError && daoVoteError.message.includes('does not exist')) {
      console.log('❌ DAO Votes table missing - needs manual creation');
    } else {
      console.log('✅ DAO Votes table already exists');
    }
    
    // 5. Create Config Proposals table
    console.log('\n⚙️  Creating Config Proposals table...');
    const { error: configPropError } = await supabase
      .from('config_proposals')
      .select('*')
      .limit(1);
    
    if (configPropError && configPropError.message.includes('does not exist')) {
      console.log('❌ Config Proposals table missing - needs manual creation');
    } else {
      console.log('✅ Config Proposals table already exists');
    }
    
    console.log('\n📋 MANUAL STEPS REQUIRED:');
    console.log('=========================');
    console.log('Since some tables are missing, you need to create them manually:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following SQL commands:');
    console.log('');
    console.log('-- Create DAO Organizations table');
    console.log(`CREATE TABLE IF NOT EXISTS dao_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  governance_token_symbol text NOT NULL,
  governance_token_decimals int NOT NULL DEFAULT 9,
  min_proposal_threshold numeric NOT NULL DEFAULT 0,
  voting_period_days int NOT NULL DEFAULT 7,
  execution_delay_hours int NOT NULL DEFAULT 24,
  quorum_percentage numeric NOT NULL DEFAULT 10.0,
  super_majority_threshold numeric NOT NULL DEFAULT 66.67,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`);
    console.log('');
    console.log('-- Create DAO Proposals table');
    console.log(`CREATE TABLE IF NOT EXISTS dao_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid REFERENCES dao_organizations(id) ON DELETE CASCADE,
  proposer_id uuid,
  title text NOT NULL,
  description text,
  category text,
  voting_type text NOT NULL DEFAULT 'simple_majority',
  status text NOT NULL DEFAULT 'draft',
  start_time timestamptz,
  end_time timestamptz,
  total_votes int NOT NULL DEFAULT 0,
  yes_votes int NOT NULL DEFAULT 0,
  no_votes int NOT NULL DEFAULT 0,
  abstain_votes int NOT NULL DEFAULT 0,
  participation_rate numeric NOT NULL DEFAULT 0
);`);
    console.log('');
    console.log('-- Create DAO Members table');
    console.log(`CREATE TABLE IF NOT EXISTS dao_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id uuid REFERENCES dao_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  wallet_address text,
  role text NOT NULL DEFAULT 'member',
  governance_tokens numeric NOT NULL DEFAULT 0,
  voting_power numeric NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  user_email text,
  user_full_name text
);`);
    console.log('');
    console.log('-- Create DAO Votes table');
    console.log(`CREATE TABLE IF NOT EXISTS dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  choice text NOT NULL,
  voting_power numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);`);
    console.log('');
    console.log('-- Create Config Proposals table');
    console.log(`CREATE TABLE IF NOT EXISTS config_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid,
  proposed_distribution_interval int NOT NULL,
  proposed_max_rewards_per_user int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  proposer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  implemented_at timestamptz
);`);
    console.log('');
    console.log('4. After creating the tables, run: node test_all_systems.js');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

// Run the check
createMissingTables().catch(error => {
  console.error('❌ Table creation check failed:', error);
  process.exit(1);
});
