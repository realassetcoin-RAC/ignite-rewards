# 🧪 Google Authentication Testing Guide

## 🚀 **Quick Start Testing**

### **Method 1: Direct App Testing (Recommended)**

1. **Start the development server:**
   ```bash
   bun dev
   # or
   npm run dev
   ```

2. **Open your browser** and navigate to:
   - `http://localhost:3000` (if using port 3000)
   - `http://localhost:8084` (if using port 8084)

3. **Test the Google Authentication:**
   - Click the **Sign In** button to open the login popup
   - **Hold Ctrl and click** the **"Google"** button
   - Watch for the success message and user creation

### **Method 2: Standalone Test Page**

1. **Open the test file:**
   - Open `test-google-auth.html` in your browser
   - This provides a dedicated testing interface

2. **Run tests:**
   - Click "Test Mock Google Auth" to simulate authentication
   - Click "Inspect Session Data" to see stored data
   - Click "Check Environment" to verify configuration

## 🔍 **What to Look For**

### **Successful Test Indicators:**

1. **Visual Feedback:**
   - ✅ Success toast message appears
   - ✅ User is redirected to authenticated state
   - ✅ Google button shows loading state briefly

2. **Console Logs:**
   - Look for: `"Test mode detected, using mock authentication"`
   - Look for: `"Mock authentication successful"`

3. **Browser Storage:**
   - Check localStorage for:
     - `google_user` - Mock user data
     - `google_access_token` - Mock access token
     - `auth_session` - Complete session object
     - `auth_user` - User profile data

4. **Network Events:**
   - `storage` event should be triggered
   - `auth-state-change` event should be triggered

## 🛠️ **Advanced Testing**

### **Browser Developer Tools Testing:**

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Run these commands:**

```javascript
// Test mock authentication programmatically
const mockUser = {
  id: 'test_user_' + Date.now(),
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  verified_email: true
};

const session = {
  user: {
    id: mockUser.id,
    email: mockUser.email,
    user_metadata: {
      full_name: mockUser.name,
      avatar_url: mockUser.picture,
      email_verified: mockUser.verified_email
    },
    email_confirmed_at: mockUser.verified_email ? new Date().toISOString() : null
  },
  access_token: 'mock_token_' + Date.now(),
  expires_at: Date.now() + (3600 * 1000)
};

// Store in localStorage
localStorage.setItem('google_user', JSON.stringify(mockUser));
localStorage.setItem('google_access_token', session.access_token);
localStorage.setItem('auth_session', JSON.stringify(session));
localStorage.setItem('auth_user', JSON.stringify(session.user));

// Trigger events
window.dispatchEvent(new Event('storage'));
window.dispatchEvent(new CustomEvent('auth-state-change', {
  detail: { event: 'SIGNED_IN', session }
}));

console.log('Mock authentication completed!');
```

### **Check Stored Data:**

```javascript
// Check what's stored
console.log('Google User:', JSON.parse(localStorage.getItem('google_user') || '{}'));
console.log('Auth Session:', JSON.parse(localStorage.getItem('auth_session') || '{}'));
console.log('Access Token:', localStorage.getItem('google_access_token'));
```

### **Clear Test Data:**

```javascript
// Clear all test data
localStorage.removeItem('google_user');
localStorage.removeItem('google_access_token');
localStorage.removeItem('auth_session');
localStorage.removeItem('auth_user');
console.log('Test data cleared!');
```

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Button not clickable:**
   - Make sure you're holding Ctrl while clicking
   - Check browser console for errors
   - Verify the development server is running

2. **No success message:**
   - Check if toast notifications are working
   - Look for JavaScript errors in console
   - Verify the component is properly imported

3. **Data not stored:**
   - Check if localStorage is available
   - Look for errors in the authentication flow
   - Verify the session creation logic

4. **Events not triggered:**
   - Check if event listeners are properly set up
   - Verify the event dispatching code
   - Look for errors in the event handling

### **Debug Steps:**

1. **Check Console Logs:**
   ```javascript
   // Enable debug logging
   localStorage.setItem('debug', 'true');
   ```

2. **Verify Component State:**
   - Check if `isInitialized` is true
   - Verify `loading` state is properly managed
   - Ensure `configStatus` is correctly set

3. **Test Environment Variables:**
   ```javascript
   // Check if environment variables are loaded
   console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
   console.log('Redirect URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);
   ```

## 📊 **Test Scenarios**

### **Scenario 1: First Time User**
1. Clear all localStorage data
2. Open the app
3. Try Ctrl+Click on Google button
4. Verify user creation and session storage

### **Scenario 2: Returning User**
1. Complete first-time authentication
2. Refresh the page
3. Check if user remains authenticated
4. Verify session persistence

### **Scenario 3: Multiple Test Users**
1. Create multiple test users with Ctrl+Click
2. Verify each user has unique data
3. Check for data conflicts or overwrites

### **Scenario 4: Error Handling**
1. Test with disabled JavaScript
2. Test with localStorage disabled
3. Test with network disconnected
4. Verify graceful error handling

## ✅ **Test Checklist**

- [ ] Development server starts successfully
- [ ] Login popup opens correctly
- [ ] Google button is visible and clickable
- [ ] Ctrl+Click triggers test mode
- [ ] Success message appears
- [ ] User data is stored in localStorage
- [ ] Session events are triggered
- [ ] User is redirected to authenticated state
- [ ] Console shows appropriate log messages
- [ ] No JavaScript errors occur
- [ ] Test data can be cleared
- [ ] Multiple test users work correctly

## 🎯 **Expected Results**

When testing is successful, you should see:

1. **Immediate Response:**
   - Button shows loading state
   - Success toast appears
   - User is authenticated

2. **Data Storage:**
   - Mock user data in localStorage
   - Valid session object
   - Access token generated

3. **Event Flow:**
   - Storage event triggered
   - Auth state change event fired
   - Application state updated

4. **User Experience:**
   - Smooth transition to authenticated state
   - No error messages
   - Consistent behavior across tests

## 🚀 **Next Steps**

After successful testing:

1. **Configure Real Google OAuth** (optional)
2. **Test with real Google accounts**
3. **Implement additional test scenarios**
4. **Set up automated testing**
5. **Document any issues found**

Happy testing! 🎉


