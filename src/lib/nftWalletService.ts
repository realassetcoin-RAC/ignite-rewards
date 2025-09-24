// NFT Wallet Service - Handles both Custodial and Non-Custodial NFTs
// Supports Web3 wallet integration (Phantom, MetaMask, etc.)

// import { supabase } from '@/integrations/supabase/client';

// Types for wallet integration
export interface WalletConnection {
  publicKey: string;
  walletType: 'phantom' | 'metamask' | 'solflare' | 'other';
  isConnected: boolean;
  address: string;
}

export interface NonCustodialNFTVerification {
  tokenId: string;
  contractAddress: string;
  walletAddress: string;
  isVerified: boolean;
  verificationDate?: string;
  metadata?: any;
}

export interface CustodialNFTPurchase {
  nftTypeId: string;
  userId: string;
  paymentMethod: 'credit_card' | 'crypto' | 'usdt';
  amount: number;
  transactionHash?: string;
}

export class NFTWalletService {
  private static walletConnection: WalletConnection | null = null;

  /**
   * Connect to Web3 wallet (Phantom, MetaMask, etc.)
   */
  static async connectWallet(walletType: 'phantom' | 'metamask' | 'solflare' = 'phantom'): Promise<WalletConnection> {
    try {
      let wallet: any = null;
      let publicKey: string = '';
      let address: string = '';

      switch (walletType) {
        case 'phantom':
          if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
            wallet = (window as any).solana;
            const response = await wallet.connect();
            publicKey = response.publicKey.toString();
            address = publicKey;
          } else {
            throw new Error('Phantom wallet not found. Please install Phantom wallet.');
          }
          break;

        case 'metamask':
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            wallet = (window as any).ethereum;
            const accounts = await wallet.request({ method: 'eth_requestAccounts' });
            address = accounts[0];
            publicKey = address;
          } else {
            throw new Error('MetaMask not found. Please install MetaMask.');
          }
          break;

        case 'solflare':
          if (typeof window !== 'undefined' && (window as any).solflare) {
            wallet = (window as any).solflare;
            const response = await wallet.connect();
            publicKey = response.publicKey.toString();
            address = publicKey;
          } else {
            throw new Error('Solflare wallet not found. Please install Solflare wallet.');
          }
          break;

        default:
          throw new Error('Unsupported wallet type');
      }

      this.walletConnection = {
        publicKey,
        walletType,
        isConnected: true,
        address
      };

      return this.walletConnection;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  /**
   * Disconnect wallet
   */
  static disconnectWallet(): void {
    this.walletConnection = null;
  }

  /**
   * Get current wallet connection
   */
  static getWalletConnection(): WalletConnection | null {
    return this.walletConnection;
  }

  /**
   * Check if wallet is connected
   */
  static isWalletConnected(): boolean {
    return this.walletConnection?.isConnected || false;
  }

  /**
   * Purchase Custodial NFT (for users signing up from the application)
   */
  static async purchaseCustodialNFT(purchaseData: CustodialNFTPurchase): Promise<any> {
    try {
      // Create the purchase record
      const { data, error } = await supabase
        .from('user_loyalty_cards')
        .insert([{
          user_id: purchaseData.userId,
          nft_type_id: purchaseData.nftTypeId,
          is_custodial: true,
          current_investment: purchaseData.amount,
          purchased_at: new Date().toISOString(),
          is_verified: true,
          // Generate a unique token ID for custodial NFTs
          token_id: `custodial_${purchaseData.userId}_${Date.now()}`,
        }])
        .select(`
          *,
          nft_types (*)
        `)
        .single();

      if (error) throw error;

      // Log the purchase transaction
      await this.logPurchaseTransaction({
        user_id: purchaseData.userId,
        nft_type_id: purchaseData.nftTypeId,
        amount: purchaseData.amount,
        payment_method: purchaseData.paymentMethod,
        transaction_hash: purchaseData.transactionHash,
        is_custodial: true,
        status: 'completed'
      });

      return data;
    } catch (error) {
      console.error('Error purchasing custodial NFT:', error);
      throw error;
    }
  }

  /**
   * Verify Non-Custodial NFT (for users who purchased from crypto marketplace)
   */
  static async verifyNonCustodialNFT(
    userId: string,
    tokenId: string,
    contractAddress: string,
    walletAddress: string
  ): Promise<NonCustodialNFTVerification> {
    try {
      // First, verify the NFT exists on the blockchain
      const isVerified = await this.verifyNFTOnBlockchain(tokenId, contractAddress, walletAddress);
      
      if (!isVerified) {
        throw new Error('NFT verification failed on blockchain');
      }

      // Get NFT metadata
      const metadata = await this.getNFTMetadata(tokenId, contractAddress);

      // Find matching NFT type in database
      const nftType = await this.findMatchingNFTType(metadata);

      if (!nftType) {
        throw new Error('No matching NFT type found in database');
      }

      // Create or update the user's non-custodial NFT record
      const { error } = await supabase
        .from('user_loyalty_cards')
        .upsert([{
          user_id: userId,
          nft_type_id: nftType.id,
          is_custodial: false,
          token_id: tokenId,
          wallet_address: walletAddress,
          contract_address: contractAddress,
          is_verified: true,
          last_verified_at: new Date().toISOString(),
          purchased_at: new Date().toISOString(),
        }])
        .select(`
          *,
          nft_types (*)
        `)
        .single();

      if (error) throw error;

      return {
        tokenId,
        contractAddress,
        walletAddress,
        isVerified: true,
        verificationDate: new Date().toISOString(),
        metadata
      };
    } catch (error) {
      console.error('Error verifying non-custodial NFT:', error);
      throw error;
    }
  }

