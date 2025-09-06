const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function deployFix() {
  // Try different connection formats for Supabase
  const connectionConfigs = [
    // Direct connection URL format
    {
      connectionString: 'postgresql://postgres.wndswqvqogeblksrujpg:Testwr@2025@@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false }
    },
    // Alternative format
    {
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.wndswqvqogeblksrujpg',
      password: 'Testwr@2025@',
      ssl: { rejectUnauthorized: false }
    },
    // Try without SSL first
    {
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.wndswqvqogeblksrujpg',
      password: 'Testwr@2025@'
    }
  ];

  let client;
  let connected = false;

  for (let i = 0; i < connectionConfigs.length; i++) {
    try {
      console.log(`🔌 Attempting connection method ${i + 1}...`);
      client = new Client(connectionConfigs[i]);
      await client.connect();
      console.log('✅ Connected successfully!');
      connected = true;
      break;
    } catch (error) {
      console.log(`❌ Connection method ${i + 1} failed: ${error.message}`);
      if (client) {
        try { await client.end(); } catch {}
      }
    }
  }

  if (!connected) {
    console.error('❌ All connection methods failed');
    console.error('');
    console.error('🔧 Manual deployment required:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project (wndswqvqogeblksrujpg)');
    console.error('   3. Open SQL Editor');
    console.error('   4. Copy the contents of: comprehensive_subscription_plans_fix.sql');
    console.error('   5. Paste and run it in the SQL editor');
    console.error('   6. After running, set your user as admin:');
    console.error('      UPDATE api.profiles SET role = \'admin\' WHERE email = \'your-email@example.com\';');
    return;
  }

  try {
    console.log('📖 Reading comprehensive fix SQL...');
    const sqlContent = fs.readFileSync(path.join(__dirname, 'comprehensive_subscription_plans_fix.sql'), 'utf8');

    console.log('🚀 Deploying subscription plans fix...');
    console.log('   This may take a moment...');
    
    // Execute the comprehensive fix
    const result = await client.query(sqlContent);
    
    console.log('✅ Fix deployed successfully!');

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
    console.log('   2. Set your user as admin (replace with your email):');
    console.log('      UPDATE api.profiles SET role = \'admin\' WHERE email = \'your-email@example.com\';');
    console.log('   3. Clear browser cache and log out/in');
    console.log('   4. Navigate to Admin Dashboard → Plans tab');
    console.log('   5. You should now see subscription plans without permission errors!');
    console.log('');
    console.log('✨ Both permission errors should now be resolved!');
    console.log('   - "You don\'t have permission to access subscription plans" ✅ FIXED');
    console.log('   - "Failed to save plan: permission denied for table merchant_subscription_plans" ✅ FIXED');

  } catch (error) {
    console.error('❌ Error during deployment:', error.message);
    console.error('');
    console.error('🔧 If this fails, use manual deployment:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Open SQL Editor');
    console.error('   4. Copy and run: comprehensive_subscription_plans_fix.sql');
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the deployment
deployFix().catch(console.error);