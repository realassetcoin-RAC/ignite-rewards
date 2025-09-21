# Browser MCP Testing Guide for RAC Rewards Application

## 🚀 Application Setup
- **URL**: http://localhost:8084
- **Environment**: Development with real database authentication
- **Email Verification**: Mocked (bypassed automatically)
- **Email Notifications**: Mocked (logged to console)

## 📋 Test Data Available

### 👤 Test Users
| Email | Password | Role | Card Type | Notes |
|-------|----------|------|-----------|-------|
| john.doe@test.com | password123 | user | free | Regular user |
| jane.smith@test.com | password123 | user | free | Regular user |
| mike.johnson@test.com | password123 | user | free | Regular user |
| sarah.wilson@test.com | password123 | user | free | Regular user |
| david.brown@test.com | password123 | user | free | Regular user |
| lisa.garcia@test.com | password123 | user | premium | Premium card user |
| robert.miller@test.com | password123 | user | premium | Premium card user |
| emily.davis@test.com | password123 | user | premium | Premium card user |
| admin@test.com | admin123! | admin | - | Admin user |
| merchant@test.com | password123 | merchant | - | Merchant user |

### 🏪 Test Merchants
| Email | Business Name | Location |
|-------|---------------|----------|
| coffee.shop@test.com | Test Coffee Shop | New York, NY |
| bookstore@test.com | Test Bookstore | Los Angeles, CA |
| restaurant@test.com | Test Restaurant | Chicago, IL |
| electronics@test.com | Test Electronics Store | Houston, TX |
| department.store@test.com | Test Department Store | Phoenix, AZ |

## 🧪 Test Scenarios

### 1. User Authentication Flow
**Objective**: Test user signup and login functionality

**Steps**:
1. Navigate to http://localhost:8084
2. Click "Sign Up" button
3. Fill in signup form with new email (e.g., testuser@example.com)
4. Enter password: password123
5. Accept terms and privacy policy
6. Click "Sign Up"
7. Verify success message shows "Account created and verified automatically"
8. Test login with same credentials
9. Verify user dashboard loads

**Expected Results**:
- Signup completes without email verification step
- User is automatically logged in
- Dashboard shows user profile and loyalty card

### 2. Admin Authentication
**Objective**: Test admin user login and access

**Steps**:
1. Navigate to http://localhost:8084
2. Click "Sign In"
3. Enter: admin@test.com / admin123!
4. Click "Sign In"
5. Verify admin dashboard loads
6. Check for admin-specific features

**Expected Results**:
- Admin user logs in successfully
- Admin dashboard is accessible
- Admin features are visible

### 3. Merchant Authentication
**Objective**: Test merchant user login

**Steps**:
1. Navigate to http://localhost:8084
2. Click "Sign In"
3. Enter: merchant@test.com / password123
4. Click "Sign In"
5. Verify merchant dashboard loads

**Expected Results**:
- Merchant user logs in successfully
- Merchant dashboard is accessible

### 4. Google OAuth Flow
**Objective**: Test Google authentication (mocked)

**Steps**:
1. Navigate to http://localhost:8084
2. Click "Sign In with Google"
3. Verify OAuth flow initiates
4. Check for redirect to /auth/callback
5. Verify user is logged in

**Expected Results**:
- Google OAuth flow works (mocked locally)
- User is redirected and logged in
- No 404 errors

### 5. Subscription Plans Page
**Objective**: Test subscription plans display and selection

**Steps**:
1. Navigate to http://localhost:8084/subscription-plans
2. Verify plans are displayed with correct pricing format ($XX /mo, $XX /yr)
3. Test plan selection
4. Verify billing cycle toggle works
5. Check yearly savings display

**Expected Results**:
- Plans display with correct formatting
- Pricing shows as "$20 /mo" and "$500 /yr"
- Plan selection works
- Billing cycle toggle functions

### 6. Exclusive Benefits Page
**Objective**: Test exclusive benefits page functionality

**Steps**:
1. Navigate to http://localhost:8084
2. Find "Exclusive Benefits" in carousel
3. Click "Learn More"
4. Verify navigation to /exclusive-benefits
5. Test "Start Free" button
6. Verify it opens signup modal on home page

**Expected Results**:
- Carousel navigation works
- Benefits page loads with correct theme
- "Start Free" button triggers signup modal

### 7. User Dashboard Features
**Objective**: Test user dashboard functionality

**Steps**:
1. Login as regular user (john.doe@test.com)
2. Verify dashboard loads
3. Check loyalty card display
4. Verify points balance
5. Test navigation between sections
6. Check transaction history

**Expected Results**:
- Dashboard loads with user data
- Loyalty card is visible
- Points balance displays correctly
- Navigation works smoothly

### 8. Merchant Dashboard Features
**Objective**: Test merchant dashboard functionality

**Steps**:
1. Login as merchant user
2. Verify merchant dashboard loads
3. Check business information display
4. Test merchant-specific features
5. Verify subscription plan display

**Expected Results**:
- Merchant dashboard loads
- Business info displays correctly
- Merchant features are accessible

### 9. Admin Dashboard Features
**Objective**: Test admin dashboard functionality

**Steps**:
1. Login as admin user
2. Verify admin dashboard loads
3. Check user management features
4. Test merchant management
5. Verify admin controls

**Expected Results**:
- Admin dashboard loads
- User management features work
- Merchant management accessible
- Admin controls function

### 10. Responsive Design Testing
**Objective**: Test application responsiveness

**Steps**:
1. Test on different screen sizes
2. Verify mobile navigation
3. Check form layouts on mobile
4. Test touch interactions

**Expected Results**:
- Application is responsive
- Mobile navigation works
- Forms are usable on mobile

## 🔍 Key Areas to Test

### Authentication
- [ ] User signup flow
- [ ] User login flow
- [ ] Admin login
- [ ] Merchant login
- [ ] Google OAuth (mocked)
- [ ] Logout functionality

### Navigation
- [ ] Home page carousel
- [ ] Subscription plans page
- [ ] Exclusive benefits page
- [ ] User dashboard
- [ ] Merchant dashboard
- [ ] Admin dashboard

### UI/UX
- [ ] Pricing format ($XX /mo, $XX /yr)
- [ ] Theme consistency
- [ ] Button functionality
- [ ] Modal interactions
- [ ] Form validation

### Data Display
- [ ] User profiles
- [ ] Loyalty cards
- [ ] Points balances
- [ ] Transaction history
- [ ] Merchant information

## 🐛 Common Issues to Watch For

1. **Console Errors**: Check browser console for any JavaScript errors
2. **Database Connection**: Verify data loads from local database
3. **Authentication State**: Ensure users stay logged in
4. **Navigation**: Check for broken links or routing issues
5. **Responsive Design**: Test on different screen sizes

## 📊 Success Criteria

- All authentication flows work without errors
- Data displays correctly from database
- Navigation is smooth and intuitive
- UI components function as expected
- No console errors during normal usage
- Responsive design works across devices

## 🚨 Troubleshooting

If you encounter issues:
1. Check browser console for errors
2. Verify database connection
3. Check network tab for failed requests
4. Ensure all test data is properly created
5. Verify environment variables are set correctly

## 📝 Test Results Template

For each test scenario, document:
- ✅ Pass / ❌ Fail
- Screenshots of any issues
- Console errors encountered
- Performance observations
- User experience notes

---

**Ready for Browser MCP Testing!** 🎯

The application is configured with:
- Real database authentication
- Mock email verification
- Comprehensive test data
- All necessary test users and merchants
