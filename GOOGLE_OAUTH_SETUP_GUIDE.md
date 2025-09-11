# Google OAuth Setup Guide

## 🔧 Required Configuration Steps

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project or create a new one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity" API

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"

4. **Configure Authorized URLs**
   - **Authorized JavaScript origins:**
     ```
     http://localhost:8084
     http://localhost:3000
     https://your-domain.com
     ```
   - **Authorized redirect URIs:**
     ```
     https://wndswqvqogeblksrujpg.supabase.co/auth/v1/callback
     ```

### 2. Supabase Configuration

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `wndswqvqogeblksrujpg`

2. **Configure Authentication Providers**
   - Navigate to "Authentication" > "Providers"
   - Find "Google" and click "Enable"
   - Add your Google OAuth credentials:
     - **Client ID**: From Google Cloud Console
     - **Client Secret**: From Google Cloud Console

3. **Configure URL Settings**
   - Go to "Authentication" > "URL Configuration"
   - **Site URL**: `http://localhost:8084` (for development)
   - **Redirect URLs**: Add these URLs:
     ```
     http://localhost:8084/**
     http://localhost:3000/**
     https://your-domain.com/**
     ```

### 3. Environment Variables (Optional)

Create a `.env` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA

# Google OAuth (if using custom implementation)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🧪 Testing the Setup

### 1. Test OAuth Configuration
Run the test script:
```bash
node test-google-oauth.js
```

### 2. Test in Browser
1. Open the application: `http://localhost:8084`
2. Click "Sign In" or "Sign Up"
3. Click "Continue with Google"
4. Check browser console for debugging information

### 3. Expected Behavior
- ✅ Google OAuth popup/redirect should appear
- ✅ After authentication, user should be redirected to `/auth/callback`
- ✅ User should then be redirected to appropriate dashboard
- ✅ Console should show detailed logging of the OAuth flow

## 🐛 Troubleshooting

### Common Issues

1. **"Configuration Error" Message**
   - Check if Google provider is enabled in Supabase
   - Verify Client ID and Secret are correct
   - Ensure redirect URLs are properly configured

2. **"Access Denied" Error**
   - Check authorized JavaScript origins in Google Console
   - Verify the domain is added to authorized origins

3. **Redirect Loop**
   - Check redirect URLs in Supabase configuration
   - Ensure `/auth/callback` route is properly set up

4. **Session Not Created**
   - Check if `detectSessionInUrl` is set to `true` in Supabase client
   - Verify OAuth callback is being processed correctly

### Debug Information

The application now includes comprehensive logging. Check the browser console for:
- 🚀 OAuth initiation logs
- 📋 Configuration details
- ✅ Success messages
- ❌ Error details

## 📞 Support

If you continue to experience issues:

1. Check the browser console for error messages
2. Verify all URLs are correctly configured
3. Ensure Google OAuth credentials are valid
4. Test with a fresh browser session (incognito mode)

## 🔄 Code Changes Made

### Files Modified:
- `src/integrations/supabase/client.ts` - Enabled session detection
- `src/components/AuthModal.tsx` - Added debugging and error handling
- `src/pages/AuthCallback.tsx` - Improved callback processing

### Key Changes:
- ✅ `detectSessionInUrl: true` in Supabase client
- ✅ Comprehensive OAuth debugging
- ✅ Better error handling and user feedback
- ✅ Improved callback processing with timeout
