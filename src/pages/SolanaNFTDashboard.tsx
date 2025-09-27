// Solana NFT Dashboard - Main page for Solana NFT operations
// This page integrates all Solana NFT functionality

import React from 'react';
import { SolanaWalletProvider } from '@/components/SolanaWalletProvider';
import { SolanaNFTMinter } from '@/components/SolanaNFTMinter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Mint, 
  Sparkles, 
  Shield, 
  Zap,
  Globe,
  Layers,
  Coins
} from 'lucide-react';

const SolanaNFTDashboard: React.FC = () => {
  return (
    <SolanaWalletProvider>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Solana NFT Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Mint, manage, and trade loyalty NFTs on Solana using Metaplex standards and Candy Machine v3
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
                Wallet Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with Phantom, Solflare, Backpack, and other Solana wallets
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mint className="h-5 w-5 text-green-600" />
                Candy Machine v3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Mint NFTs using Metaplex Candy Machine v3 for collections
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-purple-600" />
                SPL Token Standard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Native Solana token standard for secure NFT ownership
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                Metaplex Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Metadata stored on Arweave via Bundlr for decentralization
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Solana Standards Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Solana Standards Compliance
            </CardTitle>
            <CardDescription>
              This implementation follows all Solana NFT standards and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">✅ Implemented Standards</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      SPL Token
                    </Badge>
                    <span className="text-sm">Native Solana token standard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Metaplex NFT
                    </Badge>
                    <span className="text-sm">Solana's NFT metadata standard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Candy Machine v3
                    </Badge>
                    <span className="text-sm">NFT collection minting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Anchor Framework
                    </Badge>
                    <span className="text-sm">Rust smart contracts</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">🚀 Key Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Multi-wallet support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Collection management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Loyalty rewards integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Secure ownership tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFT Minter Component */}
        <SolanaNFTMinter />
      </div>
    </SolanaWalletProvider>
  );
};

export default SolanaNFTDashboard;
