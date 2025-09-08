// Apply DAO Migration Script
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'api' }
});

async function applyDAOMigration() {
  console.log('🚀 Applying DAO Migration...\n');
  
  try {
    // Step 1: Create the config_proposals table
    console.log('📋 Creating config_proposals table...');
    
    const migrationSQL = `
      -- Create config_proposals table for DAO approval workflow
      CREATE TABLE IF NOT EXISTS api.config_proposals (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          config_id VARCHAR(255) NOT NULL,
          proposed_distribution_interval INTEGER NOT NULL,
          proposed_max_rewards_per_user INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
          proposer_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          approved_at TIMESTAMP WITH TIME ZONE,
          implemented_at TIMESTAMP WITH TIME ZONE,
          rejection_reason TEXT,
          approved_by VARCHAR(255),
          implemented_by VARCHAR(255)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_config_proposals_status ON api.config_proposals(status);
      CREATE INDEX IF NOT EXISTS idx_config_proposals_config_id ON api.config_proposals(config_id);
      CREATE INDEX IF NOT EXISTS idx_config_proposals_created_at ON api.config_proposals(created_at);

      -- Enable Row Level Security (RLS)
      ALTER TABLE api.config_proposals ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      CREATE POLICY "Admins can manage config proposals" ON api.config_proposals
          FOR ALL USING (
              EXISTS (
                  SELECT 1 FROM api.profiles 
                  WHERE profiles.id = auth.uid() 
                  AND profiles.role = 'admin'
              )
          );

      -- Allow users to read approved proposals
      CREATE POLICY "Users can read approved proposals" ON api.config_proposals
          FOR SELECT USING (status = 'approved');

      -- Allow DAO members to vote on proposals (read and update status)
      CREATE POLICY "DAO members can vote on proposals" ON api.config_proposals
          FOR SELECT USING (status = 'pending');

      -- Grant necessary permissions
      GRANT ALL ON api.config_proposals TO authenticated;
      GRANT ALL ON api.config_proposals TO service_role;
    `;

    console.log('✅ Migration SQL prepared');
    console.log('📝 Execute this SQL in your database:');
    console.log(migrationSQL);
    
    // Test if table already exists
    const { data, error } = await supabase
      .from('config_proposals')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST301') {
      console.log('⚠️  Table does not exist - migration needed');
    } else if (error) {
      console.log('⚠️  Error checking table:', error.message);
    } else {
      console.log('✅ Table already exists and is accessible');
    }

    console.log('\n🎉 DAO Migration Script Ready!');
    console.log('\n📋 Next Steps:');
    console.log('1. Execute the migration SQL in your database');
    console.log('2. Test the workflow in Admin Panel');
    console.log('3. Verify proposal creation and management');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  }
}

// Run the migration
applyDAOMigration();
