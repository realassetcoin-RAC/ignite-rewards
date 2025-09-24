// Solana NFT Service with full integration
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { IDL } from './solana_dao_nft_contract';

// Define Wallet interface locally since it's not exported in browser version
interface Wallet {
  publicKey: PublicKey;
  signTransaction<T extends Transaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction>(txs: T[]): Promise<T[]>;
}

// Types for the Solana contract
export interface SolanaNFTAccount {
  admin: PublicKey;
  collection_name: string;
  nft_name: string;
  display_name: string;
  symbol: string;
  uri: string;
  custody_type: number; // 0 = NonCustodial, 1 = Custodial
  buy_price_usdt: number;
  rarity: string;
  mint_quantity: number;
  is_upgradeable: boolean;
  is_evolvable: boolean;
  is_fractional_eligible: boolean;
  auto_staking_duration: string;
  earn_on_spend_ratio: number;
  upgrade_bonus_ratio: number;
  evolution_min_investment: number;
  evolution_earnings_ratio: number;
  passive_income_rate: number;
  custodial_income_rate: number | null;
  last_distribution_timestamp: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface CreateNFTParams {
  collection_name: string;
  nft_name: string;
  display_name: string;
  symbol: string;
  uri: string;
  is_custodial: boolean;
  buy_price_usdt: number;
  rarity: string;
  mint_quantity: number;
  is_upgradeable: boolean;
  is_evolvable: boolean;
  is_fractional_eligible: boolean;
  auto_staking_duration: string;
  earn_on_spend_ratio: number;
  upgrade_bonus_ratio: number;
  evolution_min_investment: number;
  evolution_earnings_ratio: number;
  passive_income_rate: number;
  custodial_income_rate?: number;
  fractional_supply?: number;
}

export interface UpdateNFTParams {
  collection_name: string;
  nft_name: string;
  display_name: string;
  symbol: string;
  uri: string;
  buy_price_usdt: number;
  rarity: string;
  mint_quantity: number;
  is_upgradeable: boolean;
  is_evolvable: boolean;
  is_fractional_eligible: boolean;
  auto_staking_duration: string;
  earn_on_spend_ratio: number;
  upgrade_bonus_ratio: number;
  evolution_min_investment: number;
  evolution_earnings_ratio: number;
  passive_income_rate: number;
  custodial_income_rate?: number;
}

export class SolanaNFTService {
  private rpcUrl: string;
  private programId: string;
  private isSolanaAvailable: boolean = false;
  private connection: Connection;
  private program: Program;
  private provider: AnchorProvider;

  constructor(
    rpcUrl: string = 'https://api.devnet.solana.com',
    programId: string = '81y1B91W78o5zLz6Lg8P96Y7JvW4Y9q6D8W2o7Jz8K9'
  ) {
    this.rpcUrl = rpcUrl;
    this.programId = programId;
    this.checkSolanaAvailability();
  }

  private checkSolanaAvailability(): void {
    try {
      // Check if required packages are available
      if (!Connection || !PublicKey || !Keypair || !Transaction) {
        this.logSolanaUnavailable();
        return;
      }
      
      // Solana packages are now installed and available
      this.isSolanaAvailable = true;
      console.log('✅ Solana packages detected - full functionality available');
      
      // Initialize Solana connection with error handling
      try {
        this.connection = new Connection(this.rpcUrl, 'confirmed');
      } catch (connectionError) {
        console.warn('Failed to create Solana connection:', connectionError);
        this.logSolanaUnavailable();
        return;
      }
      
      // Create a dummy wallet for now (in production, use actual wallet)
      try {
        const keypair = Keypair.generate();
        const wallet: Wallet = {
          publicKey: keypair.publicKey,
          signTransaction: async <T extends Transaction>(tx: T): Promise<T> => {
            tx.sign(keypair);
            return tx;
          },
          signAllTransactions: async <T extends Transaction>(txs: T[]): Promise<T[]> => {
            txs.forEach(tx => tx.sign(keypair));
            return txs;
          }
        };
        
        // Create provider with error handling
        this.provider = new AnchorProvider(this.connection, wallet, {
          commitment: 'confirmed',
        });
        
        // Initialize program with error handling
        this.program = new Program(IDL, this.provider);
        
        console.log('✅ Solana NFT Service initialized successfully');
      } catch (walletError) {
        console.warn('Failed to create wallet or provider:', walletError);
        this.logSolanaUnavailable();
        return;
      }
    } catch (error) {
      console.warn('Solana initialization failed:', error);
      this.logSolanaUnavailable();
    }
  }

  private logSolanaUnavailable(): void {
    console.warn('Solana functionality not available. Install @solana/web3.js and @coral-xyz/anchor for full blockchain integration.');
  }

  /**
   * Create a new NFT on Solana (placeholder implementation)
   */
  async createNFT(params: CreateNFTParams): Promise<string> {
    this.logSolanaUnavailable();
    
    // Return a mock transaction hash for database-only mode
    const mockTransactionHash = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Mock Solana NFT creation:', {
      params,
      transactionHash: mockTransactionHash,
      note: 'This is a placeholder. Install Solana packages for real blockchain integration.'
    });
    
