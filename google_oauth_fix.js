// Google OAuth Fix Script
// This script fixes Google OAuth sign-in issues by bypassing the mock database adapter

console.log('🔧 GOOGLE OAUTH FIX SCRIPT');
console.log('==========================');

// Function to test Google OAuth directly
async function testGoogleOAuth() {
    console.log('🔍 Testing Google OAuth directly...');
    
    try {
        // Import Supabase client directly
        const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
        
        // Create direct Supabase client (bypassing database adapter)
        const directSupabase = createClient(
            'https://wndswqvqogeblksrujpg.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
        );
        
        console.log('✅ Direct Supabase client created');
        
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
            
            // Redirect to Google OAuth
            console.log('🚀 Redirecting to Google OAuth...');
            window.location.href = data.url;
            
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

// Function to fix the Google OAuth button
function fixGoogleOAuthButton() {
    console.log('🔧 Fixing Google OAuth button...');
    
    // Find the Google OAuth button
    const googleButtons = document.querySelectorAll('button');
    let googleButton = null;
    
    for (const button of googleButtons) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('google') || text.includes('sign in with google')) {
            googleButton = button;
            break;
        }
    }
    
    if (googleButton) {
        console.log('✅ Found Google OAuth button');
        
        // Remove existing click handlers
        const newButton = googleButton.cloneNode(true);
        googleButton.parentNode.replaceChild(newButton, googleButton);
        
        // Add new click handler that bypasses the database adapter
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔄 Google OAuth button clicked - using direct method');
            
            // Show loading state
            const originalText = newButton.textContent;
            newButton.textContent = 'Signing in with Google...';
            newButton.disabled = true;
            
            try {
                const result = await testGoogleOAuth();
                
                if (!result.success) {
                    console.error('❌ Google OAuth failed:', result.error);
                    alert(`Google OAuth failed: ${result.error?.message || 'Unknown error'}`);
                    
                    // Restore button state
                    newButton.textContent = originalText;
                    newButton.disabled = false;
                }
                // If successful, the page will redirect
                
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

// Function to check OAuth configuration
function checkOAuthConfiguration() {
    console.log('🔍 Checking OAuth configuration...');
    
    // Check current URL
    console.log('📋 Current URL:', window.location.href);
    console.log('📋 Origin:', window.location.origin);
    
    // Check for OAuth-related elements
    const oauthElements = document.querySelectorAll('[data-oauth], [class*="oauth"], [id*="oauth"]');
    console.log('🔍 OAuth elements found:', oauthElements.length);
    
    // Check for Google-related elements
    const googleElements = document.querySelectorAll('[class*="google"], [id*="google"]');
    console.log('🔍 Google elements found:', googleElements.length);
    
    // Check for any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
    console.log('⚠️ Error elements found:', errorElements.length);
    errorElements.forEach((el, index) => {
        console.log(`Error ${index + 1}:`, el.textContent);
    });
}

// Function to clear OAuth-related cache
function clearOAuthCache() {
    console.log('🧹 Clearing OAuth-related cache...');
    
    // Clear localStorage items that might interfere with OAuth
    const oauthKeys = [
        'supabase.auth.token',
        'sb-wndswqvqogeblksrujpg-auth-token',
        'google_oauth_state',
        'oauth_state',
        'auth_callback_data'
    ];
    
    oauthKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`✅ Removed ${key} from localStorage`);
        }
    });
    
    // Clear session storage
    sessionStorage.clear();
    console.log('✅ Cleared session storage');
    
    // Clear any cached OAuth data
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                if (name.includes('oauth') || name.includes('auth')) {
                    caches.delete(name);
                    console.log(`✅ Cleared cache: ${name}`);
                }
            });
        });
    }
}

// Main fix function
async function fixGoogleOAuth() {
    console.log('🚀 STARTING GOOGLE OAUTH FIX...');
    console.log('================================');
    
    // Step 1: Check current configuration
    checkOAuthConfiguration();
    
    // Step 2: Clear OAuth cache
    clearOAuthCache();
    
    // Step 3: Fix the Google OAuth button
    fixGoogleOAuthButton();
    
    // Step 4: Test OAuth (optional - will redirect if successful)
    console.log('\n💡 Google OAuth fix complete!');
    console.log('📋 Next steps:');
    console.log('1. Try clicking the Google sign-in button again');
    console.log('2. If it still doesn\'t work, run testGoogleOAuth() manually');
    console.log('3. Check the browser console for any error messages');
    
    return 'Google OAuth fix complete';
}

// Auto-run the fix
fixGoogleOAuth();

// Export functions for manual use
window.googleOAuthFix = {
    fixGoogleOAuth,
    testGoogleOAuth,
    fixGoogleOAuthButton,
    checkOAuthConfiguration,
    clearOAuthCache
};

console.log('\n💡 Manual functions available:');
console.log('- window.googleOAuthFix.testGoogleOAuth() - Test OAuth directly');
console.log('- window.googleOAuthFix.fixGoogleOAuthButton() - Fix the button');
console.log('- window.googleOAuthFix.clearOAuthCache() - Clear OAuth cache');

