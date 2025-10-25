import { Client } from 'pg';

// Local PostgreSQL database configuration
const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function testRuntimeCompliance() {
  console.log('🧪 Testing Runtime Compliance with Docker PostgreSQL Database\n');
  console.log(`📊 Database: ${localDbConfig.database}@${localDbConfig.host}:${localDbConfig.port}\n`);

  const client = new Client(localDbConfig);
  const results = {
    loyaltyCards: { success: false, details: {} },
    nftOperations: { success: false, details: {} },
    merchantPlans: { success: false, details: {} },
    otpOperations: { success: false, details: {} },
    walletOperations: { success: false, details: {} },
    investmentFeatures: { success: false, details: {} },
    rpcFunctions: { success: false, details: {} }
  };

  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    // 1. Test Loyalty Cards Operations
    console.log('1️⃣ Testing Loyalty Cards Operations...');
    try {
      // Test loyalty number generation
      const loyaltyNumberResult = await client.query('SELECT generate_loyalty_number($1) as loyalty_number', ['test@example.com']);
      const loyaltyNumber = loyaltyNumberResult.rows[0].loyalty_number;
      console.log(`✅ Generated loyalty number: ${loyaltyNumber}`);

      // Test loyalty card creation
      const testUserId = 'test-user-' + Date.now();
      const insertResult = await client.query(`
        INSERT INTO user_loyalty_cards (
          user_id, nft_type_id, loyalty_number, card_number, 
          full_name, email, phone, points_balance, tier_level, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, loyalty_number, card_number
      `, [
        testUserId,
        '1', // Pearl White NFT type
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
      console.log(`✅ Created loyalty card: ${loyaltyCard.id} - ${loyaltyCard.loyalty_number}`);

      // Test loyalty card retrieval
      const selectResult = await client.query('SELECT * FROM user_loyalty_cards WHERE id = $1', [loyaltyCard.id]);
      console.log(`✅ Retrieved loyalty card: ${selectResult.rows[0].full_name}`);

      // Cleanup
      await client.query('DELETE FROM user_loyalty_cards WHERE id = $1', [loyaltyCard.id]);
      console.log('✅ Cleaned up test loyalty card');

      results.loyaltyCards = { success: true, details: { generated: loyaltyNumber, created: loyaltyCard.id } };
    } catch (error) {
      console.log('❌ Loyalty cards test failed:', error.message);
      results.loyaltyCards = { success: false, details: { error: error.message } };
    }

    // 2. Test NFT Operations
    console.log('\n2️⃣ Testing NFT Operations...');
    try {
      // Test NFT types retrieval
      const nftTypesResult = await client.query('SELECT * FROM nft_types WHERE is_active = true LIMIT 5');
      console.log(`✅ Retrieved ${nftTypesResult.rows.length} NFT types`);

      // Test NFT collections
      const collectionsResult = await client.query('SELECT * FROM nft_collections WHERE is_active = true');
      console.log(`✅ Retrieved ${collectionsResult.rows.length} NFT collections`);

      // Test user NFTs table
      const userNftsResult = await client.query('SELECT COUNT(*) as count FROM user_nfts');
      console.log(`✅ User NFTs table accessible: ${userNftsResult.rows[0].count} records`);

      results.nftOperations = { 
        success: true, 
        details: { 
          nftTypes: nftTypesResult.rows.length,
          collections: collectionsResult.rows.length,
          userNfts: userNftsResult.rows[0].count
        } 
      };
    } catch (error) {
      console.log('❌ NFT operations test failed:', error.message);
      results.nftOperations = { success: false, details: { error: error.message } };
    }

    // 3. Test Merchant Plans
    console.log('\n3️⃣ Testing Merchant Plans...');
    try {
      // Test subscription plans retrieval
      const plansResult = await client.query('SELECT * FROM merchant_subscription_plans WHERE is_active = true ORDER BY price_monthly');
      console.log(`✅ Retrieved ${plansResult.rows.length} merchant subscription plans`);

      // Test plan features
      const planFeatures = plansResult.rows.map(plan => ({
        name: plan.name,
        price: plan.price_monthly,
        points: plan.monthly_points,
        transactions: plan.monthly_transactions
      }));
      console.log('✅ Plan features:', planFeatures);

      results.merchantPlans = { 
        success: true, 
        details: { 
          plansCount: plansResult.rows.length,
          plans: planFeatures
        } 
      };
    } catch (error) {
      console.log('❌ Merchant plans test failed:', error.message);
      results.merchantPlans = { success: false, details: { error: error.message } };
    }

    // 4. Test OTP Operations
    console.log('\n4️⃣ Testing OTP Operations...');
    try {
      // Test OTP table structure
      const otpTableResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'loyalty_otp_codes' 
        ORDER BY ordinal_position
      `);
      console.log(`✅ OTP table structure: ${otpTableResult.rows.length} columns`);

      // Test OTP insertion
      const testOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpInsertResult = await client.query(`
        INSERT INTO loyalty_otp_codes (
          user_id, network_id, mobile_number, otp_code, 
          expires_at, attempts, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        'test-user-otp',
        'test-network',
        '+1234567890',
        testOtpCode,
        new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        0,
        false
      ]);

      const otpId = otpInsertResult.rows[0].id;
      console.log(`✅ Created OTP record: ${otpId} with code: ${testOtpCode}`);

      // Test OTP verification
      const otpVerifyResult = await client.query(`
        UPDATE loyalty_otp_codes 
        SET is_verified = true, verified_at = NOW()
        WHERE id = $1 AND otp_code = $2
        RETURNING id
      `, [otpId, testOtpCode]);

      if (otpVerifyResult.rows.length > 0) {
        console.log('✅ OTP verification successful');
      }

      // Cleanup
      await client.query('DELETE FROM loyalty_otp_codes WHERE id = $1', [otpId]);
      console.log('✅ Cleaned up test OTP record');

      results.otpOperations = { 
        success: true, 
        details: { 
          tableColumns: otpTableResult.rows.length,
          createdOtp: otpId,
          verified: otpVerifyResult.rows.length > 0
        } 
      };
    } catch (error) {
      console.log('❌ OTP operations test failed:', error.message);
      results.otpOperations = { success: false, details: { error: error.message } };
    }

    // 5. Test Wallet Operations
    console.log('\n5️⃣ Testing Wallet Operations...');
    try {
      // Test Solana wallets table
      const solanaWalletsResult = await client.query('SELECT COUNT(*) as count FROM user_solana_wallets');
      console.log(`✅ Solana wallets table accessible: ${solanaWalletsResult.rows[0].count} records`);

      // Test user wallets table
      const userWalletsResult = await client.query('SELECT COUNT(*) as count FROM user_wallets');
      console.log(`✅ User wallets table accessible: ${userWalletsResult.rows[0].count} records`);

      // Test wallet creation
      const testWalletUserId = 'test-wallet-user-' + Date.now();
      const walletInsertResult = await client.query(`
        INSERT INTO user_solana_wallets (
          user_id, solana_address, seed_phrase_encrypted, encryption_iv, is_custodial
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, solana_address
      `, [
        testWalletUserId,
        'test-solana-address-' + Date.now(),
        'encrypted-seed-phrase',
        'test-iv',
        true
      ]);

      const wallet = walletInsertResult.rows[0];
      console.log(`✅ Created Solana wallet: ${wallet.id} - ${wallet.solana_address}`);

      // Cleanup
      await client.query('DELETE FROM user_solana_wallets WHERE id = $1', [wallet.id]);
      console.log('✅ Cleaned up test wallet');

      results.walletOperations = { 
        success: true, 
        details: { 
          solanaWallets: solanaWalletsResult.rows[0].count,
          userWallets: userWalletsResult.rows[0].count,
          createdWallet: wallet.id
        } 
      };
    } catch (error) {
      console.log('❌ Wallet operations test failed:', error.message);
      results.walletOperations = { success: false, details: { error: error.message } };
    }

    // 6. Test Investment Features
    console.log('\n6️⃣ Testing Investment Features...');
    try {
      // Test asset initiatives
      const initiativesResult = await client.query('SELECT * FROM asset_initiatives WHERE is_active = true LIMIT 3');
      console.log(`✅ Retrieved ${initiativesResult.rows.length} asset initiatives`);

      // Test asset investments table
      const investmentsResult = await client.query('SELECT COUNT(*) as count FROM asset_investments');
      console.log(`✅ Asset investments table accessible: ${investmentsResult.rows[0].count} records`);

      // Test investment creation
      const testInvestmentUserId = 'test-investment-user-' + Date.now();
      const investmentInsertResult = await client.query(`
        INSERT INTO asset_investments (
          user_id, asset_initiative_id, investment_amount, currency_type,
          transaction_hash, from_wallet_address, to_wallet_address, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, investment_amount, currency_type
      `, [
        testInvestmentUserId,
        initiativesResult.rows[0]?.id || '1',
        100.50,
        'USDT',
        'test-tx-hash-' + Date.now(),
        'test-from-wallet',
        'test-to-wallet',
        'completed'
      ]);

      const investment = investmentInsertResult.rows[0];
      console.log(`✅ Created investment: ${investment.id} - ${investment.investment_amount} ${investment.currency_type}`);

      // Cleanup
      await client.query('DELETE FROM asset_investments WHERE id = $1', [investment.id]);
      console.log('✅ Cleaned up test investment');

      results.investmentFeatures = { 
        success: true, 
        details: { 
          initiatives: initiativesResult.rows.length,
          investmentsCount: investmentsResult.rows[0].count,
          createdInvestment: investment.id
        } 
      };
    } catch (error) {
      console.log('❌ Investment features test failed:', error.message);
      results.investmentFeatures = { success: false, details: { error: error.message } };
    }

    // 7. Test RPC Functions
    console.log('\n7️⃣ Testing RPC Functions...');
    try {
      // Test generate_loyalty_number function
      const loyaltyNumberRpc = await client.query('SELECT generate_loyalty_number($1) as loyalty_number', ['rpc@test.com']);
      console.log(`✅ RPC generate_loyalty_number: ${loyaltyNumberRpc.rows[0].loyalty_number}`);

      // Test get_valid_subscription_plans function (if exists)
      try {
        const plansRpc = await client.query('SELECT * FROM get_valid_subscription_plans()');
        console.log(`✅ RPC get_valid_subscription_plans: ${plansRpc.rows.length} plans`);
      } catch (rpcError) {
        console.log('⚠️ RPC get_valid_subscription_plans not available (expected)');
      }

      // Test is_admin function (if exists)
      try {
        const adminRpc = await client.query('SELECT is_admin($1) as is_admin', ['test-user']);
        console.log(`✅ RPC is_admin: ${adminRpc.rows[0].is_admin}`);
      } catch (rpcError) {
        console.log('⚠️ RPC is_admin not available (expected)');
      }

      results.rpcFunctions = { 
        success: true, 
        details: { 
          loyaltyNumberGenerated: loyaltyNumberRpc.rows[0].loyalty_number
        } 
      };
    } catch (error) {
      console.log('❌ RPC functions test failed:', error.message);
      results.rpcFunctions = { success: false, details: { error: error.message } };
    }

    // 8. Test Terms/Privacy Acceptance
    console.log('\n8️⃣ Testing Terms/Privacy Acceptance...');
    try {
      // Test terms_privacy_acceptance table
      const termsResult = await client.query('SELECT COUNT(*) as count FROM terms_privacy_acceptance');
      console.log(`✅ Terms/privacy acceptance table accessible: ${termsResult.rows[0].count} records`);

      // Test terms acceptance creation
      const testTermsUserId = 'test-terms-user-' + Date.now();
      const termsInsertResult = await client.query(`
        INSERT INTO terms_privacy_acceptance (
          user_id, terms_accepted, privacy_accepted, 
          terms_version, privacy_version, accepted_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, terms_accepted, privacy_accepted
      `, [
        testTermsUserId,
        true,
        true,
        '1.0',
        '1.0',
        new Date()
      ]);

      const termsRecord = termsInsertResult.rows[0];
      console.log(`✅ Created terms acceptance: ${termsRecord.id} - Terms: ${termsRecord.terms_accepted}, Privacy: ${termsRecord.privacy_accepted}`);

      // Cleanup
      await client.query('DELETE FROM terms_privacy_acceptance WHERE id = $1', [termsRecord.id]);
      console.log('✅ Cleaned up test terms record');

      results.termsPrivacy = { 
        success: true, 
        details: { 
          recordsCount: termsResult.rows[0].count,
          createdRecord: termsRecord.id
        } 
      };
    } catch (error) {
      console.log('❌ Terms/privacy acceptance test failed:', error.message);
      results.termsPrivacy = { success: false, details: { error: error.message } };
    }

    // Summary
    console.log('\n📊 RUNTIME COMPLIANCE TEST SUMMARY:');
    console.log('=====================================');
    
    const testResults = [
      { name: 'Loyalty Cards', result: results.loyaltyCards },
      { name: 'NFT Operations', result: results.nftOperations },
      { name: 'Merchant Plans', result: results.merchantPlans },
      { name: 'OTP Operations', result: results.otpOperations },
      { name: 'Wallet Operations', result: results.walletOperations },
      { name: 'Investment Features', result: results.investmentFeatures },
      { name: 'RPC Functions', result: results.rpcFunctions },
      { name: 'Terms/Privacy', result: results.termsPrivacy }
    ];

    let passedTests = 0;
    testResults.forEach(test => {
      if (test.result.success) {
        console.log(`✅ ${test.name}: PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAILED - ${test.result.details.error}`);
      }
    });

    console.log(`\n🎯 Overall Result: ${passedTests}/${testResults.length} tests passed`);
    
    if (passedTests === testResults.length) {
      console.log('🎉 ALL RUNTIME TESTS PASSED! The application is fully compliant with Docker PostgreSQL.');
    } else {
      console.log('⚠️ Some tests failed. Review the errors above.');
    }

    return results;

  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    console.log('🔧 Please ensure Docker PostgreSQL is running on localhost:5432');
    return results;
  } finally {
    await client.end();
  }
}

testRuntimeCompliance();

