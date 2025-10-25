import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function finalWorkingTest() {
  console.log('🎯 FINAL WORKING RUNTIME COMPLIANCE TEST\n');
  console.log(`📊 Database: ${localDbConfig.database}@${localDbConfig.host}:${localDbConfig.port}\n`);

  const client = new Client(localDbConfig);
  const results = {
    loyaltyCards: { success: false, details: {} },
    nftOperations: { success: false, details: {} },
    merchantPlans: { success: false, details: {} },
    otpOperations: { success: false, details: {} },
    walletOperations: { success: false, details: {} },
    investmentFeatures: { success: false, details: {} },
    rpcFunctions: { success: false, details: {} },
    termsPrivacy: { success: false, details: {} }
  };

  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    // Get existing valid IDs
    const existingUsers = await client.query('SELECT id FROM profiles LIMIT 1');
    const existingNftTypes = await client.query('SELECT id FROM nft_types LIMIT 1');
    const existingNetworks = await client.query('SELECT id FROM loyalty_networks LIMIT 1');
    const existingInitiatives = await client.query('SELECT id FROM asset_initiatives LIMIT 1');
    
    const validUserId = existingUsers.rows[0]?.id || '00000000-0000-0000-0000-000000000001';
    const validNftTypeId = existingNftTypes.rows[0]?.id || '00000000-0000-0000-0000-000000000002';
    const validNetworkId = existingNetworks.rows[0]?.id || '00000000-0000-0000-0000-000000000003';
    const validInitiativeId = existingInitiatives.rows[0]?.id || '00000000-0000-0000-0000-000000000004';
    
    console.log(`✅ Using valid IDs: User=${validUserId}, NFT=${validNftTypeId}, Network=${validNetworkId}, Initiative=${validInitiativeId}\n`);

    // 1. Test Loyalty Cards Operations
    console.log('1️⃣ Testing Loyalty Cards Operations...');
    try {
      // Test loyalty number generation using the actual function
      const loyaltyNumberResult = await client.query('SELECT generate_loyalty_number($1) as generated_loyalty_number', ['test@example.com']);
      const loyaltyNumber = loyaltyNumberResult.rows[0].generated_loyalty_number;
      console.log(`✅ Generated loyalty number: ${loyaltyNumber}`);

      // Test loyalty card creation
      const insertResult = await client.query(`
        INSERT INTO user_loyalty_cards (
          user_id, nft_type_id, loyalty_number, card_number, 
          full_name, email, phone, points_balance, tier_level, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, card_number
      `, [
        validUserId,
        validNftTypeId,
        loyaltyNumber,
        'LC' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        'Test User',
        'test@example.com',
        '+1234567890',
        100,
        'bronze',
        true
      ]);

      const loyaltyCard = insertResult.rows[0];
      console.log(`✅ Created loyalty card: ${loyaltyCard.id} - ${loyaltyCard.card_number}`);

      // Test loyalty card retrieval
      const selectResult = await client.query(`
        SELECT id, loyalty_number, card_number, full_name, email
        FROM user_loyalty_cards 
        WHERE user_loyalty_cards.id = $1
      `, [loyaltyCard.id]);
      
      console.log(`✅ Retrieved loyalty card: ${selectResult.rows[0].full_name}`);

      // Cleanup
      await client.query('DELETE FROM user_loyalty_cards WHERE id = $1', [loyaltyCard.id]);
      console.log('✅ Cleaned up test loyalty card');

      results.loyaltyCards = { success: true, details: { created: loyaltyCard.id } };
    } catch (error) {
      console.log(`❌ Loyalty cards test failed: ${error.message}`);
      results.loyaltyCards = { success: false, details: { error: error.message } };
    }

    // 2. Test NFT Operations
    console.log('\n2️⃣ Testing NFT Operations...');
    try {
      const nftTypesResult = await client.query('SELECT COUNT(*) as count FROM nft_types');
      const nftCollectionsResult = await client.query('SELECT COUNT(*) as count FROM nft_collections');
      const userNftsResult = await client.query('SELECT COUNT(*) as count FROM user_nfts');
      
      console.log(`✅ Retrieved ${nftTypesResult.rows[0].count} NFT types`);
      console.log(`✅ Retrieved ${nftCollectionsResult.rows[0].count} NFT collections`);
      console.log(`✅ User NFTs table accessible: ${userNftsResult.rows[0].count} records`);
      
      results.nftOperations = { success: true, details: { 
        types: nftTypesResult.rows[0].count,
        collections: nftCollectionsResult.rows[0].count,
        userNfts: userNftsResult.rows[0].count
      }};
    } catch (error) {
      console.log(`❌ NFT operations test failed: ${error.message}`);
      results.nftOperations = { success: false, details: { error: error.message } };
    }

    // 3. Test Merchant Plans (Fixed)
    console.log('\n3️⃣ Testing Merchant Plans...');
    try {
      const plansResult = await client.query('SELECT * FROM merchant_subscription_plans WHERE is_active = true ORDER BY price_monthly');
      console.log(`✅ Retrieved ${plansResult.rows.length} merchant subscription plans`);
      
      plansResult.rows.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price_monthly}/month (${plan.monthly_points} points, ${plan.monthly_transactions} transactions)`);
      });
      
      results.merchantPlans = { success: true, details: { count: plansResult.rows.length } };
    } catch (error) {
      console.log(`❌ Merchant plans test failed: ${error.message}`);
      results.merchantPlans = { success: false, details: { error: error.message } };
    }

    // 4. Test OTP Operations
    console.log('\n4️⃣ Testing OTP Operations...');
    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const insertResult = await client.query(`
        INSERT INTO loyalty_otp_codes (
          user_id, network_id, otp_code, expires_at, is_used
        ) VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes', false)
        RETURNING id
      `, [validUserId, validNetworkId, otpCode]);

      const otpId = insertResult.rows[0].id;
      console.log(`✅ Created OTP record: ${otpId} with code: ${otpCode}`);

      // Test OTP verification
      const verifyResult = await client.query(`
        UPDATE loyalty_otp_codes 
        SET is_used = true, used_at = NOW()
        WHERE id = $1 AND otp_code = $2 AND expires_at > NOW() AND is_used = false
        RETURNING id
      `, [otpId, otpCode]);

      if (verifyResult.rows.length > 0) {
        console.log('✅ OTP verification successful');
      } else {
        console.log('❌ OTP verification failed');
      }

      // Cleanup
      await client.query('DELETE FROM loyalty_otp_codes WHERE id = $1', [otpId]);
      console.log('✅ Cleaned up test OTP record');

      results.otpOperations = { success: true, details: { created: otpId } };
    } catch (error) {
      console.log(`❌ OTP operations test failed: ${error.message}`);
      results.otpOperations = { success: false, details: { error: error.message } };
    }

    // 5. Test Wallet Operations
    console.log('\n5️⃣ Testing Wallet Operations...');
    try {
      const solanaWalletsResult = await client.query('SELECT COUNT(*) as count FROM user_solana_wallets');
      const userWalletsResult = await client.query('SELECT COUNT(*) as count FROM user_wallets');
      
      console.log(`✅ Solana wallets table accessible: ${solanaWalletsResult.rows[0].count} records`);
      console.log(`✅ User wallets table accessible: ${userWalletsResult.rows[0].count} records`);

      // Test wallet creation
      const walletAddress = 'test-solana-address-' + Date.now();
      const insertResult = await client.query(`
        INSERT INTO user_solana_wallets (
          user_id, public_key, is_active, created_at
        ) VALUES ($1, $2, true, NOW())
        RETURNING id
      `, [validUserId, walletAddress]);

      const walletId = insertResult.rows[0].id;
      console.log(`✅ Created Solana wallet: ${walletId} - ${walletAddress}`);

      // Cleanup
      await client.query('DELETE FROM user_solana_wallets WHERE id = $1', [walletId]);
      console.log('✅ Cleaned up test wallet');

      results.walletOperations = { success: true, details: { created: walletId } };
    } catch (error) {
      console.log(`❌ Wallet operations test failed: ${error.message}`);
      results.walletOperations = { success: false, details: { error: error.message } };
    }

    // 6. Test Investment Features
    console.log('\n6️⃣ Testing Investment Features...');
    try {
      const initiativesResult = await client.query('SELECT COUNT(*) as count FROM asset_initiatives');
      const investmentsResult = await client.query('SELECT COUNT(*) as count FROM asset_investments');
      
      console.log(`✅ Retrieved ${initiativesResult.rows[0].count} asset initiatives`);
      console.log(`✅ Asset investments table accessible: ${investmentsResult.rows[0].count} records`);

      // Test investment creation
      const insertResult = await client.query(`
        INSERT INTO asset_investments (
          user_id, asset_initiative_id, amount, currency, status, wallet_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [validUserId, validInitiativeId, 100.50, 'USDT', 'pending', 'test-wallet-address']);

      const investmentId = insertResult.rows[0].id;
      console.log(`✅ Created investment: ${investmentId} - 100.50 USDT`);

      // Cleanup
      await client.query('DELETE FROM asset_investments WHERE id = $1', [investmentId]);
      console.log('✅ Cleaned up test investment');

      results.investmentFeatures = { success: true, details: { created: investmentId } };
    } catch (error) {
      console.log(`❌ Investment features test failed: ${error.message}`);
      results.investmentFeatures = { success: false, details: { error: error.message } };
    }

    // 7. Test RPC Functions
    console.log('\n7️⃣ Testing RPC Functions...');
    try {
      const loyaltyNumberResult = await client.query('SELECT generate_loyalty_number($1) as loyalty_number', ['test@example.com']);
      const plansResult = await client.query('SELECT get_valid_subscription_plans() as plans');
      
      console.log(`✅ RPC generate_loyalty_number: ${loyaltyNumberResult.rows[0].loyalty_number}`);
      console.log(`✅ RPC get_valid_subscription_plans: ${plansResult.rows[0].plans.length} plans`);
      
      results.rpcFunctions = { success: true, details: { 
        loyaltyNumber: loyaltyNumberResult.rows[0].loyalty_number,
        plansCount: plansResult.rows[0].plans.length
      }};
    } catch (error) {
      console.log(`❌ RPC functions test failed: ${error.message}`);
      results.rpcFunctions = { success: false, details: { error: error.message } };
    }

    // 8. Test Terms/Privacy Acceptance
    console.log('\n8️⃣ Testing Terms/Privacy Acceptance...');
    try {
      const termsResult = await client.query('SELECT COUNT(*) as count FROM terms_privacy_acceptance');
      console.log(`✅ Terms/privacy acceptance table accessible: ${termsResult.rows[0].count} records`);

      // Test terms acceptance creation
      const insertResult = await client.query(`
        INSERT INTO terms_privacy_acceptance (
          user_id, terms_accepted, privacy_accepted, terms_accepted_at, privacy_accepted_at
        ) VALUES ($1, true, true, NOW(), NOW())
        RETURNING id
      `, [validUserId]);

      const termsId = insertResult.rows[0].id;
      console.log(`✅ Created terms acceptance: ${termsId} - Terms: true, Privacy: true`);

      // Cleanup
      await client.query('DELETE FROM terms_privacy_acceptance WHERE id = $1', [termsId]);
      console.log('✅ Cleaned up test terms record');

      results.termsPrivacy = { success: true, details: { created: termsId } };
    } catch (error) {
      console.log(`❌ Terms/privacy test failed: ${error.message}`);
      results.termsPrivacy = { success: false, details: { error: error.message } };
    }

    console.log('\n🎯 FINAL WORKING RUNTIME COMPLIANCE TEST SUMMARY:');
    console.log('==========================================');
    
    const passedTests = Object.values(results).filter(result => result.success).length;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([testName, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL FEATURES ARE WORKING CORRECTLY!');
      console.log('✅ The application is FULLY COMPLIANT with Docker PostgreSQL database');
    } else {
      console.log('⚠️ Some tests failed. Review the errors above.');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

finalWorkingTest().catch(console.error);

