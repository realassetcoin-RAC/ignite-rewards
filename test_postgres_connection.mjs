// Test PostgreSQL Connection
// This script tests the connection to your local PostgreSQL database

import pkg from 'pg';
const { Pool } = pkg;

// Database configuration from your local.env file
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ignite_rewards',
  password: 'Maegan@200328',
  port: 5432,
});

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('📊 Database: ignite_rewards');
  console.log('👤 User: postgres');
  console.log('🌐 Host: localhost:5432');
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test database exists
    const dbResult = await client.query('SELECT current_database()');
    console.log('📊 Current database:', dbResult.rows[0].current_database);
    
    // Test PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log('🔧 PostgreSQL version:', versionResult.rows[0].version.split(' ')[0] + ' ' + versionResult.rows[0].version.split(' ')[1]);
    
    // Test tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tablesResult.rows.length);
    if (tablesResult.rows.length > 0) {
      console.log('📋 Table list:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. You may need to run the database setup script.');
    }
    
    // Test admin user exists
    try {
      const adminResult = await client.query(`
        SELECT id, email, role, created_at 
        FROM auth.users 
        WHERE email = 'admin@igniterewards.com'
      `);
      
      if (adminResult.rows.length > 0) {
        console.log('👤 Admin user found:');
        console.log(`   - ID: ${adminResult.rows[0].id}`);
        console.log(`   - Email: ${adminResult.rows[0].email}`);
        console.log(`   - Role: ${adminResult.rows[0].role}`);
        console.log(`   - Created: ${adminResult.rows[0].created_at}`);
      } else {
        console.log('⚠️  Admin user not found. You may need to run the database setup script.');
      }
    } catch (error) {
      console.log('⚠️  Could not check admin user (table may not exist):', error.message);
    }
    
    client.release();
    
    console.log('\n🎉 PostgreSQL connection test completed successfully!');
    console.log('✅ Your local database is ready for the application.');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure PostgreSQL is running');
      console.log('   2. Check if the port 5432 is correct');
      console.log('   3. Verify the database name "ignite_rewards" exists');
    } else if (error.code === '28P01') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check the password "Maegan@200328"');
      console.log('   2. Verify the username "postgres"');
    }
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection();
