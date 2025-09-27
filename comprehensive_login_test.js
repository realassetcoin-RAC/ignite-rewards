// Comprehensive Login Test and Fix Script
// This script tests both email and Google login functionality

console.log('🔧 COMPREHENSIVE LOGIN TEST AND FIX');
console.log('====================================');

// Test credentials
const testCredentials = {
    email: 'admin@igniterewards.com',
    password: 'admin123!'
};

// Step 1: Check current authentication state
function checkCurrentAuthState() {
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
                    console.log('💡 This is why login is not working');
                }
            }
            
            // Check auth methods
            if (adapter.auth) {
                console.log('✅ Auth methods available');
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
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';
    
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

// Step 5: Test email login
async function testEmailLogin() {
    console.log('\n📧 STEP 5: Testing email login...');
    
    console.log('📧 Attempting login with:', testCredentials.email);
    
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
                const result = await adapter.auth.signInWithPassword(testCredentials);
                
                if (result.data && result.data.user) {
                    console.log('✅ EMAIL LOGIN SUCCESSFUL!');
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
                    console.log('❌ EMAIL LOGIN FAILED:', result.error);
                } else {
                    console.log('❌ EMAIL LOGIN FAILED: No user data returned');
                }
            } catch (error) {
                console.log('❌ EMAIL LOGIN ERROR:', error);
            }
        }
    }
    
    console.log('❌ No suitable auth adapter found for email login test');
}

// Step 6: Test Google OAuth
async function testGoogleOAuth() {
    console.log('\n🔐 STEP 6: Testing Google OAuth...');
    
    try {
        // Import Supabase client directly
        const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
        
        // Create direct Supabase client (bypassing database adapter)
        const directSupabase = createClient(
            'https://wndswqvqogeblksrujpg.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
        );
        
        console.log('✅ Direct Supabase client created for OAuth test');
        
        // Test OAuth configuration
        const redirectUrl = `${window.location.origin}/auth/callback`;
        console.log('📋 OAuth configuration:', {
            provider: 'google',
            redirectTo: redirectUrl,
            currentOrigin: window.location.origin
        });
        
        // Attempt OAuth sign-in
        const { data, error } = await directSupabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });
        
        if (error) {
            console.error('❌ Google OAuth error:', error);
            console.log('💡 Error details:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText
            });
            
            // Check for common OAuth errors
            if (error.message.includes('redirect_uri_mismatch')) {
                console.log('🔧 FIX: Redirect URI mismatch - check Supabase configuration');
                console.log('📋 Required redirect URI: https://wndswqvqogeblksrujpg.supabase.co/auth/v1/callback');
            } else if (error.message.includes('invalid_client')) {
                console.log('🔧 FIX: Invalid client - check Google OAuth credentials in Supabase');
            } else if (error.message.includes('access_denied')) {
                console.log('🔧 FIX: Access denied - check Google OAuth permissions');
            }
            
            return { success: false, error };
        }
        
        if (data?.url) {
            console.log('✅ Google OAuth URL generated successfully');
            console.log('🔗 OAuth URL:', data.url);
            
            // Ask user if they want to redirect
            const shouldRedirect = confirm('Google OAuth is working! Do you want to redirect to Google OAuth now?');
            if (shouldRedirect) {
                console.log('🚀 Redirecting to Google OAuth...');
                window.location.href = data.url;
            }
            
            return { success: true, data };
        } else {
            console.error('❌ No OAuth URL received');
            return { success: false, error: 'No OAuth URL received' };
        }
        
    } catch (error) {
        console.error('❌ Google OAuth test failed:', error);
        return { success: false, error };
    }
}

// Step 7: Fix login buttons
function fixLoginButtons() {
    console.log('\n🔧 STEP 7: Fixing login buttons...');
    
    // Find all buttons that might be login buttons
    const buttons = document.querySelectorAll('button');
    let loginButtons = [];
    
    buttons.forEach(button => {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('sign in') || text.includes('login') || text.includes('google')) {
            loginButtons.push(button);
        }
    });
    
    console.log(`🔍 Found ${loginButtons.length} potential login buttons`);
    
    loginButtons.forEach((button, index) => {
        console.log(`Button ${index + 1}: "${button.textContent}"`);
        
        // Add click handler that forces real Supabase
        button.addEventListener('click', async (e) => {
            console.log(`🔄 Login button ${index + 1} clicked`);
            
            // Clear mock data first
            clearMockDataAndForceRealSupabase();
            
            // Wait a bit for the adapter to be fixed
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('💡 Try logging in again - the adapter should now be in real mode');
        });
    });
}

// Step 8: Check for error messages
function checkForErrors() {
    console.log('\n⚠️ STEP 8: Checking for error messages...');
    
    // Look for any error messages in the DOM
    const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="warning"]');
    console.log(`🔍 Found ${errorElements.length} error elements`);
    
    errorElements.forEach((el, index) => {
        const text = el.textContent?.trim();
        if (text) {
            console.log(`Error ${index + 1}: ${text}`);
        }
    });
    
    // Check console for errors
    console.log('🔍 Check the browser console for any JavaScript errors');
}

// Main test function
async function runComprehensiveLoginTest() {
    console.log('🚀 STARTING COMPREHENSIVE LOGIN TEST...');
    console.log('========================================');
    
    checkCurrentAuthState();
    checkDatabaseAdapter();
    await testSupabaseConnection();
    clearMockDataAndForceRealSupabase();
    fixLoginButtons();
    checkForErrors();
    
    console.log('\n🎯 COMPREHENSIVE TEST COMPLETE!');
    console.log('================================');
    console.log('💡 Next steps:');
    console.log('1. Try clicking the login buttons again');
    console.log('2. Run testEmailLogin() to test email login');
    console.log('3. Run testGoogleOAuth() to test Google OAuth');
    console.log('4. Check the browser console for any additional errors');
    
    return 'Comprehensive login test complete';
}

// Auto-run the test
runComprehensiveLoginTest();

// Export functions for manual use
window.loginTest = {
    runComprehensiveLoginTest,
    testEmailLogin,
    testGoogleOAuth,
    clearMockDataAndForceRealSupabase,
    checkCurrentAuthState,
    checkDatabaseAdapter,
    testSupabaseConnection,
    fixLoginButtons,
    checkForErrors
};

console.log('\n💡 Manual functions available:');
console.log('- window.loginTest.testEmailLogin() - Test email login');
console.log('- window.loginTest.testGoogleOAuth() - Test Google OAuth');
console.log('- window.loginTest.clearMockDataAndForceRealSupabase() - Force real Supabase');
console.log('- window.loginTest.runComprehensiveLoginTest() - Run full test again');

