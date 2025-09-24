// Check database schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if nft_types table exists and has the right structure
    const { data: nftTypes, error: nftError } = await supabase
      .from('nft_types')
      .select('*')
      .limit(1);
    
    if (nftError) {
      console.error('❌ nft_types table error:', nftError);
      
      // Try to check if table exists at all
      const { data: tables, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'nft_types' });
      
      if (tableError) {
        console.error('❌ Cannot access nft_types table:', tableError);
        console.log('📋 This suggests the database migration needs to be run.');
        return false;
      }
    } else {
      console.log('✅ nft_types table accessible');
      console.log('📊 Sample NFT type:', nftTypes?.[0]);
    }
    
    // Check if nft_collections table exists
    const { data: collections, error: collectionsError } = await supabase
      .from('nft_collections')
      .select('*')
      .limit(1);
    
    if (collectionsError) {
      console.error('❌ nft_collections table error:', collectionsError);
      console.log('📋 nft_collections table missing - migration needed');
    } else {
      console.log('✅ nft_collections table accessible');
      console.log('📊 Sample collection:', collections?.[0]);
    }
    
    // Check if nft_minting_control table exists
    const { data: minting, error: mintingError } = await supabase
      .from('nft_minting_control')
      .select('*')
      .limit(1);
    
    if (mintingError) {
      console.error('❌ nft_minting_control table error:', mintingError);
      console.log('📋 nft_minting_control table missing - migration needed');
    } else {
      console.log('✅ nft_minting_control table accessible');
      console.log('📊 Sample minting control:', minting?.[0]);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Schema check failed:', err);
    return false;
  }
}

checkSchema();

