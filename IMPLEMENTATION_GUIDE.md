# Implementation Guide: Missing Requirements

This guide outlines the steps to integrate all the missing requirements into the PointBridge application.

## 🚀 **Quick Start**

### 1. **Database Setup**
```bash
# Run the database migration scripts
psql -h your-supabase-host -U postgres -d postgres -f src/sql/01_create_missing_tables.sql
psql -h your-supabase-host -U postgres -d postgres -f src/sql/02_insert_default_data.sql
```

### 2. **Replace AuthModal Component**
```bash
# Backup current AuthModal
mv src/components/AuthModal.tsx src/components/AuthModal_backup.tsx

# Use the updated version with referral code support
mv src/components/AuthModal_Updated.tsx src/components/AuthModal.tsx
```

### 3. **Add Inactivity Logout to Main App**
Add to your main App component or layout:
```typescript
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

// In your main App component
const App = () => {
  useInactivityLogout({
    timeoutMinutes: 5,
    warningMinutes: 4,
    onLogout: () => {
      // Optional: Custom logout logic
      console.log('User logged out due to inactivity');
    }
  });

  // ... rest of your app
};
```

## 📋 **Implementation Checklist**

### ✅ **Completed Components**
- [x] Database schema for all missing tables
- [x] Referral service with full functionality
- [x] Updated AuthModal with referral code fields
- [x] Inactivity logout hook (5-minute timeout)
- [x] Transaction editor component
- [x] Default data and email templates

### 🔄 **Still Need Implementation**

#### **High Priority**
1. **Wallet Address Display Component**
   - Create `src/components/WalletAddressDisplay.tsx`
   - Add to user dashboard
   - Show wallet address and seed phrase backup option

2. **Seed Phrase Management**
   - Create `src/components/SeedPhraseManager.tsx`
   - Add seed phrase login option
   - Add Google auth disable option

3. **Payment Gateway Integration**
   - Create `src/components/NFTUpgradePayment.tsx`
   - Integrate with Stripe/PayPal for NFT upgrades
   - Add "Proceed to Pay" popup

4. **Merchant Transaction Editing**
   - Update `src/pages/MerchantDashboard.tsx`
   - Add transaction editing functionality
   - Integrate with `TransactionEditor` component

#### **Medium Priority**
5. **Ecommerce API Integration**
   - Create `src/lib/ecommerceApiService.ts`
   - Add API endpoints for direct transactions
   - Create merchant integration dashboard

6. **Discount Code Management**
   - Create `src/components/DiscountCodeManager.tsx`
   - Add to merchant dashboard
   - Integrate with NFT card display

7. **Custom NFT Upload**
   - Create `src/components/CustomNFTUpload.tsx`
   - Add file upload functionality
   - Integrate with merchant dashboard

8. **SMS OTP Service**
   - Update `src/lib/loyaltyOtp.ts`
   - Add 5-minute validity enforcement
   - Add resend OTP functionality

#### **Low Priority**
9. **Admin Feature Controls**
   - Create `src/components/admin/FeatureControlPanel.tsx`
   - Add subscription plan-based feature enabling
   - Create admin dashboard section

10. **Asset Initiative Selection**
    - Create `src/components/AssetInitiativeSelector.tsx`
    - Add to user dashboard
    - Integrate with reward flow

## 🔧 **Integration Steps**

### **Step 1: Update User Dashboard**
```typescript
// Add to src/pages/UserDashboard.tsx
import { WalletAddressDisplay } from '@/components/WalletAddressDisplay';
import { AssetInitiativeSelector } from '@/components/AssetInitiativeSelector';
import { ReferralStats } from '@/components/ReferralStats';

// Add these components to your dashboard layout
```

### **Step 2: Update Merchant Dashboard**
```typescript
// Add to src/pages/MerchantDashboard.tsx
import { TransactionEditor } from '@/components/TransactionEditor';
import { DiscountCodeManager } from '@/components/DiscountCodeManager';
import { CustomNFTUpload } from '@/components/CustomNFTUpload';

// Add transaction editing functionality
const [editingTransaction, setEditingTransaction] = useState(null);
```

### **Step 3: Add Referral System**
```typescript
// Add to user dashboard
import { ReferralService } from '@/lib/referralService';

// Get user's referral stats
const [referralStats, setReferralStats] = useState(null);

useEffect(() => {
  if (user) {
    ReferralService.getUserReferralStats(user.id).then(setReferralStats);
  }
}, [user]);
```

### **Step 4: Add Point Release System**
```typescript
// Create src/lib/pointReleaseService.ts
// Add 30-day delay logic for point releases
// Create background job to process releases
```

## 🧪 **Testing Requirements**

### **Test Cases to Implement**
1. **Referral System**
   - Test referral code generation
   - Test referral signup process
   - Test point awarding
   - Test campaign limits

2. **Inactivity Logout**
   - Test 5-minute timeout
   - Test warning at 4 minutes
   - Test activity detection
   - Test logout functionality

3. **Transaction Editing**
   - Test 30-day edit window
   - Test required field validation
   - Test merchant permission checks
   - Test database updates

4. **SMS OTP**
   - Test OTP generation
   - Test 5-minute expiry
   - Test resend functionality
   - Test validation

## 📱 **Mobile Responsiveness**

All new components should be mobile-responsive:
- Use Tailwind responsive classes
- Test on mobile devices
- Ensure touch-friendly interfaces
- Optimize for small screens

## 🔒 **Security Considerations**

1. **Row Level Security (RLS)**
   - All new tables have RLS enabled
   - Test permission policies
   - Verify data isolation

2. **Input Validation**
   - Validate all user inputs
   - Sanitize data before database operations
   - Use proper error handling

3. **API Security**
   - Rate limiting on OTP endpoints
   - Secure payment processing
   - Validate merchant permissions

## 📊 **Monitoring & Analytics**

Add monitoring for:
- Referral conversion rates
- Transaction edit frequency
- OTP success rates
- Payment completion rates
- User inactivity patterns

## 🚀 **Deployment Checklist**

Before deploying:
- [ ] Run all database migrations
- [ ] Test all new functionality
- [ ] Verify mobile responsiveness
- [ ] Check security policies
- [ ] Update documentation
- [ ] Notify users of new features

## 📞 **Support & Maintenance**

- Monitor error logs for new components
- Track user feedback on new features
- Plan regular maintenance for background jobs
- Update documentation as features evolve

---

**Note**: This implementation guide provides a comprehensive roadmap for completing all missing requirements. Each component is designed to be modular and can be implemented independently.
