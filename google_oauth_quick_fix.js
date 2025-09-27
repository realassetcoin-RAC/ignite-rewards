// Quick Google OAuth Fix - Run this in browser console
// This bypasses the mock database adapter and uses direct Supabase client

console.log('🔧 QUICK GOOGLE OAUTH FIX');

// Clear any mock data that might interfere
localStorage.removeItem('mock_oauth_user');
sessionStorage.clear();

// Create direct Supabase client
const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
const directSupabase = createClient(
    'https://wndswqvqogeblksrujpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
);

// Test Google OAuth
const redirectUrl = `${window.location.origin}/auth/callback`;
console.log('🔗 Redirect URL:', redirectUrl);

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
    console.log('💡 Try running the full google_oauth_fix.js script for more detailed diagnostics');
} else if (data?.url) {
    console.log('✅ Google OAuth successful! Redirecting...');
    window.location.href = data.url;
} else {
    console.log('❌ No OAuth URL received');
}

