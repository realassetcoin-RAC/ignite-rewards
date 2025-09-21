# Browser MCP Testing Script for RAC Rewards

## 🎯 Application URL: http://localhost:8086

## 📋 Test Execution Order

### **Test 1: Home Page Load**
```javascript
// Navigate to home page
await browser.navigate('http://localhost:8086');

// Verify page loads
await browser.waitForElement('body');
await browser.takeScreenshot('01_home_page_load.png');

// Check for console errors
const consoleErrors = await browser.getConsoleErrors();
console.log('Console errors:', consoleErrors);
```

### **Test 2: User Signup Flow**
```javascript
// Click signup button
await browser.click('button:contains("Sign Up")');

// Fill signup form
await browser.type('input[type="email"]', 'john.doe@test.com');
await browser.type('input[type="password"]', 'password123');

// Accept terms and privacy
await browser.click('input[id="terms-signup"]');
await browser.click('input[id="privacy-signup"]');

// Submit signup
await browser.click('button[type="submit"]');

// Wait for success message
await browser.waitForElement('text="Account created and verified automatically"');
await browser.takeScreenshot('02_user_signup_success.png');
```

### **Test 3: User Login Flow**
```javascript
// Click sign in tab
await browser.click('button:contains("Sign In")');

// Fill login form
await browser.type('input[type="email"]', 'john.doe@test.com');
await browser.type('input[type="password"]', 'password123');

// Submit login
await browser.click('button[type="submit"]');

// Wait for dashboard
await browser.waitForElement('[data-testid="user-dashboard"]');
await browser.takeScreenshot('03_user_login_success.png');
```

### **Test 4: Google OAuth (Mocked)**
```javascript
// Click Google sign in
await browser.click('button:contains("Sign in with Google")');

// Wait for OAuth flow (mocked)
await browser.waitForElement('text="Signing in with Google"');

// Wait for redirect and login
await browser.waitForElement('[data-testid="user-dashboard"]');
await browser.takeScreenshot('04_google_oauth_success.png');
```

### **Test 5: Admin User Creation**
```javascript
// Logout first
await browser.click('button:contains("Logout")');

// Click signup
await browser.click('button:contains("Sign Up")');

// Fill admin signup
await browser.type('input[type="email"]', 'admin@test.com');
await browser.type('input[type="password"]', 'admin123!');

// Accept terms
await browser.click('input[id="terms-signup"]');
await browser.click('input[id="privacy-signup"]');

// Submit
await browser.click('button[type="submit"]');

// Wait for success
await browser.waitForElement('text="Account created and verified automatically"');
await browser.takeScreenshot('05_admin_signup_success.png');
```

### **Test 6: Admin Login**
```javascript
// Click sign in
await browser.click('button:contains("Sign In")');

// Fill admin login
await browser.type('input[type="email"]', 'admin@test.com');
await browser.type('input[type="password"]', 'admin123!');

// Submit
await browser.click('button[type="submit"]');

// Wait for admin dashboard
await browser.waitForElement('[data-testid="admin-dashboard"]');
await browser.takeScreenshot('06_admin_login_success.png');
```

### **Test 7: Subscription Plans Page**
```javascript
// Navigate to subscription plans
await browser.navigate('http://localhost:8086/subscription-plans');

// Wait for page load
await browser.waitForElement('h1:contains("Subscription Plans")');

// Verify pricing format
const monthlyPrice = await browser.getText('text="$20 /mo"');
const yearlyPrice = await browser.getText('text="$500 /yr"');

console.log('Monthly price format:', monthlyPrice);
console.log('Yearly price format:', yearlyPrice);

// Test billing cycle toggle
await browser.click('button:contains("Yearly")');
await browser.takeScreenshot('07_subscription_plans_yearly.png');

await browser.click('button:contains("Monthly")');
await browser.takeScreenshot('08_subscription_plans_monthly.png');
```

### **Test 8: Exclusive Benefits Page**
```javascript
// Navigate to home
await browser.navigate('http://localhost:8086');

// Find and click "Learn More" for Exclusive Benefits
await browser.click('button:contains("Learn More")');

// Wait for navigation to benefits page
await browser.waitForElement('h1:contains("Exclusive Benefits")');
await browser.takeScreenshot('09_exclusive_benefits_page.png');

// Test "Start Free" button
await browser.click('button:contains("Start Free")');

// Should open signup modal on home page
await browser.waitForElement('text="Sign Up"');
await browser.takeScreenshot('10_start_free_modal.png');
```

### **Test 9: User Dashboard Features**
```javascript
// Login as regular user
await browser.navigate('http://localhost:8086');
await browser.click('button:contains("Sign In")');
await browser.type('input[type="email"]', 'john.doe@test.com');
await browser.type('input[type="password"]', 'password123');
await browser.click('button[type="submit"]');

// Wait for dashboard
await browser.waitForElement('[data-testid="user-dashboard"]');

// Check loyalty card display
await browser.waitForElement('[data-testid="loyalty-card"]');
await browser.takeScreenshot('11_user_dashboard.png');

// Check points balance
const pointsBalance = await browser.getText('[data-testid="points-balance"]');
console.log('Points balance:', pointsBalance);

// Test navigation
await browser.click('button:contains("Profile")');
await browser.takeScreenshot('12_user_profile.png');
```

### **Test 10: Responsive Design**
```javascript
// Test mobile viewport
await browser.setViewport(375, 667); // iPhone SE
await browser.takeScreenshot('13_mobile_view.png');

// Test tablet viewport
await browser.setViewport(768, 1024); // iPad
await browser.takeScreenshot('14_tablet_view.png');

// Test desktop viewport
await browser.setViewport(1920, 1080); // Desktop
await browser.takeScreenshot('15_desktop_view.png');
```

### **Test 11: Console Error Check**
```javascript
// Navigate through key pages and check for errors
const pages = [
    'http://localhost:8086',
    'http://localhost:8086/subscription-plans',
    'http://localhost:8086/exclusive-benefits'
];

for (const page of pages) {
    await browser.navigate(page);
    await browser.waitForElement('body');
    
    const errors = await browser.getConsoleErrors();
    console.log(`Console errors on ${page}:`, errors);
    
    if (errors.length > 0) {
        await browser.takeScreenshot(`error_${page.split('/').pop()}.png`);
    }
}
```

## 🎯 **Expected Results Summary**

### ✅ **Success Criteria:**
1. **Home page loads** without errors
2. **User signup** completes with "Account created and verified automatically"
3. **User login** redirects to dashboard
4. **Google OAuth** works (mocked, no 404 errors)
5. **Admin signup/login** provides admin dashboard access
6. **Subscription plans** show correct pricing format ($XX /mo, $XX /yr)
7. **Exclusive benefits** page loads and "Start Free" opens modal
8. **User dashboard** displays loyalty card and points
9. **Responsive design** works on mobile, tablet, desktop
10. **No console errors** during normal usage

### 🚨 **Common Issues to Watch:**
- Console errors in browser dev tools
- Failed database connections
- Authentication state issues
- Navigation problems
- UI component failures

## 📊 **Test Results Template**

For each test, document:
- ✅ **Pass** / ❌ **Fail**
- **Screenshot** captured
- **Console errors** (if any)
- **Performance** observations
- **User experience** notes

## 🚀 **Ready to Execute!**

Your RAC Rewards application is running on **http://localhost:8086** with:
- ✅ Real database authentication
- ✅ Mocked email verification
- ✅ Test merchants available
- ✅ All UI components functional

**Execute these tests using your browser MCP tools!** 🎯
