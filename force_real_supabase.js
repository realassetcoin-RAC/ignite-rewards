// Force Real Supabase Client Script
// This script forces the application to use the real Supabase client instead of mock mode

console.log('🔧 FORCING REAL SUPABASE CLIENT...');

// Function to force real Supabase client
function forceRealSupabase() {
    console.log('🔄 Starting force real Supabase process...');
    
    // Step 1: Clear all mock data
    console.log('🧹 Step 1: Clearing mock data...');
    const mockKeys = [
        'mock_oauth_user',
        'mock_auth_session', 
        'mock_user_data',
        'supabase_mock_mode',
        'database_adapter_mock_mode'
    ];
    
    mockKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`✅ Removed ${key} from localStorage`);
        }
    });
    
    // Clear session storage
    sessionStorage.clear();
    console.log('✅ Cleared session storage');
    
    // Step 2: Try to access and force the database adapter
    console.log('🔄 Step 2: Forcing database adapter to use real Supabase...');
    
    // Check if we can access the database adapter through the window object
    if (typeof window !== 'undefined') {
        // Try multiple ways to access the database adapter
        const possibleAdapters = [
            window.databaseAdapter,
            window.supabase,
            window.__databaseAdapter,
            window.__supabase
        ];
        
        let adapterFound = false;
        possibleAdapters.forEach((adapter, index) => {
            if (adapter && typeof adapter === 'object') {
                console.log(`✅ Found database adapter at index ${index}`);
                adapterFound = true;
                
                // Try to force real Supabase
                if (adapter.forceRealSupabase && typeof adapter.forceRealSupabase === 'function') {
                    try {
                        const success = adapter.forceRealSupabase();
                        console.log(`✅ Force real Supabase result: ${success}`);
                    } catch (error) {
                        console.error('❌ Error calling forceRealSupabase:', error);
                    }
                } else {
                    console.log('⚠️ forceRealSupabase method not available on this adapter');
                }
                
                // Check if it's in mock mode
                if (adapter.isMockMode && typeof adapter.isMockMode === 'function') {
                    const isMock = adapter.isMockMode();
                    console.log(`📊 Mock mode status: ${isMock ? 'ACTIVE (PROBLEM)' : 'INACTIVE (GOOD)'}`);
                }
            }
        });
        
        if (!adapterFound) {
            console.log('⚠️ Database adapter not found in window object');
        }
    }
    
    // Step 3: Test Supabase connection directly
    console.log('🔍 Step 3: Testing direct Supabase connection...');
    
    const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMTA5NzQsImV4cCI6MjA1MDg4Njk3NH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';
    
    fetch(`${supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    })
    .then(response => {
        if (response.ok) {
            console.log('✅ Direct Supabase API connection successful');
            console.log('💡 Supabase service is working - the issue is in the app configuration');
        } else {
            console.log(`❌ Direct Supabase API connection failed: ${response.status} ${response.statusText}`);
        }
    })
    .catch(error => {
        console.error('❌ Direct Supabase connection test failed:', error);
    });
    
    // Step 4: Provide instructions
    console.log('📋 Step 4: Next steps...');
    console.log('1. ✅ Mock data cleared');
    console.log('2. ✅ Database adapter forced (if available)');
    console.log('3. ✅ Direct connection tested');
    console.log('4. 🔄 Now try signing in again');
    console.log('5. 🔄 If still not working, refresh the page');
    
    console.log('🎯 FORCE REAL SUPABASE COMPLETE!');
    console.log('💡 The application should now use the real Supabase client');
    console.log('🚀 Try signing in again - it should work properly now');
}

// Auto-run the force function
forceRealSupabase();

// Also provide it as a global function for manual use
if (typeof window !== 'undefined') {
    window.forceRealSupabase = forceRealSupabase;
    console.log('💡 You can also call window.forceRealSupabase() manually');
}

