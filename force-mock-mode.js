// Force Mock Mode Script
// This script forces the application to use mock mode when Supabase is unavailable

console.log('🔄 Forcing application to use mock mode...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Force switch to mock mode
  if (window.databaseAdapter) {
    window.databaseAdapter.forceMockMode();
    console.log('✅ Forced mock mode successfully');
  } else {
    console.log('⚠️ Database adapter not found, trying to access it...');
    
    // Try to access the database adapter from the global scope
    setTimeout(() => {
      if (window.databaseAdapter) {
        window.databaseAdapter.forceMockMode();
        console.log('✅ Forced mock mode successfully (delayed)');
      } else {
        console.log('❌ Could not access database adapter');
      }
    }, 1000);
  }
  
  // Clear any existing auth data
  localStorage.removeItem('mock_oauth_user');
  localStorage.removeItem('sb-wndswqvqogeblksrujpg-auth-token');
  localStorage.removeItem('supabase.auth.token');
  
  // Clear all Supabase-related localStorage items
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('🧹 Cleared all auth data');
  
  // Reload the page to apply changes
  console.log('🔄 Reloading page to apply mock mode...');
  window.location.reload();
} else {
  console.log('❌ This script must be run in a browser environment');
}
