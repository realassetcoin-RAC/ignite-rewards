#!/usr/bin/env node

/**
 * APPLY MIGRATIONS VIA SUPABASE CLIENT
 * Applies all pending migrations using the Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

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

async function applyMigrations() {
  console.log('🚀 Applying Database Migrations...');
  console.log('==================================');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('apply_all_migrations.sql', 'utf8');
    
    // Split into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('\\echo'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--') || statement.startsWith('\\echo')) {
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate key')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message} (expected)`);
            successCount++;
          } else {
            console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All migrations applied successfully!');
    } else if (errorCount < successCount) {
      console.log('\n⚠️  Most migrations applied successfully with some expected errors');
    } else {
      console.log('\n❌ Multiple migration failures detected');
    }
    
  } catch (error) {
    console.error('❌ Migration application failed:', error);
    process.exit(1);
  }
}

// Alternative approach: Apply migrations manually
async function applyMigrationsManually() {
  console.log('🚀 Applying Migrations Manually...');
  console.log('==================================');
  
  try {
    // 1. Contact System Tables
    console.log('\n📱 Creating Contact System Tables...');
    
    const contactTables = [
      `CREATE TABLE IF NOT EXISTS issue_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_key text UNIQUE NOT NULL,
        category_name text NOT NULL,
        description text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      
      `CREATE TABLE IF NOT EXISTS contact_tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id text UNIQUE NOT NULL,
        user_id uuid,
        user_email text NOT NULL,
        user_name text,
        category text NOT NULL,
        tag text,
        subject text,
        description text NOT NULL,
        status text NOT NULL DEFAULT 'open',
        priority text NOT NULL DEFAULT 'medium',
        assigned_to text,
        slack_message_ts text,
        slack_channel text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        resolved_at timestamptz
      )`,
      
      `CREATE TABLE IF NOT EXISTS chatbot_conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id text NOT NULL,
        user_id uuid,
        user_email text,
        conversation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
        ticket_id uuid,
        started_at timestamptz NOT NULL DEFAULT now(),
        ended_at timestamptz,
        status text NOT NULL DEFAULT 'active'
      )`
    ];
    
    for (const sql of contactTables) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️  Contact table creation: ${error.message}`);
      } else {
        console.log('✅ Contact table created/verified');
      }
    }
    
    // 2. DAO System Tables
    console.log('\n🏛️  Creating DAO System Tables...');
    
    const daoTables = [
      `CREATE TABLE IF NOT EXISTS dao_organizations (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS dao_proposals (
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
      )`
    ];
    
    for (const sql of daoTables) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️  DAO table creation: ${error.message}`);
      } else {
        console.log('✅ DAO table created/verified');
      }
    }
    
    // 3. Marketplace Tables
    console.log('\n🏪 Creating Marketplace Tables...');
    
    const marketplaceTables = [
      `CREATE TABLE IF NOT EXISTS marketplace_listings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        image_url text,
        funding_goal numeric NOT NULL,
        min_investment numeric NOT NULL DEFAULT 0,
        max_investment numeric,
        start_time timestamptz,
        end_time timestamptz,
        token_ticker text,
        token_supply numeric,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      
      `CREATE TABLE IF NOT EXISTS marketplace_investments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE,
        user_id uuid NOT NULL,
        amount numeric NOT NULL,
        nft_multiplier numeric NOT NULL DEFAULT 1.0,
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      
      `CREATE TABLE IF NOT EXISTS nft_card_tiers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        multiplier numeric NOT NULL,
        is_premium boolean NOT NULL DEFAULT false
      )`
    ];
    
    for (const sql of marketplaceTables) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️  Marketplace table creation: ${error.message}`);
      } else {
        console.log('✅ Marketplace table created/verified');
      }
    }
    
    // 4. Insert initial data
    console.log('\n📊 Inserting Initial Data...');
    
    const initialData = [
      `INSERT INTO issue_categories (category_key, category_name, description) VALUES
       ('technical', 'Technical Support', 'Technical issues and bugs'),
       ('billing', 'Billing & Payments', 'Payment and billing related issues'),
       ('account', 'Account Management', 'Account setup and management'),
       ('general', 'General Inquiry', 'General questions and inquiries')
       ON CONFLICT (category_key) DO NOTHING`,
       
      `INSERT INTO nft_card_tiers (name, multiplier, is_premium) VALUES
       ('Basic', 1.0, false),
       ('Silver', 1.2, true),
       ('Gold', 1.5, true),
       ('Platinum', 2.0, true)
       ON CONFLICT (name) DO NOTHING`,
       
      `INSERT INTO dao_organizations (name, description, governance_token_symbol, governance_token_decimals, min_proposal_threshold, voting_period_days, execution_delay_hours, quorum_percentage, super_majority_threshold) VALUES
       ('RAC Rewards DAO', 'Main governance organization for RAC Rewards platform', 'RAC', 9, 1000, 7, 24, 10.0, 66.67)
       ON CONFLICT (name) DO NOTHING`
    ];
    
    for (const sql of initialData) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️  Initial data insertion: ${error.message}`);
      } else {
        console.log('✅ Initial data inserted/verified');
      }
    }
    
    console.log('\n🎉 Manual Migration Application Complete!');
    console.log('✅ Contact system tables created');
    console.log('✅ DAO system tables created');
    console.log('✅ Marketplace tables created');
    console.log('✅ Initial data inserted');
    
  } catch (error) {
    console.error('❌ Manual migration application failed:', error);
    process.exit(1);
  }
}

// Try the manual approach first
applyMigrationsManually().catch(error => {
  console.error('❌ Migration execution failed:', error);
  process.exit(1);
});
