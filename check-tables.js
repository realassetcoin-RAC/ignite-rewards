// Check if required tables exist
// Run this in the browser console to check table existence

async function checkTables() {
  try {
    console.log('🔍 Checking if required tables exist...');
    
    const { supabase } = await import('./src/integrations/supabase/client.ts');
    
    const tables = [
      'dao_organizations',
      'dao_members', 
      'dao_proposals',
      'dao_votes',
      'merchants',
      'loyalty_transactions',
      'marketplace_listings'
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results[table] = { exists: false, error: error.message };
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          results[table] = { exists: true, count: data?.length || 0 };
          console.log(`✅ ${table}: exists (${data?.length || 0} records)`);
        }
      } catch (err) {
        results[table] = { exists: false, error: err.message };
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    console.log('📊 Table Check Results:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return { error: error.message };
  }
}

// Make function available globally
if (typeof window !== 'undefined') {
  window.checkTables = checkTables;
  console.log('💡 Run checkTables() to check if required tables exist');
}
