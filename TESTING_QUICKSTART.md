# 🚀 Testing Quick Start Guide

## Prerequisites

Before you begin testing, ensure you have:

- [x] PostgreSQL running on `localhost:5432`
- [x] Database `ignite_rewards` exists
- [x] Supabase project configured (for authentication)
- [x] Environment variables set in `.env.local`
- [x] Bun installed (`bun --version` to check)
- [x] All dependencies installed (`bun install`)

---

## 🏃 Quick Test Scenarios

### Test 1: Custodial User Signup (3 minutes)

**Expected Result**: Free Pearl White NFT, custodial wallet, user type badge

```bash
# 1. Start the application
bun run dev

# 2. In browser, navigate to http://localhost:8084
# 3. Click "Sign Up" or "Get Started"
# 4. Fill in signup form:
#    - Email: test-custodial@example.com
#    - Password: Test123!@#
#    - First Name: Test
#    - Last Name: Custodial
#    - Accept Terms & Privacy
# 5. Click "Sign Up"
# 6. Verify:
#    ✓ Redirected to dashboard
#    ✓ User type badge shows "🔒 Custodial"
#    ✓ Green info card at top with custodial benefits
#    ✓ Pearl White NFT card displays
#    ✓ Wallet address shown in settings
```

**Database Verification**:
```sql
-- Check profile
SELECT user_type, provider FROM profiles WHERE email = 'test-custodial@example.com';
-- Expected: user_type='custodial', provider='email'

-- Check wallet
SELECT wallet_type FROM user_solana_wallets WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'test-custodial@example.com'
);
-- Expected: wallet_type='custodial'

-- Check NFT
SELECT nft_type_id FROM user_loyalty_cards WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'test-custodial@example.com'
);
-- Expected: One record with Pearl White NFT
```

---

### Test 2: Wallet Connect (Non-Custodial) (2 minutes)

**Expected Result**: User type updates to non-custodial, no free NFT

```bash
# 1. Ensure Phantom wallet is installed and has SOL
# 2. Navigate to http://localhost:8084
# 3. Click "Connect Wallet"
# 4. Select "Phantom"
# 5. Approve connection in Phantom popup
# 6. Verify:
#    ✓ Redirected to dashboard
#    ✓ User type badge shows "🔓 Non-Custodial"
#    ✓ Blue info card with non-custodial benefits
#    ✓ Wallet address displayed correctly
#    ✓ No free NFT (or can purchase NFTs)
```

**Database Verification**:
```sql
-- Check profile update
SELECT user_type, wallet_address, network, provider 
FROM profiles 
WHERE wallet_address = 'YOUR_PHANTOM_ADDRESS';
-- Expected: user_type='non_custodial', network='solana', provider='wallet'
```

---

### Test 3: Subscription Plans Display (1 minute)

**Expected Result**: Correct pricing from local database

```bash
# 1. Navigate to http://localhost:8084/subscription-plans
# 2. Verify all 5 plans display:
#    ✓ StartUp: $20/month, $150/year
#    ✓ Momentum: $50/month, $500/year
#    ✓ Energizer: $100/month, $1,000/year (Popular badge)
#    ✓ Cloud9: $250/month, $2,500/year
#    ✓ Super: $500/month, $5,000/year
# 3. Toggle between Monthly/Yearly
# 4. Verify savings percentages display
```

**API Verification**:
```bash
# Test the API endpoint directly
curl http://localhost:3001/api/subscription-plans | json_pp

# Expected: JSON with 5 plans and correct prices
```

---

### Test 4: NFT Upgrade Restriction (2 minutes)

**Expected Result**: Custodial can upgrade, non-custodial cannot

**For Custodial User**:
```bash
# 1. Login as custodial user
# 2. Navigate to dashboard
# 3. Go to "NFT Portfolio" section
# 4. Look for "Upgrade NFT" button
# 5. Verify:
#    ✓ "Upgrade Available" section shows
#    ✓ Upgrade button is enabled
#    ✓ Clicking redirects to payment gateway
```

**For Non-Custodial User**:
```bash
# 1. Login/connect as non-custodial user
# 2. Navigate to dashboard
# 3. Go to "NFT Portfolio" section
# 4. Verify:
#    ✓ "Upgrade Not Available" section shows
#    ✓ Message: "Only custodial users can upgrade NFTs"
#    ✓ Upgrade button is disabled or hidden
```

---

### Test 5: Marketplace Investment Restrictions (2 minutes)

**Expected Result**: Custodial sees RAC restriction, non-custodial sees no restriction

**For Custodial User**:
```bash
# 1. Login as custodial user
# 2. Navigate to "Investment Hub" or "Marketplace"
# 3. Verify:
#    ✓ Blue/purple card at top with message:
#      "Custodial User - You can invest using RAC tokens only"
#    ✓ Direct crypto investment options are restricted
#    ✓ RAC token investment is available
```

