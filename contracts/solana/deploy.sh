#!/bin/bash

# Deploy All Solana Contracts Script
# This script deploys all validated contracts to Solana

set -e

echo "🚀 Deploying RAC Rewards Solana Contracts"
echo "=========================================="

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

echo ""
echo "📦 Building and Deploying Contracts..."
echo "======================================"

# 1. Deploy Loyalty Governance Contract
echo ""
echo "1️⃣  Deploying Loyalty Governance Contract..."
cd governance/loyalty_governance
anchor build
anchor deploy --provider.cluster $NETWORK
LOYALTY_GOV_PROGRAM_ID=$(solana address -k target/deploy/loyalty_governance-keypair.json)
echo "   ✅ Loyalty Governance Contract deployed: $LOYALTY_GOV_PROGRAM_ID"
cd ../..

# 2. Deploy Merchant Governance Contract
echo ""
echo "2️⃣  Deploying Merchant Governance Contract..."
cd governance/merchant_governance
anchor build
anchor deploy --provider.cluster $NETWORK
MERCHANT_GOV_PROGRAM_ID=$(solana address -k target/deploy/merchant_governance-keypair.json)
echo "   ✅ Merchant Governance Contract deployed: $MERCHANT_GOV_PROGRAM_ID"
cd ../..

# 3. Deploy Integration Governance Contract
echo ""
echo "3️⃣  Deploying Integration Governance Contract..."
cd governance/integration_governance
anchor build
anchor deploy --provider.cluster $NETWORK
INTEGRATION_GOV_PROGRAM_ID=$(solana address -k target/deploy/integration_governance-keypair.json)
echo "   ✅ Integration Governance Contract deployed: $INTEGRATION_GOV_PROGRAM_ID"
cd ../..

# 4. Deploy DAO NFT System Contract
echo ""
echo "4️⃣  Deploying DAO NFT System Contract..."
cd dao
anchor build
anchor deploy --provider.cluster $NETWORK
DAO_NFT_PROGRAM_ID=$(solana address -k target/deploy/loyalty_nft_system-keypair.json)
echo "   ✅ DAO NFT System Contract deployed: $DAO_NFT_PROGRAM_ID"
cd ..

# 5. Deploy Investment Marketplace Contract
echo ""
echo "5️⃣  Deploying Investment Marketplace Contract..."
cd marketplace
anchor build
anchor deploy --provider.cluster $NETWORK
MARKETPLACE_PROGRAM_ID=$(solana address -k target/deploy/investment_marketplace-keypair.json)
echo "   ✅ Investment Marketplace Contract deployed: $MARKETPLACE_PROGRAM_ID"
cd ..

echo ""
echo "🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!"
echo "======================================="
echo ""
echo "📋 Deployed Contract Addresses:"
echo "   • Loyalty Governance: $LOYALTY_GOV_PROGRAM_ID"
echo "   • Merchant Governance: $MERCHANT_GOV_PROGRAM_ID"
echo "   • Integration Governance: $INTEGRATION_GOV_PROGRAM_ID"
echo "   • DAO NFT System: $DAO_NFT_PROGRAM_ID"
echo "   • Investment Marketplace: $MARKETPLACE_PROGRAM_ID"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update your frontend configuration with these addresses"
echo "   2. Initialize the governance systems"
echo "   3. Test the contract interactions"
echo "   4. Deploy to mainnet when ready"
echo ""
echo "📚 Frontend Configuration:"
echo "   export const CONTRACT_ADDRESSES = {"
echo "     LOYALTY_GOVERNANCE: \"$LOYALTY_GOV_PROGRAM_ID\","
echo "     MERCHANT_GOVERNANCE: \"$MERCHANT_GOV_PROGRAM_ID\","
echo "     INTEGRATION_GOVERNANCE: \"$INTEGRATION_GOV_PROGRAM_ID\","
echo "     LOYALTY_NFT_SYSTEM: \"$DAO_NFT_PROGRAM_ID\","
echo "     INVESTMENT_MARKETPLACE: \"$MARKETPLACE_PROGRAM_ID\""
echo "   };"
echo ""
echo "✅ All contracts are now deployed and ready for use!"

# Save contract addresses to file
cat > contract_addresses.json << EOF
{
  "network": "$NETWORK",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "loyalty_governance": "$LOYALTY_GOV_PROGRAM_ID",
    "merchant_governance": "$MERCHANT_GOV_PROGRAM_ID",
    "integration_governance": "$INTEGRATION_GOV_PROGRAM_ID",
    "loyalty_nft_system": "$DAO_NFT_PROGRAM_ID",
    "investment_marketplace": "$MARKETPLACE_PROGRAM_ID"
  }
}
EOF

echo ""
echo "📄 Contract addresses saved to: contract_addresses.json"