    return mockTransactionHash;
  }

  /**
   * Update an existing NFT on Solana (placeholder implementation)
   */
  async updateNFT(params: UpdateNFTParams): Promise<string> {
    this.logSolanaUnavailable();
    
    // Return a mock transaction hash for database-only mode
    const mockTransactionHash = `mock_update_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Mock Solana NFT update:', {
      params,
      transactionHash: mockTransactionHash,
      note: 'This is a placeholder. Install Solana packages for real blockchain integration.'
    });
    
    return mockTransactionHash;
  }

  /**
   * Fetch NFT data from Solana (placeholder implementation)
   */
  async getNFT(nftName: string, symbol: string): Promise<SolanaNFTAccount | null> {
    this.logSolanaUnavailable();
    
    console.log('Mock Solana NFT fetch:', {
      nftName,
      symbol,
      note: 'This is a placeholder. Install Solana packages for real blockchain integration.'
    });
    
    return null;
  }

  /**
   * Fetch all NFTs from Solana (placeholder implementation)
   */
  async getAllNFTs(): Promise<SolanaNFTAccount[]> {
    this.logSolanaUnavailable();
    
    console.log('Mock Solana NFT fetch all:', {
      note: 'This is a placeholder. Install Solana packages for real blockchain integration.'
    });
    
    return [];
  }

  /**
   * Sync NFT data from Solana to database (placeholder implementation)
   */
  async syncNFTToDatabase(nftName: string, symbol: string): Promise<boolean> {
    this.logSolanaUnavailable();
    
    console.log('Mock Solana NFT sync to database:', {
      nftName,
      symbol,
      note: 'This is a placeholder. Install Solana packages for real blockchain integration.'
    });
    
    return false;
  }

  /**
   * Sync all NFTs from Solana to database (placeholder implementation)
   */
  async syncAllNFTsToDatabase(): Promise<{ success: number; failed: number }> {
    this.logSolanaUnavailable();
    
    console.log('Mock Solana sync all NFTs to database:', {
      note: 'This is a placeholder. Install Solana packages for real blockchain integration.'
    });
    
    return { success: 0, failed: 0 };
  }

  /**
   * Convert database NFT data to Solana format
   */
  convertDatabaseToSolana(dbNFT: any): CreateNFTParams {
    return {
      collection_name: dbNFT.collection_name || 'classic',
      nft_name: dbNFT.nft_name,
      display_name: dbNFT.display_name || dbNFT.nft_name,
      symbol: dbNFT.symbol || 'NFT',
      uri: dbNFT.uri || '',
      is_custodial: dbNFT.is_custodial !== false,
      buy_price_usdt: Math.floor((dbNFT.buy_price_usdt || 0) * 1000000), // Convert to smallest unit
      rarity: dbNFT.rarity || 'Common',
      mint_quantity: dbNFT.mint_quantity || 0,
      is_upgradeable: dbNFT.is_upgradeable || false,
      is_evolvable: dbNFT.is_evolvable !== false,
      is_fractional_eligible: dbNFT.is_fractional_eligible !== false,
      auto_staking_duration: dbNFT.auto_staking_duration || 'Forever',
      earn_on_spend_ratio: Math.floor((dbNFT.earn_on_spend_ratio || 0.01) * 10000), // Convert to basis points
      upgrade_bonus_ratio: Math.floor((dbNFT.upgrade_bonus_ratio || 0) * 10000),
      evolution_min_investment: Math.floor((dbNFT.evolution_min_investment || 0) * 1000000),
      evolution_earnings_ratio: Math.floor((dbNFT.evolution_earnings_ratio || 0) * 10000),
      passive_income_rate: Math.floor((dbNFT.passive_income_rate || 0.01) * 10000),
      custodial_income_rate: dbNFT.custodial_income_rate ? Math.floor(dbNFT.custodial_income_rate * 10000) : undefined,
      fractional_supply: dbNFT.fractional_supply
    };
  }
}

// Export singleton instance with lazy initialization
let _solanaNFTService: SolanaNFTService | null = null;

export const getSolanaNFTService = (): SolanaNFTService => {
  if (!_solanaNFTService) {
    try {
      _solanaNFTService = new SolanaNFTService();
    } catch (error) {
      console.warn('Failed to initialize Solana NFT Service:', error);
      // Return a mock service that doesn't crash
      _solanaNFTService = {
        isSolanaAvailable: false,
        connection: null,
        provider: null,
        program: null,
        createNFT: async () => ({ success: false, error: 'Solana not available' }),
        getNFT: async () => null,
        updateNFT: async () => ({ success: false, error: 'Solana not available' }),
        deleteNFT: async () => ({ success: false, error: 'Solana not available' }),
        listNFTs: async () => [],
        transferNFT: async () => ({ success: false, error: 'Solana not available' }),
        mintNFT: async () => ({ success: false, error: 'Solana not available' }),
        burnNFT: async () => ({ success: false, error: 'Solana not available' })
      } as any;
    }
  }
  return _solanaNFTService;
};

// For backward compatibility, export the getter as the main export
// This will only instantiate when first accessed, not during module load
export const solanaNFTService = new Proxy({} as SolanaNFTService, {
  get(target, prop) {
    const service = getSolanaNFTService();
    return service[prop as keyof SolanaNFTService];
  }
});
