// Test basic database connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicConnection() {
  console.log('🔍 Testing basic Supabase connection...');
  
  try {
    // Try to get the current user (this should work even if tables don't exist)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️  Auth error (expected):', authError.message);
    } else {
      console.log('✅ Auth service working, user:', user ? 'logged in' : 'not logged in');
    }
    
    // Try a simple query to see if we can access the database at all
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
      console.log('📋 This suggests the database is not accessible');
      return false;
    } else {
      console.log('✅ Database is accessible!');
      console.log('📊 Available tables:', data?.map(t => t.table_name) || []);
      return true;
    }
    
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

testBasicConnection();

