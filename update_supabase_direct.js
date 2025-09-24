#!/usr/bin/env node

/**
 * Direct Supabase Database Update Script
 * Uses direct PostgreSQL connection to update the database
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection configuration
const dbConfig = {
    host: 'db.wndswqvqogeblksrujpg.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'M@r0on@2025',
    ssl: {
        rejectUnauthorized: false
    }
};

async function updateSupabaseDatabase() {
    console.log('🚀 Starting Direct Supabase Database Update...');
    console.log('📊 Updating merchant subscription plans and loyalty NFT cards as per cursor rules');
    
    const client = new Client(dbConfig);
    
    try {
        // Connect to the database
        console.log('🔌 Connecting to Supabase database...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        // Read the SQL script
        const sqlScriptPath = join(__dirname, 'update_cloud_supabase_data.sql');
        const sqlScript = readFileSync(sqlScriptPath, 'utf8');
        
        console.log('📖 SQL script loaded successfully');
        console.log(`📏 Script size: ${sqlScript.length} characters`);
        
        // Execute the entire script
        console.log('🔄 Executing SQL script...');
        const result = await client.query(sqlScript);
        
        console.log('✅ SQL script executed successfully!');
        console.log('📊 Result:', result);
        
        // Verify the data was inserted
        console.log('\n🔍 Verifying data insertion...');
        
        // Check merchant subscription plans
        const plansResult = await client.query(`
            SELECT 
                'Merchant Subscription Plans' as table_name,
                COUNT(*) as total_records,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
                COUNT(CASE WHEN is_popular = true THEN 1 END) as popular_plans
            FROM public.merchant_subscription_plans
        `);
        
        console.log('📋 Merchant Subscription Plans:', plansResult.rows[0]);
        
        // Check NFT types
        const nftResult = await client.query(`
            SELECT 
                'NFT Types' as table_name,
                COUNT(*) as total_records,
                COUNT(CASE WHEN is_custodial = true THEN 1 END) as custodial_nfts,
                COUNT(CASE WHEN is_custodial = false THEN 1 END) as non_custodial_nfts,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_nfts
            FROM public.nft_types
        `);
        
        console.log('🎨 NFT Types:', nftResult.rows[0]);
        
        // Show sample data
        console.log('\n📋 Sample Merchant Subscription Plans:');
        const samplePlans = await client.query(`
            SELECT plan_number, plan_name, monthly_price, yearly_price, 
                   monthly_points, monthly_transactions, is_popular
            FROM public.merchant_subscription_plans 
            ORDER BY plan_number
        `);
        
        samplePlans.rows.forEach(plan => {
            console.log(`   ${plan.plan_number}. ${plan.plan_name} - $${plan.monthly_price}/month (${plan.monthly_points} points, ${plan.monthly_transactions} transactions)${plan.is_popular ? ' [POPULAR]' : ''}`);
        });
        
        console.log('\n🎨 Sample NFT Types:');
        const sampleNFTs = await client.query(`
            SELECT nft_name, rarity, buy_price_usdt, is_custodial, 
                   earn_on_spend_ratio, evolution_min_investment
            FROM public.nft_types 
            ORDER BY collection, is_custodial DESC, buy_price_usdt
        `);
        
        sampleNFTs.rows.forEach(nft => {
            console.log(`   ${nft.nft_name} (${nft.rarity}) - $${nft.buy_price_usdt} - ${nft.is_custodial ? 'Custodial' : 'Non-Custodial'} - ${(nft.earn_on_spend_ratio * 100).toFixed(2)}% earn rate`);
        });
        
        console.log('\n🎉 Database update completed successfully!');
        console.log('📊 Summary:');
        console.log(`   • ${plansResult.rows[0].total_records} Merchant Subscription Plans inserted`);
        console.log(`   • ${nftResult.rows[0].total_records} NFT Types inserted`);
        console.log(`   • ${nftResult.rows[0].custodial_nfts} Custodial NFTs`);
        console.log(`   • ${nftResult.rows[0].non_custodial_nfts} Non-Custodial NFTs`);
        
    } catch (error) {
        console.error('💥 Error updating database:', error.message);
        console.error('📋 Full error:', error);
        process.exit(1);
    } finally {
        // Close the connection
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Main execution
async function main() {
    console.log('🎯 RAC Rewards - Direct Supabase Database Update');
    console.log('================================================');
    
    await updateSupabaseDatabase();
    
    console.log('\n✨ Update process completed!');
    console.log('🔍 You can now verify the data in your Supabase dashboard.');
    console.log('🌐 Dashboard URL: https://supabase.com/dashboard/project/wndswqvqogeblksrujpg');
}

// Run the script
main().catch(console.error);
