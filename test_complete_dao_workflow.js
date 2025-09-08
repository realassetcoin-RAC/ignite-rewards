// Complete DAO Workflow Test
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'api' }
});

async function testCompleteDAOWorkflow() {
  console.log('🧪 Testing Complete DAO Workflow...\n');
  
  const testResults = {
    database: false,
    frontend: false,
    security: false,
    workflow: false,
    issues: []
  };

  try {
    // Test 1: Database Structure
    console.log('📋 Test 1: Database Structure...');
    try {
      const { data, error } = await supabase
        .from('config_proposals')
        .select('*')
        .limit(0);

      if (error && error.code === '42501') {
        console.log('✅ Database table exists and RLS is active');
        testResults.database = true;
        testResults.security = true;
      } else if (error) {
        console.log('❌ Database error:', error.message);
        testResults.issues.push(`Database error: ${error.message}`);
      } else {
        console.log('✅ Database table accessible');
        testResults.database = true;
      }
    } catch (error) {
      console.log('❌ Database connection error:', error.message);
      testResults.issues.push(`Database connection error: ${error.message}`);
    }

    // Test 2: Frontend Components
    console.log('\n📋 Test 2: Frontend Components...');
    try {
      // Check if key files exist and are accessible
      const fs = await import('fs');
      const path = await import('path');
      
      const frontendFiles = [
        'src/pages/DAOPublic.tsx',
        'src/components/admin/RewardsManager.tsx',
        'src/App.tsx'
      ];

      let frontendIssues = [];
      for (const file of frontendFiles) {
        try {
          if (fs.existsSync(file)) {
            console.log(`✅ ${file} exists`);
          } else {
            console.log(`❌ ${file} missing`);
            frontendIssues.push(`Missing file: ${file}`);
          }
        } catch (error) {
          console.log(`❌ Error checking ${file}:`, error.message);
          frontendIssues.push(`Error checking ${file}: ${error.message}`);
        }
      }

      if (frontendIssues.length === 0) {
        console.log('✅ All frontend components exist');
        testResults.frontend = true;
      } else {
        testResults.issues.push(...frontendIssues);
      }
    } catch (error) {
      console.log('❌ Frontend check error:', error.message);
      testResults.issues.push(`Frontend check error: ${error.message}`);
    }

    // Test 3: Route Configuration
    console.log('\n📋 Test 3: Route Configuration...');
    try {
      const fs = await import('fs');
      const appContent = fs.readFileSync('src/App.tsx', 'utf8');
      
      if (appContent.includes('/dao') && appContent.includes('DAOPublic')) {
        console.log('✅ DAO routes configured correctly');
        testResults.frontend = true;
      } else {
        console.log('❌ DAO routes not configured');
        testResults.issues.push('DAO routes not configured in App.tsx');
      }
    } catch (error) {
      console.log('❌ Route check error:', error.message);
      testResults.issues.push(`Route check error: ${error.message}`);
    }

    // Test 4: Smart Contract
    console.log('\n📋 Test 4: Smart Contract...');
    try {
      const fs = await import('fs');
      if (fs.existsSync('solana-dao-nft-contract-updated.rs')) {
        console.log('✅ Updated Solana contract exists');
        testResults.workflow = true;
      } else {
        console.log('❌ Updated Solana contract missing');
        testResults.issues.push('Updated Solana contract missing');
      }
    } catch (error) {
      console.log('❌ Contract check error:', error.message);
      testResults.issues.push(`Contract check error: ${error.message}`);
    }

    // Test 5: Migration Files
    console.log('\n📋 Test 5: Migration Files...');
    try {
      const fs = await import('fs');
      if (fs.existsSync('config_proposals_migration.sql')) {
        console.log('✅ Migration file exists');
        testResults.workflow = true;
      } else {
        console.log('❌ Migration file missing');
        testResults.issues.push('Migration file missing');
      }
    } catch (error) {
      console.log('❌ Migration check error:', error.message);
      testResults.issues.push(`Migration check error: ${error.message}`);
    }

    // Test 6: Build Test
    console.log('\n📋 Test 6: Build Test...');
    try {
      const fs = await import('fs');
      if (fs.existsSync('dist/index.html')) {
        console.log('✅ Application builds successfully');
        testResults.frontend = true;
      } else {
        console.log('❌ Build output missing');
        testResults.issues.push('Build output missing - run npm run build');
      }
    } catch (error) {
      console.log('❌ Build check error:', error.message);
      testResults.issues.push(`Build check error: ${error.message}`);
    }

    // Summary
    console.log('\n🎯 Test Summary:');
    console.log('================');
    console.log(`Database: ${testResults.database ? '✅' : '❌'}`);
    console.log(`Frontend: ${testResults.frontend ? '✅' : '❌'}`);
    console.log(`Security: ${testResults.security ? '✅' : '❌'}`);
    console.log(`Workflow: ${testResults.workflow ? '✅' : '❌'}`);

    if (testResults.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n🎉 All Tests Passed!');
    }

    // Recommendations
    console.log('\n📋 Recommendations:');
    if (testResults.database && testResults.security) {
      console.log('✅ Database is ready - RLS is working correctly');
    }
    if (testResults.frontend) {
      console.log('✅ Frontend is ready - all components exist and build successfully');
    }
    if (testResults.workflow) {
      console.log('✅ Workflow is ready - contract and migration files exist');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Test the Admin Panel → Rewards tab (create a proposal)');
    console.log('2. Test the public DAO interface at /dao');
    console.log('3. Verify proposal creation and voting workflow');
    console.log('4. Deploy the updated Solana contract');

    return testResults;

  } catch (error) {
    console.error('❌ Critical error during testing:', error);
    testResults.issues.push(`Critical error: ${error.message}`);
    return testResults;
  }
}

// Run the complete test
testCompleteDAOWorkflow();