**For Non-Custodial User**:
```bash
# 1. Login/connect as non-custodial user
# 2. Navigate to "Investment Hub" or "Marketplace"
# 3. Verify:
#    ✓ No restriction card displays
#    ✓ Can select USDT, SOL, ETH, BTC for investment
#    ✓ Wallet connection prompt appears when investing
```

---

### Test 6: DAO Page (1 minute)

**Expected Result**: No infinite loading loop, proposals display

```bash
# 1. Navigate to http://localhost:8084/dao
# 2. Verify:
#    ✓ Page loads without infinite loading spinner
#    ✓ RAC logo displays correctly
#    ✓ Authentication modal appears if not logged in
#    ✓ After login, proposals display
#    ✓ Can filter by category
#    ✓ Page is responsive on mobile
```

---

### Test 7: Database Connection (30 seconds)

**Expected Result**: Local PostgreSQL for data, Supabase for auth only

```bash
# Check local PostgreSQL connection
psql -h localhost -p 5432 -U postgres -d ignite_rewards -c "SELECT COUNT(*) FROM profiles;"

# Expected: Returns count without error

# Check API endpoints
curl http://localhost:3001/api/health

# Expected: { "status": "ok", "database": "connected" }
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to PostgreSQL"
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# If not running, start it:
# Windows: net start postgresql-x64-14
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Issue: "Supabase authentication failed"
```bash
# Check .env.local has correct values:
cat .env.local | grep VITE_SUPABASE

# Should show:
# VITE_SUPABASE_URL=https://wndswqvqogeblksrujpg.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Issue: "API endpoint not found"
```bash
# Ensure API server is running
bun run apis:dev

# Check if port 3001 is available
netstat -ano | findstr :3001  # Windows
lsof -i :3001                  # Mac/Linux
```

### Issue: "Free NFT not assigned"
```bash
# Check if Pearl White NFT exists in database
psql -h localhost -U postgres -d ignite_rewards -c \
  "SELECT * FROM nft_types WHERE nft_name = 'Pearl White' AND is_custodial = true;"

# If not found, run the NFT seeding script
# Or manually insert via admin panel
```

### Issue: "Wrong subscription plan prices"
```bash
# Verify prices in database
psql -h localhost -U postgres -d ignite_rewards -c \
  "SELECT name, price_monthly, price_yearly FROM merchant_subscription_plans ORDER BY price_monthly;"

# If wrong, check IMPLEMENTATION_SUMMARY.md for correct values
```

---

## 📊 Test Result Template

After running each test, document results:

```markdown
### Test: [Test Name]
**Date**: [Date]
**Tester**: [Your Name]
**Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

**Steps Executed**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Results**:
- [Expected 1]: ✅ / ❌
- [Expected 2]: ✅ / ❌
- [Expected 3]: ✅ / ❌

**Issues Found**:
- [Issue description if any]

**Screenshots**: [Attach if needed]

**Notes**: [Any additional observations]
```

---

## 🎯 Priority Test Order

Execute tests in this order for efficient coverage:

1. ✅ **Database Connection** (30 sec) - Verify infrastructure
2. ✅ **Subscription Plans** (1 min) - Verify API works
3. ✅ **Custodial Signup** (3 min) - Core user flow
4. ✅ **Wallet Connect** (2 min) - Non-custodial flow
5. ✅ **NFT Upgrade** (2 min) - User type restrictions
6. ✅ **Marketplace** (2 min) - Investment restrictions
7. ✅ **DAO Page** (1 min) - UI stability

**Total Time**: ~12 minutes for all priority tests

---

## 📈 Success Criteria

All tests pass if:

- [x] Database connections work (local PostgreSQL + Supabase auth)
- [x] User types track correctly (custodial vs non-custodial)
- [x] Free NFT assigns to custodial users
- [x] NFT upgrades restricted to custodial users
- [x] Marketplace investments restricted by user type
- [x] Subscription plans show correct pricing
- [x] No infinite loading loops anywhere
- [x] User type badges display correctly

---

## 🚨 Critical Paths to Test

These MUST work for production:

1. **User Signup & Login** - Any failure blocks all usage
2. **Database Access** - Required for all features
3. **User Type Detection** - Affects all restricted features
4. **Payment Gateway** - Revenue generation depends on this
5. **NFT Assignment** - Core value proposition

---

## 📞 Need Help?

If tests fail or you encounter issues:

1. Check `TESTING_CHECKLIST.md` for detailed scenarios
2. Review `IMPLEMENTATION_SUMMARY.md` for architecture details
3. Verify `.cursorrules` requirements are met
4. Check console for error messages
5. Review database logs for query errors

---

## ✅ Completion Checklist

After testing, verify:

- [ ] All 7 quick tests executed
- [ ] Results documented
- [ ] Critical issues logged
- [ ] Database verified for test users
- [ ] API endpoints tested
- [ ] Screenshots captured for issues
- [ ] Test report created

---

**Happy Testing! 🧪✨**

For comprehensive testing, refer to `TESTING_CHECKLIST.md` which contains 200+ test cases covering all features in detail.

