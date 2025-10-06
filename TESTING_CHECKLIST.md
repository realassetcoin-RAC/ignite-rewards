# 🧪 RAC Rewards Application - Testing Checklist

## Overview
This checklist covers end-to-end testing of all implemented features, with special focus on user type differentiation (custodial vs non-custodial) and local PostgreSQL database integration.

---

## 🔐 Authentication & User Management

### Email Signup (Custodial User Creation)
- [ ] User can sign up with valid email and password
- [ ] Password validation enforces minimum 8 characters
- [ ] Terms of Service and Privacy Policy checkboxes are required
- [ ] Referral code field is optional and can be pre-filled from URL
- [ ] Profile is created in `profiles` table with `user_type = 'custodial'`
- [ ] Custodial wallet is created in `user_solana_wallets` table
- [ ] Free Pearl White NFT is assigned automatically
- [ ] User is redirected to dashboard after successful signup
- [ ] Email verification flow works correctly

### Google OAuth Signup (Custodial User Creation)
- [ ] User can initiate Google OAuth signup
- [ ] Google authentication popup opens correctly
- [ ] Profile is created with `user_type = 'custodial'` and `provider = 'google'`
- [ ] Custodial wallet is created automatically
- [ ] Free Pearl White NFT is assigned
- [ ] User is redirected to `/auth-callback` then dashboard
- [ ] User name and email are populated from Google profile

### Wallet Connect (Non-Custodial User Creation)
- [ ] Phantom wallet connection works
- [ ] MetaMask wallet connection works
- [ ] Solflare wallet connection works (if available)
- [ ] User profile is updated to `user_type = 'non_custodial'`
- [ ] Wallet address is stored in `profiles.wallet_address`
- [ ] Network type is recorded ('solana' or 'ethereum')
- [ ] Provider is set to 'wallet'
- [ ] User is redirected to appropriate dashboard based on role

