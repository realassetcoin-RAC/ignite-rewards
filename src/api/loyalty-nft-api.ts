// Loyalty NFT API - Backend API endpoints for loyalty NFT cards
// This API provides comprehensive data fetching for loyalty NFT cards

import { databaseAdapter } from '@/lib/databaseAdapter';
import { NFTType, UserLoyaltyCard } from '@/lib/loyaltyNFTService';

export interface LoyaltyNFTApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NFTTypeWithStats extends NFTType {
  total_owned: number;
  total_minted: number;
  average_investment: number;
  evolution_count: number;
  upgrade_count: number;
}

export interface UserLoyaltyCardWithDetails extends UserLoyaltyCard {
  nft_types: NFTType;
  evolution_history?: any[];
  upgrade_history?: any[];
  recent_transactions?: any[];
}

export class LoyaltyNFTApi {
  /**
   * Get all NFT types with comprehensive statistics
   */
  static async getAllNFTTypesWithStats(): Promise<LoyaltyNFTApiResponse<NFTTypeWithStats[]>> {
    try {
      console.log('🔄 Fetching all NFT types with statistics...');
      
      // Get basic NFT types
      const { data: nftTypes, error: nftError } = await databaseAdapter
        .from('nft_types')
        .select('*')
        .eq('is_active', true)
        .order('buy_price_usdt', { ascending: true });

      if (nftError) {
        console.error('❌ Error fetching NFT types:', nftError);
        return { success: false, error: nftError.message };
      }

      if (!nftTypes || nftTypes.length === 0) {
        console.log('⚠️ No NFT types found');
        return { success: true, data: [], message: 'No NFT types found' };
      }

      // Get statistics for each NFT type
      const nftTypesWithStats: NFTTypeWithStats[] = await Promise.all(
        nftTypes.map(async (nftType: NFTType) => {
          try {
            // Get ownership statistics
            const { data: ownershipStats } = await databaseAdapter
              .from('user_loyalty_cards')
              .select('id, current_investment, is_evolved, is_upgraded')
              .eq('nft_type_id', nftType.id);

            const totalOwned = ownershipStats?.length || 0;
            const totalMinted = totalOwned; // Assuming all owned cards are minted
            const averageInvestment = ownershipStats?.length > 0 
              ? ownershipStats.reduce((sum: number, card: any) => sum + (card.current_investment || 0), 0) / ownershipStats.length
              : 0;
            const evolutionCount = ownershipStats?.filter((card: any) => card.is_evolved).length || 0;
            const upgradeCount = ownershipStats?.filter((card: any) => card.is_upgraded).length || 0;

            return {
              ...nftType,
              total_owned: totalOwned,
              total_minted: totalMinted,
              average_investment: averageInvestment,
              evolution_count: evolutionCount,
              upgrade_count: upgradeCount,
            };
          } catch (error) {
            console.error(`❌ Error getting stats for NFT type ${nftType.id}:`, error);
            return {
              ...nftType,
              total_owned: 0,
              total_minted: 0,
              average_investment: 0,
              evolution_count: 0,
              upgrade_count: 0,
            };
          }
        })
      );

      console.log(`✅ Successfully fetched ${nftTypesWithStats.length} NFT types with statistics`);
      return { success: true, data: nftTypesWithStats };
    } catch (error) {
      console.error('❌ Fatal error in getAllNFTTypesWithStats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get user's loyalty cards with detailed information
   */
  static async getUserLoyaltyCardsWithDetails(userId: string): Promise<LoyaltyNFTApiResponse<UserLoyaltyCardWithDetails[]>> {
    try {
      console.log(`🔄 Fetching loyalty cards for user ${userId}...`);
      
      // Get user's loyalty cards with NFT type details
      const { data: loyaltyCards, error: cardsError } = await databaseAdapter
        .from('user_loyalty_cards')
        .select(`
          *,
          nft_types (*)
        `)
        .eq('user_id', userId)
        .not('nft_type_id', 'is', null)
        .order('created_at', { ascending: false });

      if (cardsError) {
        console.error('❌ Error fetching user loyalty cards:', cardsError);
        return { success: false, error: cardsError.message };
      }

      if (!loyaltyCards || loyaltyCards.length === 0) {
        console.log('⚠️ No loyalty cards found for user');
        return { success: true, data: [], message: 'No loyalty cards found' };
      }

      // Get additional details for each card
      const cardsWithDetails: UserLoyaltyCardWithDetails[] = await Promise.all(
        loyaltyCards.map(async (card: any) => {
          try {
            // Get evolution history
            const { data: evolutionHistory } = await databaseAdapter
              .from('nft_evolution_history')
              .select('*')
              .eq('user_id', userId)
              .eq('nft_type_id', card.nft_type_id)
              .eq('is_active', true)
              .order('evolution_triggered_at', { ascending: false });

            // Get upgrade history
            const { data: upgradeHistory } = await databaseAdapter
              .from('nft_upgrade_history')
              .select('*')
              .eq('user_id', userId)
              .eq('nft_type_id', card.nft_type_id)
              .eq('is_active', true)
              .order('upgraded_at', { ascending: false });

            // Get recent transactions
            const { data: recentTransactions } = await databaseAdapter
              .from('loyalty_transactions')
              .select('*')
              .eq('user_id', userId)
              .eq('loyalty_number', card.loyalty_number)
              .order('transaction_date', { ascending: false })
              .limit(5);

            return {
              ...card,
              evolution_history: evolutionHistory || [],
              upgrade_history: upgradeHistory || [],
              recent_transactions: recentTransactions || [],
            };
          } catch (error) {
            console.error(`❌ Error getting details for card ${card.id}:`, error);
            return {
              ...card,
              evolution_history: [],
              upgrade_history: [],
              recent_transactions: [],
            };
          }
        })
      );

      console.log(`✅ Successfully fetched ${cardsWithDetails.length} loyalty cards with details`);
      return { success: true, data: cardsWithDetails };
    } catch (error) {
      console.error('❌ Fatal error in getUserLoyaltyCardsWithDetails:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get NFT type by ID with comprehensive details
   */
  static async getNFTTypeByIdWithDetails(nftTypeId: string): Promise<LoyaltyNFTApiResponse<NFTTypeWithStats>> {
    try {
      console.log(`🔄 Fetching NFT type details for ${nftTypeId}...`);
      
      // Get basic NFT type
      const { data: nftType, error: nftError } = await databaseAdapter
        .from('nft_types')
        .select('*')
        .eq('id', nftTypeId)
        .single();

      if (nftError) {
        console.error('❌ Error fetching NFT type:', nftError);
        return { success: false, error: nftError.message };
      }

      if (!nftType) {
        return { success: false, error: 'NFT type not found' };
      }

      // Get statistics
      const { data: ownershipStats } = await databaseAdapter
        .from('user_loyalty_cards')
        .select('id, current_investment, is_evolved, is_upgraded')
        .eq('nft_type_id', nftTypeId);

      const totalOwned = ownershipStats?.length || 0;
      const totalMinted = totalOwned;
      const averageInvestment = ownershipStats?.length > 0 
        ? ownershipStats.reduce((sum: number, card: any) => sum + (card.current_investment || 0), 0) / ownershipStats.length
        : 0;
      const evolutionCount = ownershipStats?.filter((card: any) => card.is_evolved).length || 0;
      const upgradeCount = ownershipStats?.filter((card: any) => card.is_upgraded).length || 0;

      const nftTypeWithStats: NFTTypeWithStats = {
        ...nftType,
        total_owned: totalOwned,
        total_minted: totalMinted,
        average_investment: averageInvestment,
        evolution_count: evolutionCount,
        upgrade_count: upgradeCount,
      };

      console.log(`✅ Successfully fetched NFT type details for ${nftTypeId}`);
      return { success: true, data: nftTypeWithStats };
    } catch (error) {
      console.error('❌ Fatal error in getNFTTypeByIdWithDetails:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get loyalty card statistics for admin dashboard
   */
  static async getLoyaltyCardStatistics(): Promise<LoyaltyNFTApiResponse<{
    total_nft_types: number;
    total_loyalty_cards: number;
    total_investment: number;
    evolution_rate: number;
    upgrade_rate: number;
    rarity_distribution: Record<string, number>;
    custody_distribution: { custodial: number; non_custodial: number };
  }>> {
    try {
      console.log('🔄 Fetching loyalty card statistics...');
      
      // Get total NFT types
      const { data: nftTypes, error: nftError } = await databaseAdapter
        .from('nft_types')
        .select('id, rarity, is_custodial')
        .eq('is_active', true);

      if (nftError) {
        console.error('❌ Error fetching NFT types for statistics:', nftError);
        return { success: false, error: nftError.message };
      }

      // Get total loyalty cards
      const { data: loyaltyCards, error: cardsError } = await databaseAdapter
        .from('user_loyalty_cards')
        .select('id, current_investment, is_evolved, is_upgraded, nft_type_id')
        .not('nft_type_id', 'is', null);

      if (cardsError) {
        console.error('❌ Error fetching loyalty cards for statistics:', cardsError);
        return { success: false, error: cardsError.message };
      }

      // Calculate statistics
      const totalNFTTypes = nftTypes?.length || 0;
      const totalLoyaltyCards = loyaltyCards?.length || 0;
      const totalInvestment = loyaltyCards?.reduce((sum: number, card: any) => sum + (card.current_investment || 0), 0) || 0;
      const evolutionCount = loyaltyCards?.filter((card: any) => card.is_evolved).length || 0;
      const upgradeCount = loyaltyCards?.filter((card: any) => card.is_upgraded).length || 0;
      const evolutionRate = totalLoyaltyCards > 0 ? (evolutionCount / totalLoyaltyCards) * 100 : 0;
      const upgradeRate = totalLoyaltyCards > 0 ? (upgradeCount / totalLoyaltyCards) * 100 : 0;

      // Rarity distribution
      const rarityDistribution: Record<string, number> = {};
      nftTypes?.forEach((nft: any) => {
        rarityDistribution[nft.rarity] = (rarityDistribution[nft.rarity] || 0) + 1;
      });

      // Custody distribution
      const custodialCount = nftTypes?.filter((nft: any) => nft.is_custodial).length || 0;
      const nonCustodialCount = nftTypes?.length - custodialCount || 0;

      const statistics = {
        total_nft_types: totalNFTTypes,
        total_loyalty_cards: totalLoyaltyCards,
        total_investment: totalInvestment,
        evolution_rate: evolutionRate,
        upgrade_rate: upgradeRate,
        rarity_distribution: rarityDistribution,
        custody_distribution: {
          custodial: custodialCount,
          non_custodial: nonCustodialCount,
        },
      };

      console.log('✅ Successfully calculated loyalty card statistics');
      return { success: true, data: statistics };
    } catch (error) {
      console.error('❌ Fatal error in getLoyaltyCardStatistics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Search NFT types by criteria
   */
  static async searchNFTTypes(criteria: {
    rarity?: string;
    is_custodial?: boolean;
    min_price?: number;
    max_price?: number;
    is_evolvable?: boolean;
    is_upgradeable?: boolean;
  }): Promise<LoyaltyNFTApiResponse<NFTTypeWithStats[]>> {
    try {
      console.log('🔄 Searching NFT types with criteria:', criteria);
      
      let query = databaseAdapter
        .from('nft_types')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (criteria.rarity) {
        query = query.eq('rarity', criteria.rarity);
      }
      if (criteria.is_custodial !== undefined) {
        query = query.eq('is_custodial', criteria.is_custodial);
      }
      if (criteria.min_price !== undefined) {
        query = query.gte('buy_price_usdt', criteria.min_price);
      }
      if (criteria.max_price !== undefined) {
        query = query.lte('buy_price_usdt', criteria.max_price);
      }
      if (criteria.is_evolvable !== undefined) {
        query = query.eq('is_evolvable', criteria.is_evolvable);
      }
      if (criteria.is_upgradeable !== undefined) {
        query = query.eq('is_upgradeable', criteria.is_upgradeable);
      }

      const { data: nftTypes, error: nftError } = await query.order('buy_price_usdt', { ascending: true });

      if (nftError) {
        console.error('❌ Error searching NFT types:', nftError);
        return { success: false, error: nftError.message };
      }

      if (!nftTypes || nftTypes.length === 0) {
        return { success: true, data: [], message: 'No NFT types found matching criteria' };
      }

      // Add statistics to each NFT type
      const nftTypesWithStats: NFTTypeWithStats[] = await Promise.all(
        nftTypes.map(async (nftType: NFTType) => {
          try {
            const { data: ownershipStats } = await databaseAdapter
              .from('user_loyalty_cards')
              .select('id, current_investment, is_evolved, is_upgraded')
              .eq('nft_type_id', nftType.id);

            const totalOwned = ownershipStats?.length || 0;
            const totalMinted = totalOwned;
            const averageInvestment = ownershipStats?.length > 0 
              ? ownershipStats.reduce((sum: number, card: any) => sum + (card.current_investment || 0), 0) / ownershipStats.length
              : 0;
            const evolutionCount = ownershipStats?.filter((card: any) => card.is_evolved).length || 0;
            const upgradeCount = ownershipStats?.filter((card: any) => card.is_upgraded).length || 0;

            return {
              ...nftType,
              total_owned: totalOwned,
              total_minted: totalMinted,
              average_investment: averageInvestment,
              evolution_count: evolutionCount,
              upgrade_count: upgradeCount,
            };
          } catch (error) {
            console.error(`❌ Error getting stats for NFT type ${nftType.id}:`, error);
            return {
              ...nftType,
              total_owned: 0,
              total_minted: 0,
              average_investment: 0,
              evolution_count: 0,
              upgrade_count: 0,
            };
          }
        })
      );

      console.log(`✅ Successfully found ${nftTypesWithStats.length} NFT types matching criteria`);
      return { success: true, data: nftTypesWithStats };
    } catch (error) {
      console.error('❌ Fatal error in searchNFTTypes:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update NFT type information
   */
  static async updateNFTType(nftTypeId: string, updates: Partial<NFTType>): Promise<LoyaltyNFTApiResponse<NFTType>> {
    try {
      console.log(`🔄 Updating NFT type ${nftTypeId}...`);
      
      const { data, error } = await databaseAdapter
        .from('nft_types')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nftTypeId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error updating NFT type:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully updated NFT type ${nftTypeId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Fatal error in updateNFTType:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Create new NFT type
   */
  static async createNFTType(nftData: Partial<NFTType>): Promise<LoyaltyNFTApiResponse<NFTType>> {
    try {
      console.log('🔄 Creating new NFT type...');
      
      const { data, error } = await databaseAdapter
        .from('nft_types')
        .insert({
          ...nftData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating NFT type:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully created new NFT type ${data.id}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Fatal error in createNFTType:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete NFT type
   */
  static async deleteNFTType(nftTypeId: string): Promise<LoyaltyNFTApiResponse<boolean>> {
    try {
      console.log(`🔄 Deleting NFT type ${nftTypeId}...`);
      
      // First check if any loyalty cards are using this NFT type
      const { data: loyaltyCards, error: checkError } = await databaseAdapter
        .from('user_loyalty_cards')
        .select('id')
        .eq('nft_type_id', nftTypeId)
        .limit(1);

      if (checkError) {
        console.error('❌ Error checking loyalty cards:', checkError);
        return { success: false, error: checkError.message };
      }

      if (loyaltyCards && loyaltyCards.length > 0) {
        return { 
          success: false, 
          error: 'Cannot delete NFT type that is being used by loyalty cards' 
        };
      }

      // Delete the NFT type
      const { error } = await databaseAdapter
        .from('nft_types')
        .delete()
        .eq('id', nftTypeId);

      if (error) {
        console.error('❌ Error deleting NFT type:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully deleted NFT type ${nftTypeId}`);
      return { success: true, data: true };
    } catch (error) {
      console.error('❌ Fatal error in deleteNFTType:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export default LoyaltyNFTApi;
