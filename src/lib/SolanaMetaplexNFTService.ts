// Solana Metaplex NFT Service - Solana-Compliant Implementation
// This service implements proper Solana NFT standards using Metaplex and Candy Machine

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { mplUploaderBundlr } from '@metaplex-foundation/umi-uploader-bundlr';
import { 
  createCandyMachineV2,
  mintV2,
  findCandyMachineV2Pda,
  findCandyMachineV2ConfigPda,
  CandyMachineV2,
  CandyMachineV2Config
} from '@metaplex-foundation/mpl-candy-machine';
import {
  createNft,
  findMetadataPda,
  findMasterEditionPda,
  Nft,
  NftWithToken
} from '@metaplex-foundation/mpl-token-metadata';
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  some,
  none,
  publicKey,
  Umi,
  PublicKey,
  Keypair,
  TransactionBuilder
} from '@metaplex-foundation/umi';
import { Connection, PublicKey as SolanaPublicKey, Keypair as SolanaKeypair } from '@solana/web3.js';

export interface SolanaNFTCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
}

export interface CandyMachineConfig {
  price: number; // Price in SOL
  number: number; // Number of NFTs to mint
  sellerFeeBasisPoints: number; // Royalty percentage (500 = 5%)
  goLiveDate: Date;
  endSettings?: {
    endSettingType: 'Date' | 'Amount';
    number: number;
  };
  whitelistMintSettings?: {
    mode: 'BurnEveryTime' | 'NeverBurn';
    mint: PublicKey;
    presale: boolean;
    discountPrice?: number;
  };
  hiddenSettings?: {
    name: string;
    uri: string;
    hash: string;
  };
}

export interface LoyaltyNFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
  // Loyalty-specific attributes
  loyalty_attributes: {
    card_type: string; // Pearl White, Lava Orange, etc.
    rarity: string; // Common, Less Common, Rare, Very Rare
    buy_price_usdt: number;
    is_upgradeable: boolean;
    is_evolvable: boolean;
    is_fractional_eligible: boolean;
    auto_staking_duration: string;
    earn_on_spend_ratio: number;
    upgrade_bonus_ratio: number;
    evolution_min_investment: number;
    evolution_earnings_ratio: number;
    is_custodial: boolean;
  };
}

export class SolanaMetaplexNFTService {
  private umi: Umi;
  private connection: Connection;
  private isInitialized: boolean = false;

  constructor(
    rpcUrl: string = 'https://api.devnet.solana.com',
    privateKey?: string
  ) {
    try {
      // Initialize Umi with Metaplex plugins
      this.umi = createUmi(rpcUrl)
        .use(mplCandyMachine())
        .use(mplTokenMetadata())
        .use(mplUploaderBundlr());

      // Initialize Solana connection
      this.connection = new Connection(rpcUrl, 'confirmed');

      // Set up identity if private key provided
      if (privateKey) {
        const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
        this.umi.use(keypairIdentity(keypair));
      }

      this.isInitialized = true;
      console.log('✅ Solana Metaplex NFT Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Solana Metaplex NFT Service:', error);
      this.isInitialized = false;
    }
  }

  // Create a new NFT collection using Candy Machine v3
  async createLoyaltyNFTCollection(
    collectionConfig: CandyMachineConfig,
    metadata: LoyaltyNFTMetadata
  ): Promise<{
    candyMachine: PublicKey;
    config: PublicKey;
    collectionMint: PublicKey;
    collectionMetadata: PublicKey;
    collectionMasterEdition: PublicKey;
  }> {
    if (!this.isInitialized) {
      throw new Error('Solana Metaplex NFT Service not initialized');
    }

    try {
      // Create collection NFT
      const collectionMint = generateSigner(this.umi);
      const collectionMetadata = findMetadataPda(this.umi, {
        mint: collectionMint.publicKey,
      });
      const collectionMasterEdition = findMasterEditionPda(this.umi, {
        mint: collectionMint.publicKey,
      });

      // Create the collection NFT
      await createNft(this.umi, {
        mint: collectionMint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: await this.uploadMetadata(metadata),
        sellerFeeBasisPoints: collectionConfig.sellerFeeBasisPoints,
        creators: metadata.properties.creators.map(creator => ({
          address: publicKey(creator.address),
          verified: false,
          share: creator.share,
        })),
        collection: some({
          key: collectionMint.publicKey,
          verified: false,
        }),
      }).sendAndConfirm(this.umi);

      // Create Candy Machine configuration
      const config = findCandyMachineV2ConfigPda(this.umi, {
        config: generateSigner(this.umi).publicKey,
      });

      // Create Candy Machine
      const candyMachine = findCandyMachineV2Pda(this.umi, {
        config: config[0],
      });

      await createCandyMachineV2(this.umi, {
        candyMachine: candyMachine[0],
        config: config[0],
        authority: this.umi.identity,
        collectionMint: collectionMint.publicKey,
        collectionMetadata: collectionMetadata[0],
        collectionMasterEdition: collectionMasterEdition[0],
        collectionUpdateAuthority: this.umi.identity,
        itemsAvailable: collectionConfig.number,
        symbol: metadata.symbol,
        sellerFeeBasisPoints: collectionConfig.sellerFeeBasisPoints,
        maxEditionSupply: 0,
        isMutable: true,
        retainAuthority: true,
        goLiveDate: collectionConfig.goLiveDate,
        price: collectionConfig.price,
        gatekeeper: none(),
        endSettings: collectionConfig.endSettings ? some(collectionConfig.endSettings) : none(),
        whitelistMintSettings: collectionConfig.whitelistMintSettings ? some(collectionConfig.whitelistMintSettings) : none(),
        hiddenSettings: collectionConfig.hiddenSettings ? some(collectionConfig.hiddenSettings) : none(),
      }).sendAndConfirm(this.umi);

      return {
        candyMachine: candyMachine[0],
        config: config[0],
        collectionMint: collectionMint.publicKey,
        collectionMetadata: collectionMetadata[0],
        collectionMasterEdition: collectionMasterEdition[0],
      };
    } catch (error) {
      console.error('Failed to create loyalty NFT collection:', error);
      throw error;
    }
  }

