#!/usr/bin/env node

const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function checkUsersTable() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Check if users table exists
    console.log('\n📋 Checking for users table...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table users exists with columns:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ Table users does not exist');
    }

    // Check foreign key constraints
    console.log('\n🔗 Checking foreign key constraints...');
    const fkResult = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'profiles'
    `);
    
    if (fkResult.rows.length > 0) {
      console.log('✅ Foreign key constraints for profiles table:');
      fkResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    } else {
      console.log('❌ No foreign key constraints found for profiles table');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkUsersTable();
