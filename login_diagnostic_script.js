// Comprehensive Login Diagnostic and Fix Script
// Run this in your browser console (F12) to diagnose and fix login issues

console.log('🔧 LOGIN DIAGNOSTIC AND FIX SCRIPT');
console.log('=====================================');

// Step 1: Check current authentication state
function checkAuthState() {
    console.log('\n📊 STEP 1: Checking current authentication state...');
    
    // Check localStorage for mock data
    const mockUser = localStorage.getItem('mock_oauth_user');
    if (mockUser) {
        console.log('❌ MOCK USER FOUND:', JSON.parse(mockUser));
        console.log('💡 This indicates the app is in mock mode');
    } else {
        console.log('✅ No mock user data found');
    }
    
    // Check for Supabase session
    const supabaseSession = localStorage.getItem('sb-wndswqvqogeblksrujpg-auth-token');
    if (supabaseSession) {
        console.log('✅ Supabase session found');
        try {
            const session = JSON.parse(supabaseSession);
            console.log('📋 Session details:', session);
        } catch (e) {
            console.log('⚠️ Session data exists but could not parse');
        }
    } else {
        console.log('❌ No Supabase session found');
    }
    
    // Check for any other auth-related localStorage items
    const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('session') || key.includes('user')
    );
    console.log('🔑 Auth-related localStorage keys:', authKeys);
}

// Step 2: Check database adapter state
function checkDatabaseAdapter() {
    console.log('\n🔍 STEP 2: Checking database adapter state...');
    
    // Try to access the database adapter
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
            
            // Check if it's in mock mode
            if (adapter.isMockMode && typeof adapter.isMockMode === 'function') {
                const isMock = adapter.isMockMode();
                console.log(`📊 Mock mode status: ${isMock ? 'ACTIVE (PROBLEM)' : 'INACTIVE (GOOD)'}`);
                
                if (isMock) {
                    console.log('❌ PROBLEM: Database adapter is in mock mode');
                    console.log('💡 This is why login state is not persisting');
                }
            }
            
            // Check auth methods
            if (adapter.auth) {
                console.log('✅ Auth methods available');
                
                // Test getSession
                if (adapter.auth.getSession) {
                    adapter.auth.getSession().then(result => {
                        console.log('📋 Current session:', result);
                    }).catch(error => {
                        console.log('❌ Error getting session:', error);
                    });
                }
            }
        }
    });
    
    if (!adapterFound) {
        console.log('❌ No database adapter found in window object');
    }
}

