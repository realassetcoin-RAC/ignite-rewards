import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function comprehensiveFeatureTest() {
  console.log('🎯 COMPREHENSIVE FEATURE VERIFICATION TEST');
  console.log('==========================================\n');
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
    termsPrivacy: { success: false, details: {} },
    merchants: { success: false, details: {} },
    referrals: { success: false, details: {} }
  };

  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    // Get existing valid IDs from database
    const existingUsers = await client.query('SELECT id FROM profiles ORDER BY id LIMIT 1');
    const existingNftTypes = await client.query('SELECT id FROM nft_types ORDER BY id LIMIT 1');
    const existingNetworks = await client.query('SELECT id FROM loyalty_networks ORDER BY id LIMIT 1');
    const existingInitiatives = await client.query('SELECT id FROM asset_initiatives ORDER BY id LIMIT 1');
    
    // Ensure we have actual IDs from the database
    if (!existingUsers.rows[0] || !existingNftTypes.rows[0] || !existingNetworks.rows[0] || !existingInitiatives.rows[0]) {
      throw new Error('Missing required reference data in database. Please ensure database is properly initialized.');
    }
    
    const validUserId = existingUsers.rows[0].id;
    const validNftTypeId = existingNftTypes.rows[0].id;
    const validNetworkId = existingNetworks.rows[0].id;
    const validInitiativeId = existingInitiatives.rows[0].id;
    
    console.log(`✅ Using valid IDs:`);
    console.log(`   User ID: ${validUserId}`);
    console.log(`   NFT Type ID: ${validNftTypeId}`);
    console.log(`   Network ID: ${validNetworkId}`);
    console.log(`   Initiative ID: ${validInitiativeId}\n`);

    // 1. Test Loyalty Cards Operations
    console.log('1️⃣ Testing Loyalty Cards Operations...');
    try {
      // Test loyalty number generation
      const loyaltyNumberResult = await client.query('SELECT generate_loyalty_number($1) as loyalty_number', ['test@example.com']);
      const loyaltyNumber = loyaltyNumberResult.rows[0].loyalty_number;
      console.log(`✅ Generated loyalty number: ${loyaltyNumber}`);

      // Test loyalty card creation
      const insertResult = await client.query(`
        INSERT INTO user_loyalty_cards (
          user_id, nft_type_id, card_number, 
          full_name, email, phone, points_balance, tier_level, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, card_number
      `, [
        validUserId,
        validNftTypeId,
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
        SELECT ulc.id, ulc.loyalty_number, ulc.card_number, ulc.full_name, ulc.email
        FROM user_loyalty_cards ulc
        WHERE ulc.id = $1
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
      
      // Test NFT creation
      const insertResult = await client.query(`
        INSERT INTO user_nfts (
          user_id, nft_type_id, nft_address, is_active
        ) VALUES ($1, $2, $3, true)
        RETURNING id
      `, [validUserId, validNftTypeId, 'nft-addr-' + Date.now()]);

      const userNft = insertResult.rows[0];
      console.log(`✅ Created user NFT: ${userNft.id}`);

      // Cleanup
      await client.query('DELETE FROM user_nfts WHERE id = $1', [userNft.id]);
      console.log('✅ Cleaned up test user NFT');
      
      results.nftOperations = { success: true, details: { 
        types: nftTypesResult.rows[0].count,
        collections: nftCollectionsResult.rows[0].count,
        userNfts: userNftsResult.rows[0].count
      }};
    } catch (error) {
      console.log(`❌ NFT operations test failed: ${error.message}`);
      results.nftOperations = { success: false, details: { error: error.message } };
    }

    // 3. Test Merchant Plans
    console.log('\n3️⃣ Testing Merchant Plans...');
    try {
      const plansResult = await client.query('SELECT * FROM merchant_subscription_plans ORDER BY price_monthly');
      console.log(`✅ Retrieved ${plansResult.rows.length} merchant subscription plans`);
      
      plansResult.rows.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price_monthly}/month (${plan.points_limit} points, ${plan.transaction_limit} transactions)`);
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
          user_id, network_id, mobile_number, otp_code, expires_at, is_used
        ) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes', false)
        RETURNING id
      `, [validUserId, validNetworkId, '+1234567890', otpCode]);

      const otpId = insertResult.rows[0].id;
      console.log(`✅ Created OTP record: ${otpId} with code: ${otpCode}`);

      // Test OTP verification
      const verifyResult = await client.query(`
        UPDATE loyalty_otp_codes 
        SET is_used = true
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

      results.otpOperations = { success: true, details: { verified: verifyResult.rows.length > 0 } };
    } catch (error) {
      console.log(`❌ OTP operations test failed: ${error.message}`);
      results.otpOperations = { success: false, details: { error: error.message } };
    }

    // 5. Test Wallet Operations
    console.log('\n5️⃣ Testing Wallet Operations...');
    try {
      const walletsResult = await client.query('SELECT COUNT(*) as count FROM user_solana_wallets');
      console.log(`✅ Solana wallets table accessible: ${walletsResult.rows[0].count} records`);

      // Test wallet creation
      const insertResult = await client.query(`
        INSERT INTO user_solana_wallets (
          user_id, public_key, seed_phrase_encrypted, is_active
        ) VALUES ($1, $2, $3, true)
        RETURNING id, public_key
      `, [validUserId, 'test-solana-address-' + Date.now(), 'encrypted-seed-' + Date.now()]);

      const walletId = insertResult.rows[0].id;
      console.log(`✅ Created Solana wallet: ${walletId} - ${insertResult.rows[0].public_key}`);

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
          user_id, asset_initiative_id, investment_amount, currency_type, status, wallet_address
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
      // Test generate_loyalty_number
      const loyaltyNumberResult = await client.query('SELECT generate_loyalty_number($1) as loyalty_number', ['test@example.com']);
      console.log(`✅ RPC generate_loyalty_number: ${loyaltyNumberResult.rows[0].loyalty_number}`);

      // Test get_valid_subscription_plans
      const plansResult = await client.query('SELECT get_valid_subscription_plans() as count');
      console.log(`✅ RPC get_valid_subscription_plans: ${plansResult.rows[0].count} plans`);

      results.rpcFunctions = { success: true, details: { loyaltyNumber: loyaltyNumberResult.rows[0].loyalty_number } };
    } catch (error) {
      console.log(`❌ RPC functions test failed: ${error.message}`);
      results.rpcFunctions = { success: false, details: { error: error.message } };
    }

    // 8. Test Terms/Privacy Acceptance
    console.log('\n8️⃣ Testing Terms/Privacy Acceptance...');
    try {
      const acceptanceResult = await client.query('SELECT COUNT(*) as count FROM terms_privacy_acceptance');
      console.log(`✅ Terms/privacy acceptance table accessible: ${acceptanceResult.rows[0].count} records`);

      // Test acceptance creation
      const insertResult = await client.query(`
        INSERT INTO terms_privacy_acceptance (
          user_id, terms_accepted, privacy_accepted, terms_accepted_at, privacy_accepted_at
        ) VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, terms_accepted, privacy_accepted
      `, [validUserId, true, true]);

      const acceptanceId = insertResult.rows[0].id;
      console.log(`✅ Created terms acceptance: ${acceptanceId} - Terms: ${insertResult.rows[0].terms_accepted}, Privacy: ${insertResult.rows[0].privacy_accepted}`);

      // Cleanup
      await client.query('DELETE FROM terms_privacy_acceptance WHERE id = $1', [acceptanceId]);
      console.log('✅ Cleaned up test terms record');

      results.termsPrivacy = { success: true, details: { created: acceptanceId } };
    } catch (error) {
      console.log(`❌ Terms/privacy acceptance test failed: ${error.message}`);
      results.termsPrivacy = { success: false, details: { error: error.message } };
    }

    // 9. Test Merchants
    console.log('\n9️⃣ Testing Merchants...');
    try {
      const merchantsResult = await client.query('SELECT COUNT(*) as count FROM merchants');
      console.log(`✅ Merchants table accessible: ${merchantsResult.rows[0].count} records`);

      // Test merchant creation
      const insertResult = await client.query(`
        INSERT INTO merchants (
          user_id, business_name, contact_email, status
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, business_name
      `, [validUserId, 'Test Business', 'test@business.com', 'active']);

      const merchantId = insertResult.rows[0].id;
      console.log(`✅ Created merchant: ${merchantId} - ${insertResult.rows[0].business_name}`);

      // Cleanup
      await client.query('DELETE FROM merchants WHERE id = $1', [merchantId]);
      console.log('✅ Cleaned up test merchant');

      results.merchants = { success: true, details: { created: merchantId } };
    } catch (error) {
      console.log(`❌ Merchants test failed: ${error.message}`);
      results.merchants = { success: false, details: { error: error.message } };
    }

    // 10. Test Referral Campaigns
    console.log('\n🔟 Testing Referral Campaigns...');
    try {
      const campaignsResult = await client.query('SELECT COUNT(*) as count FROM referral_campaigns');
      console.log(`✅ Referral campaigns table accessible: ${campaignsResult.rows[0].count} records`);

      // Test campaign creation
      const insertResult = await client.query(`
        INSERT INTO referral_campaigns (
          name, campaign_name, description, reward_amount, points_per_referral, max_referrals_per_user, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id, name
      `, ['Test Campaign', 'Test Campaign', 'Test referral campaign', 25.00, 50, 10]);

      const campaignId = insertResult.rows[0].id;
      console.log(`✅ Created referral campaign: ${campaignId} - ${insertResult.rows[0].name}`);

      // Cleanup
      await client.query('DELETE FROM referral_campaigns WHERE id = $1', [campaignId]);
      console.log('✅ Cleaned up test campaign');

      results.referrals = { success: true, details: { created: campaignId } };
    } catch (error) {
      console.log(`❌ Referral campaigns test failed: ${error.message}`);
      results.referrals = { success: false, details: { error: error.message } };
    }

    // Print Summary
    console.log('\n🎯 COMPREHENSIVE FEATURE VERIFICATION SUMMARY:');
    console.log('===============================================');
    
    let passedCount = 0;
    const totalTests = Object.keys(results).length;
    
    for (const [feature, result] of Object.entries(results)) {
      const status = result.success ? '✅' : '❌';
      const statusText = result.success ? 'PASSED' : 'FAILED';
      console.log(`${status} ${feature}: ${statusText}`);
      if (result.success) passedCount++;
    }
    
    console.log(`\n🎯 Overall Result: ${passedCount}/${totalTests} tests passed`);
    if (passedCount === totalTests) {
      console.log('🎉 All tests passed successfully!');
    } else {
      console.log('⚠️ Some tests failed. Review the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Test execution error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

comprehensiveFeatureTest();
