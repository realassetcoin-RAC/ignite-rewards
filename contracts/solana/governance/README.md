# Governance System Contracts

## 📋 **Overview**

The Governance System consists of three specialized contracts that enforce DAO approval for all system changes, ensuring compliance with the core rule: "Any changes that change the behavior of the loyalty application must create a DAO record for voting."

## 🏗️ **Contract Architecture**

### **1. Loyalty Governance Contract** (`loyalty_governance.rs`)
Manages loyalty system parameter changes that require DAO approval.

### **2. Merchant Governance Contract** (`merchant_governance.rs`)
Manages merchant-related parameter changes that require DAO approval.

### **3. Integration Governance Contract** (`integration_governance.rs`)
Manages third-party integration parameter changes that require DAO approval.

## ✨ **Key Features**

### **Change Management**
- ✅ **Proposal Creation**: Create proposals for system changes
- ✅ **DAO Integration**: Automatic DAO proposal creation
- ✅ **Approval Validation**: Validate DAO approval before execution
- ✅ **Change Execution**: Execute approved changes safely
- ✅ **Audit Trail**: Complete history of all changes

### **Governance Types**

#### **Loyalty Changes**
- Point Release Delay (30-day delay changes)
- Referral Parameters (points per referral, max referrals)
- NFT Ratios (earning ratios, upgrade bonuses)
- Loyalty Network Settings (conversion rates, OTP validity)
- Merchant Limits (transaction caps, point limits)
- Inactivity Timeout (logout duration changes)
- SMS OTP Settings (OTP validity, rate limits)
- Subscription Plans (plan features, pricing)
- Asset Initiative Selection
- Wallet Management
- Payment Gateway
- Email Notifications

#### **Merchant Changes**
- Subscription Limits (transaction caps, point limits)
- Transaction Edit Window (30-day edit window changes)
- Discount Code Policies
- Point Distribution Limits
- Merchant Verification

#### **Integration Changes**
- Loyalty Network Settings
- SMS OTP Settings
- Email Notification Settings
- Payment Gateway Settings
- Third-Party API Settings

## 🔧 **Contract Functions**

### **Common Functions (All Contracts)**
```rust
// Initialize governance system
pub fn initialize_*_governance(...) -> Result<()>

// Propose a change
pub fn propose_*_change(...) -> Result<()>

// Create DAO proposal
pub fn create_dao_proposal_for_*_change(...) -> Result<()>

// Validate approval
pub fn validate_*_change_approval(...) -> Result<()>

// Execute approved change
pub fn execute_approved_*_change(...) -> Result<()>

// Get change details
pub fn get_*_change(...) -> Result<*ChangeData>
```

### **Data Structures**
```rust
pub struct *Governance {
    pub authority: Pubkey,
    pub dao_program_id: Pubkey,
    pub is_active: bool,
    pub total_changes: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct *Change {
    pub id: u64,
    pub change_type: *ChangeType,
    pub parameter_name: String,
    pub old_value: String,
    pub new_value: String,
    pub reason: String,
    pub proposed_by: Pubkey,
    pub status: *ChangeStatus,
    pub dao_proposal_id: Option<u64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub approved_at: Option<i64>,
    pub implemented_at: Option<i64>,
}
```

## 🔄 **Governance Workflow**

### **1. Change Proposal**
```rust
// Propose a change
propose_loyalty_change(
    change_type: LoyaltyChangeType::PointReleaseDelay,
    parameter_name: "release_delay_days".to_string(),
    old_value: "30".to_string(),
    new_value: "45".to_string(),
    reason: "Extend delay for better security".to_string()
)
```

### **2. DAO Proposal Creation**
```rust
// Create DAO proposal
create_dao_proposal_for_change(
    change_id: 1,
    proposal_title: "Extend Point Release Delay".to_string(),
    proposal_description: "Increase point release delay from 30 to 45 days".to_string()
)
```

### **3. DAO Voting**
- DAO members vote on the proposal
- Proposal status changes to `Passed` or `Rejected`

### **4. Approval Validation**
```rust
// Validate DAO approval
validate_change_approval(change_id: 1)
```

### **5. Change Execution**
```rust
// Execute approved change
execute_approved_change(change_id: 1)
```

## 🔧 **Deployment**

### **Build All Governance Contracts**
```bash
cd contracts/solana/governance

# Build loyalty governance
cd loyalty_governance
anchor build

# Build merchant governance  
cd ../merchant_governance
anchor build

# Build integration governance
cd ../integration_governance
anchor build
```

### **Deploy to Devnet**
```bash
# Deploy all contracts
anchor deploy --provider.cluster devnet
```

## 📊 **Integration**

### **Frontend Integration**
```typescript
// Initialize governance programs
const loyaltyGov = new Program(loyaltyGovIdl, loyaltyGovProgramId, provider);
const merchantGov = new Program(merchantGovIdl, merchantGovProgramId, provider);
const integrationGov = new Program(integrationGovIdl, integrationGovProgramId, provider);

// Propose a loyalty change
await loyaltyGov.methods
  .proposeLoyaltyChange(
    changeType,
    parameterName,
    oldValue,
    newValue,
    reason
  )
  .accounts({
    loyaltyGovernance: loyaltyGovernancePDA,
    loyaltyChange: loyaltyChangePDA,
    proposer: proposerKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## 🔒 **Security Features**

### **Access Control**
- ✅ **Authority Validation**: Only authorized users can propose changes
- ✅ **DAO Integration**: All changes require DAO approval
- ✅ **State Validation**: Proper state transitions and validation
- ✅ **Execution Control**: Only approved changes can be executed

### **Audit Trail**
- ✅ **Complete History**: All changes are logged with timestamps
- ✅ **Change Tracking**: Track old and new values
- ✅ **Proposal Linking**: Link changes to DAO proposals
- ✅ **Status Monitoring**: Track change status through workflow

## 🧪 **Testing**

### **Unit Tests**
```bash
# Test each governance contract
anchor test
```

### **Integration Tests**
```bash
# Test governance workflow
npm run test:governance
```

## 📈 **Performance**

- ✅ **Efficient Storage**: Optimized data structures
- ✅ **Batch Operations**: Support for batch changes
- ✅ **Gas Optimization**: Minimal gas usage for operations
- ✅ **Scalable Design**: Supports high-volume governance

## 🔄 **Maintenance**

### **Regular Tasks**
- Monitor governance activity
- Review change proposals
- Update governance parameters
- Audit change history

### **Upgrade Procedures**
- DAO approval required for contract upgrades
- Backward compatibility maintenance
- Migration scripts for governance data
- Testing in staging environment

---

**Status**: ✅ **PRODUCTION READY**

