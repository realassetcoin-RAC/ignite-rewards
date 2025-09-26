// Force Real Supabase Usage Script
// This script tests the database connection and forces real Supabase usage

console.log('🔧 Force Real Supabase Usage Script');
console.log('=====================================');

// Test if we can access the database adapter
try {
  // Import the database adapter (this will work in browser console)
  const { databaseAdapter } = window.databaseAdapter || {};
  
  if (!databaseAdapter) {
    console.error('❌ Database adapter not found in window object');
    console.log('💡 Try running this script from the browser console after the app loads');
    return;
  }

  console.log('✅ Database adapter found');
  console.log('🔍 Current mode:', databaseAdapter.isMockMode() ? 'Mock Mode' : 'Real Supabase');
  
  // Test real Supabase connection
  console.log('🔍 Testing real Supabase connection...');
  
  databaseAdapter.testRealSupabaseConnection().then(success => {
    if (success) {
      console.log('✅ Real Supabase connection successful!');
      console.log('🔄 Forcing real Supabase usage...');
      
      const forced = databaseAdapter.forceRealSupabase();
      if (forced) {
        console.log('✅ Successfully forced real Supabase usage');
        console.log('🔄 Refreshing page to apply changes...');
        window.location.reload();
      } else {
        console.error('❌ Failed to force real Supabase usage');
      }
    } else {
      console.error('❌ Real Supabase connection failed');
      console.log('💡 Check your internet connection and Supabase service status');
    }
  }).catch(error => {
    console.error('❌ Error testing Supabase connection:', error);
  });

} catch (error) {
  console.error('❌ Error accessing database adapter:', error);
  console.log('💡 Make sure the app is loaded and try again');
}

// Alternative: Direct Supabase test
console.log('🔍 Alternative: Testing direct Supabase connection...');

const testDirectSupabase = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';
    
    const client = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await client.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Direct Supabase test failed:', error);
    } else {
      console.log('✅ Direct Supabase test successful!');
      console.log('💡 The database is working - the app should use real Supabase');
    }
  } catch (error) {
    console.error('❌ Error in direct Supabase test:', error);
  }
};

testDirectSupabase();
