# Google OAuth Quick Setup

## Current Status
The Google OAuth button is now clickable, but you need to configure the Google Client ID for full functionality.

## Quick Fix Options

### Option 1: Use Test Mode (Immediate)
- **Hold Ctrl and click** the "Google" button
- This will create a mock user for testing
- No Google OAuth configuration needed

### Option 2: Configure Google OAuth (Recommended)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Enable "Google+ API" and "Google Identity"

3. **Create OAuth Credentials**
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
     http://localhost:3000/auth/callback
     http://localhost:8084/auth/callback
     ```

5. **Create Environment File**
   - Create a `.env` file in the project root
   - Add your Google Client ID:
     ```env
     VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
     VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
     ```

6. **Restart the Application**
   - Stop the dev server (Ctrl+C)
   - Run `npm run dev` or `bun dev` again

## What Changed
- ✅ Google OAuth button is now clickable
- ✅ Test mode works with Ctrl+Click
- ✅ Better error messages for configuration issues
- ✅ Button shows "Google" instead of "Continue with Google"

## Testing
1. **Test Mode**: Hold Ctrl and click the Google button
2. **Real OAuth**: Configure the Client ID and click normally

The button will now work in both modes!


