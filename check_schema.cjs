#!/usr/bin/env node

const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function checkSchema() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Check if tables exist and their structure
    const tables = ['profiles', 'merchants', 'user_loyalty_cards', 'loyalty_transactions', 'qr_codes', 'referrals'];
    
    for (const table of tables) {
      try {
        console.log(`\n📋 Checking table: ${table}`);
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        
        if (result.rows.length > 0) {
          console.log(`✅ Table ${table} exists with columns:`);
          result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
        } else {
          console.log(`❌ Table ${table} does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkSchema();
