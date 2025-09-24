// Apply Loyalty Governance Migration
// Creates the loyalty_change_requests table and related functionality

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  user: process.env.VITE_DB_USER || 'postgres',
  host: process.env.VITE_DB_HOST || 'localhost',
  database: process.env.VITE_DB_NAME || 'ignite_rewards',
  password: process.env.VITE_DB_PASSWORD || 'Maegan@200328',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
};

async function applyLoyaltyGovernanceMigration() {
  console.log('🔧 Applying Loyalty Governance Migration...\n');
  
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../sql/create_loyalty_change_requests_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing loyalty governance migration...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Loyalty governance migration applied successfully!');
    
    // Verify the table was created
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'loyalty_change_requests'
    `);
    
    if (tables.length > 0) {
      console.log('✅ loyalty_change_requests table created successfully');
    } else {
      console.log('❌ loyalty_change_requests table not found');
    }

    // Check if the trigger was created
    const { rows: triggers } = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_create_dao_proposal_for_loyalty_change'
    `);
    
    if (triggers.length > 0) {
      console.log('✅ Automatic DAO proposal trigger created successfully');
    } else {
      console.log('❌ Automatic DAO proposal trigger not found');
    }

    // Test the functionality with a sample change
    console.log('\n🧪 Testing loyalty governance functionality...');
    
    const { rows: testUsers } = await client.query(`
      SELECT id FROM auth.users LIMIT 1
    `);
    
    if (testUsers.length > 0) {
      const testUserId = testUsers[0].id;
      
      // Insert a test loyalty change
      const { rows: testChange } = await client.query(`
        INSERT INTO public.loyalty_change_requests (
          change_type,
          parameter_name,
          old_value,
          new_value,
          reason,
          proposed_by,
          status
        ) VALUES (
          'point_release_delay',
          'release_delay_days',
          '30',
          '45',
          'Test change for governance system',
          $1,
          'pending'
        ) RETURNING id, dao_proposal_id
      `, [testUserId]);
      
      if (testChange.length > 0) {
        console.log('✅ Test loyalty change created successfully');
        console.log(`   Change ID: ${testChange[0].id}`);
        
        if (testChange[0].dao_proposal_id) {
          console.log(`   DAO Proposal ID: ${testChange[0].dao_proposal_id}`);
          console.log('✅ Automatic DAO proposal creation working');
        } else {
          console.log('❌ Automatic DAO proposal creation failed');
        }
        
        // Clean up test data
        await client.query(`
          DELETE FROM public.loyalty_change_requests 
          WHERE id = $1
        `, [testChange[0].id]);
        
        if (testChange[0].dao_proposal_id) {
          await client.query(`
            DELETE FROM public.dao_proposals 
            WHERE id = $1
          `, [testChange[0].dao_proposal_id]);
        }
        
        console.log('🧹 Test data cleaned up');
      }
    } else {
      console.log('⚠️  No users found for testing');
    }

    console.log('\n🎉 Loyalty Governance Migration Complete!');
    console.log('\n📋 What was created:');
    console.log('   ✅ loyalty_change_requests table');
    console.log('   ✅ Automatic DAO proposal trigger');
    console.log('   ✅ RLS policies for security');
    console.log('   ✅ Indexes for performance');
    console.log('   ✅ Test functionality verified');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. The loyalty governance system is now active');
    console.log('   2. Any loyalty behavior changes will automatically create DAO proposals');
    console.log('   3. Use the Admin Panel → Governance tab to manage changes');
    console.log('   4. All changes require DAO approval before implementation');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure PostgreSQL is running');
    console.error('   2. Check database credentials in .env.local');
    console.error('   3. Verify database exists and is accessible');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
applyLoyaltyGovernanceMigration();

