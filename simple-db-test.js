// Simple database test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleTest() {
  try {
    console.log('🔍 Testing basic database connection...');
    
    // Try a simple query to any table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database error:', error);
      
      // Try to get table list
      const { data: tables, error: tableError } = await supabase
        .rpc('get_schema_tables');
      
      if (tableError) {
        console.error('❌ Cannot get table list:', tableError);
        console.log('📋 Database might be in maintenance mode or migration failed');
      } else {
        console.log('✅ Database accessible, tables:', tables);
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Profiles count:', data);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

simpleTest();

