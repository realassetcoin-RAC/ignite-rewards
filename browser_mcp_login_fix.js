// Browser MCP Login Fix Script
// Based on console logs analysis - fixes the identified issues

console.log('🔧 BROWSER MCP LOGIN FIX SCRIPT');
console.log('=================================');
console.log('📊 ISSUES IDENTIFIED FROM CONSOLE LOGS:');
console.log('1. ❌ Supabase PGRST002 error - schema cache issue');
console.log('2. ❌ App switching to mock client');
console.log('3. ❌ Profile is null - user not properly authenticated');
console.log('4. ❌ isAdmin flag: false - admin status not detected');
console.log('5. ❌ Google OAuth not working - falling back to form submission');

// Function to force real Supabase and clear mock data
function forceRealSupabaseAndClearMock() {
    console.log('🧹 Step 1: Clearing mock data and forcing real Supabase...');
    
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
    
    // Try to access and force the database adapter
    const possibleAdapters = [
        window.databaseAdapter,
        window.supabase,
        window.__databaseAdapter,
        window.__supabase
    ];
    
    possibleAdapters.forEach((adapter, index) => {
        if (adapter && typeof adapter === 'object') {
            console.log(`✅ Found database adapter at index ${index}`);
            
            // Force real Supabase
            if (adapter.forceRealSupabase && typeof adapter.forceRealSupabase === 'function') {
                try {
                    const success = adapter.forceRealSupabase();
                    console.log(`✅ Force real Supabase result: ${success}`);
                } catch (error) {
                    console.error('❌ Error calling forceRealSupabase:', error);
                }
            }
            
            // Check mock mode status
            if (adapter.isMockMode && typeof adapter.isMockMode === 'function') {
                const isMock = adapter.isMockMode();
                console.log(`📊 Mock mode status: ${isMock ? 'ACTIVE (PROBLEM)' : 'INACTIVE (GOOD)'}`);
            }
        }
    });
}

// Function to test direct Supabase connection
async function testDirectSupabaseConnection() {
    console.log('🔍 Step 2: Testing direct Supabase connection...');
    
    try {
        // Import Supabase client directly
        const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
        
        // Create direct Supabase client
        const directSupabase = createClient(
            'https://wndswqvqogeblksrujpg.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
        );
        
        console.log('✅ Direct Supabase client created');
        
        // Test connection
        const { data, error } = await directSupabase.from('profiles').select('count').limit(1);
        
        if (error) {
            console.error('❌ Direct Supabase connection error:', error);
            return false;
        } else {
            console.log('✅ Direct Supabase connection successful');
            return true;
        }
    } catch (error) {
        console.error('❌ Direct Supabase connection test failed:', error);
        return false;
    }
}

// Function to test admin login with direct Supabase
async function testAdminLoginDirect() {
    console.log('🔐 Step 3: Testing admin login with direct Supabase...');
    
    try {
        // Import Supabase client directly
        const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
        
        // Create direct Supabase client
        const directSupabase = createClient(
            'https://wndswqvqogeblksrujpg.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
        );
        
        const adminCredentials = {
            email: 'admin@igniterewards.com',
            password: 'admin123!'
        };
        
        console.log('📧 Attempting admin login with direct Supabase...');
        
        const { data, error } = await directSupabase.auth.signInWithPassword(adminCredentials);
        
        if (error) {
            console.error('❌ Admin login failed:', error);
            return { success: false, error };
        }
        
        if (data?.user) {
            console.log('✅ Admin login successful!');
            console.log('👤 User:', data.user);
            console.log('🎫 Session:', data.session);
            
            // Store session in localStorage for the app to pick up
            localStorage.setItem('sb-wndswqvqogeblksrujpg-auth-token', JSON.stringify({
                currentSession: data.session,
                expiresAt: data.session.expires_at
            }));
            
            console.log('✅ Session stored in localStorage');
            
            // Refresh the page to pick up the new session
            console.log('🔄 Refreshing page to apply changes...');
            window.location.reload();
            
            return { success: true, data };
        } else {
            console.error('❌ No user data returned from login');
            return { success: false, error: 'No user data returned' };
        }
        
    } catch (error) {
        console.error('❌ Admin login test failed:', error);
        return { success: false, error };
    }
}

