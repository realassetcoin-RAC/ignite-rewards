#!/usr/bin/env node

const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function checkAllTables() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Get all tables
    console.log('\n📋 All tables in database:');
    const result = await client.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name} (${row.table_schema})`);
      });
    } else {
      console.log('❌ No tables found in public schema');
    }

    // Check if there are other schemas
    console.log('\n📋 All schemas:');
    const schemaResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkAllTables();