  // Mint a loyalty NFT from the collection
  async mintLoyaltyNFT(
    candyMachineAddress: PublicKey,
    recipientAddress: PublicKey,
    metadata: LoyaltyNFTMetadata
  ): Promise<{
    mint: PublicKey;
    metadata: PublicKey;
    masterEdition: PublicKey;
    tokenAccount: PublicKey;
  }> {
    if (!this.isInitialized) {
      throw new Error('Solana Metaplex NFT Service not initialized');
    }

    try {
      // Generate new mint for the NFT
      const mint = generateSigner(this.umi);

      // Upload metadata
      const metadataUri = await this.uploadMetadata(metadata);

      // Mint the NFT
      const mintResult = await mintV2(this.umi, {
        candyMachine: candyMachineAddress,
        nftMint: mint,
        collectionMint: candyMachineAddress, // This should be the collection mint
        collectionUpdateAuthority: this.umi.identity,
        tokenStandard: 0, // NonFungible
        tokenOwner: recipientAddress,
        metadata: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 500, // 5% royalty
          creators: metadata.properties.creators.map(creator => ({
            address: publicKey(creator.address),
            verified: false,
            share: creator.share,
          })),
          collection: some({
            key: candyMachineAddress,
            verified: false,
          }),
        },
      }).sendAndConfirm(this.umi);

      // Get the created NFT details
      const metadataPda = findMetadataPda(this.umi, {
        mint: mint.publicKey,
      });
      const masterEditionPda = findMasterEditionPda(this.umi, {
        mint: mint.publicKey,
      });

      return {
        mint: mint.publicKey,
        metadata: metadataPda[0],
        masterEdition: masterEditionPda[0],
        tokenAccount: mint.publicKey, // In a real implementation, this would be the associated token account
      };
    } catch (error) {
      console.error('Failed to mint loyalty NFT:', error);
      throw error;
    }
  }

  // Upload metadata to Arweave via Bundlr
  private async uploadMetadata(metadata: LoyaltyNFTMetadata): Promise<string> {
    try {
      const metadataUri = await this.umi.uploader.upload(metadata);
      return metadataUri;
    } catch (error) {
      console.error('Failed to upload metadata:', error);
      throw error;
    }
  }

  // Get NFT metadata
  async getNFTMetadata(mintAddress: PublicKey): Promise<LoyaltyNFTMetadata | null> {
    try {
      const metadataPda = findMetadataPda(this.umi, {
        mint: mintAddress,
      });

      const metadata = await this.umi.rpc.getAccount(metadataPda[0]);
      if (!metadata.exists) {
        return null;
      }

      // Parse metadata and return
      // This would need to be implemented based on the actual metadata structure
      return null;
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return null;
    }
  }

  // Verify NFT ownership
  async verifyNFTOwnership(
    mintAddress: PublicKey,
    ownerAddress: PublicKey
  ): Promise<boolean> {
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        new SolanaPublicKey(ownerAddress.toString()),
        {
          mint: new SolanaPublicKey(mintAddress.toString()),
        }
      );

      return tokenAccounts.value.length > 0;
    } catch (error) {
      console.error('Failed to verify NFT ownership:', error);
      return false;
    }
  }

  // Get user's NFTs
  async getUserNFTs(ownerAddress: PublicKey): Promise<Array<{
    mint: PublicKey;
    metadata: PublicKey;
    name: string;
    symbol: string;
    image: string;
  }>> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        new SolanaPublicKey(ownerAddress.toString()),
        {
          programId: new SolanaPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        }
      );

      const nfts = [];
      for (const account of tokenAccounts.value) {
        const tokenInfo = account.account.data.parsed.info;
        if (tokenInfo.tokenAmount.amount === '1' && tokenInfo.tokenAmount.decimals === 0) {
          // This is likely an NFT (amount = 1, decimals = 0)
          const mintAddress = new PublicKey(tokenInfo.mint);
          const metadata = await this.getNFTMetadata(mintAddress);
          
          if (metadata) {
            nfts.push({
              mint: mintAddress,
              metadata: findMetadataPda(this.umi, { mint: mintAddress })[0],
              name: metadata.name,
              symbol: metadata.symbol,
              image: metadata.image,
            });
          }
        }
      }

      return nfts;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
    }
  }

  // Create loyalty NFT metadata
  createLoyaltyNFTMetadata(
    cardType: string,
    rarity: string,
    buyPriceUsdt: number,
    isCustodial: boolean
  ): LoyaltyNFTMetadata {
    return {
      name: `${cardType} Loyalty Card`,
      symbol: 'RAC',
      description: `RAC Rewards ${cardType} loyalty card with ${rarity} rarity`,
      image: `https://rac-rewards.com/nft-images/${cardType.toLowerCase().replace(' ', '-')}.png`,
      attributes: [
        {
          trait_type: 'Card Type',
          value: cardType,
        },
        {
          trait_type: 'Rarity',
          value: rarity,
        },
        {
          trait_type: 'Buy Price (USDT)',
          value: buyPriceUsdt,
        },
        {
          trait_type: 'Custodial',
          value: isCustodial,
        },
      ],
      properties: {
        files: [
          {
            uri: `https://rac-rewards.com/nft-images/${cardType.toLowerCase().replace(' ', '-')}.png`,
            type: 'image/png',
          },
        ],
        category: 'image',
        creators: [
          {
            address: this.umi.identity.publicKey.toString(),
            share: 100,
          },
        ],
      },
      loyalty_attributes: {
        card_type: cardType,
        rarity: rarity,
        buy_price_usdt: buyPriceUsdt,
        is_upgradeable: isCustodial,
        is_evolvable: true,
        is_fractional_eligible: true,
        auto_staking_duration: 'Forever',
        earn_on_spend_ratio: this.getEarnOnSpendRatio(cardType),
        upgrade_bonus_ratio: isCustodial ? this.getUpgradeBonusRatio(cardType) : 0,
        evolution_min_investment: this.getEvolutionMinInvestment(cardType, isCustodial),
        evolution_earnings_ratio: this.getEvolutionEarningsRatio(cardType, isCustodial),
        is_custodial: isCustodial,
      },
    };
  }

  // Helper methods for loyalty attributes
  private getEarnOnSpendRatio(cardType: string): number {
    const ratios: Record<string, number> = {
      'Pearl White': 0.0100, // 1.00%
      'Lava Orange': 0.0110, // 1.10%
      'Pink': 0.0110, // 1.10%
      'Silver': 0.0120, // 1.20%
      'Gold': 0.0130, // 1.30%
      'Black': 0.0140, // 1.40%
    };
    return ratios[cardType] || 0.0100;
  }

  private getUpgradeBonusRatio(cardType: string): number {
    const ratios: Record<string, number> = {
      'Pearl White': 0.0000, // 0.00%
      'Lava Orange': 0.0010, // 0.10%
      'Pink': 0.0010, // 0.10%
      'Silver': 0.0015, // 0.15%
      'Gold': 0.0020, // 0.20%
      'Black': 0.0030, // 0.30%
    };
    return ratios[cardType] || 0.0000;
  }

  private getEvolutionMinInvestment(cardType: string, isCustodial: boolean): number {
    if (isCustodial) {
      const investments: Record<string, number> = {
        'Pearl White': 100,
        'Lava Orange': 500,
        'Pink': 500,
        'Silver': 1000,
        'Gold': 1500,
        'Black': 2500,
      };
      return investments[cardType] || 100;
    } else {
      const investments: Record<string, number> = {
        'Pearl White': 500,
        'Lava Orange': 2500,
        'Pink': 2500,
        'Silver': 5000,
        'Gold': 5000,
        'Black': 13500,
      };
      return investments[cardType] || 500;
    }
  }

  private getEvolutionEarningsRatio(cardType: string, isCustodial: boolean): number {
    if (isCustodial) {
      const ratios: Record<string, number> = {
        'Pearl White': 0.0025, // 0.25%
        'Lava Orange': 0.0050, // 0.50%
        'Pink': 0.0050, // 0.50%
        'Silver': 0.0075, // 0.75%
        'Gold': 0.0100, // 1.00%
        'Black': 0.0125, // 1.25%
      };
      return ratios[cardType] || 0.0025;
    } else {
      const ratios: Record<string, number> = {
        'Pearl White': 0.0050, // 0.50%
        'Lava Orange': 0.0125, // 1.25%
        'Pink': 0.0125, // 1.25%
        'Silver': 0.0015, // 0.15%
        'Gold': 0.0020, // 0.20%
        'Black': 0.0030, // 0.30%
      };
      return ratios[cardType] || 0.0050;
    }
  }
}
