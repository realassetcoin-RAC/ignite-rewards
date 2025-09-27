# Web3 Investment Flow Implementation

## 🎯 **Complete User Flow Understanding**

### **Non-Custodial Users (Web3 Wallet Users)**
1. **Connect Web3 Wallet** (MetaMask, Phantom, etc.)
2. **Browse Asset Initiatives** (Environmental, Social, Governance, etc.)
3. **Select Asset Initiative** of choice
4. **Invest Directly** using USDT, SOL, ETH, or BTC from their wallet
5. **Track Investment** and returns on platform

### **Custodial Users (Platform Wallet Users)**
1. **Earn RAC Rewards** from loyalty program
2. **Select Asset Initiative** for micro-investment
3. **Convert RAC to USDT** via DEX
4. **Invest RAC/USDT** into chosen asset initiative
5. **Track Investment** and returns

### **Asset Initiative Management**
1. **Each Asset Initiative** has unique multi-sig wallet
2. **Hot/Cold Multi-sig** for security
3. **Direct blockchain integration** for all transactions
4. **Real-time tracking** of investments and returns

---

## 🏗️ **Technical Architecture**

### 1. **Database Schema Updates**

```sql
-- Enhanced asset initiatives with multi-sig wallet info
ALTER TABLE public.asset_initiatives 
ADD COLUMN IF NOT EXISTS multi_sig_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS multi_sig_threshold INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS multi_sig_signers JSONB,
ADD COLUMN IF NOT EXISTS blockchain_network TEXT DEFAULT 'ethereum',
ADD COLUMN IF NOT EXISTS supported_currencies JSONB DEFAULT '["USDT", "SOL", "ETH", "BTC"]',
ADD COLUMN IF NOT EXISTS investment_contract_address TEXT,
ADD COLUMN IF NOT EXISTS is_web3_enabled BOOLEAN DEFAULT TRUE;

-- Investment transactions table
CREATE TABLE IF NOT EXISTS public.asset_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    asset_initiative_id UUID REFERENCES public.asset_initiatives(id) NOT NULL,
    
    -- Investment Details
    investment_amount NUMERIC(18, 8) NOT NULL,
    currency_type TEXT NOT NULL CHECK (currency_type IN ('USDT', 'SOL', 'ETH', 'BTC', 'RAC')),
    investment_type TEXT NOT NULL CHECK (investment_type IN ('direct_web3', 'rac_conversion', 'custodial')),
    
    -- Blockchain Details
    transaction_hash TEXT UNIQUE,
    blockchain_network TEXT NOT NULL,
    from_wallet_address TEXT NOT NULL,
    to_wallet_address TEXT NOT NULL, -- Multi-sig wallet address
    
    -- Status and Tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    confirmation_blocks INTEGER DEFAULT 0,
    gas_fee NUMERIC(18, 8),
    
    -- Returns Tracking
    current_value NUMERIC(18, 8) DEFAULT 0,
    total_returns NUMERIC(18, 8) DEFAULT 0,
    return_percentage NUMERIC(5, 2) DEFAULT 0,
    
    -- Timestamps
    invested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User wallet connections
CREATE TABLE IF NOT EXISTS public.user_wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Wallet Details
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('metamask', 'phantom', 'trust_wallet', 'hardware', 'custodial')),
    blockchain_network TEXT NOT NULL CHECK (blockchain_network IN ('ethereum', 'solana', 'bitcoin', 'polygon')),
    
    -- Connection Details
    connection_method TEXT NOT NULL CHECK (connection_method IN ('signature', 'transaction', 'api')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_data JSONB,
    
    -- Security
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAC conversion tracking
CREATE TABLE IF NOT EXISTS public.rac_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Conversion Details
    rac_amount NUMERIC(18, 8) NOT NULL,
    target_currency TEXT NOT NULL CHECK (target_currency IN ('USDT', 'ETH', 'SOL', 'BTC')),
    converted_amount NUMERIC(18, 8) NOT NULL,
    exchange_rate NUMERIC(18, 8) NOT NULL,
    
    -- DEX Details
    dex_provider TEXT NOT NULL CHECK (dex_provider IN ('uniswap', 'pancakeswap', 'raydium', 'jupiter')),
    transaction_hash TEXT UNIQUE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    
    -- Timestamps
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **Smart Contract Integration**

```typescript
// Asset Initiative Investment Contract Interface
interface AssetInitiativeContract {
  // Multi-sig wallet address for the asset initiative
  multiSigWallet: string;
  
  // Supported currencies and their contract addresses
  supportedCurrencies: {
    USDT: string;
    ETH: string;
    SOL: string;
    BTC: string;
  };
  
  // Investment functions
  invest(amount: BigNumber, currency: string, userAddress: string): Promise<TransactionReceipt>;
  
