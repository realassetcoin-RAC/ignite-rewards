# Smart Contract Governance Scope

## Overview

The RAC Rewards smart contracts are designed to handle **only DAO-governed operations** and **core NFT functionality**. Routine operations like user signups, merchant onboarding, and individual NFT upgrades are handled by the **application layer** (frontend/backend), not the smart contracts.

## ✅ **Smart Contract Responsibilities**

### **1. DAO Governance Operations**
- **Proposal Creation**: Creating governance proposals for platform changes
- **Voting**: Casting votes on proposals
- **Proposal Execution**: Executing approved proposals
- **Configuration Updates**: Updating platform parameters through DAO approval

### **2. Core NFT Functionality**
- **NFT Creation**: Creating new NFT collections (admin function)
- **NFT Evolution**: Investment-based NFT evolution with 3D unlock
- **Auto-Staking**: Irreversible auto-staking feature
- **Fractional Investment**: Tokenized asset investments
- **Passive Income Distribution**: Automated reward distributions

### **3. RAC Token Management**
- **Token Minting**: Creating and managing RAC governance tokens
- **Token Distribution**: Distributing tokens to DAO members
- **Voting Power**: Calculating voting power based on token holdings

## ❌ **NOT Smart Contract Responsibilities**

### **Automated Operations (Handled by Application Layer)**
- **User Signups**: New user registrations
- **Merchant Onboarding**: Individual merchant signups
- **NFT Upgrades**: User preference to upgrade their NFTs
- **Routine Transactions**: Point distributions, reward calculations
- **Customer Support**: Individual user support requests
- **Standard Operations**: Daily platform operations

## 🏗️ **Architecture Separation**

### **Smart Contract Layer (Blockchain)**
```
┌─────────────────────────────────────┐
│           Smart Contracts           │
├─────────────────────────────────────┤
│ • DAO Governance                    │
│ • NFT Creation & Evolution          │
│ • RAC Token Management              │
│ • Proposal & Voting System          │
│ • Configuration Updates             │
└─────────────────────────────────────┘
```

### **Application Layer (Frontend/Backend)**
```
┌─────────────────────────────────────┐
│        Application Layer            │
├─────────────────────────────────────┤
│ • User Signups                      │
│ • Merchant Onboarding               │
│ • NFT Upgrades                      │
│ • Routine Transactions              │
│ • Customer Support                  │
│ • Standard Operations               │
└─────────────────────────────────────┘
```

## 📋 **Current Smart Contract Functions**

### **DAO Governance Functions**
```rust
// Proposal Management
pub fn create_proposal(ctx: Context<CreateProposal>, proposal_type: u8, description: String) -> Result<()>
pub fn create_config_proposal(ctx: Context<CreateConfigProposal>, ...) -> Result<()>
pub fn create_loyalty_change_proposal(ctx: Context<CreateLoyaltyChangeProposal>, ...) -> Result<()>

// Voting System
pub fn vote(ctx: Context<Vote>, proposal_id: u64, vote_type: u8) -> Result<()>

// Proposal Execution
pub fn execute_config_proposal(ctx: Context<ExecuteConfigProposal>, proposal_id: u64) -> Result<()>
```

### **NFT Management Functions**
```rust
// NFT Creation & Management
pub fn create_nft(ctx: Context<CreateNft>, ...) -> Result<()>
pub fn update_nft(ctx: Context<UpdateNft>, ...) -> Result<()>

// Investment & Evolution
pub fn invest_in_custodial_nft(ctx: Context<InvestInCustodialNft>, investment_amount: u64) -> Result<()>
pub fn invest_in_non_custodial_nft(ctx: Context<InvestInNonCustodialNft>, investment_amount: u64) -> Result<()>

// Income Distribution
pub fn distribute_passive_income(ctx: Context<DistributeIncome>) -> Result<()>
pub fn update_passive_income_rate(ctx: Context<UpdateRate>, new_rate: u64) -> Result<()>
```

### **RAC Token Functions**
```rust
// Token Management
pub fn create_rac_mint(ctx: Context<CreateRacMint>) -> Result<()>
pub fn mint_rac_tokens(ctx: Context<MintRacTokens>, amount: u64) -> Result<()>

// Configuration
pub fn initialize_rewards_config(ctx: Context<InitializeRewardsConfig>, ...) -> Result<()>
```

## 🎯 **Why This Separation Makes Sense**

### **1. Performance**
- **Smart Contracts**: Expensive gas fees, slow execution
- **Application Layer**: Fast, free operations

### **2. User Experience**
- **Smart Contracts**: Complex transactions, wallet connections
- **Application Layer**: Simple forms, instant feedback

### **3. Scalability**
- **Smart Contracts**: Limited by blockchain capacity
- **Application Layer**: Can handle thousands of operations per second

### **4. Cost Efficiency**
- **Smart Contracts**: Gas fees for every operation
- **Application Layer**: No transaction costs for routine operations

## 🔄 **Integration Points**

### **When Application Calls Smart Contracts**
1. **User wants to create a proposal** → Call `create_proposal()`
2. **User wants to vote** → Call `vote()`
3. **Admin wants to execute approved proposal** → Call `execute_config_proposal()`
4. **User wants to evolve NFT** → Call `invest_in_custodial_nft()`
5. **Admin wants to create NFT collection** → Call `create_nft()`

### **When Application Handles Directly**
1. **User signs up** → Create database record
2. **Merchant joins** → Create database record
3. **User upgrades NFT** → Update database record
4. **Points are earned** → Update database record
5. **Rewards are distributed** → Update database record

## 📊 **Data Flow Example**

### **User NFT Upgrade (Application Layer)**
```
User clicks "Upgrade NFT" 
    ↓
Application validates user has enough points
    ↓
Application updates database record
    ↓
User sees updated NFT tier immediately
    ↓
No blockchain transaction needed
```

### **Platform Policy Change (Smart Contract Layer)**
```
Admin creates proposal to change referral bonus
    ↓
Smart contract: create_proposal()
    ↓
DAO members vote on proposal
    ↓
Smart contract: vote()
    ↓
If approved, admin executes proposal
    ↓
Smart contract: execute_config_proposal()
    ↓
Platform configuration updated
```

This architecture ensures that **routine operations are fast and free** while **strategic decisions are properly governed** through the DAO system.

