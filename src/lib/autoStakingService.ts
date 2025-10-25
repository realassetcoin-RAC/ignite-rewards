/**
 * ✅ IMPLEMENT REQUIREMENT: Auto-staking system for NFT rewards
 * Automatic staking of earned rewards into staking pools with configurable settings
 */

import { databaseAdapter } from '@/lib/databaseAdapter';

interface StakingPool {
  id: string;
  name: string;
  description: string;
  apy_percentage: number;
  minimum_stake: number;
  maximum_stake?: number;
  lock_period_days: number;
  early_withdrawal_penalty: number;
  is_active: boolean;
  total_staked: number;
  available_slots: number;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
}

interface StakePosition {
  id: string;
  user_id: string;
  pool_id: string;
  amount_staked: number;
  rewards_earned: number;
  stake_date: string;
  unlock_date: string;
  is_active: boolean;
  auto_restake: boolean;
  last_reward_claim: string;
}

interface AutoStakingConfig {
  id: string;
  user_id: string;
  is_enabled: boolean;
  default_pool_id: string;
  minimum_auto_stake: number;
  percentage_to_stake: number; // 0-100
  preferred_risk_level: 'low' | 'medium' | 'high';
  auto_compound: boolean;
  created_at: string;
  updated_at: string;
}

interface StakingReward {
  id: string;
  stake_position_id: string;
  reward_amount: number;
  reward_type: 'daily' | 'weekly' | 'compound' | 'bonus';
  calculated_at: string;
  is_claimed: boolean;
  claimed_at?: string;
}

