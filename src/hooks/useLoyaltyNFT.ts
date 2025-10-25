// React Hook for Loyalty NFT API
// This hook provides easy access to loyalty NFT data in React components

import { useState, useEffect, useCallback } from 'react';
import { LoyaltyNFTApi, NFTTypeWithStats, UserLoyaltyCardWithDetails } from '@/api/loyalty-nft-api';
import { useToast } from '@/hooks/use-toast';

export interface UseLoyaltyNFTReturn {
  // NFT Types
  nftTypes: NFTTypeWithStats[];
  loadingNFTTypes: boolean;
  errorNFTTypes: string | null;
  refreshNFTTypes: () => Promise<void>;
  
  // User Loyalty Cards
  userLoyaltyCards: UserLoyaltyCardWithDetails[];
  loadingUserCards: boolean;
  errorUserCards: string | null;
  refreshUserCards: (userId: string) => Promise<void>;
  
  // Statistics
  statistics: any;
  loadingStatistics: boolean;
  errorStatistics: string | null;
  refreshStatistics: () => Promise<void>;
  
  // Actions
  updateNFTType: (nftTypeId: string, updates: any) => Promise<boolean>;
  createNFTType: (nftData: any) => Promise<boolean>;
  deleteNFTType: (nftTypeId: string) => Promise<boolean>;
  searchNFTTypes: (criteria: any) => Promise<NFTTypeWithStats[]>;
}

export const useLoyaltyNFT = (userId?: string): UseLoyaltyNFTReturn => {
  const { toast } = useToast();
  
  // State for NFT Types
  const [nftTypes, setNftTypes] = useState<NFTTypeWithStats[]>([]);
  const [loadingNFTTypes, setLoadingNFTTypes] = useState(false);
  const [errorNFTTypes, setErrorNFTTypes] = useState<string | null>(null);
  
  // State for User Loyalty Cards
  const [userLoyaltyCards, setUserLoyaltyCards] = useState<UserLoyaltyCardWithDetails[]>([]);
  const [loadingUserCards, setLoadingUserCards] = useState(false);
  const [errorUserCards, setErrorUserCards] = useState<string | null>(null);
  
  // State for Statistics
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [errorStatistics, setErrorStatistics] = useState<string | null>(null);

  // Refresh NFT Types
  const refreshNFTTypes = useCallback(async () => {
    setLoadingNFTTypes(true);
    setErrorNFTTypes(null);
    
    try {
      const response = await LoyaltyNFTApi.getAllNFTTypesWithStats();
      
      if (response.success && response.data) {
        setNftTypes(response.data);
        console.log('✅ NFT Types refreshed:', response.data.length);
      } else {
        setErrorNFTTypes(response.error || 'Failed to fetch NFT types');
        toast({
          title: "Error",
          description: response.error || 'Failed to fetch NFT types',
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorNFTTypes(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingNFTTypes(false);
    }
  }, [toast]);

  // Refresh User Loyalty Cards
  const refreshUserCards = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setLoadingUserCards(true);
    setErrorUserCards(null);
    
    try {
      const response = await LoyaltyNFTApi.getUserLoyaltyCardsWithDetails(userId);
      
      if (response.success && response.data) {
        setUserLoyaltyCards(response.data);
        console.log('✅ User Loyalty Cards refreshed:', response.data.length);
      } else {
        setErrorUserCards(response.error || 'Failed to fetch user loyalty cards');
        toast({
          title: "Error",
          description: response.error || 'Failed to fetch user loyalty cards',
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorUserCards(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingUserCards(false);
    }
  }, [toast]);

  // Refresh Statistics
  const refreshStatistics = useCallback(async () => {
    setLoadingStatistics(true);
    setErrorStatistics(null);
    
    try {
      const response = await LoyaltyNFTApi.getLoyaltyCardStatistics();
      
      if (response.success && response.data) {
        setStatistics(response.data);
        console.log('✅ Statistics refreshed:', response.data);
      } else {
        setErrorStatistics(response.error || 'Failed to fetch statistics');
        toast({
          title: "Error",
          description: response.error || 'Failed to fetch statistics',
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorStatistics(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStatistics(false);
    }
  }, [toast]);

  // Update NFT Type
  const updateNFTType = useCallback(async (nftTypeId: string, updates: any): Promise<boolean> => {
    try {
      const response = await LoyaltyNFTApi.updateNFTType(nftTypeId, updates);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "NFT type updated successfully",
        });
        // Refresh the data
        await refreshNFTTypes();
        return true;
      } else {
        toast({
          title: "Error",
          description: response.error || 'Failed to update NFT type',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshNFTTypes]);

  // Create NFT Type
  const createNFTType = useCallback(async (nftData: any): Promise<boolean> => {
    try {
      const response = await LoyaltyNFTApi.createNFTType(nftData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "NFT type created successfully",
        });
        // Refresh the data
        await refreshNFTTypes();
        return true;
      } else {
        toast({
          title: "Error",
          description: response.error || 'Failed to create NFT type',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshNFTTypes]);

  // Delete NFT Type
  const deleteNFTType = useCallback(async (nftTypeId: string): Promise<boolean> => {
    try {
      const response = await LoyaltyNFTApi.deleteNFTType(nftTypeId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "NFT type deleted successfully",
        });
        // Refresh the data
        await refreshNFTTypes();
        return true;
      } else {
        toast({
          title: "Error",
          description: response.error || 'Failed to delete NFT type',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshNFTTypes]);

  // Search NFT Types
  const searchNFTTypes = useCallback(async (criteria: any): Promise<NFTTypeWithStats[]> => {
    try {
      const response = await LoyaltyNFTApi.searchNFTTypes(criteria);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        toast({
          title: "Error",
          description: response.error || 'Failed to search NFT types',
          variant: "destructive",
        });
        return [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Load initial data
  useEffect(() => {
    refreshNFTTypes();
    refreshStatistics();
  }, [refreshNFTTypes, refreshStatistics]);

  // Load user cards when userId changes
  useEffect(() => {
    if (userId) {
      refreshUserCards(userId);
    }
  }, [userId, refreshUserCards]);

  return {
    // NFT Types
    nftTypes,
    loadingNFTTypes,
    errorNFTTypes,
    refreshNFTTypes,
    
    // User Loyalty Cards
    userLoyaltyCards,
    loadingUserCards,
    errorUserCards,
    refreshUserCards,
    
    // Statistics
    statistics,
    loadingStatistics,
    errorStatistics,
    refreshStatistics,
    
    // Actions
    updateNFTType,
    createNFTType,
    deleteNFTType,
    searchNFTTypes,
  };
};

export default useLoyaltyNFT;
