import { databaseAdapter } from './databaseAdapter';
import { MarketplaceListing, CreateListingRequest, UpdateListingRequest } from '@/types/marketplace';
import { LoyaltyNFTService } from './loyaltyNFTService';
import { supabase } from '@/integrations/supabase/client';

export class MarketplaceService {
  /**
   * Get all marketplace listings
   */
  static async getListings(): Promise<MarketplaceListing[]> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const fetchPromise = databaseAdapter.supabase
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false });

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const { data, error } = result as { data: MarketplaceListing[] | null; error: { code?: string; message?: string } | null };

      if (error) {
        // Error fetching listings
        // If table doesn't exist, return mock data instead of empty array
        if (error.code === 'PGRST116' || (error.message && (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('timeout')))) {
          // Marketplace listings table does not exist or timeout, returning mock listings
          return this.getMockListings();
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      // Failed to fetch listings - return mock data instead of throwing
      console.warn('MarketplaceService: Failed to fetch listings, using mock data:', error);
      return this.getMockListings();
    }
  }

  /**
   * Get a single marketplace listing by ID
   */
  static async getListingById(id: string): Promise<MarketplaceListing | null> {
    const { data, error } = await databaseAdapter.supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Error fetching listing
      throw error;
    }

    return data;
  }

  /**
   * Create a new marketplace listing
   */
  static async createListing(listingData: CreateListingRequest): Promise<MarketplaceListing> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be authenticated to create listings');
      }

      // Ensure required fields have default values
      const listingPayload = {
        ...listingData,
        created_by: user.id,
        current_funding_amount: 0,
        current_investor_count: 0,
        status: listingData.status || 'draft',
        listing_type: listingData.listing_type || 'asset',
        campaign_type: listingData.campaign_type || 'open_ended',
        risk_level: listingData.risk_level || 'medium',
        minimum_investment: listingData.minimum_investment || 100,
        is_featured: listingData.is_featured || false,
        is_verified: listingData.is_verified || false,
        tags: listingData.tags || []
      };

      const { data, error } = await databaseAdapter.supabase
        .from('marketplace_listings')
        .insert(listingPayload)
        .select()
        .single();

      if (error) {
        // Error creating listing
        // If table doesn't exist, create a mock listing for development
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          // Marketplace listings table does not exist yet, returning mock listing
          return {
            id: 'mock-' + Date.now(),
            ...listingPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as MarketplaceListing;
        }
        throw error;
      }

      return data;
    } catch (error) {
      // Failed to create listing
      console.warn('MarketplaceService: Failed to create listing:', error);
      throw error;
    }
  }

  /**
   * Update an existing marketplace listing
   */
  static async updateListing(listingData: UpdateListingRequest): Promise<MarketplaceListing> {
    const { data, error } = await databaseAdapter.supabase
      .from('marketplace_listings')
      .update({
        ...listingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingData.id)
      .select()
      .single();

    if (error) {
      // Error updating listing
      throw error;
    }

    return data;
  }

  /**
   * Delete a marketplace listing
   */
  static async deleteListing(id: string): Promise<void> {
    const { error } = await databaseAdapter.supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', id);

    if (error) {
      // Error deleting listing
      throw error;
    }
  }

  /**
   * Update listing status
   */
  static async updateListingStatus(id: string, status: string): Promise<MarketplaceListing> {
    const { data, error } = await databaseAdapter.supabase
      .from('marketplace_listings')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Error updating listing status
      throw error;
    }

    return data;
  }

  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStats(): Promise<Record<string, unknown>> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const fetchPromise = Promise.all([
        databaseAdapter.supabase.from('marketplace_listings').select('status, total_funding_goal'),
        databaseAdapter.supabase.from('marketplace_investments').select('amount')
      ]);

      const [listingsResult, investmentsResult] = await Promise.race([fetchPromise, timeoutPromise]) as [
        { data: MarketplaceListing[] | null; error: any },
        { data: { amount: number }[] | null; error: any }
      ];

      const listings = listingsResult.data || [];
      const investments = investmentsResult.data || [];

      const stats = {
        total_listings: listings.length,
        active_listings: listings.filter((l: MarketplaceListing) => l.status === 'active').length,
        total_funding_goal: listings.reduce((sum: number, l: MarketplaceListing) => sum + (l.total_funding_goal || 0), 0),
        total_funding_raised: investments.reduce((sum: number, i: { amount?: number }) => sum + (i.amount || 0), 0),
        total_investments: investments.length,
        total_investment_amount: investments.reduce((sum: number, i: { amount?: number }) => sum + (i.amount || 0), 0)
      };

      return stats;
    } catch (error) {
      // Failed to fetch marketplace stats - return mock stats instead of throwing
      console.warn('MarketplaceService: Failed to fetch marketplace stats, using mock data:', error);
      return this.getMockStats();
    }
  }

  /**
   * Get mock stats when the database is unavailable
   */
  static getMockStats(): {
    total_listings: number;
    active_listings: number;
    total_funding_goal: number;
    total_funding_raised: number;
    total_investments: number;
    total_investment_amount: number;
  } {
    return {
      total_listings: 3,
      active_listings: 3,
      total_funding_goal: 15000000,
      total_funding_raised: 7400000,
      total_investments: 105,
      total_investment_amount: 7400000
    };
  }

  /**
   * Get user's NFT multiplier for marketplace investments
   */
  static async getUserNFTMultiplier(userId: string): Promise<number> {
    try {
      // Get user's loyalty NFT
      const cards = await LoyaltyNFTService.getUserNFTs(userId);
      const loyaltyCard = cards.length > 0 ? cards[0] : null;
      
      if (!loyaltyCard || !loyaltyCard.nft_types) {
        return 1.0; // Default multiplier for users without NFTs
      }

      const nftType = loyaltyCard.nft_types;
      
      // Calculate multiplier based on NFT tier and features
      let multiplier = 1.0;
      
      // Base multiplier from NFT rarity
      switch (nftType.rarity) {
        case 'Common':
          multiplier = 1.0;
          break;
        case 'Less Common':
          multiplier = 1.1;
          break;
        case 'Rare':
          multiplier = 1.25;
          break;
        case 'Very Rare':
          multiplier = 1.5;
          break;
        default:
          multiplier = 1.0;
      }

      // Bonus for upgraded custodial NFTs
      if (loyaltyCard.is_custodial && loyaltyCard.is_upgraded && nftType.upgrade_bonus_ratio) {
        multiplier += parseFloat(nftType.upgrade_bonus_ratio.toString());
      }

      // Bonus for evolved NFTs
      if (loyaltyCard.is_evolved && nftType.evolution_earnings_ratio) {
        multiplier += parseFloat(nftType.evolution_earnings_ratio.toString());
      }

      return Math.min(multiplier, 2.0); // Cap at 2.0x multiplier
    } catch (error) {
      // Error getting NFT multiplier
      console.warn('MarketplaceService: Failed to get NFT multiplier:', error);
      return 1.0; // Default multiplier on error
    }
  }

  /**
   * Invest in a marketplace listing with NFT multiplier
   */
  static async investWithNFTMultiplier(
    listingId: string, 
    investmentAmount: number, 
    userId: string
  ): Promise<{ success: boolean; effectiveAmount: number; multiplier: number; message?: string }> {
    try {
      // Get user's NFT multiplier
      const multiplier = await this.getUserNFTMultiplier(userId);
      const effectiveAmount = investmentAmount * multiplier;

      // Get the listing to validate investment
      const listing = await this.getListingById(listingId);
      if (!listing) {
        return { success: false, effectiveAmount: 0, multiplier, message: 'Listing not found' };
      }

      // Check if listing is active
      if (listing.status !== 'active') {
        return { success: false, effectiveAmount: 0, multiplier, message: 'Listing is not active' };
      }

      // Check if investment exceeds remaining funding goal
      const remainingGoal = (listing.total_funding_goal || 0) - (effectiveAmount || 0);
      if (effectiveAmount > remainingGoal) {
        return { 
          success: false, 
          effectiveAmount, 
          multiplier, 
          message: `Investment exceeds remaining goal of ${remainingGoal}` 
        };
      }

      // Create investment record
      const { error } = await databaseAdapter.supabase
        .from('marketplace_investments')
        .insert([{
          listing_id: listingId,
          user_id: userId,
          amount: investmentAmount,
          nft_multiplier: multiplier
        }])
        .select()
        .single();

      if (error) {
        // Error creating investment
        return { success: false, effectiveAmount: 0, multiplier, message: 'Failed to create investment' };
      }

      // Note: The actual marketplace_listings table doesn't track current funding amounts
      // This would need to be calculated from marketplace_investments table

      return { 
        success: true, 
        effectiveAmount, 
        multiplier, 
        message: `Investment successful! ${multiplier}x multiplier applied.` 
      };
    } catch (error) {
      // Error investing with NFT multiplier
      console.warn('MarketplaceService: Failed to invest with NFT multiplier:', error);
      return { success: false, effectiveAmount: 0, multiplier: 1.0, message: 'Investment failed' };
    }
  }

  /**
   * Get user's investment history with NFT multipliers
   */
  static async getUserInvestments(userId: string): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await databaseAdapter.supabase
        .from('marketplace_investments')
        .select(`
          *,
          marketplace_listings (
            title,
            description,
            status,
            token_price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // Error fetching user investments
        return [];
      }

      return data || [];
    } catch (error) {
      // Error fetching user investments
      console.warn('MarketplaceService: Failed to fetch user investments:', error);
      return [];
    }
  }

  /**
   * Get marketplace categories
   */
  static async getCategories(): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await databaseAdapter.supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        // Error fetching categories
        // If table doesn't exist, return mock categories
        if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message.includes('relation') || error.message.includes('does not exist')) {
          // Marketplace categories table does not exist yet, returning mock categories
          return this.getMockCategories();
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      // Failed to fetch categories
      console.warn('MarketplaceService: Failed to fetch categories, using mock data:', error);
      // Return mock categories instead of throwing to prevent app crashes
      return this.getMockCategories();
    }
  }

  /**
   * Get mock categories when the table doesn't exist
   */
  static getMockCategories(): { id: string; name: string; description: string }[] {
    return [
      {
        id: 'mock-tech',
        name: 'Technology',
        description: 'Tech startups and innovative solutions'
      },
      {
        id: 'mock-real-estate',
        name: 'Real Estate',
        description: 'Property investments and development'
      },
      {
        id: 'mock-healthcare',
        name: 'Healthcare',
        description: 'Medical and wellness investments'
      },
      {
        id: 'mock-education',
        name: 'Education',
        description: 'Educational technology and services'
      },
      {
        id: 'mock-environment',
        name: 'Environment',
        description: 'Green energy and sustainability'
      },
      {
        id: 'mock-finance',
        name: 'Finance',
        description: 'Financial services and fintech'
      },
      {
        id: 'mock-entertainment',
        name: 'Entertainment',
        description: 'Media, gaming, and entertainment'
      },
      {
        id: 'mock-other',
        name: 'Other',
        description: 'Other investment opportunities'
      }
    ];
  }

  /**
   * Get mock listings when the table doesn't exist or times out
   */
  static getMockListings(): MarketplaceListing[] {
    return [
      {
        id: 'mock-listing-1',
        title: 'Green Energy Solar Farm',
        description: 'Invest in a large-scale solar energy project that will power 10,000 homes. This project offers stable returns and contributes to environmental sustainability.',
        image_url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400',
        listing_type: 'asset',
        status: 'active',
        total_funding_goal: 5000000,
        current_funding_amount: 2500000,
        current_investor_count: 45,
        campaign_type: 'time_bound',
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        token_symbol: 'SOLAR',
        total_token_supply: 1000000,
        risk_level: 'medium',
        minimum_investment: 1000,
        maximum_investment: 100000,
        is_featured: true,
        is_verified: true,
        created_by: 'mock-user-1',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mock-listing-2',
        title: 'AI Healthcare Platform',
        description: 'Revolutionary AI-powered healthcare platform that helps doctors diagnose diseases faster and more accurately. Join the future of medical technology.',
        image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
        listing_type: 'asset',
        status: 'active',
        total_funding_goal: 2000000,
        current_funding_amount: 1200000,
        current_investor_count: 28,
        campaign_type: 'time_bound',
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        token_symbol: 'AIHC',
        total_token_supply: 500000,
        risk_level: 'high',
        minimum_investment: 500,
        maximum_investment: 50000,
        is_featured: false,
        is_verified: true,
        created_by: 'mock-user-2',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mock-listing-3',
        title: 'Luxury Real Estate Development',
        description: 'Premium residential complex in downtown with modern amenities, smart home features, and sustainable design. High-end investment opportunity.',
        image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
        listing_type: 'asset',
        status: 'active',
        total_funding_goal: 8000000,
        current_funding_amount: 4800000,
        current_investor_count: 67,
        campaign_type: 'time_bound',
        start_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        token_symbol: 'REAL',
        total_token_supply: 2000000,
        risk_level: 'low',
        minimum_investment: 2500,
        maximum_investment: 200000,
        is_featured: true,
        is_verified: true,
        created_by: 'mock-user-3',
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

