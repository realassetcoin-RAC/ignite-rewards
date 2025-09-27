// Solana Metaplex Service - Main Service for NFT Operations
// This service integrates Metaplex standards with the existing SolanaNFTService

import { SolanaMetaplexNFTService, LoyaltyNFTMetadata, CandyMachineConfig } from './SolanaMetaplexNFTService';
import { SolanaNFTService, SolanaNFT, SolanaNFTCollection } from './solanaNFTService';
import { PublicKey } from '@solana/web3.js';

export interface MetaplexIntegrationConfig {
  rpcUrl: string;
  programId: string;
  bundlrEndpoint?: string;
  bundlrPrivateKey?: string;
}

export class SolanaMetaplexService {
  private metaplexService: SolanaMetaplexNFTService;
  private legacyService: SolanaNFTService;
  private config: MetaplexIntegrationConfig;

  constructor(config: MetaplexIntegrationConfig) {
    this.config = config;
    
    // Initialize Metaplex service
    this.metaplexService = new SolanaMetaplexNFTService(
      config.rpcUrl,
      config.bundlrPrivateKey
    );

    // Initialize legacy service for backward compatibility
    this.legacyService = new SolanaNFTService(
      config.rpcUrl,
      config.programId
    );
  }

  // Create a loyalty NFT collection using Candy Machine v3
  async createLoyaltyNFTCollection(
    collectionName: string,
    nftTypes: Array<{
      name: string;
      rarity: string;
      buyPriceUsdt: number;
      isCustodial: boolean;
    }>,
    config: CandyMachineConfig
  ): Promise<{
    candyMachine: PublicKey;
    collectionMint: PublicKey;
    collectionMetadata: PublicKey;
  }> {
    try {
      // Create metadata for the collection
      const collectionMetadata: LoyaltyNFTMetadata = {
        name: `${collectionName} Collection`,
        symbol: 'RAC',
        description: `RAC Rewards ${collectionName} loyalty NFT collection`,
        image: `https://rac-rewards.com/collections/${collectionName.toLowerCase().replace(' ', '-')}.png`,
        attributes: [
          {
            trait_type: 'Collection',
            value: collectionName,
          },
          {
            trait_type: 'Platform',
            value: 'RAC Rewards',
          },
        ],
        properties: {
          files: [
            {
              uri: `https://rac-rewards.com/collections/${collectionName.toLowerCase().replace(' ', '-')}.png`,
              type: 'image/png',
            },
          ],
          category: 'image',
          creators: [
            {
              address: this.config.programId,
              share: 100,
            },
          ],
        },
        loyalty_attributes: {
          card_type: collectionName,
          rarity: 'Collection',
          buy_price_usdt: 0,
          is_upgradeable: false,
          is_evolvable: false,
          is_fractional_eligible: false,
          auto_staking_duration: 'N/A',
          earn_on_spend_ratio: 0,
          upgrade_bonus_ratio: 0,
          evolution_min_investment: 0,
          evolution_earnings_ratio: 0,
          is_custodial: false,
        },
      };

      // Create the collection using Metaplex
      const result = await this.metaplexService.createLoyaltyNFTCollection(
        config,
        collectionMetadata
      );

      return {
        candyMachine: result.candyMachine,
        collectionMint: result.collectionMint,
        collectionMetadata: result.collectionMetadata,
      };
    } catch (error) {
      console.error('Failed to create loyalty NFT collection:', error);
      throw error;
    }
  }

  // Mint a specific loyalty NFT from the collection
  async mintLoyaltyNFT(
    candyMachineAddress: PublicKey,
    recipientAddress: PublicKey,
    nftType: {
      name: string;
      rarity: string;
      buyPriceUsdt: number;
      isCustodial: boolean;
    }
  ): Promise<{
    mint: PublicKey;
    metadata: PublicKey;
    masterEdition: PublicKey;
  }> {
    try {
      // Create metadata for the specific NFT
      const metadata = this.metaplexService.createLoyaltyNFTMetadata(
        nftType.name,
        nftType.rarity,
        nftType.buyPriceUsdt,
        nftType.isCustodial
      );

      // Mint the NFT using Metaplex
      const result = await this.metaplexService.mintLoyaltyNFT(
        candyMachineAddress,
        recipientAddress,
        metadata
      );

      return {
        mint: result.mint,
        metadata: result.metadata,
        masterEdition: result.masterEdition,
      };
    } catch (error) {
      console.error('Failed to mint loyalty NFT:', error);
      throw error;
    }
  }

