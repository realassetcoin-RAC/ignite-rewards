# Authentication Setup Guide

This guide will help you fix the connect wallet and Google signin issues in your application.

## Issues Fixed

### 1. Wallet Connection Issues
- ✅ Installed missing Solana wallet adapter packages
- ✅ Added proper error handling for wallet connection
- ✅ Added wallet adapter CSS imports
- ✅ Improved loading states and user feedback

### 2. Google Signin Issues
- ✅ Enhanced error handling for OAuth flow
- ✅ Added proper redirect URL configuration
- ✅ Improved loading states and error messages

## Required Configuration

### Google OAuth Setup

1. **Google Cloud Console Configuration:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" > "Credentials"
   - Create or select your OAuth 2.0 Client ID
   - Add these URLs to **Authorized JavaScript origins:**
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - Add these URLs to **Authorized redirect URIs:**
     - `https://wndswqvqogeblksrujpg.supabase.co/auth/v1/callback`

2. **Supabase Configuration:**
   - Go to your Supabase Dashboard
   - Navigate to "Authentication" > "Providers"
   - Enable Google provider
   - Add your Google Client ID and Client Secret
   - Go to "Authentication" > "URL Configuration"
   - Set **Site URL** to your production domain
   - Add **Redirect URLs:**
     - `http://localhost:3000/**` (for development)
     - `https://your-domain.com/**` (for production)

### Wallet Setup

1. **User Requirements:**
   - Users need to install Phantom or Solflare wallet browser extension
   - The wallet extension must be unlocked and ready to connect

2. **Network Configuration:**
   - The app is configured to use Solana Devnet
   - Users can switch to Mainnet in their wallet settings if needed

## Testing the Fixes

### Test Wallet Connection:
1. Install Phantom or Solflare wallet extension
2. Open the application
3. Click "Connect Solana Wallet"
4. Approve the connection in your wallet
5. You should see a success message and be redirected to the user dashboard

### Test Google Signin:
1. Click "Continue with Google"
2. Complete the Google OAuth flow
3. You should be redirected back to the application
4. Check that you're logged in and can access protected routes

## Troubleshooting

### Wallet Connection Issues:
- Ensure wallet extension is installed and unlocked
- Check browser console for error messages
- Try refreshing the page and connecting again
- Make sure you're on a supported browser (Chrome, Firefox, Safari)

### Google Signin Issues:
- Verify Google Cloud Console configuration
- Check Supabase redirect URL settings
- Ensure Site URL matches your domain
- Check browser console for OAuth errors

### Common Error Messages:
- "Wallet Not Available": Install Phantom or Solflare extension
- "Google OAuth is not properly configured": Check Supabase and Google Cloud settings
- "Failed to connect wallet": Try refreshing and reconnecting

## Environment Variables

Make sure these are set in your `.env` file:
```
VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Support

If you continue to experience issues:
1. Check the browser console for error messages
2. Verify all configuration steps above
3. Test with a fresh browser session
4. Ensure all dependencies are properly installed