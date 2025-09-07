import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserRewards {
  id: string;
  user_id: string;
  solana_address: string;
  total_earned: number;
  total_claimed: number;
  pending_vesting: number;
  last_claim_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotionalEarning {
  id: string;
  user_id: string;
  transaction_id: string;
  merchant_id: string | null;
  amount: number;
  vesting_start_date: string;
  vesting_end_date: string;
  status: 'vesting' | 'vested' | 'cancelled' | 'claimed';
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardsHistory {
  id: string;
  user_id: string | null;
  anonymous_user_id: string | null;
  transaction_id: string;
  event_type: 'earned' | 'vested' | 'claimed' | 'cancelled' | 'distributed';
  amount: number;
  previous_balance: number;
  new_balance: number;
  metadata: any;
  created_at: string;
}

export interface VestingSchedule {
  id: string;
  user_id: string;
  notional_earning_id: string;
  vesting_start_date: string;
  vesting_end_date: string;
  total_amount: number;
  vested_amount: number;
  is_fully_vested: boolean;
  created_at: string;
  updated_at: string;
}

export const useSolanaRewards = (userId?: string) => {
  const [userRewards, setUserRewards] = useState<UserRewards | null>(null);
  const [notionalEarnings, setNotionalEarnings] = useState<NotionalEarning[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<RewardsHistory[]>([]);
  const [vestingSchedules, setVestingSchedules] = useState<VestingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUserRewards = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Load user rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (rewardsError && rewardsError.code !== 'PGRST116') {
        throw rewardsError;
      }

      setUserRewards(rewardsData);

      // Load notional earnings
      const { data: notionalData, error: notionalError } = await supabase
        .from('notional_earnings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notionalError) {
        throw notionalError;
      }

      setNotionalEarnings(notionalData || []);

      // Load rewards history
      const { data: historyData, error: historyError } = await supabase
        .from('rewards_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) {
        throw historyError;
      }

      setRewardsHistory(historyData || []);

      // Load vesting schedules
      const { data: vestingData, error: vestingError } = await supabase
        .from('vesting_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('vesting_end_date', { ascending: true });

      if (vestingError) {
        throw vestingError;
      }

      setVestingSchedules(vestingData || []);

    } catch (err) {
      console.error('Error loading Solana rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rewards data');
      toast({
        title: "Error",
        description: "Failed to load rewards data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const claimRewards = useCallback(async (amount: number) => {
    if (!userId || !userRewards) return;

    try {
      setLoading(true);

      // Here you would typically call the Solana contract to claim rewards
      // For now, we'll simulate the process
      
      // Update user rewards in database
      const { error: updateError } = await supabase
        .from('user_rewards')
        .update({
          total_claimed: userRewards.total_claimed + amount,
          last_claim_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Add to rewards history
      const { error: historyError } = await supabase
        .from('rewards_history')
        .insert({
          user_id: userId,
          transaction_id: `claim_${Date.now()}`,
          event_type: 'claimed',
          amount: amount,
          previous_balance: userRewards.total_claimed,
          new_balance: userRewards.total_claimed + amount,
          metadata: { claim_method: 'manual' }
        });

      if (historyError) {
        throw historyError;
      }

      toast({
        title: "Rewards Claimed",
        description: `Successfully claimed ${amount} rewards.`,
      });

      // Reload data
      await loadUserRewards();

    } catch (err) {
      console.error('Error claiming rewards:', err);
      toast({
        title: "Error",
        description: "Failed to claim rewards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, userRewards, loadUserRewards, toast]);

  const getVestingProgress = useCallback((vestingEndDate: string) => {
    const now = new Date();
    const endDate = new Date(vestingEndDate);
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    
    if (now >= endDate) return 100;
    if (now <= startDate) return 0;
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  }, []);

  const getDaysUntilVesting = useCallback((vestingEndDate: string) => {
    const now = new Date();
    const endDate = new Date(vestingEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  const getTotalVested = useCallback(() => {
    return notionalEarnings
      .filter(earning => earning.status === 'vested')
      .reduce((total, earning) => total + earning.amount, 0);
  }, [notionalEarnings]);

  const getTotalVesting = useCallback(() => {
    return notionalEarnings
      .filter(earning => earning.status === 'vesting')
      .reduce((total, earning) => total + earning.amount, 0);
  }, [notionalEarnings]);

  const getTotalClaimable = useCallback(() => {
    return getTotalVested() - (userRewards?.total_claimed || 0);
  }, [getTotalVested, userRewards]);

  useEffect(() => {
    loadUserRewards();
  }, [loadUserRewards]);

  return {
    userRewards,
    notionalEarnings,
    rewardsHistory,
    vestingSchedules,
    loading,
    error,
    claimRewards,
    getVestingProgress,
    getDaysUntilVesting,
    getTotalVested,
    getTotalVesting,
    getTotalClaimable,
    refreshRewards: loadUserRewards
  };
};
