#!/usr/bin/env node
/**
 * Test script to verify Supabase database connection
 * Usage: node test-db-connection.js
 */

const { Client } = require('pg');

async function testConnection() {
  console.log('🔌 Testing Supabase database connection...\n');
  
  const connectionString = 'postgresql://postgres:M@r0on@2025@db.wndswqvqogeblksrujpg.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to Supabase database!\n');

    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Database query successful!');
    console.log(`📊 Database: ${result.rows[0].current_database}`);
    console.log(`👤 User: ${result.rows[0].current_user}`);
    console.log(`🔧 Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);

    // Test schema access
    console.log('🔍 Testing schema access...');
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('public', 'api', 'auth')
      ORDER BY schema_name
    `);
    console.log('✅ Schema access successful!');
    console.log('📋 Available schemas:');
    schemaResult.rows.forEach(row => {
      console.log(`   - ${row.schema_name}`);
    });
    console.log('');

    // Test table access
    console.log('🔍 Testing table access...');
    const tableResult = await client.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'api')
      ORDER BY table_schema, table_name
      LIMIT 10
    `);
    console.log('✅ Table access successful!');
    console.log('📋 Sample tables:');
    tableResult.rows.forEach(row => {
      console.log(`   - ${row.table_schema}.${row.table_name}`);
    });
    if (tableResult.rows.length === 10) {
      console.log('   ... (showing first 10 tables)');
    }
    console.log('');

    console.log('🎉 All database connection tests passed!');
    console.log('✅ Your Supabase database is ready to use.');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Possible solutions:');
      console.error('   - Check if the password is correct');
      console.error('   - Verify the username is correct');
    } else if (error.message.includes('connection refused')) {
      console.error('\n💡 Possible solutions:');
      console.error('   - Check if the host and port are correct');
      console.error('   - Verify network connectivity');
      console.error('   - Check if the database server is running');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 Possible solutions:');
      console.error('   - SSL connection issue - try with ssl: { rejectUnauthorized: false }');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
testConnection().catch(console.error);
