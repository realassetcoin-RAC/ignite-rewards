// Google OAuth Diagnostic Script
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wndswqvqogeblksrujpg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function diagnoseGoogleOAuth() {
  console.log('🔍 Google OAuth Diagnostic Tool');
  console.log('================================');
  
  // Test 1: Check Supabase connection
  console.log('\n1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
      console.log('   Current session:', data.session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
  }

  // Test 2: Check Google OAuth configuration
  console.log('\n2. Testing Google OAuth configuration...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:8084/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('❌ Google OAuth configuration error:');
      console.error('   Message:', error.message);
      console.error('   Status:', error.status);
      console.error('   StatusText:', error.statusText);
      
      // Provide specific guidance based on error
      if (error.message.includes('provider')) {
        console.log('\n💡 Suggestion: Google provider may not be enabled in Supabase');
        console.log('   Go to: Supabase Dashboard > Authentication > Providers > Google');
        console.log('   Make sure Google is enabled and configured with valid credentials');
      } else if (error.message.includes('redirect')) {
        console.log('\n💡 Suggestion: Check redirect URL configuration');
        console.log('   Verify redirect URLs in both Google Console and Supabase');
      }
    } else if (data?.url) {
      console.log('✅ Google OAuth configuration successful');
      console.log('   OAuth URL generated:', data.url.substring(0, 100) + '...');
    } else {
      console.log('⚠️ No OAuth URL generated - configuration may be incomplete');
    }
  } catch (err) {
    console.error('❌ Unexpected error during OAuth test:', err.message);
  }

  // Test 3: Check current environment
  console.log('\n3. Environment check...');
  console.log('   Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A (Node.js)');
  console.log('   Supabase URL:', SUPABASE_URL);
  console.log('   Supabase Key:', SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + '...');

  // Test 4: Check for common issues
  console.log('\n4. Common issues check...');
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('⚠️ Running in Node.js environment - some tests may not work');
    console.log('   Run this script in a browser console for full diagnostics');
  }

  console.log('\n📋 Diagnostic Summary:');
  console.log('======================');
  console.log('If you see errors above, follow these steps:');
  console.log('1. Check Google Cloud Console configuration');
  console.log('2. Verify Supabase Google provider is enabled');
  console.log('3. Ensure redirect URLs are correctly configured');
  console.log('4. Check browser console for additional errors');
  console.log('\nFor detailed setup instructions, see: GOOGLE_OAUTH_SETUP_GUIDE.md');
}

// Run diagnostics
diagnoseGoogleOAuth().catch(console.error);