### Login
- [ ] Email/password login works correctly
- [ ] Google OAuth login works correctly
- [ ] Session persistence works (refresh doesn't log out)
- [ ] Logout functionality works properly
- [ ] Inactivity timeout (5 minutes) logs user out

---

## 👤 User Dashboard

### Dashboard Overview
- [ ] Dashboard loads without errors
- [ ] User type badge displays correctly (🔒 Custodial / 🔓 Non-Custodial)
- [ ] User type information card displays at top
- [ ] Card shows appropriate features based on user type
- [ ] Stats display correctly (points, earned, rewards, referrals, NFTs)
- [ ] Quick action cards are functional
- [ ] Navigation sidebar works properly
- [ ] Mobile menu toggle works

### Custodial User Dashboard Features
- [ ] Shows "🔒 Custodial Account" badge
- [ ] Information card lists: Free Pearl White NFT, NFT upgrade available, Invest with RAC tokens
- [ ] All loyalty features are accessible
- [ ] NFT upgrade option is visible and enabled

### Non-Custodial User Dashboard Features
- [ ] Shows "🔓 Non-Custodial Account" badge
- [ ] Information card lists: Direct crypto investments, All loyalty features, Multi-currency support
- [ ] Can invest with USDT, SOL, ETH, BTC
- [ ] NFT upgrade option is hidden or disabled

---

## 🎴 Loyalty NFT System

### NFT Display & Management
- [ ] Pearl White NFT displays for new custodial users
- [ ] NFT card shows correct type name (Pearl White, Pink, Lava Orange, Silver, Gold, Black)
- [ ] NFT attributes display correctly (earn on spend, auto staking, etc.)
- [ ] Card number format is correct (8 characters, starts with user initial)
- [ ] NFT rarity is displayed correctly
- [ ] Collection type is shown

### NFT Upgrades (Custodial Users Only)
- [ ] Custodial users see "Upgrade NFT" button
- [ ] Upgrade prices are correct:
  - Pearl White → Silver: $50
  - Silver → Gold: $100
  - Gold → Platinum: $200
  - Platinum → Diamond: $500
- [ ] Clicking upgrade redirects to payment gateway
- [ ] Payment data is stored in sessionStorage
- [ ] After payment, upgrade is processed
- [ ] Token buy-back and burn is recorded

### NFT Restrictions (Non-Custodial Users)
- [ ] Non-custodial users see message "Only custodial users can upgrade NFTs"
- [ ] Upgrade button is disabled or hidden
- [ ] Non-custodial users can still view their NFT details
- [ ] Non-custodial users can purchase higher tier NFTs directly (not upgrade)

### NFT Attributes Verification
**Custodial NFTs:**
- [ ] Pearl White: $0, 1.00% earn, 0.00% upgrade bonus, 100 RAC evolution min, 0.25% evolution earnings
- [ ] Lava Orange: $100, 1.10% earn, 0.10% upgrade bonus, 500 RAC evolution min, 0.50% evolution earnings
- [ ] Pink: $100, 1.10% earn, 0.10% upgrade bonus, 500 RAC evolution min, 0.50% evolution earnings
- [ ] Silver: $200, 1.20% earn, 0.15% upgrade bonus, 1,000 RAC evolution min, 0.75% evolution earnings
- [ ] Gold: $300, 1.30% earn, 0.20% upgrade bonus, 1,500 RAC evolution min, 1.00% evolution earnings
- [ ] Black: $500, 1.40% earn, 0.30% upgrade bonus, 2,500 RAC evolution min, 1.25% evolution earnings

**Non-Custodial NFTs:**
- [ ] Pearl White: $100, 1.00% earn, 0.00% upgrade bonus, 500 RAC evolution min, 0.50% evolution earnings
- [ ] All other tiers have correct pricing and attributes per PRODUCT_FEATURES.md

---

## 💰 Marketplace & Investment System

### Marketplace Display
- [ ] Marketplace listings load correctly
- [ ] Investment opportunities display with images
- [ ] Funding progress bars show correctly
- [ ] Risk levels are displayed (Low/Medium/High)
- [ ] Impact scores are visible (1-10)
- [ ] Expected returns are shown
- [ ] Current funding amounts and investor counts update

### Investment - Custodial Users
- [ ] Custodial user notice card displays: "You can invest using RAC tokens only"
- [ ] Direct crypto investment buttons are disabled or show restriction message
- [ ] RAC token investment option is available
- [ ] Investment redirects to payment gateway with correct data
- [ ] NFT multiplier is calculated and applied correctly
- [ ] Investment is recorded in `marketplace_investments` table with `nft_multiplier`

### Investment - Non-Custodial Users
- [ ] No restriction notice is shown
- [ ] Can invest with USDT, SOL, ETH, BTC
- [ ] Wallet connection is verified before investment
- [ ] Investment amount validation works
- [ ] NFT multiplier bonus is applied to investments
- [ ] Investment is recorded with correct `effective_amount`
- [ ] Direct crypto transfer works from external wallet

### Passive Income Distribution
- [ ] Earnings are calculated proportionally based on investment amount
- [ ] `user_passive_earnings` records are created correctly
- [ ] Distribution events are logged in `passive_income_distributions`
- [ ] Users can view their passive income history
- [ ] Total earnings are aggregated correctly per currency
- [ ] Earnings can be claimed successfully

---

## 🏪 Merchant Subscription Plans

### Subscription Plans Display
- [ ] All 5 plans display correctly (StartUp, Momentum, Energizer, Cloud9, Super)
- [ ] Monthly prices are correct from database:
  - StartUp: $20/month, $150/year
  - Momentum: $50/month, $500/year
  - Energizer: $100/month, $1,000/year (marked as Popular)
  - Cloud9: $250/month, $2,500/year
  - Super: $500/month, $5,000/year
- [ ] Yearly prices show savings percentage
- [ ] Monthly toggle switches between pricing correctly
- [ ] Popular badge shows on Energizer plan
- [ ] Features list displays correctly for each plan
- [ ] Monthly points and transaction limits are shown

### Merchant Signup & Subscription
- [ ] Merchant can sign up with business details
- [ ] Industry dropdown has all options
- [ ] Country and city fields work correctly
- [ ] Terms and privacy checkboxes are required
- [ ] Plan selection works properly
- [ ] Payment data is stored in sessionStorage
- [ ] Redirects to payment gateway with correct parameters
- [ ] After payment, merchant account is activated
- [ ] Token buy-back is triggered for subscription payment

### Subscription Plan Enforcement
- [ ] Monthly points limit is enforced
- [ ] Transaction limit is enforced
- [ ] Email account limit is checked
- [ ] Merchants can upgrade/downgrade plans
- [ ] Plan features are properly restricted based on tier

---

## 🔗 Referral System

### Referral Code Generation
- [ ] Users receive unique referral codes
- [ ] Merchants receive unique referral codes
- [ ] Referral links are properly formatted
- [ ] QR codes generate correctly for referral links

### Referral Tracking
- [ ] Referral code pre-fills from URL parameter `?ref=CODE`
- [ ] Referrals are tracked when new users sign up
- [ ] Referral status updates correctly (pending → completed)
- [ ] Referral points are awarded to referrer
- [ ] User-to-user referrals work
- [ ] User-to-merchant referrals work with higher points
- [ ] Merchant-to-user referrals work
- [ ] Merchant-to-merchant referrals work

### Referral Display
- [ ] Referral dashboard shows all referrals
- [ ] Referral stats display correctly (total, pending, completed)
- [ ] Referral earnings are calculated accurately
- [ ] Share buttons work (native share API)
- [ ] Referral history is viewable

---

## 🎯 DAO Governance

### DAO Dashboard
- [ ] DAO page loads without errors
- [ ] RAC logo displays correctly
- [ ] Page is responsive on all screen sizes
- [ ] Authentication modal shows for non-authenticated users
- [ ] After authentication, proposals load correctly

### Proposal Display
- [ ] Active proposals display correctly
- [ ] Proposal status shows accurately (Active/Passed/Rejected/Pending)
- [ ] Voting options are visible
- [ ] Vote counts display correctly
- [ ] Time remaining shows for active proposals
- [ ] Category filtering works (All/Governance/Treasury/Technical/Community)

### Voting Functionality
- [ ] Users can vote on active proposals
- [ ] Vote is recorded in database
- [ ] Vote counts update immediately
- [ ] Users cannot vote twice on same proposal
- [ ] Voting power is calculated based on NFT holdings
- [ ] Results display correctly after voting period ends

---

## 💳 Wallet Management

### Custodial Wallet (Platform Users)
- [ ] Wallet is created automatically on signup
- [ ] Wallet address displays in dashboard
- [ ] Seed phrase backup option is available
- [ ] Seed phrase shows correctly (12/24 words)
- [ ] Backup confirmation works
- [ ] Google auth can be disabled if backup is confirmed
- [ ] Wallet transactions are viewable
- [ ] Balance displays correctly

### Non-Custodial Wallet (External Wallet Users)
- [ ] External wallet address displays correctly
- [ ] Wallet balance is fetched from blockchain
- [ ] Transaction history shows blockchain transactions
- [ ] Wallet can be disconnected
- [ ] Multiple wallets can be managed
- [ ] Network type is shown (Solana/Ethereum)

### Seed Phrase Backup
- [ ] Seed phrase modal opens correctly
- [ ] Seed phrase is displayed securely
- [ ] Copy to clipboard works
- [ ] Download backup works
- [ ] Backup confirmation checkbox required
- [ ] Status updates to "backed up" after confirmation

---

## 🌐 Database & API Integration

### Local PostgreSQL Connection
- [ ] All data operations use local PostgreSQL at `localhost:5432`
- [ ] Database name is `ignite_rewards`
- [ ] Connection is stable and performant
- [ ] Queries execute without timeout errors
- [ ] RLS policies work correctly

### Supabase Authentication Only
- [ ] User login uses Supabase auth
- [ ] Google OAuth uses Supabase
- [ ] Session management uses Supabase
- [ ] No business data is stored in Supabase cloud
- [ ] Authentication tokens are valid and refresh properly

### API Endpoints
- [ ] `/api/subscription-plans` returns correct data
- [ ] City search API works with `?search=` parameter
- [ ] Health check endpoints respond correctly
- [ ] All APIs use local PostgreSQL for data
- [ ] CORS is properly configured
- [ ] API responses have correct structure

### Data Integrity
- [ ] User profiles sync between Supabase auth and local DB
- [ ] Foreign key relationships are maintained
- [ ] Cascading deletes work correctly
- [ ] Data migrations are applied successfully
- [ ] No orphaned records exist

---

## 🔒 Security & Compliance

### OWASP Top 10 Compliance
- [ ] **A01 - Access Control**: RLS policies enforce data access
- [ ] **A02 - Cryptographic Failures**: Sensitive data is encrypted
- [ ] **A03 - Injection**: Parameterized queries are used
- [ ] **A07 - Authentication Failures**: Strong password policies enforced
- [ ] Session timeout works (5 minutes inactivity)
- [ ] JWT tokens are validated properly

### Data Security
- [ ] Passwords are hashed properly
- [ ] Seed phrases are encrypted in database
- [ ] API keys are not exposed in frontend
- [ ] Environment variables are used for sensitive config
- [ ] HTTPS is used in production
- [ ] Database connections are encrypted

---

## ♿ Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Modal dialogs trap focus correctly
- [ ] Escape key closes modals

### Screen Reader Support
- [ ] Images have alt text
- [ ] ARIA labels are present where needed
- [ ] Semantic HTML is used
- [ ] Form labels are properly associated
- [ ] Error messages are announced

### Visual Accessibility
- [ ] Color contrast meets 4.5:1 ratio for text
- [ ] Text can be resized to 200% without breaking layout
- [ ] No information is conveyed by color alone
- [ ] Interactive elements have visible hover/focus states

---

## 📱 Responsive Design

### Mobile (320px - 767px)
- [ ] Dashboard sidebar collapses to hamburger menu
- [ ] Cards stack vertically
- [ ] Forms are usable on small screens
- [ ] Touch targets are at least 44x44px
- [ ] Modals fit within viewport
- [ ] No horizontal scrolling

### Tablet (768px - 1023px)
- [ ] Layout adapts to medium screen size
- [ ] Sidebar behavior is appropriate
- [ ] Cards display in 2-column grid where appropriate
- [ ] Touch interactions work smoothly

### Desktop (1024px+)
- [ ] Full sidebar is visible
- [ ] Multi-column layouts display correctly
- [ ] Hover states work properly
- [ ] Modal sizing is appropriate
- [ ] Dashboard uses available space efficiently

---

## 🐛 Error Handling

### Network Errors
- [ ] API timeout errors are caught and displayed
- [ ] Network disconnection is handled gracefully
- [ ] Retry logic works for failed requests
- [ ] User sees helpful error messages

### Validation Errors
- [ ] Form validation errors are clear and specific
- [ ] Field-level validation shows real-time feedback
- [ ] Submit button is disabled during submission
- [ ] Server-side validation errors are displayed

### Database Errors
- [ ] Connection failures show appropriate messages
- [ ] Query errors don't crash the application
- [ ] Fallback data is used when appropriate (marketplace mock data)
- [ ] Users are notified of data issues

---

## ⚡ Performance

### Load Times
- [ ] Initial page load is under 3 seconds
- [ ] Dashboard loads in under 2 seconds
- [ ] API responses are under 500ms
- [ ] Images are optimized and lazy-loaded

### Optimization
- [ ] Code splitting is implemented
- [ ] Bundle size is minimized
- [ ] Unused dependencies are removed
- [ ] Database queries are optimized with indexes
- [ ] No memory leaks in React components

---

## 🧹 Code Quality

### Linting
- [ ] No ESLint errors in console
- [ ] No TypeScript errors
- [ ] All `any` types are replaced with proper types
- [ ] No unused imports or variables
- [ ] Console statements are removed (except logger)

### Best Practices
- [ ] Components follow single responsibility principle
- [ ] Reusable logic is extracted to hooks
- [ ] Database operations use adapter pattern
- [ ] Error boundaries are implemented
- [ ] Loading states are handled consistently

---

## 🔄 Integration Testing Scenarios

### Complete User Journey - Custodial User
1. [ ] Sign up with email
2. [ ] Verify email (if enabled)
3. [ ] View free Pearl White NFT
4. [ ] Check user type badge shows "Custodial"
5. [ ] View marketplace (see RAC token restriction notice)
6. [ ] Try to upgrade NFT (should work)
7. [ ] Share referral link
8. [ ] Vote on DAO proposal
9. [ ] View passive earnings
10. [ ] Backup seed phrase
11. [ ] Log out and log back in

### Complete User Journey - Non-Custodial User
1. [ ] Connect Phantom wallet
2. [ ] Profile updated to "Non-Custodial"
3. [ ] Check user type badge shows "Non-Custodial"
4. [ ] View marketplace (no restriction notice)
5. [ ] Invest with SOL or USDT directly
6. [ ] Try to upgrade NFT (should be restricted)
7. [ ] View investment history
8. [ ] Check passive earnings
9. [ ] Vote on DAO proposal
10. [ ] Disconnect and reconnect wallet

### Merchant Journey
1. [ ] Sign up as merchant
2. [ ] Select subscription plan
3. [ ] Complete payment
4. [ ] Access merchant dashboard
5. [ ] Check plan limits are enforced
6. [ ] Distribute points to users
7. [ ] View analytics
8. [ ] Upgrade/downgrade plan

---

## 📊 Data Verification

### Database Tables to Check
- [ ] `profiles` - user_type field is set correctly
- [ ] `user_solana_wallets` - custodial wallets exist for email/OAuth users
- [ ] `user_loyalty_cards` - free NFTs are assigned
- [ ] `nft_types` - all 6 NFT types exist with correct attributes
- [ ] `marketplace_investments` - nft_multiplier and effective_amount are set
- [ ] `user_passive_earnings` - earnings records are created
- [ ] `merchant_subscription_plans` - correct pricing from database
- [ ] `referral_codes` - unique codes are generated
- [ ] `dao_proposals` - proposals are stored correctly

### Data Consistency
- [ ] No NULL values in required fields
- [ ] Foreign keys are valid
- [ ] Timestamps are in correct format (ISO 8601)
- [ ] Enums match database definitions
- [ ] UUIDs are properly generated

---

## 🎨 UI/UX Testing

### Visual Consistency
- [ ] Color scheme is consistent throughout
- [ ] Typography follows design system
- [ ] Spacing is uniform
- [ ] Icons are consistent style
- [ ] Gradients display correctly
- [ ] Shadows and effects are subtle

### User Experience
- [ ] Loading states are clear
- [ ] Success messages are encouraging
- [ ] Error messages are helpful, not technical
- [ ] Navigation is intuitive
- [ ] Actions have confirmation for destructive operations
- [ ] Tooltips provide helpful context

---

## 🚀 Production Readiness

### Pre-Deployment Checklist
- [ ] All environment variables are configured
- [ ] Database is backed up
- [ ] SSL certificates are valid
- [ ] API rate limiting is configured
- [ ] Monitoring and logging are set up
- [ ] Error tracking (Sentry) is configured
- [ ] Analytics are implemented
- [ ] Terms of Service and Privacy Policy are current

### Post-Deployment Verification
- [ ] Application loads in production
- [ ] Database connections work
- [ ] Authentication works
- [ ] Payment processing works
- [ ] Email notifications send
- [ ] SMS OTP sends
- [ ] Blockchain transactions execute
- [ ] All critical paths are functional

---

## 📝 Test Results Summary

### Test Execution Date: _________________

**Total Tests:** _______  
**Passed:** _______  
**Failed:** _______  
**Blocked:** _______  

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

## 🎯 Priority Testing Order

### P0 - Critical (Must Work)
1. User signup and login
2. Database connections (local PostgreSQL + Supabase auth)
3. User type tracking and display
4. Free NFT assignment for custodial users
5. Subscription plan display and pricing

### P1 - High Priority
1. NFT upgrade restrictions based on user type
2. Investment restrictions based on user type
3. Marketplace display and basic functionality
4. Wallet connection and management
5. DAO page display without infinite loops

### P2 - Medium Priority
1. Referral system
2. Passive income distribution
3. Payment gateway integration
4. Token buy-back mechanism
5. Admin panel functionality

### P3 - Low Priority
1. Advanced analytics
2. Email notifications
3. SMS OTP
4. Mobile optimizations
5. Accessibility enhancements

---

## 📞 Support & Troubleshooting

### Common Issues
- **Database Connection Failed**: Check PostgreSQL service is running
- **Supabase Auth Error**: Verify API keys in .env.local
- **API Timeout**: Check network and increase timeout limits
- **NFT Not Assigned**: Check database functions are created
- **Wrong Prices Displayed**: Verify API endpoint is fetching from local DB

### Debug Commands
```bash
# Check PostgreSQL service
pg_isready -h localhost -p 5432

# Check database tables
psql -h localhost -U postgres -d ignite_rewards -c "\dt public.*"

# Test API endpoint
curl http://localhost:3001/api/subscription-plans

# Check for linting errors
bun run lint

# Build for production
bun run build
```

---

**Testing Completed By:** _________________  
**Date:** _________________  
**Sign-off:** _________________
