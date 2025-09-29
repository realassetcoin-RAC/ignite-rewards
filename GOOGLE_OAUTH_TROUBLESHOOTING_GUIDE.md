# Google OAuth Troubleshooting Guide

## Current Issue Analysis

Based on the console errors, the Google OAuth issue is caused by:

1. **503 Service Unavailable** errors from Supabase API calls
2. **PGRST002** errors indicating database schema cache issues
3. **Authentication callback** problems

## Root Causes

### 1. Supabase Service Unavailability (503 Errors)
- The Supabase service is experiencing downtime or rate limiting
- Database schema cache is not accessible
- Network connectivity issues

### 2. OAuth Configuration Issues
- Google OAuth provider may not be properly configured in Supabase
- Redirect URLs may not be correctly set up
- Google Cloud Console OAuth credentials may be missing or incorrect

## Solutions Implemented

### 1. Enhanced OAuth Debugging
- Created `GoogleOAuthButton` component with built-in debugging
- Added comprehensive error handling and user feedback
- Implemented OAuth configuration diagnostics

### 2. Improved Error Handling
- Enhanced database adapter to handle 503 errors gracefully
- Added fallback mechanisms for service unavailability
- Implemented mock OAuth flow for development

### 3. Better User Experience
- Clear error messages for OAuth failures
- Debug information available to users
- Fallback authentication methods

## Manual Configuration Steps

### 1. Supabase Dashboard Configuration

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `wndswqvqogeblksrujpg`

2. **Configure Authentication Providers**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add redirect URLs:
     - `http://localhost:8084/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)

3. **Get Google OAuth Credentials**
   - Go to Google Cloud Console: https://console.cloud.google.com/
   - Create or select a project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized origins:
     - `http://localhost:8084`
     - `https://yourdomain.com`

### 2. Environment Variables

Ensure these environment variables are set:

```env
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA
VITE_ENABLE_MOCK_AUTH=false
```

### 3. Testing OAuth Configuration

1. **Use the Debug Feature**
   - Click "Debug OAuth Configuration" button in the auth modal
   - Review the diagnostic information
   - Check for configuration issues

2. **Test OAuth Flow**
   - Try signing in with Google
   - Check browser console for errors
   - Verify redirect URLs are working

## Troubleshooting Steps

### Step 1: Check Supabase Service Status
```bash
# Test Supabase connection
curl -I https://wndswqvqogeblksrujpg.supabase.co/rest/v1/
```

### Step 2: Verify OAuth Configuration
1. Open browser developer tools
2. Go to the auth modal
3. Click "Debug OAuth Configuration"
4. Review the diagnostic information

### Step 3: Test OAuth Flow
1. Try signing in with Google
2. Check for redirect to Google OAuth
3. Verify callback URL handling

### Step 4: Check Network Requests
1. Open Network tab in developer tools
2. Try OAuth sign-in
3. Look for failed requests (503 errors)
4. Check for CORS issues

## Common Issues and Solutions

### Issue 1: "Provider is not enabled"
**Solution**: Enable Google provider in Supabase dashboard

### Issue 2: "Redirect URI mismatch"
**Solution**: Add correct redirect URLs in both Supabase and Google Cloud Console

### Issue 3: "503 Service Unavailable"
**Solution**: 
- Check Supabase service status
- Use mock authentication for development
- Retry after service recovery

### Issue 4: "PGRST002 Database schema cache"
**Solution**:
- Wait for Supabase service recovery
- Use mock client as fallback
- Check database connection

## Development Mode

For development, the application now includes:

1. **Mock OAuth Flow**: Simulates Google OAuth for testing
2. **Fallback Authentication**: Works even when Supabase is unavailable
3. **Debug Information**: Detailed OAuth configuration diagnostics

## Production Deployment

For production deployment:

1. **Configure Production URLs**: Update redirect URLs in both Supabase and Google Cloud Console
2. **Set Production Environment**: Ensure `VITE_ENABLE_MOCK_AUTH=false`
3. **Test OAuth Flow**: Verify Google OAuth works in production environment
4. **Monitor Errors**: Set up error monitoring for OAuth failures

## Support

If issues persist:

1. Check Supabase service status: https://status.supabase.com/
2. Review Google Cloud Console OAuth configuration
3. Test with the debug OAuth configuration tool
4. Check browser console for detailed error messages

## Files Modified

- `src/components/GoogleOAuthButton.tsx` - New OAuth component with debugging
- `src/lib/oauthDebugger.ts` - OAuth diagnostic utilities
- `src/components/AuthModal.tsx` - Updated to use new OAuth component
- `src/lib/databaseAdapter.ts` - Enhanced error handling for 503 errors

## Testing

To test the OAuth fixes:

1. Start the development server: `npm run dev`
2. Open the application: http://localhost:8084
3. Click "Sign In" or "Sign Up"
4. Try Google OAuth with debug information
5. Check console for any remaining errors