  // Get user's NFTs (combines Metaplex and legacy data)
  async getUserNFTs(userAddress: PublicKey): Promise<SolanaNFT[]> {
    try {
      // Get NFTs from Metaplex service
      const metaplexNFTs = await this.metaplexService.getUserNFTs(userAddress);
      
      // Convert to legacy format for compatibility
      const legacyNFTs: SolanaNFT[] = metaplexNFTs.map(nft => ({
        mint: nft.mint.toString(),
        owner: userAddress.toString(),
        metadata: {
          name: nft.name,
          symbol: nft.symbol,
          description: '', // Would need to fetch from metadata
          image: nft.image,
          attributes: [], // Would need to fetch from metadata
        },
        tokenStandard: 'NonFungible',
        collection: {
          key: nft.mint.toString(), // This would be the collection mint
          verified: false,
        },
      }));

      return legacyNFTs;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
    }
  }

  // Verify NFT ownership using Metaplex
  async verifyNFTOwnership(
    mintAddress: PublicKey,
    ownerAddress: PublicKey
  ): Promise<boolean> {
    try {
      return await this.metaplexService.verifyNFTOwnership(
        mintAddress,
        ownerAddress
      );
    } catch (error) {
      console.error('Failed to verify NFT ownership:', error);
      return false;
    }
  }

  // Get NFT metadata using Metaplex
  async getNFTMetadata(mintAddress: PublicKey): Promise<LoyaltyNFTMetadata | null> {
    try {
      return await this.metaplexService.getNFTMetadata(mintAddress);
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return null;
    }
  }

  // Create loyalty NFT collections for all standard types
  async createStandardLoyaltyCollections(): Promise<{
    custodial: {
      candyMachine: PublicKey;
      collectionMint: PublicKey;
    };
    nonCustodial: {
      candyMachine: PublicKey;
      collectionMint: PublicKey;
    };
  }> {
    try {
      // Create custodial collection
      const custodialConfig: CandyMachineConfig = {
        price: 0, // Free for custodial users
        number: 10000, // Total supply
        sellerFeeBasisPoints: 500, // 5% royalty
        goLiveDate: new Date(),
      };

      const custodialCollection = await this.createLoyaltyNFTCollection(
        'Custodial Loyalty Cards',
        [
          { name: 'Pearl White', rarity: 'Common', buyPriceUsdt: 0, isCustodial: true },
          { name: 'Lava Orange', rarity: 'Less Common', buyPriceUsdt: 100, isCustodial: true },
          { name: 'Pink', rarity: 'Less Common', buyPriceUsdt: 100, isCustodial: true },
          { name: 'Silver', rarity: 'Rare', buyPriceUsdt: 200, isCustodial: true },
          { name: 'Gold', rarity: 'Rare', buyPriceUsdt: 300, isCustodial: true },
          { name: 'Black', rarity: 'Very Rare', buyPriceUsdt: 500, isCustodial: true },
        ],
        custodialConfig
      );

      // Create non-custodial collection
      const nonCustodialConfig: CandyMachineConfig = {
        price: 0.1, // 0.1 SOL base price
        number: 10000, // Total supply
        sellerFeeBasisPoints: 500, // 5% royalty
        goLiveDate: new Date(),
      };

      const nonCustodialCollection = await this.createLoyaltyNFTCollection(
        'Non-Custodial Loyalty Cards',
        [
          { name: 'Pearl White', rarity: 'Common', buyPriceUsdt: 100, isCustodial: false },
          { name: 'Lava Orange', rarity: 'Less Common', buyPriceUsdt: 500, isCustodial: false },
          { name: 'Pink', rarity: 'Less Common', buyPriceUsdt: 500, isCustodial: false },
          { name: 'Silver', rarity: 'Rare', buyPriceUsdt: 1000, isCustodial: false },
          { name: 'Gold', rarity: 'Rare', buyPriceUsdt: 1000, isCustodial: false },
          { name: 'Black', rarity: 'Very Rare', buyPriceUsdt: 2500, isCustodial: false },
        ],
        nonCustodialConfig
      );

      return {
        custodial: {
          candyMachine: custodialCollection.candyMachine,
          collectionMint: custodialCollection.collectionMint,
        },
        nonCustodial: {
          candyMachine: nonCustodialCollection.candyMachine,
          collectionMint: nonCustodialCollection.collectionMint,
        },
      };
    } catch (error) {
      console.error('Failed to create standard loyalty collections:', error);
      throw error;
    }
  }

  // Check if Metaplex service is available
  isMetaplexAvailable(): boolean {
    try {
      return this.metaplexService !== null;
    } catch {
      return false;
    }
  }

  // Get service status
  getServiceStatus(): {
    metaplex: boolean;
    legacy: boolean;
    connection: boolean;
  } {
    return {
      metaplex: this.isMetaplexAvailable(),
      legacy: this.legacyService !== null,
      connection: true, // Would check actual connection status
    };
  }
}
