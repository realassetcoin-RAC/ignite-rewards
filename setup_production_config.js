#!/usr/bin/env node

/**
 * PRODUCTION CONFIGURATION SETUP SCRIPT
 * Sets up production environment configuration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupProductionConfig() {
  console.log('🚀 Setting up Production Configuration...');
  console.log('==========================================');
  
  try {
    // 1. Setup Slack Integration Settings
    console.log('\n📱 Setting up Slack Integration...');
    
    const slackSettings = [
      {
        category: 'technical',
        webhook_url: process.env.SLACK_TECHNICAL_WEBHOOK || 'https://hooks.slack.com/services/YOUR/TECHNICAL/WEBHOOK',
        channel_name: 'technical-support',
        is_active: true
      },
      {
        category: 'billing',
        webhook_url: process.env.SLACK_BILLING_WEBHOOK || 'https://hooks.slack.com/services/YOUR/BILLING/WEBHOOK',
        channel_name: 'billing-support',
        is_active: true
      },
      {
        category: 'general',
        webhook_url: process.env.SLACK_GENERAL_WEBHOOK || 'https://hooks.slack.com/services/YOUR/GENERAL/WEBHOOK',
        channel_name: 'general-support',
        is_active: true
      }
    ];
    
    for (const setting of slackSettings) {
      const { error } = await supabase
        .from('slack_integration_settings')
        .upsert(setting, { onConflict: 'category' });
      
      if (error) {
        console.log(`⚠️  Warning: Could not setup Slack integration for ${setting.category}: ${error.message}`);
      } else {
        console.log(`✅ Slack integration setup for ${setting.category}`);
      }
    }
    
    // 2. Setup Default DAO Organization
    console.log('\n🏛️  Setting up DAO Organization...');
    
    const { error: daoError } = await supabase
      .from('dao_organizations')
      .upsert({
        name: 'RAC Rewards DAO',
        description: 'Main governance organization for RAC Rewards platform',
        governance_token_symbol: 'RAC',
        governance_token_decimals: 9,
        min_proposal_threshold: 1000,
        voting_period_days: 7,
        execution_delay_hours: 24,
        quorum_percentage: 10.0,
        super_majority_threshold: 66.67,
        is_active: true
      }, { onConflict: 'name' });
    
    if (daoError) {
      console.log(`⚠️  Warning: Could not setup DAO organization: ${daoError.message}`);
    } else {
      console.log('✅ DAO organization setup complete');
    }
    
    // 3. Setup Default Rewards Configuration
    console.log('\n💰 Setting up Rewards Configuration...');
    
    const { error: rewardsError } = await supabase
      .from('rewards_config')
      .upsert({
        program_id: process.env.SOLANA_PROGRAM_ID || 'default_program_id',
        admin_authority: process.env.SOLANA_ADMIN_AUTHORITY || 'default_admin',
        reward_token_mint: process.env.SOLANA_REWARD_TOKEN_MINT || 'default_mint',
        distribution_interval: 86400, // 24 hours
        max_rewards_per_user: 1000000,
        is_active: true
      }, { onConflict: 'program_id' });
    
    if (rewardsError) {
      console.log(`⚠️  Warning: Could not setup rewards configuration: ${rewardsError.message}`);
    } else {
      console.log('✅ Rewards configuration setup complete');
    }
    
    // 4. Setup NFT Card Tiers
    console.log('\n🎴 Setting up NFT Card Tiers...');
    
    const nftTiers = [
      { name: 'Basic', multiplier: 1.0, is_premium: false },
      { name: 'Silver', multiplier: 1.2, is_premium: true },
      { name: 'Gold', multiplier: 1.5, is_premium: true },
      { name: 'Platinum', multiplier: 2.0, is_premium: true }
    ];
    
    for (const tier of nftTiers) {
      const { error } = await supabase
        .from('nft_card_tiers')
        .upsert(tier, { onConflict: 'name' });
      
      if (error) {
        console.log(`⚠️  Warning: Could not setup NFT tier ${tier.name}: ${error.message}`);
      } else {
        console.log(`✅ NFT tier ${tier.name} setup complete`);
      }
    }
    
    // 5. Setup Issue Categories and Tags
    console.log('\n🏷️  Setting up Issue Categories and Tags...');
    
    const categories = [
      {
        category_key: 'technical',
        category_name: 'Technical Support',
        description: 'Technical issues and bugs'
      },
      {
        category_key: 'billing',
        category_name: 'Billing & Payments',
        description: 'Payment and billing related issues'
      },
      {
        category_key: 'account',
        category_name: 'Account Management',
        description: 'Account setup and management'
      },
      {
        category_key: 'general',
        category_name: 'General Inquiry',
        description: 'General questions and inquiries'
      }
    ];
    
    for (const category of categories) {
      const { data: categoryData, error: catError } = await supabase
        .from('issue_categories')
        .upsert(category, { onConflict: 'category_key' })
        .select();
      
      if (catError) {
        console.log(`⚠️  Warning: Could not setup category ${category.category_key}: ${catError.message}`);
      } else {
        console.log(`✅ Category ${category.category_key} setup complete`);
        
        // Setup tags for each category
        const tags = getTagsForCategory(category.category_key);
        for (const tag of tags) {
          const { error: tagError } = await supabase
            .from('issue_tags')
            .upsert({
              ...tag,
              category_id: categoryData[0]?.id
            }, { onConflict: 'tag_key' });
          
          if (tagError) {
            console.log(`⚠️  Warning: Could not setup tag ${tag.tag_key}: ${tagError.message}`);
          } else {
            console.log(`  ✅ Tag ${tag.tag_key} setup complete`);
          }
        }
      }
    }
    
    // 6. Create sample marketplace listings
    console.log('\n🏪 Setting up Sample Marketplace Listings...');
    
    const sampleListings = [
      {
        title: 'Real Estate Investment Fund',
        description: 'Invest in diversified real estate portfolio with 8% annual returns',
        funding_goal: 1000000,
        min_investment: 100,
        max_investment: 50000,
        token_ticker: 'REIF',
        token_supply: 1000000,
        status: 'active'
      },
      {
        title: 'Green Energy Solar Farm',
        description: 'Sustainable energy investment with environmental impact',
        funding_goal: 500000,
        min_investment: 50,
        max_investment: 25000,
        token_ticker: 'GESF',
        token_supply: 500000,
        status: 'active'
      }
    ];
    
    for (const listing of sampleListings) {
      const { error } = await supabase
        .from('marketplace_listings')
        .upsert(listing, { onConflict: 'title' });
      
      if (error) {
        console.log(`⚠️  Warning: Could not setup listing ${listing.title}: ${error.message}`);
      } else {
        console.log(`✅ Listing ${listing.title} setup complete`);
      }
    }
    
    console.log('\n🎉 Production Configuration Setup Complete!');
    console.log('==========================================');
    console.log('✅ Slack integration configured');
    console.log('✅ DAO organization setup');
    console.log('✅ Rewards configuration ready');
    console.log('✅ NFT card tiers configured');
    console.log('✅ Issue categories and tags setup');
    console.log('✅ Sample marketplace listings created');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Update environment variables with your actual values:');
    console.log('   - SLACK_TECHNICAL_WEBHOOK');
    console.log('   - SLACK_BILLING_WEBHOOK');
    console.log('   - SLACK_GENERAL_WEBHOOK');
    console.log('   - SOLANA_PROGRAM_ID');
    console.log('   - SOLANA_ADMIN_AUTHORITY');
    console.log('   - SOLANA_REWARD_TOKEN_MINT');
    console.log('2. Deploy your frontend application');
    console.log('3. Test all user flows');
    console.log('4. Monitor system health');
    
  } catch (error) {
    console.error('❌ Production configuration setup failed:', error);
    process.exit(1);
  }
}

function getTagsForCategory(categoryKey) {
  const tagMap = {
    technical: [
      { tag_key: 'bug', tag_name: 'Bug Report', description: 'Application bugs and errors' },
      { tag_key: 'performance', tag_name: 'Performance Issue', description: 'Slow loading or performance problems' },
      { tag_key: 'compatibility', tag_name: 'Compatibility Issue', description: 'Browser or device compatibility' },
      { tag_key: 'feature_request', tag_name: 'Feature Request', description: 'Request for new features' }
    ],
    billing: [
      { tag_key: 'payment_failed', tag_name: 'Payment Failed', description: 'Payment processing issues' },
      { tag_key: 'refund', tag_name: 'Refund Request', description: 'Request for refunds' },
      { tag_key: 'billing_inquiry', tag_name: 'Billing Inquiry', description: 'Questions about billing' },
      { tag_key: 'subscription', tag_name: 'Subscription Issue', description: 'Subscription management' }
    ],
    account: [
      { tag_key: 'login_issue', tag_name: 'Login Problem', description: 'Cannot log in to account' },
      { tag_key: 'password_reset', tag_name: 'Password Reset', description: 'Need to reset password' },
      { tag_key: 'profile_update', tag_name: 'Profile Update', description: 'Update account information' },
      { tag_key: 'account_verification', tag_name: 'Account Verification', description: 'Account verification issues' }
    ],
    general: [
      { tag_key: 'question', tag_name: 'General Question', description: 'General questions about the platform' },
      { tag_key: 'feedback', tag_name: 'Feedback', description: 'User feedback and suggestions' },
      { tag_key: 'partnership', tag_name: 'Partnership Inquiry', description: 'Business partnership opportunities' },
      { tag_key: 'press', tag_name: 'Press Inquiry', description: 'Media and press inquiries' }
    ]
  };
  
  return tagMap[categoryKey] || [];
}

// Run setup
setupProductionConfig().catch(error => {
  console.error('❌ Setup execution failed:', error);
  process.exit(1);
});
