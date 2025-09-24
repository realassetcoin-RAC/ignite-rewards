#!/usr/bin/env node

/**
 * Supabase REST API Update Script
 * Uses Supabase REST API to update merchant subscription plans and NFT types
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Merchant Subscription Plans Data (as per cursor rules)
const merchantPlans = [
    {
        plan_name: 'StartUp Plan',
        plan_number: 1,
        monthly_price: 20.00,
        yearly_price: 150.00,
        monthly_points: 100,
        monthly_transactions: 100,
        features: {
            basic_loyalty_program: true,
            customer_management: true,
            email_support: true,
            basic_analytics: true,
            qr_code_generation: true,
            advanced_features: false,
            customer_segmentation: false,
            priority_support: false,
            custom_branding: false,
            api_access: false,
            premium_features: false,
            dedicated_account_manager: false,
            real_time_analytics: false,
            custom_integrations: false,
            enterprise_features: false,
            unlimited_staff_accounts: false,
            multi_location_support: false,
            "24_7_support": false,
            ultimate_features: false,
            white_label_solutions: false,
            priority_feature_requests: false,
            custom_onboarding: false
        },
        trial_days: 14,
        is_popular: false,
        is_active: true
    },
    {
        plan_name: 'Momentum Plan',
        plan_number: 2,
        monthly_price: 50.00,
        yearly_price: 500.00,
        monthly_points: 300,
        monthly_transactions: 300,
        features: {
            basic_loyalty_program: true,
            customer_management: true,
            email_support: true,
            basic_analytics: true,
            qr_code_generation: true,
            advanced_features: true,
            customer_segmentation: true,
            priority_support: true,
            custom_branding: true,
            api_access: true,
            premium_features: false,
            dedicated_account_manager: false,
            real_time_analytics: false,
            custom_integrations: false,
            enterprise_features: false,
            unlimited_staff_accounts: false,
            multi_location_support: false,
            "24_7_support": false,
            ultimate_features: false,
            white_label_solutions: false,
            priority_feature_requests: false,
            custom_onboarding: false
        },
        trial_days: 14,
        is_popular: true,
        is_active: true
    },
    {
        plan_name: 'Energizer Plan',
        plan_number: 3,
        monthly_price: 100.00,
        yearly_price: 1000.00,
        monthly_points: 600,
        monthly_transactions: 600,
        features: {
            basic_loyalty_program: true,
            customer_management: true,
            email_support: true,
            basic_analytics: true,
            qr_code_generation: true,
            advanced_features: true,
            customer_segmentation: true,
            priority_support: true,
            custom_branding: true,
            api_access: true,
            premium_features: true,
            dedicated_account_manager: true,
            real_time_analytics: true,
            custom_integrations: true,
            enterprise_features: false,
            unlimited_staff_accounts: false,
            multi_location_support: false,
            "24_7_support": false,
            ultimate_features: false,
            white_label_solutions: false,
            priority_feature_requests: false,
            custom_onboarding: false
        },
        trial_days: 21,
        is_popular: false,
        is_active: true
    },
    {
        plan_name: 'Cloud Plan',
        plan_number: 4,
        monthly_price: 250.00,
        yearly_price: 2500.00,
        monthly_points: 1800,
        monthly_transactions: 1800,
        features: {
            basic_loyalty_program: true,
            customer_management: true,
            email_support: true,
            basic_analytics: true,
            qr_code_generation: true,
            advanced_features: true,
            customer_segmentation: true,
            priority_support: true,
            custom_branding: true,
            api_access: true,
            premium_features: true,
            dedicated_account_manager: true,
            real_time_analytics: true,
            custom_integrations: true,
            enterprise_features: true,
            unlimited_staff_accounts: true,
            multi_location_support: true,
            "24_7_support": true,
            ultimate_features: false,
            white_label_solutions: false,
            priority_feature_requests: false,
            custom_onboarding: false
        },
        trial_days: 30,
        is_popular: false,
        is_active: true
    },
    {
        plan_name: 'Super Plan',
        plan_number: 5,
        monthly_price: 500.00,
        yearly_price: 5000.00,
        monthly_points: 4000,
        monthly_transactions: 4000,
        features: {
            basic_loyalty_program: true,
            customer_management: true,
            email_support: true,
            basic_analytics: true,
            qr_code_generation: true,
            advanced_features: true,
            customer_segmentation: true,
            priority_support: true,
            custom_branding: true,
            api_access: true,
            premium_features: true,
            dedicated_account_manager: true,
            real_time_analytics: true,
            custom_integrations: true,
            enterprise_features: true,
            unlimited_staff_accounts: true,
            multi_location_support: true,
            "24_7_support": true,
            ultimate_features: true,
            white_label_solutions: true,
            priority_feature_requests: true,
            custom_onboarding: true
        },
        trial_days: 30,
        is_popular: false,
        is_active: true
    }
];

// NFT Types Data (as per cursor rules)
const nftTypes = [
    // Custodial NFT Types (Free for users with custodial wallets)
    {
        collection: 'Classic',
        nft_name: 'Pearl White',
        display_name: 'Pearl White',
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
        buy_price_usdt: 0.00,
        buy_price_nft: 0.00,
        rarity: 'Common',
        mint_quantity: 10000,
        is_upgradeable: true,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: true,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0100,
        upgrade_bonus_ratio: 0.0000,
        evolution_min_investment: 100.00,
        evolution_earnings_ratio: 0.0025,
        passive_income_rate: 0.0100,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Classic',
        nft_name: 'Lava Orange',
        display_name: 'Lava Orange',
        image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 100.00,
        buy_price_nft: 100.00,
        rarity: 'Less Common',
        mint_quantity: 3000,
        is_upgradeable: true,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: true,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0110,
        upgrade_bonus_ratio: 0.0010,
        evolution_min_investment: 500.00,
        evolution_earnings_ratio: 0.0050,
        passive_income_rate: 0.0110,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Classic',
        nft_name: 'Pink',
        display_name: 'Pink',
        image_url: 'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 100.00,
        buy_price_nft: 100.00,
        rarity: 'Less Common',
        mint_quantity: 3000,
        is_upgradeable: true,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: true,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0110,
        upgrade_bonus_ratio: 0.0010,
        evolution_min_investment: 500.00,
        evolution_earnings_ratio: 0.0050,
        passive_income_rate: 0.0110,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Premium',
        nft_name: 'Silver',
        display_name: 'Silver',
        image_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 200.00,
        buy_price_nft: 200.00,
        rarity: 'Rare',
        mint_quantity: 750,
        is_upgradeable: true,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: true,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0120,
        upgrade_bonus_ratio: 0.0015,
        evolution_min_investment: 1000.00,
        evolution_earnings_ratio: 0.0075,
        passive_income_rate: 0.0120,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Premium',
        nft_name: 'Gold',
        display_name: 'Gold',
        image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 300.00,
        buy_price_nft: 300.00,
        rarity: 'Rare',
        mint_quantity: 750,
        is_upgradeable: true,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: true,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0130,
        upgrade_bonus_ratio: 0.0020,
        evolution_min_investment: 1500.00,
        evolution_earnings_ratio: 0.0100,
        passive_income_rate: 0.0130,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Elite',
        nft_name: 'Black',
        display_name: 'Black',
        image_url: 'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 500.00,
        buy_price_nft: 500.00,
        rarity: 'Very Rare',
        mint_quantity: 250,
        is_upgradeable: true,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: true,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0140,
        upgrade_bonus_ratio: 0.0030,
        evolution_min_investment: 2500.00,
        evolution_earnings_ratio: 0.0125,
        passive_income_rate: 0.0140,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    // Non-Custodial NFT Types (For users with external wallets)
    {
        collection: 'Classic',
        nft_name: 'Pearl White (Non-Custodial)',
        display_name: 'Pearl White (Non-Custodial)',
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
        buy_price_usdt: 100.00,
        buy_price_nft: 100.00,
        rarity: 'Common',
        mint_quantity: 10000,
        is_upgradeable: false,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: false,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0100,
        upgrade_bonus_ratio: 0.0000,
        evolution_min_investment: 500.00,
        evolution_earnings_ratio: 0.0050,
        passive_income_rate: 0.0100,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Classic',
        nft_name: 'Lava Orange (Non-Custodial)',
        display_name: 'Lava Orange (Non-Custodial)',
        image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 500.00,
        buy_price_nft: 500.00,
        rarity: 'Less Common',
        mint_quantity: 3000,
        is_upgradeable: false,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: false,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0110,
        upgrade_bonus_ratio: 0.0000,
        evolution_min_investment: 2500.00,
        evolution_earnings_ratio: 0.0125,
        passive_income_rate: 0.0110,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Classic',
        nft_name: 'Pink (Non-Custodial)',
        display_name: 'Pink (Non-Custodial)',
        image_url: 'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 500.00,
        buy_price_nft: 500.00,
        rarity: 'Less Common',
        mint_quantity: 3000,
        is_upgradeable: false,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: false,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0110,
        upgrade_bonus_ratio: 0.0000,
        evolution_min_investment: 2500.00,
        evolution_earnings_ratio: 0.0125,
        passive_income_rate: 0.0110,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Premium',
        nft_name: 'Silver (Non-Custodial)',
        display_name: 'Silver (Non-Custodial)',
        image_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 1000.00,
        buy_price_nft: 1000.00,
        rarity: 'Rare',
        mint_quantity: 750,
        is_upgradeable: false,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: false,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0120,
        upgrade_bonus_ratio: 0.0000,
        evolution_min_investment: 5000.00,
        evolution_earnings_ratio: 0.0015,
        passive_income_rate: 0.0120,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Premium',
        nft_name: 'Gold (Non-Custodial)',
        display_name: 'Gold (Non-Custodial)',
        image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 1000.00,
        buy_price_nft: 1000.00,
        rarity: 'Rare',
        mint_quantity: 750,
        is_upgradeable: false,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: false,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0130,
        upgrade_bonus_ratio: 0.0000,
        evolution_min_investment: 5000.00,
        evolution_earnings_ratio: 0.0020,
        passive_income_rate: 0.0130,
        custodial_income_rate: 0.0000,
        is_active: true
    },
    {
        collection: 'Elite',
        nft_name: 'Black (Non-Custodial)',
        display_name: 'Black (Non-Custodial)',
        image_url: 'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400',
        evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        buy_price_usdt: 2500.00,
        buy_price_nft: 2500.00,
        rarity: 'Very Rare',
        mint_quantity: 250,
        is_upgradeable: false,
        is_evolvable: true,
        is_fractional_eligible: true,
        is_custodial: false,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: 0.0140,
        upgrade_bonus_ratio: 0.0000,
        evolution_min_investment: 13500.00,
        evolution_earnings_ratio: 0.0030,
        passive_income_rate: 0.0140,
        custodial_income_rate: 0.0000,
        is_active: true
    }
];

async function updateSupabaseDatabase() {
    console.log('🚀 Starting Supabase Database Update via REST API...');
    console.log('📊 Updating merchant subscription plans and loyalty NFT cards as per cursor rules');
    
    try {
        // Step 1: Clear existing data
        console.log('\n🗑️  Clearing existing data...');
        
        // Delete existing merchant subscription plans
        const { error: deletePlansError } = await supabase
            .from('merchant_subscription_plans')
            .delete()
            .neq('id', 0); // Delete all records
        
        if (deletePlansError) {
            console.log('⚠️  Could not delete existing plans (table might not exist):', deletePlansError.message);
        } else {
            console.log('✅ Existing merchant subscription plans cleared');
        }
        
        // Delete existing NFT types
        const { error: deleteNFTsError } = await supabase
            .from('nft_types')
            .delete()
            .neq('id', 0); // Delete all records
        
        if (deleteNFTsError) {
            console.log('⚠️  Could not delete existing NFT types (table might not exist):', deleteNFTsError.message);
        } else {
            console.log('✅ Existing NFT types cleared');
        }
        
        // Step 2: Insert merchant subscription plans
        console.log('\n📋 Inserting merchant subscription plans...');
        const { data: plansData, error: plansError } = await supabase
            .from('merchant_subscription_plans')
            .insert(merchantPlans);
        
        if (plansError) {
            console.error('❌ Error inserting merchant subscription plans:', plansError.message);
            console.log('📋 This might be because the table doesn\'t exist yet.');
            console.log('🔧 Please create the table first using the SQL script.');
        } else {
            console.log(`✅ Successfully inserted ${merchantPlans.length} merchant subscription plans`);
            console.log('📊 Plans inserted:', plansData?.length || merchantPlans.length);
        }
        
        // Step 3: Insert NFT types
        console.log('\n🎨 Inserting NFT types...');
        const { data: nftData, error: nftError } = await supabase
            .from('nft_types')
            .insert(nftTypes);
        
        if (nftError) {
            console.error('❌ Error inserting NFT types:', nftError.message);
            console.log('📋 This might be because the table doesn\'t exist yet.');
            console.log('🔧 Please create the table first using the SQL script.');
        } else {
            console.log(`✅ Successfully inserted ${nftTypes.length} NFT types`);
            console.log('📊 NFTs inserted:', nftData?.length || nftTypes.length);
        }
        
        // Step 4: Verify the data
        console.log('\n🔍 Verifying inserted data...');
        
        // Check merchant subscription plans
        const { data: plansCheck, error: plansCheckError } = await supabase
            .from('merchant_subscription_plans')
            .select('*');
        
        if (plansCheckError) {
            console.log('⚠️  Could not verify merchant subscription plans:', plansCheckError.message);
        } else {
            console.log(`📋 Merchant Subscription Plans: ${plansCheck?.length || 0} records found`);
            if (plansCheck && plansCheck.length > 0) {
                console.log('   Sample plans:');
                plansCheck.slice(0, 3).forEach(plan => {
                    console.log(`   • ${plan.plan_name} - $${plan.monthly_price}/month (${plan.monthly_points} points)`);
                });
            }
        }
        
        // Check NFT types
        const { data: nftCheck, error: nftCheckError } = await supabase
            .from('nft_types')
            .select('*');
        
        if (nftCheckError) {
            console.log('⚠️  Could not verify NFT types:', nftCheckError.message);
        } else {
            console.log(`🎨 NFT Types: ${nftCheck?.length || 0} records found`);
            if (nftCheck && nftCheck.length > 0) {
                const custodialCount = nftCheck.filter(nft => nft.is_custodial).length;
                const nonCustodialCount = nftCheck.filter(nft => !nft.is_custodial).length;
                console.log(`   • Custodial NFTs: ${custodialCount}`);
                console.log(`   • Non-Custodial NFTs: ${nonCustodialCount}`);
            }
        }
        
        console.log('\n🎉 Database update process completed!');
        
        if (plansError || nftError) {
            console.log('\n⚠️  Some data could not be inserted due to missing tables.');
            console.log('📋 Please run the SQL script manually in your Supabase SQL editor:');
            console.log('   1. Go to https://supabase.com/dashboard/project/wndswqvqogeblksrujpg');
            console.log('   2. Navigate to SQL Editor');
            console.log('   3. Copy and paste the content from update_cloud_supabase_data.sql');
            console.log('   4. Execute the script');
        } else {
            console.log('✅ All data successfully updated in Supabase!');
        }
        
    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    }
}

// Main execution
async function main() {
    console.log('🎯 RAC Rewards - Supabase Database Update via REST API');
    console.log('======================================================');
    
    await updateSupabaseDatabase();
    
    console.log('\n✨ Update process completed!');
    console.log('🔍 You can verify the data in your Supabase dashboard.');
    console.log('🌐 Dashboard URL: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg');
}

// Run the script
main().catch(console.error);
