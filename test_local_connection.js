import pkg from 'pg';
const { Pool } = pkg;

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ignite_rewards',
  password: 'postgres123!',
  port: 5432,
});

async function testConnection() {
  console.log('🔍 Testing local PostgreSQL connection...');
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test database exists
    const dbResult = await client.query('SELECT current_database()');
    console.log('📊 Current database:', dbResult.rows[0].current_database);
    
    // Test tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('📋 Tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log('  - ' + row.table_name);
    });
    
    // Test auth schema exists
    const authTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'auth' 
      ORDER BY table_name
    `);
    console.log('🔐 Auth tables found:', authTablesResult.rows.length);
    authTablesResult.rows.forEach(row => {
      console.log('  - ' + row.table_name);
    });
    
    // Test admin user exists
    const userResult = await client.query(`
      SELECT id, email, role, is_super_admin 
      FROM auth.users 
      WHERE email = 'admin@igniterewards.com'
    `);
    console.log('👤 Admin user:', userResult.rows.length > 0 ? 'Found' : 'Not found');
    if (userResult.rows.length > 0) {
      console.log('   Email:', userResult.rows[0].email);
      console.log('   Role:', userResult.rows[0].role);
      console.log('   Is Super Admin:', userResult.rows[0].is_super_admin);
    }
    
    // Test profiles table
    const profileResult = await client.query(`
      SELECT id, email, full_name, role 
      FROM public.profiles 
      WHERE email = 'admin@igniterewards.com'
    `);
    console.log('👤 Admin profile:', profileResult.rows.length > 0 ? 'Found' : 'Not found');
    if (profileResult.rows.length > 0) {
      console.log('   Name:', profileResult.rows[0].full_name);
      console.log('   Role:', profileResult.rows[0].role);
    }
    
    // Test subscription plans
    const plansResult = await client.query(`
      SELECT id, name, price_monthly 
      FROM merchant_subscription_plans 
      ORDER BY plan_number
    `);
    console.log('💰 Subscription plans:', plansResult.rows.length);
    plansResult.rows.forEach(plan => {
      console.log(`  - ${plan.name} ($${plan.price_monthly}/month)`);
    });
    
    // Test RPC function
    const rpcResult = await client.query('SELECT * FROM get_valid_subscription_plans()');
    console.log('🔧 RPC function test:', rpcResult.rows.length, 'plans returned');
    
    client.release();
    console.log('✅ All tests passed! Database is ready for local development.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('💡 Make sure PostgreSQL is running and the database exists.');
    console.error('💡 Run the setup script first: psql -U postgres -d ignite_rewards -f fix-subscription-plans-table.sql');
  } finally {
    await pool.end();
  }
}

testConnection();
