#!/usr/bin/env node

/**
 * Apply Loyalty Network Integration Migration
 * 
 * This script applies the database schema for the loyalty network linking feature.
 * It creates all necessary tables, indexes, and policies for the system.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting Loyalty Network Integration Migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'loyalty_network_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded successfully');
    console.log('📊 Applying database schema...\n');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_text: statement + ';' 
          });

          if (error) {
            // Try direct execution if RPC fails
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
              },
              body: JSON.stringify({ sql_text: statement + ';' })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Statement ${i + 1} failed:`, errorText);
              errorCount++;
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
              successCount++;
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Statement ${i + 1} failed:`, err.message);
          errorCount++;
        }
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total statements: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Loyalty Network Integration Migration completed successfully!');
      console.log('\n📋 What was created:');
      console.log('   • loyalty_networks table - Store third-party loyalty network configurations');
      console.log('   • user_loyalty_links table - Track user connections to loyalty networks');
      console.log('   • loyalty_otp_sessions table - Manage OTP verification sessions');
      console.log('   • loyalty_point_conversions table - Record point conversion transactions');
      console.log('   • loyalty_point_balances table - Store point balance snapshots');
      console.log('   • Row Level Security (RLS) policies for data protection');
      console.log('   • Database functions for OTP generation and cleanup');
      console.log('   • Default loyalty networks (Starbucks, McDonald\'s, etc.)');
      
      console.log('\n🔧 Next Steps:');
      console.log('   1. Test the admin loyalty network management interface');
      console.log('   2. Test the user loyalty account linking flow');
      console.log('   3. Configure real API endpoints for third-party integrations');
      console.log('   4. Set up SMS service for OTP delivery');
      console.log('   5. Test the point conversion system');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the failed statements.');
      console.log('   Some features may not work correctly until all statements are applied.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function testMigration() {
  console.log('\n🧪 Testing migration results...\n');

  try {
    // Test if tables exist
    const tables = [
      'loyalty_networks',
      'user_loyalty_links', 
      'loyalty_otp_sessions',
      'loyalty_point_conversions',
      'loyalty_point_balances'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    // Test default data
    const { data: networks, error: networksError } = await supabase
      .from('loyalty_networks')
      .select('name, display_name, is_active')
      .limit(5);

    if (networksError) {
      console.log(`❌ Default networks: ${networksError.message}`);
    } else {
      console.log(`✅ Default networks: ${networks?.length || 0} networks created`);
      networks?.forEach(network => {
        console.log(`   • ${network.display_name} (${network.name}) - ${network.is_active ? 'Active' : 'Inactive'}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Main execution
async function main() {
  await applyMigration();
  await testMigration();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { applyMigration, testMigration };
