// NFT Card Integration for Marketplace
// This module integrates with the existing loyalty platform's NFT system
// to check which NFT cards users actually own and calculate investment multipliers

import { supabase } from '@/integrations/supabase/client';
import { NFTCardTier } from '@/types/marketplace';

export interface UserNFTCardStatus {
  hasNftCard: boolean;
  ownedNfts: LoyaltyNFT[];
  multiplier: number;
  canAccessPremiumListings: boolean;
  canAccessEarlyListings: boolean;
  highestTier?: string;
}

export interface LoyaltyNFT {
  id: string;
  tier: string;
  displayName: string;
  multiplier: number;
  canAccessPremium: boolean;
  canAccessEarly: boolean;
  ownedAt: string;
}

export interface NFTCardCheckResult {
  success: boolean;
  status?: UserNFTCardStatus;
  error?: string;
}

// Marketplace benefit mappings for loyalty NFT tiers
// These map to the card types in your existing loyalty system
const MARKETPLACE_BENEFITS = {
  'basic': { multiplier: 1.00, premiumAccess: false, earlyAccess: false },
  'standard': { multiplier: 1.10, premiumAccess: false, earlyAccess: false },
  'premium': { multiplier: 1.25, premiumAccess: true, earlyAccess: false },
  'premium_plus': { multiplier: 1.35, premiumAccess: true, earlyAccess: false },
  'vip': { multiplier: 1.50, premiumAccess: true, earlyAccess: true },
  'vip_plus': { multiplier: 1.75, premiumAccess: true, earlyAccess: true },
};

/**
 * Check user's NFT card status by querying the loyalty platform's NFT system
 */
