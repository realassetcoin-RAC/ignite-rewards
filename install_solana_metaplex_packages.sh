#!/bin/bash

# Install Solana Metaplex Packages for NFT Compliance
# This script installs all required packages for proper Solana NFT implementation

echo "🚀 Installing Solana Metaplex Packages for NFT Compliance..."

# Core Metaplex packages
echo "📦 Installing Metaplex packages..."
npm install @metaplex-foundation/mpl-token-metadata
npm install @metaplex-foundation/mpl-candy-machine-core
npm install @metaplex-foundation/mpl-candy-machine
npm install @metaplex-foundation/umi
npm install @metaplex-foundation/umi-uploader-bundlr
npm install @metaplex-foundation/umi-bundle-defaults

# Additional Solana packages
echo "📦 Installing additional Solana packages..."
npm install @solana/spl-token
npm install @solana/wallet-adapter-base
npm install @solana/wallet-adapter-react
npm install @solana/wallet-adapter-react-ui
npm install @solana/wallet-adapter-wallets

# Development dependencies
echo "📦 Installing development dependencies..."
npm install --save-dev @types/node

echo "✅ All Solana Metaplex packages installed successfully!"
echo ""
echo "📋 Installed packages:"
echo "  - @metaplex-foundation/mpl-token-metadata"
echo "  - @metaplex-foundation/mpl-candy-machine-core"
echo "  - @metaplex-foundation/mpl-candy-machine"
echo "  - @metaplex-foundation/umi"
echo "  - @metaplex-foundation/umi-uploader-bundlr"
echo "  - @metaplex-foundation/umi-bundle-defaults"
echo "  - @solana/spl-token"
echo "  - @solana/wallet-adapter-base"
echo "  - @solana/wallet-adapter-react"
echo "  - @solana/wallet-adapter-react-ui"
echo "  - @solana/wallet-adapter-wallets"
echo ""
echo "🎯 Next steps:"
echo "  1. Update SolanaNFTService to use Metaplex"
echo "  2. Implement Candy Machine integration"
echo "  3. Update smart contracts for Solana compliance"
echo "  4. Test with Solana devnet"
