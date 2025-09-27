// Solana NFT Minter - Component for minting NFTs using Candy Machine v3
// This component integrates with the Metaplex service for NFT minting

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { SolanaMetaplexService } from '@/lib/SolanaMetaplexService';
import { SolanaWalletButton } from './SolanaWalletButton';
import { Loader2, Mint, Sparkles, Coins, Crown, Gem } from 'lucide-react';
import { toast } from 'sonner';

interface NFTType {
  name: string;
  rarity: string;
  buyPriceUsdt: number;
  isCustodial: boolean;
  icon: React.ReactNode;
  color: string;
}

const NFT_TYPES: NFTType[] = [
  {
    name: 'Pearl White',
    rarity: 'Common',
    buyPriceUsdt: 0,
    isCustodial: true,
    icon: <Gem className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800',
  },
  {
    name: 'Lava Orange',
    rarity: 'Less Common',
    buyPriceUsdt: 100,
    isCustodial: true,
    icon: <Coins className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800',
  },
  {
    name: 'Pink',
    rarity: 'Less Common',
    buyPriceUsdt: 100,
    isCustodial: true,
    icon: <Coins className="h-4 w-4" />,
    color: 'bg-pink-100 text-pink-800',
  },
  {
    name: 'Silver',
    rarity: 'Rare',
    buyPriceUsdt: 200,
    isCustodial: true,
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-gray-200 text-gray-900',
  },
  {
    name: 'Gold',
    rarity: 'Rare',
    buyPriceUsdt: 300,
    isCustodial: true,
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    name: 'Black',
    rarity: 'Very Rare',
    buyPriceUsdt: 500,
    isCustodial: true,
    icon: <Sparkles className="h-4 w-4" />,
    color: 'bg-gray-800 text-white',
  },
];

export const SolanaNFTMinter: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [selectedNFTType, setSelectedNFTType] = useState<NFTType | null>(null);
  const [minting, setMinting] = useState(false);
  const [metaplexService, setMetaplexService] = useState<SolanaMetaplexService | null>(null);
  const [candyMachineAddress, setCandyMachineAddress] = useState<string>('');

  useEffect(() => {
    // Initialize Metaplex service
    const service = new SolanaMetaplexService({
      rpcUrl: 'https://api.devnet.solana.com',
      programId: '81y1B91W78o5zLz6Lg8P96Y7JvW4Y9q6D8W2o7Jz8K9',
    });
    setMetaplexService(service);
  }, []);

  const handleMintNFT = async () => {
    if (!connected || !publicKey || !selectedNFTType || !metaplexService) {
      toast.error('Please connect your wallet and select an NFT type');
      return;
    }

    if (!candyMachineAddress) {
      toast.error('Please enter a valid Candy Machine address');
      return;
    }

    setMinting(true);

    try {
      const candyMachinePubkey = new PublicKey(candyMachineAddress);
      
      const result = await metaplexService.mintLoyaltyNFT(
        candyMachinePubkey,
        publicKey,
        selectedNFTType
      );

      toast.success(`Successfully minted ${selectedNFTType.name} NFT!`);
      console.log('Minted NFT:', result);
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      toast.error('Failed to mint NFT. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!metaplexService) {
      toast.error('Metaplex service not initialized');
      return;
    }

    try {
      const result = await metaplexService.createStandardLoyaltyCollections();
      toast.success('Successfully created standard loyalty collections!');
      console.log('Created collections:', result);
    } catch (error) {
      console.error('Failed to create collections:', error);
      toast.error('Failed to create collections. Please try again.');
    }
  };

  if (!connected) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet to Mint NFTs</CardTitle>
            <CardDescription>
              You need to connect your Solana wallet to mint loyalty NFTs
            </CardDescription>
          </CardHeader>
        </Card>
        <SolanaWalletButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mint className="h-5 w-5" />
            Mint Loyalty NFT
          </CardTitle>
          <CardDescription>
            Mint a loyalty NFT using Candy Machine v3 on Solana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="candy-machine">Candy Machine Address</Label>
            <Input
              id="candy-machine"
              placeholder="Enter Candy Machine address..."
              value={candyMachineAddress}
              onChange={(e) => setCandyMachineAddress(e.target.value)}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Select NFT Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NFT_TYPES.map((nftType) => (
                <Card
                  key={nftType.name}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedNFTType?.name === nftType.name
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => setSelectedNFTType(nftType)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {nftType.icon}
                        <div>
                          <h3 className="font-semibold">{nftType.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {nftType.rarity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={nftType.color}>
                          {nftType.buyPriceUsdt === 0 ? 'Free' : `$${nftType.buyPriceUsdt}`}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {nftType.isCustodial ? 'Custodial' : 'Non-Custodial'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button
              onClick={handleMintNFT}
              disabled={!selectedNFTType || !candyMachineAddress || minting}
              className="flex-1"
            >
              {minting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Mint className="mr-2 h-4 w-4" />
                  Mint NFT
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCreateCollection}
              disabled={minting}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </div>
        </CardContent>
      </Card>

      <SolanaWalletButton />
    </div>
  );
};

export default SolanaNFTMinter;
