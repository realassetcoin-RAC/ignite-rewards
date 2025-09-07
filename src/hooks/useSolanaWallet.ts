import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserWallet {
  id: string;
  user_id: string;
  solana_address: string;
  encrypted_seed_phrase: string;
  wallet_type: 'generated' | 'connected';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  sol: number;
  tokens: { [mint: string]: number };
}

export const useSolanaWallet = (userId?: string) => {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadWallet = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      setWallet(walletData);

      // If wallet exists, load balance (simulated for now)
      if (walletData) {
        // In a real implementation, you would query the Solana blockchain
        // For now, we'll simulate the balance
        setBalance({
          sol: 0.5, // Simulated SOL balance
          tokens: {
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1000 // Simulated USDC balance
          }
        });
      }

    } catch (err) {
      console.error('Error loading wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
      toast({
        title: "Error",
        description: "Failed to load wallet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const generateWallet = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // In a real implementation, you would generate a new Solana keypair
      // For now, we'll simulate wallet generation
      const mockAddress = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockSeedPhrase = 'mock seed phrase for demonstration purposes only';

      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          solana_address: mockAddress,
          encrypted_seed_phrase: mockSeedPhrase, // In real implementation, this would be encrypted
          wallet_type: 'generated',
          is_active: true
        })
        .select()
        .single();

      if (walletError) {
        throw walletError;
      }

      setWallet(walletData);

      toast({
        title: "Wallet Generated",
        description: "Your Solana wallet has been generated successfully.",
      });

    } catch (err) {
      console.error('Error generating wallet:', err);
      toast({
        title: "Error",
        description: "Failed to generate wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const connectWallet = useCallback(async (address: string, seedPhrase?: string) => {
    if (!userId) return;

    try {
      setLoading(true);

      // Deactivate existing wallet if any
      if (wallet) {
        await supabase
          .from('user_wallets')
          .update({ is_active: false })
          .eq('user_id', userId);
      }

      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          solana_address: address,
          encrypted_seed_phrase: seedPhrase || '', // In real implementation, this would be encrypted
          wallet_type: 'connected',
          is_active: true
        })
        .select()
        .single();

      if (walletError) {
        throw walletError;
      }

      setWallet(walletData);

      toast({
        title: "Wallet Connected",
        description: "Your Solana wallet has been connected successfully.",
      });

    } catch (err) {
      console.error('Error connecting wallet:', err);
      toast({
        title: "Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, wallet, toast]);

  const disconnectWallet = useCallback(async () => {
    if (!userId || !wallet) return;

    try {
      setLoading(true);

      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ is_active: false })
        .eq('id', wallet.id);

      if (updateError) {
        throw updateError;
      }

      setWallet(null);
      setBalance(null);

      toast({
        title: "Wallet Disconnected",
        description: "Your Solana wallet has been disconnected.",
      });

    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      toast({
        title: "Error",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, wallet, toast]);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;

    try {
      // In a real implementation, you would query the Solana blockchain
      // For now, we'll simulate a balance refresh
      setBalance({
        sol: Math.random() * 2, // Simulated SOL balance
        tokens: {
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': Math.floor(Math.random() * 2000) // Simulated USDC balance
        }
      });

    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  }, [wallet]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  return {
    wallet,
    balance,
    loading,
    error,
    generateWallet,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    refreshWallet: loadWallet
  };
};
