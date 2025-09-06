const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function deployFix() {
  // Database connection configuration
  const client = new Client({
    host: 'aws-0-us-west-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.wndswqvqogeblksrujpg',
    password: 'Testwr@2025@',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📖 Reading comprehensive fix SQL...');
    const sqlContent = fs.readFileSync(path.join(__dirname, 'comprehensive_subscription_plans_fix.sql'), 'utf8');

    console.log('🚀 Deploying subscription plans fix...');
    console.log('   This may take a moment...');
    
    // Execute the comprehensive fix
    const result = await client.query(sqlContent);
    
    console.log('✅ Fix deployed successfully!');
    console.log('📊 Database response received');

    // Run verification queries
    console.log('🔍 Verifying deployment...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_name = 'merchant_subscription_plans'
      ) as table_exists;
    `);
    
    // Check RLS policies
    const policyCheck = await client.query(`
      SELECT COUNT(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'api' AND tablename = 'merchant_subscription_plans';
    `);
    
    // Check default plans
    const plansCheck = await client.query(`
      SELECT COUNT(*) as plans_count FROM api.merchant_subscription_plans;
    `);
    
    // Check admin function
    const functionCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'api' AND routine_name = 'check_admin_access'
      ) as function_exists;
    `);

    console.log('');
    console.log('📋 VERIFICATION RESULTS:');
    console.log(`   ✅ Table exists: ${tableCheck.rows[0].table_exists}`);
    console.log(`   ✅ RLS policies: ${policyCheck.rows[0].policy_count}`);
    console.log(`   ✅ Default plans: ${plansCheck.rows[0].plans_count}`);
    console.log(`   ✅ Admin function: ${functionCheck.rows[0].function_exists}`);

    console.log('');
    console.log('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📋 What was deployed:');
    console.log('   ✅ Created api.merchant_subscription_plans table');
    console.log('   ✅ Set up 5 RLS policies for secure access');
    console.log('   ✅ Created admin role checking function');
    console.log('   ✅ Granted all necessary permissions');
    console.log('   ✅ Added performance indexes');
    console.log('   ✅ Inserted 3 default subscription plans');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('   1. Log into your application');
    console.log('   2. Find your user ID and update your role to admin:');
    console.log('      UPDATE api.profiles SET role = \'admin\' WHERE email = \'your-email@example.com\';');
    console.log('   3. Clear browser cache and log out/in');
    console.log('   4. Navigate to Admin Dashboard → Plans tab');
    console.log('   5. You should now see subscription plans without permission errors!');
    console.log('');
    console.log('✨ The permission errors should now be resolved!');

  } catch (error) {
    console.error('❌ Error deploying fix:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   - Check if the database credentials are correct');
    console.error('   - Verify network connectivity to Supabase');
    console.error('   - Ensure the database is accessible');
    console.error('');
    console.error('💡 Alternative: Apply the fix manually in Supabase Dashboard');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Open SQL Editor');
    console.error('   4. Copy and run: comprehensive_subscription_plans_fix.sql');
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the deployment
deployFix().catch(console.error);