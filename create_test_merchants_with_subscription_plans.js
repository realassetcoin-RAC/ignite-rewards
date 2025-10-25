const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestMerchantsWithSubscriptionPlans() {
  console.log('🔧 Creating test merchants with subscription plans...\n');

  try {
    // First, get the available subscription plans
    console.log('1️⃣ Getting available subscription plans...');
    const { data: plans, error: plansError } = await supabase
      .from('merchant_subscription_plans')
      .select('id, plan_name, plan_type')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    
    if (plansError) {
      console.log('❌ Error loading subscription plans:', plansError.message);
      return;
    }
    
    console.log('✅ Found subscription plans:');
    plans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_name} (${plan.plan_type}) - ID: ${plan.id}`);
    });

    // Create test merchants with different subscription plans
    const testMerchants = [
      {
        id: 'test_merchant_1',
        business_name: 'TechStore Pro',
        contact_email: 'contact@techstorepro.com',
        contact_phone: '+1-555-0101',
        business_type: 'electronics',
        business_address: '123 Tech Street, San Francisco, CA 94105',
        city: 'San Francisco',
        country: 'United States',
        status: 'active',
        subscription_plan: 'startup-plan', // This should match the plan_type
        industry: 'Electronics',
        created_at: new Date().toISOString()
      },
      {
        id: 'test_merchant_2',
        business_name: 'Fashion Forward',
        contact_email: 'hello@fashionforward.com',
        contact_phone: '+1-555-0102',
        business_type: 'fashion',
        business_address: '456 Fashion Ave, New York, NY 10001',
        city: 'New York',
        country: 'United States',
        status: 'active',
        subscription_plan: 'momentum-plan',
        industry: 'Fashion',
        created_at: new Date().toISOString()
      },
      {
        id: 'test_merchant_3',
        business_name: 'Green Grocer',
        contact_email: 'info@greengrocer.com',
        contact_phone: '+1-555-0103',
        business_type: 'food',
        business_address: '789 Organic Lane, Portland, OR 97201',
        city: 'Portland',
        country: 'United States',
        status: 'active',
        subscription_plan: 'energizer-plan',
        industry: 'Food & Beverage',
        created_at: new Date().toISOString()
      },
      {
        id: 'test_merchant_4',
        business_name: 'Cloud Solutions Inc',
        contact_email: 'contact@cloudsolutions.com',
        contact_phone: '+1-555-0104',
        business_type: 'technology',
        business_address: '321 Cloud Drive, Seattle, WA 98101',
        city: 'Seattle',
        country: 'United States',
        status: 'active',
        subscription_plan: 'cloud9-plan',
        industry: 'Technology',
        created_at: new Date().toISOString()
      },
      {
        id: 'test_merchant_5',
        business_name: 'Super Enterprise Corp',
        contact_email: 'info@superenterprise.com',
        contact_phone: '+1-555-0105',
        business_type: 'enterprise',
        business_address: '999 Enterprise Blvd, Austin, TX 78701',
        city: 'Austin',
        country: 'United States',
        status: 'active',
        subscription_plan: 'super-plan',
        industry: 'Enterprise',
        created_at: new Date().toISOString()
      },
      {
        id: 'test_merchant_6',
        business_name: 'Startup Cafe',
        contact_email: 'hello@startupcafe.com',
        contact_phone: '+1-555-0106',
        business_type: 'restaurant',
        business_address: '555 Startup Street, San Francisco, CA 94102',
        city: 'San Francisco',
        country: 'United States',
        status: 'active',
        subscription_plan: 'startup-plan',
        industry: 'Food & Beverage',
        created_at: new Date().toISOString()
      },
      {
        id: 'test_merchant_7',
        business_name: 'Momentum Motors',
        contact_email: 'sales@momentummotors.com',
        contact_phone: '+1-555-0107',
        business_type: 'automotive',
        business_address: '777 Motor Way, Detroit, MI 48201',
        city: 'Detroit',
        country: 'United States',
        status: 'active',
        subscription_plan: 'momentum-plan',
        industry: 'Automotive',
        created_at: new Date().toISOString()
      }
    ];

    console.log('\n2️⃣ Creating test merchants...');
    
    // Insert merchants one by one to handle any conflicts
    let successCount = 0;
    let errorCount = 0;
    
    for (const merchant of testMerchants) {
      try {
        const { error } = await supabase
          .from('merchants')
          .upsert(merchant, { onConflict: 'id' });
        
        if (error) {
          console.log(`❌ Error creating merchant ${merchant.business_name}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Created merchant: ${merchant.business_name} (${merchant.subscription_plan})`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception creating merchant ${merchant.business_name}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} merchants`);
    console.log(`   ❌ Failed to create: ${errorCount} merchants`);

    // Verify the merchants were created
    console.log('\n3️⃣ Verifying created merchants...');
    const { data: createdMerchants, error: verifyError } = await supabase
      .from('merchants')
      .select('id, business_name, status, subscription_plan')
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.log('❌ Error verifying merchants:', verifyError.message);
    } else {
      console.log(`✅ Found ${createdMerchants?.length || 0} total merchants in database`);
      
      if (createdMerchants && createdMerchants.length > 0) {
        console.log('📋 Active merchants with subscription plans:');
        const activeMerchants = createdMerchants.filter(m => m.status === 'active' && m.subscription_plan);
        activeMerchants.forEach((merchant, index) => {
          console.log(`   ${index + 1}. ${merchant.business_name} - Plan: ${merchant.subscription_plan}`);
        });
        
        // Count by subscription plan
        const planCounts = activeMerchants.reduce((acc, merchant) => {
          const plan = merchant.subscription_plan;
          acc[plan] = (acc[plan] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📊 Subscription plan distribution:');
        Object.entries(planCounts).forEach(([plan, count]) => {
          console.log(`   ${plan}: ${count} merchants`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

createTestMerchantsWithSubscriptionPlans();
