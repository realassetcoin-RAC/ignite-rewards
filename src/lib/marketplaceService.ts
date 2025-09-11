import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing, CreateListingRequest, UpdateListingRequest } from '@/types/marketplace';

export class MarketplaceService {
  /**
   * Get all marketplace listings
   */
  static async getListings(): Promise<MarketplaceListing[]> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Marketplace listings table does not exist yet, returning empty array');
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Get a single marketplace listing by ID
   */
  static async getListingById(id: string): Promise<MarketplaceListing | null> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      throw error;
    }
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

      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert([listingPayload])
        .select()
        .single();

      if (error) {
        console.error('Error creating listing:', error);
        // If table doesn't exist, create a mock listing for development
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Marketplace listings table does not exist yet, returning mock listing');
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
      console.error('Failed to create listing:', error);
      throw error;
    }
  }

  /**
   * Update an existing marketplace listing
   */
  static async updateListing(listingData: UpdateListingRequest): Promise<MarketplaceListing> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .update({
          ...listingData,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating listing:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update listing:', error);
      throw error;
    }
  }

  /**
   * Delete a marketplace listing
   */
  static async deleteListing(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting listing:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
      throw error;
    }
  }

  /**
   * Update listing status
   */
  static async updateListingStatus(id: string, status: string): Promise<MarketplaceListing> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating listing status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update listing status:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStats(): Promise<any> {
    try {
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('status, total_funding_goal, current_funding_amount');

      const { data: investments } = await supabase
        .from('marketplace_investments')
        .select('investment_amount');

      const stats = {
        total_listings: listings?.length || 0,
        active_listings: listings?.filter(l => l.status === 'active').length || 0,
        total_funding_goal: listings?.reduce((sum, l) => sum + (l.total_funding_goal || 0), 0) || 0,
        total_funding_raised: listings?.reduce((sum, l) => sum + (l.current_funding_amount || 0), 0) || 0,
        total_investments: investments?.length || 0,
        total_investment_amount: investments?.reduce((sum, i) => sum + (i.investment_amount || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Failed to fetch marketplace stats:', error);
      // Return default stats instead of throwing to prevent app crashes
      return {
        total_listings: 0,
        active_listings: 0,
        total_funding_goal: 0,
        total_funding_raised: 0,
        total_investments: 0,
        total_investment_amount: 0
      };
    }
  }
}

