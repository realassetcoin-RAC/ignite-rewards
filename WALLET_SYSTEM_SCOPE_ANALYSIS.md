# Wallet System Scope Analysis

## 🎯 **Your Question:**
"Is this only applicable for Marketplace Assets and Initiative collection from user investments?"

## 📋 **Current Implementation Scope**

Based on the codebase analysis, the wallet system is currently designed for:

### 1. **Asset Initiatives** (Primary Use Case)
```sql
-- Asset Initiatives are investment opportunities
CREATE TABLE public.asset_initiatives (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'environmental', 'social', 'governance', 
        'technology', 'healthcare', 'education'
    )),
    impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 10),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_return DECIMAL(5,2) NOT NULL, -- percentage
    min_investment DECIMAL(18,8) NOT NULL DEFAULT 0,
    max_investment DECIMAL(18,8) NOT NULL DEFAULT 1000000,
    current_funding DECIMAL(18,8) NOT NULL DEFAULT 0,
    target_funding DECIMAL(18,8) NOT NULL DEFAULT 1000000,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    website_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

### 2. **User Asset Selections**
```sql
-- Users select ONE asset initiative for their reward flow
CREATE TABLE public.user_asset_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_initiative_id UUID NOT NULL REFERENCES public.asset_initiatives(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, asset_initiative_id, is_active) -- One active selection per user per asset
);
```

### 3. **Asset Wallets** (Current Implementation)
```sql
-- Wallets are linked to specific asset initiatives
CREATE TABLE public.asset_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    asset_initiative_id uuid NOT NULL, -- Links to specific asset initiative
    wallet_address text NOT NULL UNIQUE,
    currency_type text NOT NULL CHECK (currency_type IN ('USDT', 'ETH', 'BTC', 'SOL', 'BNB', 'RAC')),
    balance numeric(18, 8) NOT NULL DEFAULT 0,
    locked_balance numeric(18, 8) NOT NULL DEFAULT 0,
    total_invested numeric(18, 8) NOT NULL DEFAULT 0,
    total_returns numeric(18, 8) NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, asset_initiative_id, currency_type)
);
```

---

## 🔍 **Current Scope Analysis**

### ✅ **What It's Currently Designed For:**

1. **Asset Initiative Investments**
   - Users select ONE asset initiative for their reward flow
   - Wallets are created for specific asset initiatives
   - Investments flow into chosen asset initiatives
   - Returns come from asset initiative performance

2. **Multi-Currency Support**
   - USDT, ETH, BTC, SOL, BNB, RAC
   - Each currency can have separate wallets per asset initiative

3. **Investment Tracking**
   - Track investments into asset initiatives
   - Monitor returns from asset initiatives
   - Balance management per asset initiative

### ❌ **What It's NOT Currently Designed For:**

1. **General Purpose Wallets**
   - Not for general cryptocurrency storage
   - Not for personal use outside asset initiatives

2. **Merchant Payments**
   - Not for paying merchants directly
   - Not for loyalty program transactions

3. **NFT Purchases**
   - Not for buying loyalty NFTs
   - Not for NFT marketplace transactions

4. **General Trading**
   - Not for general cryptocurrency trading
   - Not for DeFi activities outside asset initiatives

---

## 🎯 **Answer to Your Question**

**YES, the current wallet system is specifically designed for:**

1. **Marketplace Assets** ✅
   - Asset initiatives are investment opportunities
   - Users can invest in different asset categories
   - Returns come from asset performance

2. **Initiative Collection from User Investments** ✅
   - Users select one asset initiative
   - All investments flow to that initiative
   - Wallets are created per asset initiative
   - Returns are tracked per asset initiative

---

## 🔄 **Potential Scope Expansion**

The wallet system could be expanded to support:

### 1. **General Purpose Wallets**
```sql
-- Add wallet_type field
ALTER TABLE public.asset_wallets 
ADD COLUMN wallet_type VARCHAR(20) DEFAULT 'asset_initiative' 
CHECK (wallet_type IN ('asset_initiative', 'general', 'merchant', 'nft'));
```

### 2. **Merchant Payment Wallets**
```sql
-- Link wallets to merchants for payments
ALTER TABLE public.asset_wallets 
ADD COLUMN merchant_id UUID REFERENCES public.merchants(id);
```

### 3. **NFT Purchase Wallets**
```sql
-- Link wallets to NFT purchases
ALTER TABLE public.asset_wallets 
ADD COLUMN nft_type_id UUID REFERENCES public.nft_types(id);
```

### 4. **General Trading Wallets**
```sql
-- Remove asset_initiative_id requirement for general wallets
ALTER TABLE public.asset_wallets 
ALTER COLUMN asset_initiative_id DROP NOT NULL;
```

---

## 🤔 **Recommendations**

### Option 1: **Keep Current Scope** (Recommended)
- Focus on asset initiative investments
- Keep system simple and focused
- Add features specific to asset initiatives

### Option 2: **Expand Scope**
- Add general purpose wallets
- Support merchant payments
- Support NFT purchases
- More complex but more flexible

### Option 3: **Hybrid Approach**
- Keep asset initiative wallets as primary
- Add optional general wallets
- Best of both worlds

---

## 📊 **Current Use Cases**

1. **User selects "Environmental" asset initiative**
2. **Creates USDT wallet for that initiative**
3. **Invests 1000 USDT into environmental projects**
4. **Receives returns based on environmental project performance**
5. **Can create additional wallets for same initiative (ETH, BTC, etc.)**

---

## 🎯 **Conclusion**

**The current wallet system is specifically designed for Asset Initiative investments and collections.** It's not a general-purpose wallet system, but rather a specialized system for managing investments in specific asset categories.

**Would you like to:**
- **A)** Keep the current scope (asset initiatives only)
- **B)** Expand to general purpose wallets
- **C)** Add specific use cases (merchant payments, NFT purchases)
- **D)** Implement a hybrid approach

Let me know your preference and I can modify the system accordingly! 🚀