export class AutoStakingService {
  /**
   * Get available staking pools
   */
  static async getStakingPools(): Promise<StakingPool[]> {
    try {
      const { data, error } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('is_active', true)
        .order('apy_percentage', { ascending: false });

      if (error) {
        console.error('Error fetching staking pools:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStakingPools:', error);
      return [];
    }
  }

  /**
   * Get user's auto-staking configuration
   */
  static async getUserAutoStakingConfig(userId: string): Promise<AutoStakingConfig | null> {
    try {
      const { data, error } = await supabase
        .from('auto_staking_configs')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching auto-staking config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserAutoStakingConfig:', error);
      return null;
    }
  }

  /**
   * Update user's auto-staking configuration
   */
  static async updateAutoStakingConfig(
    userId: string,
    config: Partial<AutoStakingConfig>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('auto_staking_configs')
        .upsert({
          user_id: userId,
          ...config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating auto-staking config:', error);
        return false;
      }

      console.log('✅ Auto-staking config updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateAutoStakingConfig:', error);
      return false;
    }
  }

  /**
   * Process auto-staking for earned rewards
   */
  static async processAutoStaking(userId: string, rewardAmount: number): Promise<boolean> {
    try {
      console.log(`🎯 Processing auto-staking for user ${userId}, amount: ${rewardAmount}`);

      // Get user's auto-staking configuration
      const config = await this.getUserAutoStakingConfig(userId);
      
      if (!config || !config.is_enabled) {
        console.log('Auto-staking not enabled for user');
        return false;
      }

      // Check if reward amount meets minimum threshold
      if (rewardAmount < config.minimum_auto_stake) {
        console.log(`Reward amount ${rewardAmount} below minimum auto-stake threshold ${config.minimum_auto_stake}`);
        return false;
      }

      // Calculate amount to stake
      const amountToStake = (rewardAmount * config.percentage_to_stake) / 100;
      
      if (amountToStake < config.minimum_auto_stake) {
        console.log(`Calculated stake amount ${amountToStake} below minimum threshold`);
        return false;
      }

      // Get the configured staking pool
      const { data: pool, error: poolError } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('id', config.default_pool_id)
        .eq('is_active', true)
        .single();

      if (poolError || !pool) {
        console.error('Error fetching staking pool:', poolError);
        return false;
      }

      // Check pool capacity and limits
      if (pool.maximum_stake && amountToStake > pool.maximum_stake) {
        console.log(`Stake amount ${amountToStake} exceeds pool maximum ${pool.maximum_stake}`);
        return false;
      }

      if (pool.available_slots !== null && pool.available_slots <= 0) {
        console.log('No available slots in staking pool');
        return false;
      }

      // Create stake position
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + pool.lock_period_days);

      const { data: stakePosition, error: stakeError } = await supabase
        .from('stake_positions')
        .insert({
          user_id: userId,
          pool_id: pool.id,
          amount_staked: amountToStake,
          stake_date: new Date().toISOString(),
          unlock_date: unlockDate.toISOString(),
          is_active: true,
          auto_restake: config.auto_compound,
          rewards_earned: 0
        })
        .select()
        .single();

      if (stakeError) {
        console.error('Error creating stake position:', stakeError);
        return false;
      }

      // Update pool statistics
      await supabase
        .from('staking_pools')
        .update({
          total_staked: databaseAdapter.supabase.sql`total_staked + ${amountToStake}`,
          available_slots: pool.available_slots ? databaseAdapter.supabase.sql`available_slots - 1` : null
        })
        .eq('id', pool.id);

      // Deduct staked amount from user's available balance
      await supabase
        .from('user_loyalty_cards')
        .update({
          points_balance: databaseAdapter.supabase.sql`points_balance - ${amountToStake}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`✅ Auto-staking successful: ${amountToStake} tokens staked in ${pool.name}`);
      return true;

    } catch (error) {
      console.error('Error in processAutoStaking:', error);
      return false;
    }
  }

  /**
   * Get user's active stake positions
   */
  static async getUserStakePositions(userId: string): Promise<StakePosition[]> {
    try {
      const { data, error } = await supabase
        .from('stake_positions')
        .select(`
          *,
          staking_pools (
            name,
            apy_percentage,
            lock_period_days,
            early_withdrawal_penalty
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('stake_date', { ascending: false });

      if (error) {
        console.error('Error fetching stake positions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserStakePositions:', error);
      return [];
    }
  }

  /**
   * Calculate pending rewards for a stake position
   */
  static calculatePendingRewards(stakePosition: StakePosition, pool: StakingPool): number {
    const stakeDate = new Date(stakePosition.stake_date);
    const now = new Date();
    const daysStaked = Math.floor((now.getTime() - stakeDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysStaked <= 0) return 0;

    // Calculate daily reward rate
    const dailyRate = pool.apy_percentage / 365 / 100;
    const pendingRewards = stakePosition.amount_staked * dailyRate * daysStaked;
    
    return Math.max(0, pendingRewards - stakePosition.rewards_earned);
  }

  /**
   * Claim rewards from a stake position
   */
  static async claimStakeRewards(stakePositionId: string): Promise<{ success: boolean; amount?: number; error?: string }> {
    try {
      // Get stake position with pool info
      const { data: stakePosition, error: fetchError } = await supabase
        .from('stake_positions')
        .select(`
          *,
          staking_pools (*)
        `)
        .eq('id', stakePositionId)
        .eq('is_active', true)
        .single();

      if (fetchError || !stakePosition) {
        return { success: false, error: 'Stake position not found' };
      }

      // Calculate pending rewards
      const pendingRewards = this.calculatePendingRewards(
        stakePosition,
        stakePosition.staking_pools
      );

      if (pendingRewards <= 0) {
        return { success: false, error: 'No rewards to claim' };
      }

      // Create reward record
      const { data: rewardRecord, error: rewardError } = await supabase
        .from('staking_rewards')
        .insert({
          stake_position_id: stakePositionId,
          reward_amount: pendingRewards,
          reward_type: 'daily',
          calculated_at: new Date().toISOString(),
          is_claimed: true,
          claimed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (rewardError) {
        console.error('Error creating reward record:', rewardError);
        return { success: false, error: 'Failed to process reward claim' };
      }

      // Update stake position
      await supabase
        .from('stake_positions')
        .update({
          rewards_earned: databaseAdapter.supabase.sql`rewards_earned + ${pendingRewards}`,
          last_reward_claim: new Date().toISOString()
        })
        .eq('id', stakePositionId);

      // Add rewards to user's balance or auto-compound if configured
      if (stakePosition.auto_restake) {
        // Auto-compound: add to staked amount
        await supabase
          .from('stake_positions')
          .update({
            amount_staked: databaseAdapter.supabase.sql`amount_staked + ${pendingRewards}`
          })
          .eq('id', stakePositionId);

        console.log(`✅ Rewards auto-compounded: ${pendingRewards} tokens`);
      } else {
        // Add to user's available balance
        await supabase
          .from('user_loyalty_cards')
          .update({
            points_balance: databaseAdapter.supabase.sql`points_balance + ${pendingRewards}`,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', stakePosition.user_id);

        console.log(`✅ Rewards claimed: ${pendingRewards} tokens`);
      }

      return { success: true, amount: pendingRewards };

    } catch (error) {
      console.error('Error in claimStakeRewards:', error);
      return { success: false, error: 'An error occurred while claiming rewards' };
    }
  }

  /**
   * Unstake tokens from a position
   */
  static async unstakePosition(
    stakePositionId: string,
    amount?: number
  ): Promise<{ success: boolean; amount?: number; penalty?: number; error?: string }> {
    try {
      // Get stake position with pool info
      const { data: stakePosition, error: fetchError } = await supabase
        .from('stake_positions')
        .select(`
          *,
          staking_pools (*)
        `)
        .eq('id', stakePositionId)
        .eq('is_active', true)
        .single();

      if (fetchError || !stakePosition) {
        return { success: false, error: 'Stake position not found' };
      }

      const pool = stakePosition.staking_pools;
      const unlockDate = new Date(stakePosition.unlock_date);
      const now = new Date();
      const isEarlyWithdrawal = now < unlockDate;

      // Determine amount to unstake
      const unstakeAmount = amount || stakePosition.amount_staked;
      
      if (unstakeAmount > stakePosition.amount_staked) {
        return { success: false, error: 'Insufficient staked amount' };
      }

      // Calculate penalty for early withdrawal
      let penalty = 0;
      if (isEarlyWithdrawal) {
        penalty = unstakeAmount * (pool.early_withdrawal_penalty / 100);
      }

      const netAmount = unstakeAmount - penalty;

      // Update or deactivate stake position
      if (unstakeAmount === stakePosition.amount_staked) {
        // Complete withdrawal - deactivate position
        await supabase
          .from('stake_positions')
          .update({
            is_active: false,
            unstake_date: new Date().toISOString()
          })
          .eq('id', stakePositionId);
      } else {
        // Partial withdrawal - update amount
        await supabase
          .from('stake_positions')
          .update({
            amount_staked: databaseAdapter.supabase.sql`amount_staked - ${unstakeAmount}`
          })
          .eq('id', stakePositionId);
      }

      // Update pool statistics
      await supabase
        .from('staking_pools')
        .update({
          total_staked: databaseAdapter.supabase.sql`total_staked - ${unstakeAmount}`,
          available_slots: pool.available_slots ? databaseAdapter.supabase.sql`available_slots + 1` : null
        })
        .eq('id', pool.id);

      // Add net amount to user's balance
      await supabase
        .from('user_loyalty_cards')
        .update({
          points_balance: databaseAdapter.supabase.sql`points_balance + ${netAmount}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', stakePosition.user_id);

      console.log(`✅ Unstaking successful: ${netAmount} tokens returned (penalty: ${penalty})`);
      return { 
        success: true, 
        amount: netAmount, 
        penalty: penalty > 0 ? penalty : undefined 
      };

    } catch (error) {
      console.error('Error in unstakePosition:', error);
      return { success: false, error: 'An error occurred while unstaking' };
    }
  }

  /**
   * Get staking statistics for user
   */
  static async getUserStakingStats(userId: string): Promise<any> {
    try {
      const [positions, rewards] = await Promise.all([
        this.getUserStakePositions(userId),
        supabase
          .from('staking_rewards')
          .select('reward_amount, claimed_at')
          .eq('stake_position_id', databaseAdapter.supabase.sql`
            (SELECT id FROM stake_positions WHERE user_id = ${userId})
          `)
          .eq('is_claimed', true)
      ]);

      const totalStaked = positions.reduce((sum, pos) => sum + pos.amount_staked, 0);
      const totalRewards = rewards.data?.reduce((sum, reward) => sum + reward.reward_amount, 0) || 0;
      const activePositions = positions.length;

      // Calculate total pending rewards
      const pools = await this.getStakingPools();
      const poolMap = new Map(pools.map(p => [p.id, p]));
      
      const totalPendingRewards = positions.reduce((sum, pos) => {
        const pool = poolMap.get(pos.pool_id);
        if (!pool) return sum;
        return sum + this.calculatePendingRewards(pos, pool);
      }, 0);

      return {
        total_staked: totalStaked,
        total_rewards_earned: totalRewards,
        total_pending_rewards: totalPendingRewards,
        active_positions: activePositions,
        positions
      };

    } catch (error) {
      console.error('Error in getUserStakingStats:', error);
      return {
        total_staked: 0,
        total_rewards_earned: 0,
        total_pending_rewards: 0,
        active_positions: 0,
        positions: []
      };
    }
  }

  /**
   * Process daily reward calculations for all active positions
   */
  static async processDailyRewards(): Promise<void> {
    try {
      console.log('🔄 Processing daily staking rewards...');

      const { data: activePositions, error } = await supabase
        .from('stake_positions')
        .select(`
          *,
          staking_pools (*)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching active positions:', error);
        return;
      }

      for (const position of activePositions || []) {
        const pool = position.staking_pools;
        const pendingRewards = this.calculatePendingRewards(position, pool);

        if (pendingRewards > 0) {
          // Create daily reward record
          await supabase
            .from('staking_rewards')
            .insert({
              stake_position_id: position.id,
              reward_amount: pendingRewards,
              reward_type: 'daily',
              calculated_at: new Date().toISOString(),
              is_claimed: false
            });

          // If auto-compound is enabled, automatically compound the rewards
          if (position.auto_restake) {
            await this.claimStakeRewards(position.id);
          }
        }
      }

      console.log('✅ Daily staking rewards processed');
    } catch (error) {
      console.error('Error processing daily rewards:', error);
    }
  }
}