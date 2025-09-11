// Debug script to test Google OAuth configuration
// Run this in the browser console on your app

console.log('🔍 Google OAuth Debug Script');
console.log('============================');

// Check if Supabase client is available
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client found');
  
  // Test getting current session
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('📋 Current session:', { data: !!data?.session, error });
  });
  
  // Test OAuth configuration
  console.log('🧪 Testing Google OAuth configuration...');
  
  window.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  }).then(({ data, error }) => {
    console.log('📋 Google OAuth test result:', { 
      hasUrl: !!data?.url, 
      error: error?.message || 'No error' 
    });
    
    if (error) {
      console.error('❌ Google OAuth Error Details:', error);
      
      // Provide specific guidance based on error
      if (error.message?.includes('provider is not enabled')) {
        console.log('💡 Solution: Enable Google provider in Supabase Dashboard > Authentication > Providers');
      } else if (error.message?.includes('Invalid client')) {
        console.log('💡 Solution: Check Google OAuth credentials in Supabase Dashboard');
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        console.log('💡 Solution: Add redirect URI to Google Console: https://wndswqvqogeblksrujpg.supabase.co/auth/v1/callback');
      }
    } else if (data?.url) {
      console.log('✅ Google OAuth URL generated successfully');
      console.log('🔗 OAuth URL:', data.url);
    }
  });
  
} else {
  console.log('❌ Supabase client not found');
  console.log('💡 Make sure you run this script on your app page');
}

console.log('============================');
console.log('📝 Instructions:');
console.log('1. Open your app in browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Paste and run this script');
console.log('5. Check the output for any errors');
