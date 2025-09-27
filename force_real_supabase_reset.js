// Force Real Supabase Reset - Comprehensive Fix
// This script completely resets the application to use real Supabase

console.log('🔧 FORCE REAL SUPABASE RESET');
console.log('=============================');

// Step 1: Complete localStorage and sessionStorage cleanup
function completeStorageCleanup() {
    console.log('🧹 Step 1: Complete storage cleanup...');
    
    // Clear all localStorage
    localStorage.clear();
    console.log('✅ Cleared all localStorage');
    
    // Clear all sessionStorage
    sessionStorage.clear();
    console.log('✅ Cleared all sessionStorage');
    
    // Clear any cached data
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
                console.log(`✅ Cleared cache: ${name}`);
            });
        });
    }
    
    // Clear any service worker registrations
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
                console.log('✅ Unregistered service worker');
            });
        });
    }
}

// Step 2: Force database adapter reset
function forceDatabaseAdapterReset() {
    console.log('🔄 Step 2: Force database adapter reset...');
    
    // Try to access the database adapter and force a complete reset
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
            
            // Force real Supabase if method exists
            if (adapter.forceRealSupabase && typeof adapter.forceRealSupabase === 'function') {
                try {
                    const success = adapter.forceRealSupabase();
                    console.log(`✅ Force real Supabase result: ${success}`);
                } catch (error) {
                    console.error('❌ Error calling forceRealSupabase:', error);
                }
            }
            
            // Check and log mock mode status
            if (adapter.isMockMode && typeof adapter.isMockMode === 'function') {
                const isMock = adapter.isMockMode();
                console.log(`📊 Mock mode status: ${isMock ? 'ACTIVE (PROBLEM)' : 'INACTIVE (GOOD)'}`);
            }
        }
    });
    
    if (!adapterFound) {
        console.log('⚠️ No database adapter found in window object');
    }
}

// Step 3: Create and test direct Supabase client
async function createAndTestDirectSupabase() {
    console.log('🌐 Step 3: Create and test direct Supabase client...');
    
    try {
        // Import Supabase client directly
        const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
        
        // Create direct Supabase client
        const directSupabase = createClient(
            'https://wndswqvqogeblksrujpg.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
        );
        
        console.log('✅ Direct Supabase client created');
        
        // Test connection with retry
        let connectionSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`🔍 Testing connection (attempt ${attempt}/3)...`);
            
            try {
                const { data, error } = await directSupabase.from('profiles').select('count').limit(1);
                
                if (error) {
                    console.warn(`⚠️ Connection attempt ${attempt} failed:`, error.message);
                    if (attempt < 3) {
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                        continue;
                    }
                } else {
                    console.log('✅ Direct Supabase connection successful');
                    connectionSuccess = true;
                    break;
                }
            } catch (error) {
                console.warn(`⚠️ Connection attempt ${attempt} failed:`, error.message);
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                    continue;
                }
            }
        }
        
        if (!connectionSuccess) {
            console.error('❌ All connection attempts failed');
            return false;
        }
        
        // Store the direct client globally for the app to use
        window.directSupabase = directSupabase;
        console.log('✅ Direct Supabase client stored globally');
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to create direct Supabase client:', error);
        return false;
    }
}

// Step 4: Test admin login with direct client
async function testAdminLoginWithDirectClient() {
    console.log('🔐 Step 4: Test admin login with direct client...');
    
    if (!window.directSupabase) {
        console.error('❌ Direct Supabase client not available');
        return false;
    }
    
    try {
        const adminCredentials = {
            email: 'admin@igniterewards.com',
            password: 'admin123!'
        };
        
        console.log('📧 Attempting admin login...');
        
        const { data, error } = await window.directSupabase.auth.signInWithPassword(adminCredentials);
        
        if (error) {
            console.error('❌ Admin login failed:', error);
            return false;
        }
        
        if (data?.user && data?.session) {
            console.log('✅ Admin login successful!');
            console.log('👤 User ID:', data.user.id);
            console.log('📧 Email:', data.user.email);
            console.log('🎫 Session expires at:', new Date(data.session.expires_at * 1000));
            
            // Store session properly
            const sessionData = {
                currentSession: data.session,
                expiresAt: data.session.expires_at
            };
            
            localStorage.setItem('sb-wndswqvqogeblksrujpg-auth-token', JSON.stringify(sessionData));
            console.log('✅ Session stored in localStorage');
            
            return true;
        } else {
            console.error('❌ No user or session data returned');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Admin login test failed:', error);
        return false;
    }
}

// Step 5: Override the app's database adapter
function overrideAppDatabaseAdapter() {
    console.log('🔧 Step 5: Override app database adapter...');
    
    if (!window.directSupabase) {
        console.error('❌ Direct Supabase client not available for override');
        return;
    }
    
    // Try to override the database adapter
    const possibleAdapters = [
        'databaseAdapter',
        'supabase',
        '__databaseAdapter',
        '__supabase'
    ];
    
    possibleAdapters.forEach(adapterName => {
        if (window[adapterName]) {
            console.log(`🔄 Overriding ${adapterName}...`);
            
            // Store original for backup
            window[`${adapterName}_original`] = window[adapterName];
            
            // Override with direct client
            window[adapterName] = window.directSupabase;
            
            console.log(`✅ ${adapterName} overridden with direct client`);
        }
    });
}

// Step 6: Force page refresh with new session
function forcePageRefresh() {
    console.log('🔄 Step 6: Force page refresh...');
    
    // Add a small delay to ensure everything is saved
    setTimeout(() => {
        console.log('🚀 Refreshing page with new session...');
        window.location.reload();
    }, 1000);
}

// Main reset function
async function runCompleteSupabaseReset() {
    console.log('🚀 STARTING COMPLETE SUPABASE RESET...');
    console.log('======================================');
    
    try {
        // Step 1: Complete storage cleanup
        completeStorageCleanup();
        
        // Step 2: Force database adapter reset
        forceDatabaseAdapterReset();
        
        // Step 3: Create and test direct Supabase client
        const connectionOk = await createAndTestDirectSupabase();
        
        if (!connectionOk) {
            console.error('❌ Failed to establish Supabase connection');
            console.log('💡 This may be a temporary service issue. Try again later.');
            return;
        }
        
        // Step 4: Test admin login
        const loginOk = await testAdminLoginWithDirectClient();
        
        if (!loginOk) {
            console.warn('⚠️ Admin login failed, but connection is working');
            console.log('💡 You can try logging in manually after the page refreshes');
        }
        
        // Step 5: Override app database adapter
        overrideAppDatabaseAdapter();
        
        // Step 6: Force page refresh
        forcePageRefresh();
        
    } catch (error) {
        console.error('❌ Reset process failed:', error);
        console.log('💡 Try running the script again or check the console for specific errors');
    }
}

// Auto-run the reset
runCompleteSupabaseReset();

// Export functions for manual use
window.supabaseReset = {
    runCompleteSupabaseReset,
    completeStorageCleanup,
    forceDatabaseAdapterReset,
    createAndTestDirectSupabase,
    testAdminLoginWithDirectClient,
    overrideAppDatabaseAdapter,
    forcePageRefresh
};

console.log('\n💡 Manual functions available:');
console.log('- window.supabaseReset.runCompleteSupabaseReset()');
console.log('- window.supabaseReset.testAdminLoginWithDirectClient()');
console.log('- window.supabaseReset.forcePageRefresh()');

