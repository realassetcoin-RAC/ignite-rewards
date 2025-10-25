console.log('Starting simple test...');

import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function simpleTest() {
  console.log('Creating client...');
  const client = new Client(localDbConfig);
  
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query('SELECT COUNT(*) as count FROM profiles');
    console.log(`✅ Profiles count: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('✅ Disconnected');
  }
}

simpleTest().catch(console.error);