export async function checkUserNFTCardStatus(userId: string): Promise<NFTCardCheckResult> {
  try {
    // Query the loyalty platform's NFT ownership system
    // This integrates with your existing NFT/loyalty card system
    const { data: userNfts, error: nftError } = await supabase
      .from('user_loyalty_cards') // Your existing loyalty NFT table
      .select(`
        id,
        loyalty_number,
        card_type,
        tier,
        is_active,
        created_at
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (nftError) {
      return {
        success: false,
        error: `Failed to check NFT ownership: ${nftError.message}`
      };
    }

    if (!userNfts || userNfts.length === 0) {
      // User doesn't own any NFT cards
      return {
        success: true,
        status: {
          hasNftCard: false,
          ownedNfts: [],
          multiplier: 1.0,
          canAccessPremiumListings: false,
          canAccessEarlyListings: false
        }
      };
    }

    // Process owned NFTs and calculate benefits
    const ownedNfts: LoyaltyNFT[] = [];
    let highestMultiplier = 1.0;
    let canAccessPremium = false;
    let canAccessEarly = false;
    let highestTier = '';

    for (const nft of userNfts) {
      // Map the loyalty platform's card_type/tier to marketplace benefits
      const tier = nft.tier || nft.card_type || 'basic';
      const benefits = MARKETPLACE_BENEFITS[tier as keyof typeof MARKETPLACE_BENEFITS] || MARKETPLACE_BENEFITS.basic;
      
      const loyaltyNft: LoyaltyNFT = {
        id: nft.id,
        tier: tier,
        displayName: getTierDisplayName(tier),
        multiplier: benefits.multiplier,
        canAccessPremium: benefits.premiumAccess,
        canAccessEarly: benefits.earlyAccess,
        ownedAt: nft.created_at
      };

      ownedNfts.push(loyaltyNft);

      // Track highest benefits (user gets the best benefits from their highest tier NFT)
      if (benefits.multiplier > highestMultiplier) {
        highestMultiplier = benefits.multiplier;
        highestTier = tier;
      }
      if (benefits.premiumAccess) canAccessPremium = true;
      if (benefits.earlyAccess) canAccessEarly = true;
    }

    const status: UserNFTCardStatus = {
      hasNftCard: true,
      ownedNfts,
      multiplier: highestMultiplier,
      canAccessPremiumListings: canAccessPremium,
      canAccessEarlyListings: canAccessEarly,
      highestTier
    };

    return {
      success: true,
      status
    };

  } catch (error) {
    console.error('Error checking NFT card status:', error);
    return {
      success: false,
      error: 'Failed to check NFT card status'
    };
  }
}

/**
 * Get display name for NFT tier
 */
function getTierDisplayName(tier: string): string {
  const displayNames: Record<string, string> = {
    'basic': 'Basic',
    'standard': 'Standard', 
    'premium': 'Premium',
    'premium_plus': 'Premium+',
    'vip': 'VIP',
    'vip_plus': 'VIP+'
  };
  
  return displayNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Calculate effective investment amount with NFT multiplier
 */
export function calculateEffectiveInvestment(
  baseAmount: number,
  nftMultiplier: number
): number {
  return baseAmount * nftMultiplier;
}

/**
 * Calculate tokens received with NFT multiplier
 */
export function calculateTokensWithMultiplier(
  investmentAmount: number,
  tokenPrice: number,
  nftMultiplier: number
): number {
  const effectiveAmount = calculateEffectiveInvestment(investmentAmount, nftMultiplier);
  return Math.floor(effectiveAmount / tokenPrice);
}

/**
 * Check if user can access a specific listing based on their NFT ownership
 */
export function canUserAccessListing(
  userStatus: UserNFTCardStatus,
  listing: any
): { canAccess: boolean; reason?: string } {
  // Check if listing requires premium access
  if (listing.requires_premium_access && !userStatus.canAccessPremiumListings) {
    return {
      canAccess: false,
      reason: 'This listing requires a premium NFT card'
    };
  }

  // Check if listing has early access and user has early access
  if (listing.early_access_only && !userStatus.canAccessEarlyListings) {
    return {
      canAccess: false,
      reason: 'This listing is currently in early access period'
    };
  }

  return { canAccess: true };
}

/**
 * Get NFT tier benefits description
 */
export function getNFTTierBenefits(tier: string): string[] {
  const benefits = MARKETPLACE_BENEFITS[tier as keyof typeof MARKETPLACE_BENEFITS];
  if (!benefits) return [];

  const benefitList: string[] = [];
  
  if (benefits.multiplier > 1.0) {
    benefitList.push(`${benefits.multiplier}x investment multiplier`);
  }

  if (benefits.premiumAccess) {
    benefitList.push('Access to premium listings');
  }

  if (benefits.earlyAccess) {
    benefitList.push('Early access to new listings');
  }

  return benefitList;
}

/**
 * Format NFT multiplier for display
 */
export function formatNFTMultiplier(multiplier: number): string {
  if (multiplier === 1.0) {
    return '1.0x (Standard)';
  }
  return `${multiplier}x`;
}

/**
 * Get NFT tier color for UI
 */
export function getNFTTierColor(tierName: string): string {
  switch (tierName.toLowerCase()) {
    case 'basic':
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    case 'standard':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'premium':
      return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'premium_plus':
      return 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';
    case 'vip':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'vip_plus':
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
}

/**
 * Get all owned NFTs for a user
 */
export async function getUserOwnedNFTs(userId: string): Promise<LoyaltyNFT[]> {
  try {
    const result = await checkUserNFTCardStatus(userId);
    return result.success ? result.status?.ownedNfts || [] : [];
  } catch (error) {
    console.error('Error getting user owned NFTs:', error);
    return [];
  }
}

/**
 * Check if user owns a specific NFT tier
 */
export async function userOwnsNFTTier(userId: string, tier: string): Promise<boolean> {
  try {
    const ownedNfts = await getUserOwnedNFTs(userId);
    return ownedNfts.some(nft => nft.tier === tier);
  } catch (error) {
    console.error('Error checking NFT tier ownership:', error);
    return false;
  }
}

/**
 * Get the highest tier NFT owned by user
 */
export async function getUserHighestNFTTier(userId: string): Promise<LoyaltyNFT | null> {
  try {
    const ownedNfts = await getUserOwnedNFTs(userId);
    if (ownedNfts.length === 0) return null;

    // Sort by multiplier (highest first)
    return ownedNfts.sort((a, b) => b.multiplier - a.multiplier)[0];
  } catch (error) {
    console.error('Error getting highest NFT tier:', error);
    return null;
  }
}

/**
 * Get marketplace benefits for a specific NFT tier from the database
 */
export async function getMarketplaceBenefitsForTier(tierName: string): Promise<NFTCardTier | null> {
  try {
    const { data, error } = await supabase
      .from('nft_card_tiers')
      .select('*')
      .eq('tier_name', tierName)
      .single();

    if (error) {
      console.error('Error fetching marketplace benefits:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting marketplace benefits:', error);
    return null;
  }
}

/**
 * Sync loyalty platform NFT data with marketplace benefits
 * This function can be called to ensure the marketplace benefits are up to date
 */
export async function syncLoyaltyNFTsWithMarketplace(): Promise<{ success: boolean; message: string }> {
  try {
    // Get all unique NFT tiers from the loyalty platform
    const { data: loyaltyTiers, error: loyaltyError } = await supabase
      .from('user_loyalty_cards')
      .select('DISTINCT card_type, tier')
      .eq('is_active', true);

    if (loyaltyError) {
      return {
        success: false,
        message: `Failed to fetch loyalty tiers: ${loyaltyError.message}`
      };
    }

    // Get existing marketplace benefits
    const { data: marketplaceTiers, error: marketplaceError } = await supabase
      .from('nft_card_tiers')
      .select('tier_name');

    if (marketplaceError) {
      return {
        success: false,
        message: `Failed to fetch marketplace tiers: ${marketplaceError.message}`
      };
    }

    const existingTiers = marketplaceTiers?.map(t => t.tier_name) || [];
    const loyaltyTierNames = loyaltyTiers?.map(t => t.tier || t.card_type).filter(Boolean) || [];
    
    // Find tiers that exist in loyalty platform but not in marketplace
    const missingTiers = loyaltyTierNames.filter(tier => !existingTiers.includes(tier));
    
    if (missingTiers.length > 0) {
      return {
        success: false,
        message: `Missing marketplace benefits for loyalty tiers: ${missingTiers.join(', ')}. Please add them to the nft_card_tiers table.`
      };
    }

    return {
      success: true,
      message: 'Loyalty NFT tiers are properly synced with marketplace benefits'
    };

  } catch (error) {
    console.error('Error syncing loyalty NFTs:', error);
    return {
      success: false,
      message: 'Failed to sync loyalty NFTs with marketplace'
    };
  }
}