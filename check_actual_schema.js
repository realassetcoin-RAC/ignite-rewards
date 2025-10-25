import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function checkActualSchema() {
  console.log('🔍 Checking Actual Database Schema...\n');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    const tablesToCheck = [
      'user_loyalty_cards',
      'loyalty_otp_codes', 
      'user_solana_wallets',
      'asset_investments',
      'terms_privacy_acceptance'
    ];

    for (const tableName of tablesToCheck) {
      console.log(`📋 Table: ${tableName}`);
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (result.rows.length > 0) {
          console.log('Columns:');
          result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
          });
        } else {
          console.log('  Table not found');
        }
        console.log('');
      } catch (error) {
        console.log(`  Error: ${error.message}\n`);
      }
    }

  } catch (error) {
    console.log('❌ Database connection error:', error.message);
  } finally {
    await client.end();
  }
}

checkActualSchema();

