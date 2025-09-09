// New Loyalty NFT Service (Custodial & Non-Custodial)
// This service integrates with the updated database schema

import { supabase } from '@/integrations/supabase/client';

// Core NFT Types
export enum CustodyType {
  NonCustodial = 0,
  Custodial = 1,
}

export enum NFTRarity {
  Common = 'Common',
  LessCommon = 'Less Common', 
  Rare = 'Rare',
  VeryRare = 'Very Rare',
}

// Database interfaces
export interface NFTType {
  id: string;
  nft_name: string;
  display_name: string;
  buy_price_usdt: number;
  rarity: NFTRarity;
  mint_quantity: number;
  is_upgradeable: boolean;
  is_evolvable: boolean;
  is_fractional_eligible: boolean;
  auto_staking_duration: string;
  earn_on_spend_ratio: number;
  upgrade_bonus_ratio: number;
  evolution_min_investment: number;
  evolution_earnings_ratio: number;
  is_custodial: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLoyaltyCard {
  id: string;
  user_id: string;
  nft_type_id?: string;
  is_custodial: boolean;
  token_id?: string;
  is_upgraded: boolean;
  is_evolved: boolean;
  evolved_token_id?: string;
  current_investment: number;
  auto_staking_enabled: boolean;
  auto_staking_asset_id?: string;
  wallet_address?: string;
  contract_address?: string;
  is_verified: boolean;
  last_verified_at?: string;
  purchased_at: string;
  upgraded_at?: string;
  evolved_at?: string;
  nft_types?: NFTType;
}

export interface NFTEvolutionHistory {
  id: string;
  user_id: string;
  nft_type_id: string;
  original_token_id?: string;
  evolved_token_id?: string;
  investment_amount: number;
  evolution_triggered_at: string;
  is_active: boolean;
  nft_types?: NFTType;
}

export interface NFTUpgradeHistory {
  id: string;
  user_id: string;
  nft_type_id: string;
  original_earn_ratio: number;
  new_earn_ratio: number;
  upgrade_bonus_ratio: number;
  upgraded_at: string;
  is_active: boolean;
  nft_types?: NFTType;
}

export interface NFTMintingControl {
  id: string;
  nft_type_id: string;
  minting_enabled: boolean;
  total_minted: number;
  max_mintable: number;
  minting_paused_reason?: string;
  paused_by?: string;
  paused_at?: string;
  created_at: string;
  updated_at: string;
  nft_types?: NFTType;
}

// Service functions
export class LoyaltyNFTService {
  // Get all available NFT types
  static async getAllNFTTypes(): Promise<NFTType[]> {
    const { data, error } = await supabase
      .from('nft_types')
      .select('*')
      .eq('is_active', true)
      .order('is_custodial', { ascending: false })
      .order('buy_price_usdt', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get NFT types by custody type
  static async getNFTTypesByCustody(isCustodial: boolean): Promise<NFTType[]> {
    const { data, error } = await supabase
      .from('nft_types')
      .select('*')
      .eq('is_custodial', isCustodial)
      .eq('is_active', true)
      .order('buy_price_usdt', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get user's owned NFTs
  static async getUserNFTs(userId: string): Promise<UserLoyaltyCard[]> {
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
  }

  // Get NFT type details by ID
  static async getNFTTypeById(nftTypeId: string): Promise<NFTType | null> {
    const { data, error } = await supabase
      .from('nft_types')
      .select('*')
      .eq('id', nftTypeId)
      .single();

    if (error) throw error;
    return data;
  }

  // Check if user owns a specific NFT type
  static async checkUserOwnership(userId: string, nftTypeId: string): Promise<UserLoyaltyCard | null> {
    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .select(`
        *,
        nft_types (*)
      `)
      .eq('user_id', userId)
      .eq('nft_type_id', nftTypeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get NFT type display name
  static getNFTTypeDisplayName(nftType: NFTType): string {
    return `${nftType.display_name} (${nftType.is_custodial ? 'Custodial' : 'Non-Custodial'})`;
  }

  // Get rarity display name with color
  static getRarityDisplayInfo(rarity: NFTRarity): { name: string; color: string; bgColor: string } {
    const rarityInfo = {
      [NFTRarity.Common]: { name: 'Common', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      [NFTRarity.LessCommon]: { name: 'Less Common', color: 'text-green-600', bgColor: 'bg-green-100' },
      [NFTRarity.Rare]: { name: 'Rare', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      [NFTRarity.VeryRare]: { name: 'Very Rare', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    };
    return rarityInfo[rarity] || { name: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  }

  // Get custody type display name
  static getCustodyTypeDisplayName(isCustodial: boolean): string {
    return isCustodial ? 'Custodial' : 'Non-Custodial';
  }

  // Calculate effective earning ratio for a user's NFT
  static calculateEffectiveEarningRatio(userNFT: UserLoyaltyCard): number {
    if (!userNFT.nft_types) return 0;
    
    let baseRatio = userNFT.nft_types.earn_on_spend_ratio;
    
    // Apply upgrade bonus if NFT is upgraded and custodial
    if (userNFT.is_upgraded && userNFT.is_custodial && userNFT.nft_types.upgrade_bonus_ratio > 0) {
      baseRatio += userNFT.nft_types.upgrade_bonus_ratio;
    }
    
    return baseRatio;
  }

  // Get NFT pricing information
  static getNFTPriceInfo(nftType: NFTType): {
    price: number;
    currency: string;
    displayPrice: string;
  } {
    return {
      price: nftType.buy_price_usdt,
      currency: 'USDT',
      displayPrice: nftType.buy_price_usdt > 0 ? `${nftType.buy_price_usdt} USDT` : 'Free',
    };
  }

  // Check if NFT can be upgraded
  static canUpgrade(userNFT: UserLoyaltyCard): boolean {
    return !userNFT.is_upgraded && userNFT.nft_types?.is_upgradeable === true;
  }

  // Check if auto-staking can be enabled
  static canEnableAutoStaking(userNFT: UserLoyaltyCard): boolean {
    return !userNFT.auto_staking_enabled;
  }

  // Check if NFT can evolve
  static canEvolve(userNFT: UserLoyaltyCard): boolean {
    return !userNFT.is_evolved && 
           userNFT.nft_types?.is_evolvable === true && 
           userNFT.current_investment >= (userNFT.nft_types?.evolution_min_investment || 0);
  }

  // Get evolution requirements
  static getEvolutionRequirements(userNFT: UserLoyaltyCard): {
    canEvolve: boolean;
    requirements: string[];
    minInvestment: number;
  } {
    const requirements: string[] = [];
    let canEvolve = true;
    const minInvestment = userNFT.nft_types?.evolution_min_investment || 0;

    // Check if NFT is evolved
    if (userNFT.is_evolved) {
      requirements.push('❌ NFT is already evolved');
      canEvolve = false;
    } else {
      requirements.push('✅ NFT is not evolved');
    }

    // Check if NFT is evolvable
    if (!userNFT.nft_types?.is_evolvable) {
      requirements.push('❌ NFT type is not evolvable');
      canEvolve = false;
    } else {
      requirements.push('✅ NFT type is evolvable');
    }

    // Check investment amount
    if (userNFT.current_investment < minInvestment) {
      requirements.push(`❌ Need ${minInvestment} USDT investment (current: ${userNFT.current_investment})`);
      canEvolve = false;
    } else {
      requirements.push(`✅ Investment requirement met (${userNFT.current_investment}/${minInvestment} USDT)`);
    }

    return { canEvolve, requirements, minInvestment };
  }

  // Get minting status for an NFT type
  static async getMintingStatus(nftTypeId: string): Promise<NFTMintingControl | null> {
    const { data, error } = await supabase
      .from('nft_minting_control')
      .select(`
        *,
        nft_types (*)
      `)
      .eq('nft_type_id', nftTypeId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get user's evolution history
  static async getUserEvolutionHistory(userId: string): Promise<NFTEvolutionHistory[]> {
    const { data, error } = await supabase
      .from('nft_evolution_history')
      .select(`
        *,
        nft_types (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('evolution_triggered_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get user's upgrade history
  static async getUserUpgradeHistory(userId: string): Promise<NFTUpgradeHistory[]> {
    const { data, error } = await supabase
      .from('nft_upgrade_history')
      .select(`
        *,
        nft_types (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('upgraded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Purchase an NFT (create user loyalty card)
  static async purchaseNFT(
    userId: string, 
    nftTypeId: string, 
    tokenId?: string,
    walletAddress?: string,
    contractAddress?: string
  ): Promise<UserLoyaltyCard> {
    const nftType = await this.getNFTTypeById(nftTypeId);
    if (!nftType) throw new Error('NFT type not found');

    const mintingStatus = await this.getMintingStatus(nftTypeId);
    if (!mintingStatus?.minting_enabled) {
      throw new Error('Minting is currently disabled for this NFT type');
    }

    if (mintingStatus.total_minted >= mintingStatus.max_mintable) {
      throw new Error('Maximum supply reached for this NFT type');
    }

    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .insert({
        user_id: userId,
        nft_type_id: nftTypeId,
        is_custodial: nftType.is_custodial,
        token_id: tokenId,
        wallet_address: walletAddress,
        contract_address: contractAddress,
        is_verified: !nftType.is_custodial, // Non-custodial NFTs need verification
        purchased_at: new Date().toISOString(),
      })
      .select(`
        *,
        nft_types (*)
      `)
      .single();

    if (error) throw error;

    // Update minting count
    await supabase
      .from('nft_minting_control')
      .update({ total_minted: mintingStatus.total_minted + 1 })
      .eq('nft_type_id', nftTypeId);

    return data;
  }

  // Upgrade an NFT
  static async upgradeNFT(userId: string, nftTypeId: string): Promise<NFTUpgradeHistory> {
    const userNFT = await this.checkUserOwnership(userId, nftTypeId);
    if (!userNFT) throw new Error('NFT not found');

    if (!this.canUpgrade(userNFT)) {
      throw new Error('NFT cannot be upgraded');
    }

    const originalRatio = userNFT.nft_types?.earn_on_spend_ratio || 0;
    const upgradeBonus = userNFT.nft_types?.upgrade_bonus_ratio || 0;
    const newRatio = originalRatio + upgradeBonus;

    // Update user loyalty card
    const { error: updateError } = await supabase
      .from('user_loyalty_cards')
      .update({
        is_upgraded: true,
        upgraded_at: new Date().toISOString(),
      })
      .eq('id', userNFT.id);

    if (updateError) throw updateError;

    // Create upgrade history record
    const { data, error } = await supabase
      .from('nft_upgrade_history')
      .insert({
        user_id: userId,
        nft_type_id: nftTypeId,
        original_earn_ratio: originalRatio,
        new_earn_ratio: newRatio,
        upgrade_bonus_ratio: upgradeBonus,
        upgraded_at: new Date().toISOString(),
      })
      .select(`
        *,
        nft_types (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Enable auto-staking
  static async enableAutoStaking(
    userId: string, 
    nftTypeId: string, 
    assetId: string
  ): Promise<UserLoyaltyCard> {
    const userNFT = await this.checkUserOwnership(userId, nftTypeId);
    if (!userNFT) throw new Error('NFT not found');

    if (!this.canEnableAutoStaking(userNFT)) {
      throw new Error('Auto-staking is already enabled');
    }

    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .update({
        auto_staking_enabled: true,
        auto_staking_asset_id: assetId,
      })
      .eq('id', userNFT.id)
      .select(`
        *,
        nft_types (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Evolve an NFT
  static async evolveNFT(
    userId: string, 
    nftTypeId: string, 
    investmentAmount: number,
    evolvedTokenId?: string
  ): Promise<NFTEvolutionHistory> {
    const userNFT = await this.checkUserOwnership(userId, nftTypeId);
    if (!userNFT) throw new Error('NFT not found');

    const evolutionReq = this.getEvolutionRequirements(userNFT);
    if (!evolutionReq.canEvolve) {
      throw new Error('NFT cannot be evolved: ' + evolutionReq.requirements.join(', '));
    }

    // Update user loyalty card
    const { error: updateError } = await supabase
      .from('user_loyalty_cards')
      .update({
        is_evolved: true,
        evolved_token_id: evolvedTokenId,
        current_investment: userNFT.current_investment + investmentAmount,
        evolved_at: new Date().toISOString(),
      })
      .eq('id', userNFT.id);

    if (updateError) throw updateError;

    // Create evolution history record
    const { data, error } = await supabase
      .from('nft_evolution_history')
      .insert({
        user_id: userId,
        nft_type_id: nftTypeId,
        original_token_id: userNFT.token_id,
        evolved_token_id: evolvedTokenId,
        investment_amount: investmentAmount,
        evolution_triggered_at: new Date().toISOString(),
      })
      .select(`
        *,
        nft_types (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Verify non-custodial NFT
  static async verifyNonCustodialNFT(
    userId: string, 
    nftTypeId: string, 
    walletAddress: string
  ): Promise<UserLoyaltyCard> {
    const userNFT = await this.checkUserOwnership(userId, nftTypeId);
    if (!userNFT) throw new Error('NFT not found');

    if (userNFT.is_custodial) {
      throw new Error('Cannot verify custodial NFT');
    }

    const { data, error } = await supabase
      .from('user_loyalty_cards')
      .update({
        is_verified: true,
        last_verified_at: new Date().toISOString(),
        wallet_address: walletAddress,
      })
      .eq('id', userNFT.id)
      .select(`
        *,
        nft_types (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }
}