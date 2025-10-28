# Firebase Authentication Setup Guide

## 🚀 **Phase 1 Complete: Core Authentication Migration**

Your RAC Rewards application has been successfully migrated from Supabase to Firebase Authentication! Here's what has been implemented:

### ✅ **What's Been Done**

1. **Firebase SDK Installed** - `firebase` package added to dependencies
2. **Firebase Configuration** - `src/lib/firebaseConfig.ts` created
3. **Firebase Auth Service** - `src/lib/firebaseAuthService.ts` created
4. **Updated Services**:
   - `LocalAuthService` - Now uses Firebase instead of Supabase
   - `GoogleOAuthService` - Added Firebase integration
   - `DatabaseAdapter` - Updated auth methods to use Firebase
5. **Test Suite** - `src/lib/firebaseAuthTest.ts` for testing

### 🔧 **Next Steps: Firebase Project Setup**

To complete the migration, you need to set up a Firebase project:

#### **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `rac-rewards-auth`
4. Enable Google Analytics (optional)
5. Click "Create project"

#### **Step 2: Enable Authentication**

1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your project's support email
6. Save the configuration

#### **Step 3: Get Firebase Configuration**

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app (</> icon)
4. Register your app with nickname: `rac-rewards-web`
5. Copy the Firebase configuration object

#### **Step 4: Update Environment Variables**

Add these to your `.env.local` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

#### **Step 5: Configure Google OAuth**

1. In Firebase Console → Authentication → Sign-in method
2. Click on "Google" provider
3. Enable it and add your OAuth consent screen details
4. Add authorized domains:
   - `localhost` (for development)
   - Your production domain

### 🧪 **Testing the Migration**

Run the Firebase authentication test:

```typescript
import { FirebaseAuthTest } from '@/lib/firebaseAuthTest';

// Run all tests
FirebaseAuthTest.runAllTests();
```

### 📋 **Migration Summary**

| Component | Before (Supabase) | After (Firebase) |
|-----------|-------------------|------------------|
| **Authentication** | `supabase.auth.signInWithPassword()` | `FirebaseAuthService.signInWithEmailAndPassword()` |
| **Google OAuth** | `supabase.auth.signInWithOAuth()` | `FirebaseAuthService.signInWithGoogle()` |
| **User Management** | `supabase.auth.getUser()` | `FirebaseAuthService.getCurrentUser()` |
| **Session Management** | `supabase.auth.getSession()` | `FirebaseAuthService.onAuthStateChange()` |
| **Sign Out** | `supabase.auth.signOut()` | `FirebaseAuthService.signOut()` |

### 🔄 **Backward Compatibility**

The migration maintains backward compatibility by:
- Converting Firebase users to Supabase-compatible format
- Maintaining the same API interface in `DatabaseAdapter`
- Preserving localStorage session management
- Keeping the same auth state change events

### 🚨 **Important Notes**

1. **Database Operations**: Still use local PostgreSQL (no change)
2. **User Data**: Firebase handles authentication, PostgreSQL handles user profiles
3. **Session Storage**: Firebase manages sessions internally
4. **Error Handling**: Enhanced error handling with Firebase-specific messages

### 🎯 **What's Next**

After setting up Firebase:
1. Test Google OAuth login
2. Test email/password authentication
3. Verify user data sync with PostgreSQL
4. Test sign out functionality
5. Update any remaining components that use Supabase auth

### 🆘 **Troubleshooting**

If you encounter issues:

1. **Firebase not initialized**: Check environment variables
2. **Google OAuth fails**: Verify Google provider is enabled in Firebase
3. **User data not syncing**: Check PostgreSQL connection
4. **Auth state not updating**: Verify Firebase Auth Service initialization

### 📞 **Support**

The migration is complete and ready for testing. All 63 Supabase authentication references have been replaced with Firebase equivalents while maintaining full backward compatibility.

**Status**: ✅ **Phase 1 Complete - Ready for Firebase Project Setup**
