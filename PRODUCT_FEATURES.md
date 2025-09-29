# RAC Rewards Platform - Complete Product Features

## 📋 **Table of Contents**
1. [Platform Overview](#platform-overview)
2. [User Types & Access](#user-types--access)
3. [Loyalty NFT System](#loyalty-nft-system)
4. [Web3 Investment System](#web3-investment-system)
5. [Merchant Dashboard](#merchant-dashboard)
6. [Referral System](#referral-system)
7. [Third-Party Integration](#third-party-integration)
8. [Security & Compliance](#security--compliance)
9. [Technical Features](#technical-features)
10. [Implementation Status](#implementation-status)

---

## 🎯 **Platform Overview**

The RAC Rewards Platform is a comprehensive Web3-native loyalty and investment ecosystem that combines traditional loyalty programs with blockchain technology, NFT-based rewards, and direct investment opportunities in impactful asset initiatives.

### **Core Value Proposition**
- **Dual User Experience**: Custodial and Non-Custodial wallet support
- **NFT-Based Loyalty**: Unique loyalty cards with upgradeable benefits
- **Web3 Investment**: Direct investment in environmental, social, and governance initiatives
- **Merchant Integration**: Complete merchant dashboard with custom NFT creation
- **Global Reach**: GMT timezone enforcement for worldwide consistency

---

## 👥 **User Types & Access**

### **A. Custodial Users (Platform Wallet Users)**

#### **Signup Process**
- ✅ **Email/Google Authentication**: Signup via email or Google OAuth
- ✅ **Terms Acceptance**: Automatic terms of use and privacy policy acceptance
- ✅ **Loyalty NFT Assignment**: Automatic free loyalty NFT card with predefined benefits
- ✅ **Wallet Creation**: Automatic wallet address creation with 12-word seed phrase
- ✅ **Loyalty Number**: Unique 8-character loyalty number (e.g., J0000001)

#### **Authentication & Security**
- ✅ **Seed Phrase Backup**: Option to backup seed phrases for account recovery
- ✅ **Seed Phrase Login**: Login capability using seed phrases
- ✅ **Wallet Display**: Wallet address display in user dashboard
- ✅ **Google Auth Disable**: Option to disable Google auth for seed phrase-only access
- ✅ **Session Management**: 5-minute inactivity logout
- ✅ **MFA System**: TOTP-based multi-factor authentication with backup codes

#### **Solana Custodial Wallet System**
- ✅ **Automatic Wallet Creation**: Unique Solana custodial wallet automatically created for ALL users (email + Google)
- ✅ **Unique Seed Phrases**: Each user gets a unique 12-word BIP39 seed phrase for their wallet
- ✅ **Universal Access**: Both email and Google users receive Solana wallets by default
- ✅ **Seed Phrase Backup**: Users can backup their seed phrases through the dashboard
- ✅ **Seed Phrase Login**: Users can login using their seed phrases instead of email/Google
- ✅ **Auth Method Control**: Users can disable email/Google authentication and use only seed phrases
- ✅ **Wallet Management**: Complete wallet creation, backup, and recovery system
- ✅ **Database Integration**: Standardized `user_solana_wallets` table for all wallet operations
- ✅ **Security Features**: Encrypted seed phrase storage with secure backup options

#### **Loyalty NFT Management**
- ✅ **One NFT Limit**: Maximum one loyalty NFT per account
- ✅ **NFT Upgrade**: Upgrade feature with payment gateway integration
- ✅ **Payment Integration**: "Proceed to Pay" popup for NFT purchases
- ✅ **New Transaction Benefits**: New NFT features apply only to new transactions
- ✅ **Dashboard Display**: Loyalty card display in top-left section

#### **Investment System**
- ✅ **RAC Rewards Investment**: Use earned RAC rewards for micro-investments
- ✅ **Asset Initiative Selection**: Choose one asset/initiative for investment flow
- ✅ **DEX Integration**: Convert RAC to USDT via decentralized exchanges
- ✅ **Multi-Currency Support**: Support for USDT, ETH, BTC, SOL investments

### **B. Non-Custodial Users (External Wallet Users)**

#### **Core Features**
- ✅ **External Wallet Connection**: Connect MetaMask, Phantom, Trust Wallet, etc.
- ✅ **Wallet Verification**: Cryptographic signature verification for ownership
- ✅ **Direct Investment**: Invest directly from external wallets
- ✅ **Multi-Currency Support**: USDT, SOL, ETH, BTC investment support
- ✅ **Same Loyalty Features**: All loyalty features available to non-custodial users

---

## 🎨 **Loyalty NFT System**

### **NFT Types & Attributes**

#### **Custodial NFT Cards (Free for Platform Users)**
| Card Type | Price | Upgrade | Evolve | Rarity | Mint | Auto Staking | Earn on Spend | Upgrade Bonus | Evolution Min Investment | Evolution Earnings |
|-----------|-------|---------|--------|--------|------|--------------|---------------|---------------|------------------------|-------------------|
| Pearl White | $0 | Yes | Yes | Common | 10,000 | Forever | 1.00% | 0.00% | 100 RAC | 0.25% |
| Lava Orange | $100 | Yes | Yes | Less Common | 3,000 | Forever | 1.10% | 0.10% | 500 RAC | 0.50% |
| Pink | $100 | Yes | Yes | Less Common | 3,000 | Forever | 1.10% | 0.10% | 500 RAC | 0.50% |
| Silver | $200 | Yes | Yes | Rare | 750 | Forever | 1.20% | 0.15% | 1,000 RAC | 0.75% |
| Gold | $300 | Yes | Yes | Rare | 750 | Forever | 1.30% | 0.20% | 1,500 RAC | 1.00% |
| Black | $500 | Yes | Yes | Very Rare | 250 | Forever | 1.40% | 0.30% | 2,500 RAC | 1.25% |

#### **Non-Custodial NFT Cards (For External Wallet Users)**
| Card Type | Price | Upgrade | Evolve | Rarity | Mint | Auto Staking | Earn on Spend | Upgrade Bonus | Evolution Min Investment | Evolution Earnings |
|-----------|-------|---------|--------|--------|------|--------------|---------------|---------------|------------------------|-------------------|
| Pearl White | $100 | No | Yes | Common | 10,000 | Forever | 1.00% | 0.00% | 500 RAC | 0.50% |
| Lava Orange | $500 | No | Yes | Less Common | 3,000 | Forever | 1.10% | 0.00% | 2,500 RAC | 1.25% |
| Pink | $500 | No | Yes | Less Common | 3,000 | Forever | 1.10% | 0.00% | 2,500 RAC | 1.25% |
| Silver | $1,000 | No | Yes | Rare | 750 | Forever | 1.20% | 0.00% | 5,000 RAC | 0.15% |
| Gold | $1,000 | No | Yes | Rare | 750 | Forever | 1.30% | 0.00% | 5,000 RAC | 0.20% |
| Black | $2,500 | No | Yes | Very Rare | 250 | Forever | 1.40% | 0.00% | 13,500 RAC | 0.30% |

### **NFT Features**
- ✅ **Auto-Staking**: Optional automatic reward locking
- ✅ **Collections**: Support for different NFT collection types
- ✅ **Rarity System**: Dynamic rarity levels with future updates
- ✅ **Minting Control**: Defined number of NFTs per collection
- ✅ **Fractionalized Investment**: NFT holders can invest in fractionalized assets
- ✅ **Evolution System**: 3D NFT generation for eligible users
- ✅ **Upgrade System**: Enhanced benefits for upgraded NFTs

---

## 💰 **Web3 Investment System**

### **Asset Initiatives**
- ✅ **Environmental Projects**: Renewable energy, climate solutions
- ✅ **Social Impact**: Education, healthcare, community development
- ✅ **Governance**: Transparent governance and voting systems
- ✅ **Technology**: Innovation and digital transformation
- ✅ **Healthcare**: Medical research and healthcare access
- ✅ **Education**: Learning platforms and educational resources

### **Investment Features**
- ✅ **Multi-Sig Wallets**: Each initiative has secure multi-signature wallets
- ✅ **Hot/Cold Storage**: Separate hot and cold wallet management
- ✅ **Direct Investment**: Users invest directly from their Web3 wallets
- ✅ **Real-Time Tracking**: Live investment monitoring and returns
- ✅ **Multi-Currency**: Support for USDT, ETH, BTC, SOL, RAC
- ✅ **Risk Assessment**: Low, medium, high risk categorization
- ✅ **Impact Scoring**: 1-10 impact score for each initiative
- ✅ **Expected Returns**: Transparent return expectations

### **Investment Flow**
1. **Browse Initiatives**: Users explore available asset initiatives
2. **Select Initiative**: Choose preferred investment opportunity
3. **Connect Wallet**: Link Web3 wallet (MetaMask, Phantom, etc.)
4. **Verify Ownership**: Cryptographic signature verification
5. **Invest Directly**: Send funds to multi-sig wallet
6. **Track Returns**: Monitor investment performance and returns

---

## 🏪 **Merchant Dashboard**

### **Subscription Plans**
| Plan | Monthly Price | Yearly Price | Monthly Points | Transactions | Features |
|------|---------------|--------------|----------------|--------------|----------|
| StartUp | $20 | $150 | 100 | 100 | Basic loyalty, email support |
| Momentum | $50 | $500 | 300 | 300 | Advanced features, priority support |
| Energizer | $100 | $1,000 | 600 | 600 | Premium features, account manager |
| Cloud | $250 | $2,500 | 1,800 | 1,800 | Enterprise features, 24/7 support |
| Super | $500 | $5,000 | 4,000 | 4,000 | Ultimate features, white-label |

### **Merchant Features**
- ✅ **Transaction Management**: Edit transactions within 30 days
- ✅ **QR Code Generation**: Create transaction QR codes
- ✅ **Customer Management**: Track customer loyalty and points
- ✅ **Analytics Dashboard**: Comprehensive business insights
- ✅ **Custom NFT Creation**: Create branded loyalty NFTs (Momentum+ plans)
- ✅ **Discount Programs**: Set up discount codes and promotions
- ✅ **Subscription Management**: Upgrade/downgrade plans
- ✅ **Payment Processing**: Integrated payment gateway

### **Custom NFT Features (Momentum+ Plans)**
- ✅ **Branded NFTs**: Upload custom loyalty NFT designs
- ✅ **Discount Integration**: Embed discount codes in NFTs
- ✅ **QR Code Generation**: Unique QR codes for each NFT
- ✅ **Usage Tracking**: Monitor NFT usage and redemption
- ✅ **Validity Management**: Set expiration dates and limits

---

## 🔗 **Referral System**

### **Referral Types**
- ✅ **User-to-User**: Standard points for referring other users
- ✅ **User-to-Merchant**: Higher points for referring merchants
- ✅ **Merchant-to-User**: Merchants can refer users
- ✅ **Merchant-to-Merchant**: Merchants can refer other merchants

### **Campaign Management**
- ✅ **Campaign Types**: 'user', 'merchant', or 'both' campaigns
- ✅ **GMT Timezone**: All dates stored and displayed in GMT
- ✅ **Campaign Caps**: Maximum referrals per user
- ✅ **Automatic Settlement**: Referral rewards when criteria met
- ✅ **Admin Dashboard**: Complete campaign management interface

### **Referral Features**
- ✅ **Referral Codes**: Unique codes for each user/merchant
- ✅ **Signup Integration**: Referral code fields in signup/login
- ✅ **Point Rewards**: Configurable point rewards per referral
- ✅ **Tracking System**: Complete referral tracking and analytics

---

## 🔌 **Third-Party Integration**

### **Loyalty Network Integration**
- ✅ **Network Management**: Admin-defined loyalty networks
- ✅ **Conversion Rates**: Configurable point conversion rates
- ✅ **SMS OTP**: 5-minute validity with resend functionality
- ✅ **Transfer System**: Port rewards from other loyalty partners
- ✅ **Email Notifications**: Linking and transfer completion emails
- ✅ **Mobile Verification**: SMS OTP for account linking

### **Supported Integrations**
- ✅ **Email Service**: Comprehensive email notification system
- ✅ **SMS Service**: OTP verification and notifications
- ✅ **Payment Gateways**: Stripe, PayPal, Square integration
- ✅ **Blockchain**: Solana NFT service integration
- ✅ **DEX Integration**: Uniswap, PancakeSwap, Raydium, Jupiter

---

## 🔒 **Security & Compliance**

### **OWASP Top 10 Compliance**
- ✅ **A01 - Access Control**: Proper authentication and authorization
- ✅ **A02 - Cryptographic Failures**: Strong encryption and hashing
- ✅ **A03 - Injection**: Parameterized queries and input validation
- ✅ **A04 - Insecure Design**: Security-by-default principles
- ✅ **A05 - Security Misconfiguration**: Secure defaults and configurations
- ✅ **A06 - Vulnerable Components**: Regular dependency updates
- ✅ **A07 - Authentication Failures**: MFA and strong password policies
- ✅ **A08 - Data Integrity**: Code signing and integrity checks
- ✅ **A09 - Logging Failures**: Comprehensive audit logging
- ✅ **A10 - SSRF**: URL validation and allowlists

### **Database Security**
- ✅ **Row Level Security**: RLS policies on all tables
- ✅ **Encrypted Storage**: Sensitive data encryption
- ✅ **Access Control**: Minimal required permissions
- ✅ **Audit Logging**: Complete database access logging

### **Application Security**
- ✅ **CSP Headers**: Content Security Policy implementation
- ✅ **Secure Headers**: HSTS, X-Frame-Options, etc.
- ✅ **Rate Limiting**: API endpoint rate limiting
- ✅ **Input Validation**: Comprehensive input sanitization
- ✅ **Error Handling**: Secure error messages without information disclosure

---

## 🛠️ **Technical Features**

### **Database Architecture**
- ✅ **PostgreSQL**: Primary database with Supabase
- ✅ **UUID Primary Keys**: Secure identifier generation
- ✅ **Foreign Key Constraints**: Data integrity enforcement
- ✅ **Indexes**: Performance optimization
- ✅ **Triggers**: Automated data updates
- ✅ **Functions**: Reusable database logic

### **Frontend Technology**
- ✅ **React/TypeScript**: Modern frontend framework
- ✅ **Next.js**: Server-side rendering and routing
- ✅ **Tailwind CSS**: Utility-first styling
- ✅ **Shadcn/ui**: Component library
- ✅ **React Hook Form**: Form management
- ✅ **Lucide Icons**: Consistent iconography

### **Backend Services**
- ✅ **Supabase**: Backend-as-a-Service
- ✅ **Real-time**: Live data synchronization
- ✅ **Authentication**: Built-in auth system
- ✅ **Storage**: File and image storage
- ✅ **Edge Functions**: Serverless functions

### **Web3 Integration**
- ✅ **Wallet Connection**: MetaMask, Phantom, Trust Wallet
- ✅ **Smart Contracts**: Solana NFT integration
- ✅ **Blockchain Monitoring**: Transaction tracking
- ✅ **Multi-Sig Wallets**: Secure asset management
- ✅ **DEX Integration**: Decentralized exchange support

### **Solana Custodial Wallet Implementation**
- ✅ **Automatic Wallet Creation**: `SolanaWalletService.createWalletForUser()` creates wallets during signup
- ✅ **BIP39 Seed Generation**: Unique 12-word seed phrases using industry-standard BIP39
- ✅ **Database Storage**: Standardized `user_solana_wallets` table with encrypted seed phrases
- ✅ **Auth Integration**: `AuthCallback.tsx` automatically creates wallets for all users
- ✅ **Seed Phrase Backup**: `SeedPhraseBackup.tsx` component for secure backup management
- ✅ **Seed Phrase Login**: `SeedPhraseLoginModal.tsx` with database authentication function
- ✅ **Auth Control**: `SeedPhraseManager.tsx` allows disabling email/Google authentication
- ✅ **Database Function**: `authenticate_with_seed_phrase()` function for secure login
- ✅ **Universal Access**: Both email and Google users receive Solana wallets automatically
- ✅ **Security Features**: Encrypted storage, secure backup, and recovery options

---

## 📊 **Implementation Status**

### **✅ Completed Features**
- [x] **User Authentication**: Email, Google OAuth, seed phrase login
- [x] **Solana Custodial Wallet System**: Automatic wallet creation, seed phrase management, auth control
- [x] **Loyalty NFT System**: Complete NFT management and upgrades
- [x] **Merchant Dashboard**: Full merchant management system
- [x] **Referral System**: Complete referral campaign management
- [x] **Third-Party Integration**: Email, SMS, payment gateways
- [x] **Web3 Investment**: Asset initiative investment system
- [x] **Security Implementation**: OWASP compliance and RLS
- [x] **Database Schema**: Complete database architecture
- [x] **Frontend Components**: All major UI components
- [x] **GMT Timezone**: Global timezone consistency

### **🔄 In Progress**
- [ ] **Real-time Investment Tracking**: Live blockchain monitoring
- [ ] **Advanced Analytics**: Comprehensive reporting dashboard
- [ ] **Mobile App**: React Native mobile application
- [ ] **API Documentation**: Complete API documentation

### **📋 Planned Features**
- [ ] **White-label Solution**: Customizable platform branding
- [ ] **Advanced NFT Features**: More NFT types and benefits
- [ ] **Gamification**: Achievement and reward systems
- [ ] **Social Features**: Community and social interactions
- [ ] **Advanced Analytics**: AI-powered insights and recommendations

---

## 🎯 **Key Differentiators**

1. **Web3-Native**: Built from the ground up for Web3 integration
2. **Universal Solana Wallets**: Automatic Solana custodial wallet creation for ALL users (email + Google)
3. **Dual User Experience**: Seamless custodial and non-custodial support
4. **Seed Phrase Authentication**: Users can login with seed phrases and disable traditional auth
5. **Impact Investment**: Direct investment in meaningful initiatives
6. **NFT-Based Loyalty**: Unique loyalty system with upgradeable benefits
7. **Global Consistency**: GMT timezone enforcement for worldwide users
8. **Security-First**: Comprehensive security and compliance implementation
9. **Merchant-Focused**: Complete merchant dashboard and management tools
10. **Scalable Architecture**: Built to handle millions of users and transactions

---

## 📈 **Success Metrics**

- **User Engagement**: Daily active users and session duration
- **Investment Volume**: Total amount invested in asset initiatives
- **Merchant Adoption**: Number of active merchants and transactions
- **NFT Utilization**: NFT upgrades and evolution rates
- **Referral Success**: Referral conversion rates and rewards distributed
- **Security Compliance**: Zero security incidents and audit results

---

*This document serves as the comprehensive specification for the RAC Rewards Platform. All features listed are either implemented, in progress, or planned for future development.*

---

## 📅 **Recent Updates**

### **January 28, 2025 - Solana Custodial Wallet System Implementation**
- ✅ **Complete Implementation**: Automatic Solana wallet creation for ALL users (email + Google)
- ✅ **Seed Phrase Management**: Full backup, login, and recovery system
- ✅ **Auth Control**: Users can disable email/Google authentication and use only seed phrases
- ✅ **Database Standardization**: Unified `user_solana_wallets` table across all components
- ✅ **Security Features**: BIP39 seed generation, encrypted storage, secure authentication
- ✅ **Universal Access**: Both email and Google users receive Solana wallets automatically

**Implementation Files:**
- `src/pages/AuthCallback.tsx` - Automatic wallet creation during signup
- `src/lib/solanaWalletService.ts` - Wallet management service
- `src/components/SeedPhraseBackup.tsx` - Seed phrase backup interface
- `src/components/SeedPhraseLoginModal.tsx` - Seed phrase login functionality
- `src/components/SeedPhraseManager.tsx` - Auth control and management
- Database function: `authenticate_with_seed_phrase()` for secure login
