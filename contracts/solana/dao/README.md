# Loyalty NFT System Contract

## 📋 **Overview**

The Loyalty NFT System contract (`loyalty_nft_system.rs`) is the core contract for managing loyalty NFTs in the RAC Rewards Platform. It handles NFT creation, upgrades, evolution, and integration with the DAO governance system.

## ✨ **Key Features**

### **NFT Types & Rarities**
- **Pearl White** (Common) - Free/100 USDT
- **Lava Orange** (Less Common) - 100/500 USDT  
- **Pink** (Less Common) - 100/500 USDT
- **Silver** (Rare) - 200/1000 USDT
- **Gold** (Rare) - 300/1000 USDT
- **Black** (Very Rare) - 500/2500 USDT

### **Core Functionality**
- ✅ **NFT Creation & Minting**: Create and mint loyalty NFTs
- ✅ **NFT Upgrades**: Increase earning ratios (custodial only)
- ✅ **NFT Evolution**: Investment-based evolution with 3D unlock
- ✅ **Auto-Staking**: Irreversible auto-staking feature
- ✅ **Fractional Investment**: Invest in tokenized assets
- ✅ **DAO Integration**: Community-driven parameter changes

## 🏗️ **Contract Structure**

### **Main Functions**
```rust
// NFT Management
pub fn create_nft(...) -> Result<()>
pub fn update_nft(...) -> Result<()>
pub fn upgrade_nft(...) -> Result<()>
pub fn evolve_nft(...) -> Result<()>

// RAC Token Management
pub fn create_rac_mint(...) -> Result<()>
pub fn mint_rac_tokens(...) -> Result<()>

// Rewards Configuration
pub fn initialize_rewards_config(...) -> Result<()>
pub fn update_rewards_config(...) -> Result<()>

// DAO Integration
pub fn create_proposal(...) -> Result<()>
pub fn vote_on_proposal(...) -> Result<()>
pub fn execute_proposal(...) -> Result<()>
```

### **Data Structures**
```rust
pub struct NftAccount {
    // Basic Information
    pub collection_name: String,
    pub nft_name: String,
    pub display_name: String,
    
    // Pricing & Minting
    pub buy_price_usdt: u64,
    pub rarity: String,
    pub mint_quantity: u64,
    
    // Features & Capabilities
    pub is_upgradeable: bool,
    pub is_evolvable: bool,
    pub is_fractional_eligible: bool,
    
    // Auto Staking
    pub auto_staking_duration: String,
    
    // Earning Ratios
    pub earn_on_spend_ratio: u64,
    pub upgrade_bonus_ratio: u64,
    
    // Evolution Settings
    pub evolution_min_investment: u64,
    pub evolution_earnings_ratio: u64,
    
    // Metadata
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}
```

## 🔧 **Deployment**

### **Build Contract**
```bash
cd contracts/solana/dao
anchor build
```

### **Deploy to Devnet**
```bash
anchor deploy --provider.cluster devnet
```

### **Deploy to Mainnet**
```bash
anchor deploy --provider.cluster mainnet-beta
```

## 📊 **Integration**

### **Frontend Integration**
```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

// Initialize program
const program = new Program(idl, programId, provider);

// Create NFT
await program.methods
  .createNft(
    collectionName,
    nftName,
    displayName,
    symbol,
    uri,
    isCustodial,
    buyPriceUsdt,
    rarity,
    mintQuantity,
    isUpgradeable,
    isEvolvable,
    isFractionalEligible,
    autoStakingDuration,
    earnOnSpendRatio,
    upgradeBonusRatio,
    evolutionMinInvestment,
    evolutionEarningsRatio
  )
  .accounts({
    nftAccount: nftAccountPDA,
    admin: adminKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## 🔒 **Security Features**

- ✅ **Admin Controls**: Only authorized admins can create/update NFTs
- ✅ **DAO Governance**: Parameter changes require DAO approval
- ✅ **Input Validation**: All inputs are validated and sanitized
- ✅ **State Management**: Proper state transitions and validation
- ✅ **Access Control**: Role-based permissions for all operations

## 🧪 **Testing**

### **Unit Tests**
```bash
anchor test
```

### **Integration Tests**
```bash
npm run test:integration
```

## 📈 **Performance**

- ✅ **Gas Optimized**: Efficient data structures and operations
- ✅ **Scalable**: Supports high-volume NFT operations
- ✅ **Upgradeable**: Modular design for future enhancements

---

**Status**: ✅ **PRODUCTION READY**

