// Test database connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

console.log('Testing Supabase connection...');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection by querying nft_types table
async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    const { data, error } = await supabase
      .from('nft_types')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 NFT Types found:', data?.length || 0);
    console.log('📋 Sample data:', data);
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return false;
  }
}

testConnection();