  // Returns tracking
  getCurrentValue(investmentId: string): Promise<BigNumber>;
  getTotalReturns(investmentId: string): Promise<BigNumber>;
  
  // Multi-sig management
  getSigners(): Promise<string[]>;
  getThreshold(): Promise<number>;
}
```

### 3. **Frontend Components**

```typescript
// Web3 Investment Component
interface Web3InvestmentProps {
  assetInitiative: AssetInitiative;
  userWallet: UserWallet;
  onInvestmentComplete: (transactionHash: string) => void;
}

const Web3Investment: React.FC<Web3InvestmentProps> = ({
  assetInitiative,
  userWallet,
  onInvestmentComplete
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'USDT' | 'SOL' | 'ETH' | 'BTC'>('USDT');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [isInvesting, setIsInvesting] = useState(false);

  const handleInvestment = async () => {
    setIsInvesting(true);
    try {
      // 1. Connect to user's wallet
      const provider = await connectWallet(userWallet.walletType);
      
      // 2. Get user's balance for selected currency
      const balance = await getWalletBalance(provider, selectedCurrency);
      
      // 3. Validate investment amount
      if (parseFloat(investmentAmount) > balance) {
        throw new Error('Insufficient balance');
      }
      
      // 4. Execute investment transaction
      const txHash = await executeInvestment({
        assetInitiative: assetInitiative.multi_sig_wallet_address,
        currency: selectedCurrency,
        amount: investmentAmount,
        userWallet: userWallet.wallet_address
      });
      
      // 5. Track transaction
      await trackInvestment({
        user_id: userWallet.user_id,
        asset_initiative_id: assetInitiative.id,
        investment_amount: investmentAmount,
        currency_type: selectedCurrency,
        transaction_hash: txHash,
        from_wallet_address: userWallet.wallet_address,
        to_wallet_address: assetInitiative.multi_sig_wallet_address
      });
      
      onInvestmentComplete(txHash);
    } catch (error) {
      console.error('Investment failed:', error);
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <div className="web3-investment-interface">
      <h3>Invest in {assetInitiative.name}</h3>
      
      {/* Currency Selection */}
      <div className="currency-selector">
        <label>Select Currency:</label>
        <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
          <option value="USDT">USDT</option>
          <option value="SOL">Solana (SOL)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="BTC">Bitcoin (BTC)</option>
        </select>
      </div>
      
      {/* Investment Amount */}
      <div className="amount-input">
        <label>Investment Amount:</label>
        <input
          type="number"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <span>{selectedCurrency}</span>
      </div>
      
      {/* Wallet Info */}
      <div className="wallet-info">
        <p>From: {userWallet.wallet_address}</p>
        <p>To: {assetInitiative.multi_sig_wallet_address}</p>
      </div>
      
      {/* Investment Button */}
      <button 
        onClick={handleInvestment}
        disabled={isInvesting || !investmentAmount}
        className="invest-button"
      >
        {isInvesting ? 'Processing...' : 'Invest Now'}
      </button>
    </div>
  );
};
```

### 4. **Custodial User Flow**

```typescript
// RAC to USDT Conversion Component
const RACConversionFlow: React.FC = () => {
  const [racAmount, setRacAmount] = useState<string>('');
  const [targetCurrency, setTargetCurrency] = useState<'USDT' | 'ETH' | 'SOL' | 'BTC'>('USDT');
  const [conversionRate, setConversionRate] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);

  const handleRACConversion = async () => {
    setIsConverting(true);
    try {
      // 1. Get current exchange rate
      const rate = await getExchangeRate('RAC', targetCurrency);
      setConversionRate(rate);
      
      // 2. Execute DEX swap
      const txHash = await executeDEXSwap({
        fromCurrency: 'RAC',
        toCurrency: targetCurrency,
        amount: racAmount,
        userWallet: userWallet.address
      });
      
      // 3. Track conversion
      await trackRACConversion({
        user_id: userId,
        rac_amount: racAmount,
        target_currency: targetCurrency,
        converted_amount: parseFloat(racAmount) * rate,
        exchange_rate: rate,
        transaction_hash: txHash
      });
      
      // 4. Proceed to investment
      await proceedToInvestment(targetCurrency, parseFloat(racAmount) * rate);
      
    } catch (error) {
      console.error('RAC conversion failed:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="rac-conversion-flow">
      <h3>Convert RAC Rewards to {targetCurrency}</h3>
      
      <div className="rac-amount">
        <label>RAC Amount:</label>
        <input
          type="number"
          value={racAmount}
          onChange={(e) => setRacAmount(e.target.value)}
          placeholder="Enter RAC amount"
        />
      </div>
      
      <div className="target-currency">
        <label>Target Currency:</label>
        <select value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)}>
          <option value="USDT">USDT</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="SOL">Solana (SOL)</option>
          <option value="BTC">Bitcoin (BTC)</option>
        </select>
      </div>
      
      {conversionRate > 0 && (
        <div className="conversion-preview">
          <p>{racAmount} RAC = {parseFloat(racAmount) * conversionRate} {targetCurrency}</p>
          <p>Rate: 1 RAC = {conversionRate} {targetCurrency}</p>
        </div>
      )}
      
      <button 
        onClick={handleRACConversion}
        disabled={isConverting || !racAmount}
        className="convert-button"
      >
        {isConverting ? 'Converting...' : 'Convert & Invest'}
      </button>
    </div>
  );
};
```

---

## 🔒 **Security Implementation**

### 1. **Multi-Sig Wallet Setup**

```typescript
// Multi-sig wallet configuration for each asset initiative
interface MultiSigConfig {
  assetInitiativeId: string;
  walletAddress: string;
  threshold: number; // Minimum signatures required
  signers: string[]; // List of signer addresses
  hotWallet: string; // Hot wallet for quick transactions
  coldWallet: string; // Cold wallet for long-term storage
}

// Example configuration
const environmentalInitiativeMultiSig: MultiSigConfig = {
  assetInitiativeId: 'env-001',
  walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  threshold: 3, // Require 3 out of 5 signatures
  signers: [
    '0x1234...', // Platform admin
    '0x5678...', // Asset initiative manager
    '0x9abc...', // Community representative
    '0xdef0...', // Technical lead
    '0x2468...'  // Financial auditor
  ],
  hotWallet: '0xhot...', // For quick operations
  coldWallet: '0xcold...' // For long-term storage
};
```

### 2. **Wallet Verification**

```typescript
// Wallet ownership verification
const verifyWalletOwnership = async (walletAddress: string, signature: string) => {
  try {
    // 1. Generate verification message
    const message = `Verify wallet ownership for RAC Rewards Platform\nTimestamp: ${Date.now()}`;
    
    // 2. Verify signature
    const recoveredAddress = await verifySignature(message, signature);
    
    // 3. Check if recovered address matches provided address
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Signature verification failed');
    }
    
    // 4. Store verification
    await storeWalletVerification({
      wallet_address: walletAddress,
      verification_status: 'verified',
      verified_at: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Wallet verification failed:', error);
    return false;
  }
};
```

---

## 📊 **Investment Tracking**

### 1. **Real-time Balance Updates**

```typescript
// Blockchain monitoring service
class InvestmentTracker {
  async trackInvestment(transactionHash: string) {
    // 1. Monitor blockchain for transaction confirmation
    const receipt = await this.waitForConfirmation(transactionHash);
    
    // 2. Update investment status
    await this.updateInvestmentStatus(transactionHash, 'confirmed');
    
    // 3. Start monitoring for returns
    await this.startReturnsMonitoring(transactionHash);
  }
  
  async monitorReturns(assetInitiativeId: string) {
    // 1. Get current value from smart contract
    const currentValue = await this.getCurrentValue(assetInitiativeId);
    
    // 2. Calculate returns
    const returns = await this.calculateReturns(assetInitiativeId);
    
    // 3. Update database
    await this.updateReturns(assetInitiativeId, currentValue, returns);
  }
}
```

### 2. **Portfolio Dashboard**

```typescript
// User investment portfolio
interface UserPortfolio {
  totalInvested: number;
  totalReturns: number;
  totalValue: number;
  investments: {
    assetInitiative: string;
    amount: number;
    currency: string;
    currentValue: number;
    returns: number;
    returnPercentage: number;
  }[];
}
```

---

## 🚀 **Implementation Phases**

### Phase 1: Database & Smart Contracts
- [ ] Update database schema
- [ ] Deploy multi-sig wallets for each asset initiative
- [ ] Set up smart contracts for investments

### Phase 2: Web3 Integration
- [ ] Implement wallet connection
- [ ] Add wallet verification
- [ ] Create investment interface

### Phase 3: Custodial User Flow
- [ ] Implement RAC to USDT conversion
- [ ] Add DEX integration
- [ ] Create custodial investment flow

### Phase 4: Tracking & Monitoring
- [ ] Real-time investment tracking
- [ ] Returns monitoring
- [ ] Portfolio dashboard

---

## 🎯 **Next Steps**

1. **Update Database Schema** - Add multi-sig wallet fields
2. **Deploy Smart Contracts** - Create investment contracts
3. **Implement Web3 Integration** - Wallet connection and verification
4. **Create Investment Interface** - User-friendly investment flow
5. **Add Monitoring System** - Real-time tracking and returns

Would you like me to start implementing this Web3 investment flow? I can begin with the database schema updates and then move to the smart contract integration! 🚀