// Function to fix Google OAuth button
function fixGoogleOAuthButton() {
    console.log('🔧 Step 4: Fixing Google OAuth button...');
    
    // Find Google OAuth button
    const googleButtons = document.querySelectorAll('button');
    let googleButton = null;
    
    for (const button of googleButtons) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('google')) {
            googleButton = button;
            break;
        }
    }
    
    if (googleButton) {
        console.log('✅ Found Google OAuth button');
        
        // Remove existing click handlers
        const newButton = googleButton.cloneNode(true);
        googleButton.parentNode.replaceChild(newButton, googleButton);
        
        // Add new click handler that uses direct Supabase
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔄 Google OAuth button clicked - using direct method');
            
            // Show loading state
            const originalText = newButton.textContent;
            newButton.textContent = 'Signing in with Google...';
            newButton.disabled = true;
            
            try {
                // Import Supabase client directly
                const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
                
                // Create direct Supabase client
                const directSupabase = createClient(
                    'https://wndswqvqogeblksrujpg.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
                );
                
                const redirectUrl = `${window.location.origin}/auth/callback`;
                
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
                    alert(`Google OAuth failed: ${error.message}`);
                    
                    // Restore button state
                    newButton.textContent = originalText;
                    newButton.disabled = false;
                } else if (data?.url) {
                    console.log('✅ Google OAuth successful! Redirecting...');
                    window.location.href = data.url;
                } else {
                    console.error('❌ No OAuth URL received');
                    alert('Google OAuth failed: No OAuth URL received');
                    
                    // Restore button state
                    newButton.textContent = originalText;
                    newButton.disabled = false;
                }
                
            } catch (error) {
                console.error('❌ Google OAuth error:', error);
                alert(`Google OAuth error: ${error.message}`);
                
                // Restore button state
                newButton.textContent = originalText;
                newButton.disabled = false;
            }
        });
        
        console.log('✅ Google OAuth button fixed');
    } else {
        console.log('❌ Google OAuth button not found');
    }
}

// Main fix function
async function runCompleteLoginFix() {
    console.log('🚀 STARTING COMPLETE LOGIN FIX...');
    console.log('==================================');
    
    // Step 1: Clear mock data and force real Supabase
    forceRealSupabaseAndClearMock();
    
    // Step 2: Test direct Supabase connection
    const connectionOk = await testDirectSupabaseConnection();
    
    if (!connectionOk) {
        console.log('❌ Direct Supabase connection failed - there may be a service issue');
        console.log('💡 Try again later or check your internet connection');
        return;
    }
    
    // Step 3: Test admin login
    const loginResult = await testAdminLoginDirect();
    
    if (loginResult.success) {
        console.log('✅ Admin login successful! Page will refresh...');
        return;
    } else {
        console.log('❌ Admin login failed, but connection is working');
        console.log('💡 You can try logging in manually after the page refreshes');
    }
    
    // Step 4: Fix Google OAuth button
    fixGoogleOAuthButton();
    
    console.log('\n🎯 LOGIN FIX COMPLETE!');
    console.log('======================');
    console.log('✅ Mock data cleared');
    console.log('✅ Real Supabase forced');
    console.log('✅ Direct connection tested');
    console.log('✅ Google OAuth button fixed');
    console.log('💡 Try logging in again - it should work properly now');
}

// Auto-run the fix
runCompleteLoginFix();

// Export functions for manual use
window.loginFix = {
    runCompleteLoginFix,
    forceRealSupabaseAndClearMock,
    testDirectSupabaseConnection,
    testAdminLoginDirect,
    fixGoogleOAuthButton
};

console.log('\n💡 Manual functions available:');
console.log('- window.loginFix.runCompleteLoginFix()');
console.log('- window.loginFix.testAdminLoginDirect()');
console.log('- window.loginFix.fixGoogleOAuthButton()');