  /**
   * Get user's NFTs (both custodial and non-custodial)
   */
  static async getUserNFTs(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_loyalty_cards')
        .select(`
          *,
          nft_types (*)
        `)
        .eq('user_id', userId)
        .not('nft_type_id', 'is', null)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw error;
    }
  }

  /**
   * Get user's custodial NFTs only
   */
  static async getUserCustodialNFTs(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_loyalty_cards')
        .select(`
          *,
          nft_types (*)
        `)
        .eq('user_id', userId)
        .eq('is_custodial', true)
        .not('nft_type_id', 'is', null)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching custodial NFTs:', error);
      throw error;
    }
  }

  /**
   * Get user's non-custodial NFTs only
   */
  static async getUserNonCustodialNFTs(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_loyalty_cards')
        .select(`
          *,
          nft_types (*)
        `)
        .eq('user_id', userId)
        .eq('is_custodial', false)
        .not('nft_type_id', 'is', null)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching non-custodial NFTs:', error);
      throw error;
    }
  }

  /**
   * Verify NFT exists on blockchain (placeholder implementation)
   */
  private static async verifyNFTOnBlockchain(tokenId: string, contractAddress: string, walletAddress: string): Promise<boolean> {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would:
      // 1. Connect to the appropriate blockchain (Solana, Ethereum, etc.)
      // 2. Query the NFT contract to verify ownership
      // 3. Check if the wallet address owns the token ID
      
      console.log('Verifying NFT on blockchain:', { tokenId, contractAddress, walletAddress });
      
      // For now, return true (in production, implement actual blockchain verification)
      return true;
    } catch (error) {
      console.error('Error verifying NFT on blockchain:', error);
      return false;
    }
  }

  /**
   * Get NFT metadata (placeholder implementation)
   */
  private static async getNFTMetadata(tokenId: string, contractAddress: string): Promise<any> {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would:
      // 1. Query the NFT contract for metadata URI
      // 2. Fetch metadata from IPFS or other storage
      // 3. Parse and return the metadata
      
      console.log('Fetching NFT metadata:', { tokenId, contractAddress });
      
      // For now, return mock metadata
      return {
        name: 'Sample NFT',
        description: 'A sample NFT',
        image: 'https://example.com/image.png',
        attributes: [
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Type', value: 'Loyalty' }
        ]
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }

  /**
   * Find matching NFT type in database based on metadata
   */
  private static async findMatchingNFTType(metadata: any): Promise<any> {
    try {
      // Try to match based on rarity and other attributes
      const rarity = metadata.attributes?.find((attr: any) => attr.trait_type === 'Rarity')?.value || 'Common';
      
      const { data, error } = await supabase
        .from('nft_types')
        .select('*')
        .eq('rarity', rarity)
        .eq('is_custodial', false)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        console.warn('No matching NFT type found:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error finding matching NFT type:', error);
      return null;
    }
  }

  /**
   * Log purchase transaction
   */
  private static async logPurchaseTransaction(transactionData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('nft_purchase_transactions')
        .insert([{
          ...transactionData,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.warn('Failed to log purchase transaction:', error);
      }
    } catch (error) {
      console.warn('Error logging purchase transaction:', error);
    }
  }

  /**
   * Check if user owns a specific NFT
   */
  static async checkNFTOwnership(userId: string, tokenId: string, contractAddress?: string): Promise<boolean> {
    try {
      const query = supabase
        .from('user_loyalty_cards')
        .select('id')
        .eq('user_id', userId)
        .eq('token_id', tokenId);

      if (contractAddress) {
        query.eq('contract_address', contractAddress);
      }

      const { data, error } = await query.single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
      return false;
    }
  }

  /**
   * Get NFT benefits for user
   */
  static async getUserNFTBenefits(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_loyalty_cards')
        .select(`
          *,
          nft_types (
            earn_on_spend_ratio,
            upgrade_bonus_ratio,
            evolution_earnings_ratio,
            auto_staking_duration,
            is_upgradeable,
            is_evolvable,
            is_fractional_eligible
          )
        `)
        .eq('user_id', userId)
        .eq('is_verified', true)
        .not('nft_type_id', 'is', null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching NFT benefits:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const nftWalletService = NFTWalletService;


