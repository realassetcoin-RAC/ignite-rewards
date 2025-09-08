// Test DAO Workflow Script
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'api' }
});

async function testDAOWorkflow() {
  console.log('🧪 Testing DAO Workflow...\n');
  
  try {
    // Test 1: Check if table exists
    console.log('📋 Test 1: Checking if config_proposals table exists...');
    
    const { data: tableData, error: tableError } = await supabase
      .from('config_proposals')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table does not exist or error:', tableError);
      console.log('⚠️  Please apply the migration first by running: apply_dao_migration.js');
      return;
    }

    console.log('✅ config_proposals table exists and is accessible');

    // Test 2: Create a test proposal
    console.log('\n📋 Test 2: Creating a test proposal...');
    
    const testProposal = {
      config_id: 'test-config-' + Date.now(),
      proposed_distribution_interval: 86400,
      proposed_max_rewards_per_user: 2000000,
      status: 'pending',
      proposer_id: 'test-admin',
      created_at: new Date().toISOString()
    };

    const { data: proposalData, error: proposalError } = await supabase
      .from('config_proposals')
      .insert([testProposal])
      .select();

    if (proposalError) {
      console.error('❌ Error creating test proposal:', proposalError);
      return;
    }

    console.log('✅ Test proposal created successfully:', proposalData[0]);

    // Test 3: Read the proposal
    console.log('\n📋 Test 3: Reading the test proposal...');
    
    const { data: readData, error: readError } = await supabase
      .from('config_proposals')
      .select('*')
      .eq('id', proposalData[0].id);

    if (readError) {
      console.error('❌ Error reading proposal:', readError);
      return;
    }

    console.log('✅ Test proposal read successfully:', readData[0]);

    // Test 4: Update proposal status
    console.log('\n📋 Test 4: Updating proposal status to approved...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('config_proposals')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'test-dao-member'
      })
      .eq('id', proposalData[0].id)
      .select();

    if (updateError) {
      console.error('❌ Error updating proposal:', updateError);
      return;
    }

    console.log('✅ Test proposal updated successfully:', updateData[0]);

    // Test 5: Test proposal execution
    console.log('\n📋 Test 5: Testing proposal execution...');
    
    const { data: executeData, error: executeError } = await supabase
      .from('config_proposals')
      .update({ 
        status: 'implemented',
        implemented_at: new Date().toISOString(),
        implemented_by: 'test-executor'
      })
      .eq('id', proposalData[0].id)
      .select();

    if (executeError) {
      console.error('❌ Error executing proposal:', executeError);
      return;
    }

    console.log('✅ Test proposal executed successfully:', executeData[0]);

    // Test 6: Clean up test data
    console.log('\n📋 Test 6: Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('config_proposals')
      .delete()
      .eq('id', proposalData[0].id);

    if (deleteError) {
      console.error('❌ Error deleting test proposal:', deleteError);
      return;
    }

    console.log('✅ Test data cleaned up successfully');

    console.log('\n🎉 DAO Workflow Test Complete!');
    console.log('\n✅ All tests passed:');
    console.log('  - Table creation and access');
    console.log('  - Proposal creation');
    console.log('  - Proposal reading');
    console.log('  - Proposal status updates (pending → approved → implemented)');
    console.log('  - Proposal execution workflow');
    console.log('  - Data cleanup');

    console.log('\n📋 Next Steps:');
    console.log('1. Test the frontend in Admin Panel → Rewards tab');
    console.log('2. Create a real proposal and verify it appears');
    console.log('3. Test the public DAO interface at /dao');
    console.log('4. Deploy the updated Solana contract');

  } catch (error) {
    console.error('❌ Error during workflow test:', error);
  }
}

// Run the test
testDAOWorkflow();
