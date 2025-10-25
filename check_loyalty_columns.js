import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function checkLoyaltyColumns() {
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_loyalty_cards' 
      AND column_name LIKE '%loyalty%'
    `);
    
    console.log('Loyalty columns:', result.rows);

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkLoyaltyColumns();

