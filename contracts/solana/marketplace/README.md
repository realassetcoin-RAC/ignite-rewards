# Investment Marketplace Contract

## 📋 **Overview**

The Investment Marketplace contract (`investment_marketplace.rs`) handles tokenized asset listings, fractionalized ownership, investment tracking, and passive income distribution for the RAC Rewards Platform.

## ✨ **Key Features**

### **Asset Management**
- ✅ **Tokenized Listings**: Create tokenized asset initiatives
- ✅ **Fractional Ownership**: Enable fractional investment in assets
- ✅ **Multi-Currency Support**: USDT, SOL, ETH, BTC investment support
- ✅ **NFT Multipliers**: Enhanced returns for NFT holders
- ✅ **Investment Tracking**: Complete investment history and returns

### **Campaign Types**
- **Environmental Initiatives**: Green energy, carbon offset, sustainability
- **Social Impact**: Education, healthcare, community development
- **Governance Projects**: DAO governance, voting systems, transparency
- **Time-Bound Campaigns**: Limited-time investment opportunities

## 🏗️ **Contract Structure**

### **Main Functions**
```rust
// Listing Management
pub fn initialize_listing(...) -> Result<()>
pub fn update_listing(...) -> Result<()>
pub fn close_listing(...) -> Result<()>

// Investment Operations
pub fn invest(...) -> Result<()>
pub fn withdraw_investment(...) -> Result<()>
pub fn claim_returns(...) -> Result<()>

// Asset Management
pub fn distribute_returns(...) -> Result<()>
pub fn update_asset_value(...) -> Result<()>
pub fn liquidate_asset(...) -> Result<()>
```

### **Data Structures**
```rust
pub struct Listing {
    pub listing_id: u64,
    pub creator: Pubkey,
    pub total_funding_goal: u64,
    pub current_funding_amount: u64,
    pub token_price: u64,
    pub end_date: i64,
    pub campaign_type: CampaignType,
    pub status: ListingStatus,
    pub total_investors: u64,
    pub total_token_supply: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct Investment {
    pub investor: Pubkey,
    pub listing_id: u64,
    pub investment_amount: u64,
    pub tokens_received: u64,
    pub nft_multiplier: u64,
    pub effective_amount: u64,
    pub investment_date: i64,
    pub current_value: u64,
    pub total_returns: u64,
    pub is_active: bool,
}

pub struct AssetInitiative {
    pub initiative_id: u64,
    pub name: String,
    pub description: String,
    pub category: String,
    pub target_amount: u64,
    pub current_amount: u64,
    pub return_rate: u64,
    pub risk_level: u8,
    pub duration_months: u16,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}
```

## 🎯 **Investment Flow**

### **1. Asset Listing Creation**
```rust
// Create a new asset listing
initialize_listing(
    listing_id: 1,
    total_funding_goal: 1000000, // 1M USDT
    token_price: 100,            // 100 USDT per token
    end_date: 1640995200,        // Campaign end date
    campaign_type: CampaignType::Environmental
)
```

### **2. Investment Process**
```rust
// Invest in a listing
invest(
    investment_amount: 10000,    // 10K USDT
    nft_multiplier: 150          // 1.5x multiplier for NFT holders
)
```

### **3. Return Distribution**
```rust
// Distribute returns to investors
distribute_returns(
    listing_id: 1,
    return_amount: 50000         // 50K USDT in returns
)
```

### **4. Investment Withdrawal**
```rust
// Withdraw investment (if allowed)
withdraw_investment(
    listing_id: 1,
    withdrawal_amount: 5000      // 5K USDT withdrawal
)
```

## 🔧 **Deployment**

### **Build Contract**
```bash
cd contracts/solana/marketplace
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

// Initialize marketplace program
const marketplace = new Program(marketplaceIdl, marketplaceProgramId, provider);

// Create asset listing
await marketplace.methods
  .initializeListing(
    listingId,
    totalFundingGoal,
    tokenPrice,
    endDate,
    campaignType
  )
  .accounts({
    listing: listingPDA,
    creator: creatorKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Invest in asset
await marketplace.methods
  .invest(investmentAmount, nftMultiplier)
  .accounts({
    listing: listingPDA,
    investment: investmentPDA,
    investor: investorKeypair.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

## 🔒 **Security Features**

### **Investment Protection**
- ✅ **Funding Validation**: Validate investment amounts and limits
- ✅ **Campaign Validation**: Ensure campaigns are active and not expired
- ✅ **Multiplier Validation**: Validate NFT multiplier calculations
- ✅ **Withdrawal Controls**: Controlled withdrawal mechanisms

### **Asset Security**
- ✅ **Creator Verification**: Verify asset creators and their authority
- ✅ **Value Validation**: Validate asset values and return calculations
- ✅ **Liquidation Protection**: Protect against unauthorized liquidations
- ✅ **Audit Trail**: Complete investment and return history

## 🧪 **Testing**

### **Unit Tests**
```bash
anchor test
```

### **Integration Tests**
```bash
npm run test:marketplace
```

### **Load Tests**
```bash
npm run test:load:marketplace
```

## 📈 **Performance**

### **Optimization Features**
- ✅ **Gas Efficient**: Optimized for minimal transaction costs
- ✅ **Batch Operations**: Support for batch investments and returns
- ✅ **Scalable Design**: Handles high-volume investment operations
- ✅ **Memory Efficient**: Optimized data structures and storage

### **Scalability**
- ✅ **Horizontal Scaling**: Support for multiple asset initiatives
- ✅ **Vertical Scaling**: Handle large investment amounts
- ✅ **Network Scaling**: Optimized for Solana network performance
- ✅ **Storage Scaling**: Efficient storage management

## 🔄 **Maintenance**

### **Regular Tasks**
- Monitor investment performance
- Update asset values
- Distribute returns
- Audit investment history

### **Upgrade Procedures**
- DAO approval required for contract upgrades
- Backward compatibility maintenance
- Migration scripts for investment data
- Testing in staging environment

## 📊 **Analytics & Reporting**

### **Investment Metrics**
- Total investments by asset
- Return rates and performance
- Investor distribution
- Campaign success rates

### **Asset Performance**
- Asset value tracking
- Return distribution history
- Risk assessment metrics
- Liquidation events

---

**Status**: ✅ **PRODUCTION READY**

