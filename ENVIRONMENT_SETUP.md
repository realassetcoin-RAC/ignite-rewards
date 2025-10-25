# Environment Setup for Google OAuth

## 📋 **Required Environment Variables**

Create a `.env` file in your project root with the following variables:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Existing Supabase Configuration (already configured)
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA
```

## 🔧 **How to Get Google OAuth Credentials**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Enable "Google+ API" and "Google Identity"

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
     ```
   - **Authorized redirect URIs**:
     ```
     https://wndswqvqogeblksrujpg.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     http://localhost:8084/auth/callback
     ```

5. **Copy Credentials**
   - Copy the **Client ID** to `VITE_GOOGLE_CLIENT_ID`
   - Copy the **Client Secret** to `VITE_GOOGLE_CLIENT_SECRET`

## 🚀 **Quick Setup Commands**

```bash
# 1. Create .env file
cp .env.example .env

# 2. Edit .env file with your Google OAuth credentials
# Replace the placeholder values with your actual credentials

# 3. Restart the development server
npm run dev
```

## ✅ **Verification**

After setting up the environment variables:

1. **Check Configuration**
   - The OAuth test panel will show configuration status
   - Green indicators mean everything is configured correctly

2. **Test OAuth Flow**
   - Use the OAuth test panel to test both Supabase and direct OAuth
   - Verify that users can sign in with Google

3. **Check Console Logs**
   - Look for "Google OAuth service initialized successfully"
   - No error messages about missing Client ID

## 🔍 **Troubleshooting**

### **"Client ID not configured"**
- Check that `VITE_GOOGLE_CLIENT_ID` is set in your `.env` file
- Restart the development server after adding environment variables
- Verify the Client ID is correct (no extra spaces or characters)

### **"Invalid redirect URI"**
- Ensure redirect URIs in Google Console match exactly
- Check that `VITE_GOOGLE_REDIRECT_URI` matches your current domain
- No trailing slashes in the URIs

### **"OAuth consent screen not configured"**
- Go to Google Console > "OAuth consent screen"
- Configure the consent screen with required information
- Add your email as a test user if in testing mode

## 📱 **Production Setup**

For production deployment:

1. **Update Google Console**
   - Add production domain to authorized origins
   - Add production redirect URIs

2. **Update Environment Variables**
   - Set production `VITE_GOOGLE_REDIRECT_URI`
   - Use production Supabase settings

3. **Test in Production**
   - Verify OAuth flow works in production
   - Check that users are created correctly
   - Monitor for any errors
