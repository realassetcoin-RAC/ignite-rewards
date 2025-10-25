# Google OAuth Integration Setup Guide

## 🎯 **Overview**

This guide will help you set up Google OAuth authentication for the RAC Rewards application. The integration supports both Supabase-managed OAuth and direct Google Identity Services.

## 🔧 **Setup Options**

### **Option 1: Supabase OAuth (Recommended)**
- Uses Supabase's built-in OAuth handling
- Simpler setup and maintenance
- Automatic user profile creation
- Built-in security features

### **Option 2: Direct Google OAuth**
- Direct integration with Google Identity Services
- More control over the OAuth flow
- Requires additional configuration
- Better for custom implementations

## 📋 **Prerequisites**

1. **Google Cloud Console Account**
2. **Supabase Project** (for Option 1)
3. **Domain/URL** for redirect configuration

## 🚀 **Setup Instructions**

### **Step 1: Google Cloud Console Configuration**

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select or create a project

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity" if available

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"

4. **Configure OAuth Client**
   - **Name**: RAC Rewards OAuth Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://localhost:8084
     https://your-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://wndswqvqogeblksrujpg.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     http://localhost:8084/auth/callback
     https://your-domain.com/auth/callback
     ```

5. **Save Credentials**
   - Copy the **Client ID** and **Client Secret**
   - You'll need these for the next steps

### **Step 2: Supabase Configuration (Option 1)**

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `wndswqvqogeblksrujpg`

2. **Configure Authentication Providers**
   - Go to "Authentication" > "Providers"
   - Find "Google" and click "Enable"
   - Enter your Google OAuth credentials:
     - **Client ID**: (from Google Cloud Console)
     - **Client Secret**: (from Google Cloud Console)

3. **Configure URL Settings**
   - Go to "Authentication" > "URL Configuration"
   - Set **Site URL**: `https://your-domain.com`
   - Add **Redirect URLs**:
     ```
     http://localhost:3000/**
     http://localhost:8084/**
     https://your-domain.com/**
     ```

### **Step 3: Environment Configuration**

1. **Create/Update `.env` file**
   ```env
   # Google OAuth Configuration
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   
   # Supabase Configuration (already configured)
   VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA
   ```

2. **Update `src/config/environment.ts`**
   ```typescript
   export const environment = {
     // ... existing config
     google: {
       clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
       clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
     }
   };
   ```

## 🧪 **Testing the Integration**

### **Test Supabase OAuth (Option 1)**
1. Start the application: `npm run dev`
2. Navigate to the login page
3. Click "Continue with Google"
4. Complete the OAuth flow
5. Verify user is created in Supabase

### **Test Direct OAuth (Option 2)**
1. Set `useDirectOAuth={true}` in GoogleOAuthButton
2. Ensure Google Client ID is configured
3. Test the direct OAuth flow

## 🔍 **Troubleshooting**

### **Common Issues**

1. **"Invalid redirect URI"**
   - Check that redirect URIs in Google Console match exactly
   - Ensure no trailing slashes or extra characters

2. **"Client ID not found"**
   - Verify VITE_GOOGLE_CLIENT_ID is set correctly
   - Check that the Client ID is from the correct project

3. **"OAuth consent screen not configured"**
   - Go to Google Console > "OAuth consent screen"
   - Configure the consent screen with required information

4. **"Domain not verified"**
   - Add your domain to Google Console
   - Complete domain verification process

### **Debug Mode**

Enable debug logging by setting:
```env
VITE_APP_DEBUG=true
```

This will show detailed OAuth flow information in the console.

## 📱 **Mobile Considerations**

For mobile applications, you may need to:
1. Add mobile-specific redirect URIs
2. Configure deep linking
3. Handle OAuth in WebView vs. external browser

## 🔒 **Security Best Practices**

1. **Never expose Client Secret** in frontend code
2. **Use HTTPS** in production
3. **Validate redirect URIs** on the server
4. **Implement proper session management**
5. **Use secure cookie settings**

## 📊 **Monitoring and Analytics**

1. **Google Cloud Console**
   - Monitor OAuth usage
   - Check for errors and issues
   - Review consent screen analytics

2. **Supabase Dashboard**
   - Monitor authentication events
   - Check user creation and login patterns
   - Review security logs

## 🚀 **Production Deployment**

1. **Update OAuth Configuration**
   - Add production domain to authorized origins
   - Update redirect URIs for production
   - Configure production Supabase settings

2. **Environment Variables**
   - Set production environment variables
   - Use secure secret management
   - Enable production debugging if needed

3. **Testing**
   - Test OAuth flow in production
   - Verify user creation and login
   - Check error handling and fallbacks

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase authentication logs
3. Verify Google Cloud Console configuration
4. Test with different browsers/incognito mode

## ✅ **Verification Checklist**

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials configured
- [ ] Redirect URIs added correctly
- [ ] Supabase Google provider enabled
- [ ] Environment variables set
- [ ] OAuth flow tested successfully
- [ ] User creation verified
- [ ] Error handling tested
- [ ] Production configuration ready
