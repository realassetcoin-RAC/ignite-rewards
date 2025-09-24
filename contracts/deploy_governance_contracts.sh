#!/bin/bash

# Deploy Governance Contracts Script
# This script deploys all the governance smart contracts to Solana

set -e

echo "🚀 Deploying RAC Rewards Governance Contracts to Solana"
echo "=================================================="

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install Anchor first:"
    echo "   npm install -g @coral-xyz/anchor-cli"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install Solana CLI first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/v1.17.0/install)\""
    exit 1
fi

# Set network (devnet for testing, mainnet-beta for production)
NETWORK=${1:-devnet}
echo "🌐 Deploying to: $NETWORK"

# Set Solana cluster
solana config set --url $NETWORK

# Check wallet
WALLET_BALANCE=$(solana balance)
echo "💰 Wallet balance: $WALLET_BALANCE SOL"

if [ "$WALLET_BALANCE" = "0 SOL" ]; then
    echo "⚠️  Warning: Wallet balance is 0 SOL. You may need to fund your wallet."
    echo "   For devnet: solana airdrop 2"
    echo "   For mainnet: Transfer SOL to your wallet"
fi

# Create contracts directory if it doesn't exist
mkdir -p contracts

echo ""
echo "📦 Building and Deploying Contracts..."
echo "======================================"

# 1. Deploy Loyalty Governance Contract
echo ""
echo "1️⃣  Deploying Loyalty Governance Contract..."
cd contracts

# Create Anchor project structure for loyalty governance
mkdir -p loyalty_governance
cd loyalty_governance

# Create Anchor.toml
cat > Anchor.toml << EOF
[features]
seeds = false
skip-lint = false

[programs.devnet]
loyalty_governance = "LoyaltyGov1111111111111111111111111111111111"

[programs.mainnet]
loyalty_governance = "LoyaltyGov1111111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "$NETWORK"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOF

# Create Cargo.toml
cat > Cargo.toml << EOF
[package]
name = "loyalty-governance"
version = "0.1.0"
description = "Loyalty Governance Smart Contract"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "loyalty_governance"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
EOF

# Create src/lib.rs
cp ../../loyalty_governance_contract.rs src/lib.rs

# Build and deploy
echo "   Building loyalty governance contract..."
anchor build

echo "   Deploying loyalty governance contract..."
anchor deploy --provider.cluster $NETWORK

LOYALTY_GOV_PROGRAM_ID=$(solana address -k target/deploy/loyalty_governance-keypair.json)
echo "   ✅ Loyalty Governance Contract deployed: $LOYALTY_GOV_PROGRAM_ID"

cd ..

# 2. Deploy Merchant Governance Contract
echo ""
echo "2️⃣  Deploying Merchant Governance Contract..."

mkdir -p merchant_governance
cd merchant_governance

# Create Anchor.toml
cat > Anchor.toml << EOF
[features]
seeds = false
skip-lint = false

[programs.devnet]
merchant_governance = "MerchantGov1111111111111111111111111111111111"

[programs.mainnet]
merchant_governance = "MerchantGov1111111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "$NETWORK"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOF

# Create Cargo.toml
cat > Cargo.toml << EOF
[package]
name = "merchant-governance"
version = "0.1.0"
description = "Merchant Governance Smart Contract"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "merchant_governance"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
EOF

# Create src/lib.rs
cp ../../merchant_governance_contract.rs src/lib.rs

# Build and deploy
echo "   Building merchant governance contract..."
anchor build

echo "   Deploying merchant governance contract..."
anchor deploy --provider.cluster $NETWORK

MERCHANT_GOV_PROGRAM_ID=$(solana address -k target/deploy/merchant_governance-keypair.json)
echo "   ✅ Merchant Governance Contract deployed: $MERCHANT_GOV_PROGRAM_ID"

cd ..

# 3. Deploy Integration Governance Contract
echo ""
echo "3️⃣  Deploying Integration Governance Contract..."

mkdir -p integration_governance
cd integration_governance

# Create Anchor.toml
cat > Anchor.toml << EOF
[features]
seeds = false
skip-lint = false

[programs.devnet]
integration_governance = "IntegrationGov1111111111111111111111111111111111"

[programs.mainnet]
integration_governance = "IntegrationGov1111111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "$NETWORK"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOF

# Create Cargo.toml
cat > Cargo.toml << EOF
[package]
name = "integration-governance"
version = "0.1.0"
description = "Integration Governance Smart Contract"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "integration_governance"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
EOF

# Create src/lib.rs
cp ../../integration_governance_contract.rs src/lib.rs

# Build and deploy
echo "   Building integration governance contract..."
anchor build

echo "   Deploying integration governance contract..."
anchor deploy --provider.cluster $NETWORK

INTEGRATION_GOV_PROGRAM_ID=$(solana address -k target/deploy/integration_governance-keypair.json)
echo "   ✅ Integration Governance Contract deployed: $INTEGRATION_GOV_PROGRAM_ID"

cd ..

# 4. Update existing DAO contract
echo ""
echo "4️⃣  Updating existing DAO contract with loyalty governance integration..."

# Copy the updated DAO contract
cp ../../solana-dao-nft-contract-updated.rs dao_contract.rs

echo "   ✅ DAO contract updated with loyalty governance integration"

cd ..

echo ""
echo "🎉 GOVERNANCE CONTRACTS DEPLOYMENT COMPLETE!"
echo "============================================="
echo ""
echo "📋 Deployed Contracts:"
echo "   • Loyalty Governance: $LOYALTY_GOV_PROGRAM_ID"
echo "   • Merchant Governance: $MERCHANT_GOV_PROGRAM_ID"
echo "   • Integration Governance: $INTEGRATION_GOV_PROGRAM_ID"
echo "   • Updated DAO Contract: Ready for deployment"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update your frontend to use the new contract addresses"
echo "   2. Initialize the governance systems"
echo "   3. Test the governance workflow"
echo "   4. Deploy to mainnet when ready"
echo ""
echo "📚 Contract Addresses for Frontend Integration:"
echo "   export LOYALTY_GOV_PROGRAM_ID=\"$LOYALTY_GOV_PROGRAM_ID\""
echo "   export MERCHANT_GOV_PROGRAM_ID=\"$MERCHANT_GOV_PROGRAM_ID\""
echo "   export INTEGRATION_GOV_PROGRAM_ID=\"$INTEGRATION_GOV_PROGRAM_ID\""
echo ""
echo "✅ All governance contracts are now deployed and ready for use!"