// Step 3: Test Supabase connection
async function testSupabaseConnection() {
    console.log('\n🌐 STEP 3: Testing Supabase connection...');
    
    const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMTA5NzQsImV4cCI6MjA1MDg4Njk3NH0.8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';
    
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Supabase API connection successful');
            console.log('💡 Supabase service is working - issue is in app configuration');
        } else {
            console.log(`❌ Supabase API connection failed: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log('Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Supabase connection test failed:', error);
    }
}

// Step 4: Clear mock data and force real Supabase
function clearMockDataAndForceRealSupabase() {
    console.log('\n🧹 STEP 4: Clearing mock data and forcing real Supabase...');
    
    // Clear all mock data
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
    
    // Try to force real Supabase
    const possibleAdapters = [
        window.databaseAdapter,
        window.supabase,
        window.__databaseAdapter,
        window.__supabase
    ];
    
    possibleAdapters.forEach((adapter, index) => {
        if (adapter && typeof adapter === 'object') {
            if (adapter.forceRealSupabase && typeof adapter.forceRealSupabase === 'function') {
                try {
                    const success = adapter.forceRealSupabase();
                    console.log(`✅ Force real Supabase result: ${success}`);
                } catch (error) {
                    console.error('❌ Error calling forceRealSupabase:', error);
                }
            }
        }
    });
}

// Step 5: Test admin login
async function testAdminLogin() {
    console.log('\n🔐 STEP 5: Testing admin login...');
    
    const adminCredentials = {
        email: 'admin@igniterewards.com',
        password: 'admin123!'
    };
    
    console.log('📧 Attempting login with:', adminCredentials.email);
    
    // Try to access the database adapter and test login
    const possibleAdapters = [
        window.databaseAdapter,
        window.supabase,
        window.__databaseAdapter,
        window.__supabase
    ];
    
    for (const adapter of possibleAdapters) {
        if (adapter && adapter.auth && adapter.auth.signInWithPassword) {
            try {
                console.log('🔄 Attempting signInWithPassword...');
                const result = await adapter.auth.signInWithPassword(adminCredentials);
                
                if (result.data && result.data.user) {
                    console.log('✅ LOGIN SUCCESSFUL!');
                    console.log('👤 User:', result.data.user);
                    console.log('🎫 Session:', result.data.session);
                    
                    // Check if session is properly stored
                    setTimeout(() => {
                        const sessionCheck = localStorage.getItem('sb-wndswqvqogeblksrujpg-auth-token');
                        if (sessionCheck) {
                            console.log('✅ Session properly stored in localStorage');
                        } else {
                            console.log('❌ Session not stored in localStorage');
                        }
                    }, 1000);
                    
                    return result;
                } else if (result.error) {
                    console.log('❌ LOGIN FAILED:', result.error);
                } else {
                    console.log('❌ LOGIN FAILED: No user data returned');
                }
            } catch (error) {
                console.log('❌ LOGIN ERROR:', error);
            }
        }
    }
    
    console.log('❌ No suitable auth adapter found for login test');
}

// Step 6: Check for React components and auth hooks
function checkReactAuthState() {
    console.log('\n⚛️ STEP 6: Checking React auth state...');
    
    // Try to find React components in the DOM
    const reactRoot = document.querySelector('#root');
    if (reactRoot) {
        console.log('✅ React root found');
        
        // Look for auth-related elements
        const authElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"], [id*="auth"]');
        console.log('🔍 Auth-related elements found:', authElements.length);
        
        // Look for user profile or login indicators
        const userElements = document.querySelectorAll('[data-testid*="user"], [class*="user"], [id*="user"]');
        console.log('👤 User-related elements found:', userElements.length);
        
        // Check for any error messages
        const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
        console.log('⚠️ Error elements found:', errorElements.length);
        errorElements.forEach((el, index) => {
            console.log(`Error ${index + 1}:`, el.textContent);
        });
    } else {
        console.log('❌ React root not found');
    }
}

// Main diagnostic function
async function runFullDiagnostic() {
    console.log('🚀 STARTING FULL LOGIN DIAGNOSTIC...');
    console.log('=====================================');
    
    checkAuthState();
    checkDatabaseAdapter();
    await testSupabaseConnection();
    clearMockDataAndForceRealSupabase();
    checkReactAuthState();
    
    console.log('\n🎯 DIAGNOSTIC COMPLETE!');
    console.log('=====================================');
    console.log('💡 Next steps:');
    console.log('1. If mock mode was detected, try logging in again');
    console.log('2. If Supabase connection failed, check your internet connection');
    console.log('3. If login still fails, run testAdminLogin() manually');
    console.log('4. Check the browser console for any additional errors');
    
    return 'Diagnostic complete';
}

// Auto-run the diagnostic
runFullDiagnostic();

// Export functions for manual use
window.loginDiagnostic = {
    runFullDiagnostic,
    checkAuthState,
    checkDatabaseAdapter,
    testSupabaseConnection,
    clearMockDataAndForceRealSupabase,
    testAdminLogin,
    checkReactAuthState
};

console.log('\n💡 Manual functions available:');
console.log('- window.loginDiagnostic.runFullDiagnostic()');
console.log('- window.loginDiagnostic.testAdminLogin()');
console.log('- window.loginDiagnostic.clearMockDataAndForceRealSupabase()');

