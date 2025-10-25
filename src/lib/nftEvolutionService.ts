/**
 * ✅ IMPLEMENT REQUIREMENT: 3D NFT Evolution System with surprise unlocks
 * Evolution system that unlocks surprise 3D NFTs for users meeting minimum investment criteria
 */

import { databaseAdapter } from '@/lib/databaseAdapter';

interface EvolutionCriteria {
  id: string;
  nft_type_id: string;
  minimum_investment: number;
  minimum_staking_amount: number;
  minimum_days_staked: number;
  minimum_transactions: number;
  minimum_referrals: number;
  is_active: boolean;
}

interface EvolutionNFT {
  id: string;
  base_nft_id: string;
  evolved_name: string;
  evolved_description: string;
  evolved_image_url: string; // .gif format for 3D animation
  evolution_rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
  evolution_bonus_multiplier: number;
  fixed_earning_ratio: number;
  special_abilities: string[];
  is_surprise: boolean;
}

interface UserEvolution {
  id: string;
  user_id: string;
  base_nft_id: string;
  evolved_nft_id: string;
  evolution_date: string;
  investment_amount: number;
  staking_amount: number;
  days_staked: number;
  transaction_count: number;
  referral_count: number;
  surprise_unlocked: boolean;
  evolution_wallet: string;
}

interface EvolutionEligibility {
  eligible: boolean;
  criteria_met: {
    investment: boolean;
    staking: boolean;
    days_staked: boolean;
    transactions: boolean;
    referrals: boolean;
  };
  missing_requirements: string[];
  progress_percentage: number;
}

export class NFTEvolutionService {
  /**
   * Check if user is eligible for NFT evolution
   */
  static async checkEvolutionEligibility(
    userId: string,
    nftTypeId: string
  ): Promise<EvolutionEligibility> {
    try {
      console.log(`🔍 Checking evolution eligibility for user ${userId}, NFT ${nftTypeId}`);

      // Get evolution criteria
      const { data: criteria, error: criteriaError } = await supabase
        .from('evolution_criteria')
        .select('*')
        .eq('nft_type_id', nftTypeId)
        .eq('is_active', true)
        .single();

      if (criteriaError || !criteria) {
        return {
          eligible: false,
          criteria_met: {
            investment: false,
            staking: false,
            days_staked: false,
            transactions: false,
            referrals: false
          },
          missing_requirements: ['Evolution criteria not found'],
          progress_percentage: 0
        };
      }

      // Get user's current stats
      const [
        investmentStats,
        stakingStats,
        transactionStats,
        referralStats
      ] = await Promise.all([
        this.getUserInvestmentStats(userId),
        this.getUserStakingStats(userId),
        this.getUserTransactionStats(userId),
        this.getUserReferralStats(userId)
      ]);

      // Check each criteria
      const criteriaMet = {
        investment: investmentStats.total_invested >= criteria.minimum_investment,
        staking: stakingStats.total_staked >= criteria.minimum_staking_amount,
        days_staked: stakingStats.max_days_staked >= criteria.minimum_days_staked,
        transactions: transactionStats.total_transactions >= criteria.minimum_transactions,
        referrals: referralStats.successful_referrals >= criteria.minimum_referrals
      };

      // Calculate progress for each criteria
      const progress = {
        investment: Math.min(100, (investmentStats.total_invested / criteria.minimum_investment) * 100),
        staking: Math.min(100, (stakingStats.total_staked / criteria.minimum_staking_amount) * 100),
        days_staked: Math.min(100, (stakingStats.max_days_staked / criteria.minimum_days_staked) * 100),
        transactions: Math.min(100, (transactionStats.total_transactions / criteria.minimum_transactions) * 100),
        referrals: Math.min(100, (referralStats.successful_referrals / criteria.minimum_referrals) * 100)
      };

      const overallProgress = Object.values(progress).reduce((sum, p) => sum + p, 0) / 5;
      const eligible = Object.values(criteriaMet).every(met => met);

      // Generate missing requirements list
      const missing: string[] = [];
      if (!criteriaMet.investment) {
        const needed = criteria.minimum_investment - investmentStats.total_invested;
        missing.push(`Investment: $${needed.toFixed(2)} more needed`);
      }
      if (!criteriaMet.staking) {
        const needed = criteria.minimum_staking_amount - stakingStats.total_staked;
        missing.push(`Staking: ${needed} tokens more needed`);
      }
      if (!criteriaMet.days_staked) {
        const needed = criteria.minimum_days_staked - stakingStats.max_days_staked;
        missing.push(`Staking Duration: ${needed} more days needed`);
      }
      if (!criteriaMet.transactions) {
        const needed = criteria.minimum_transactions - transactionStats.total_transactions;
        missing.push(`Transactions: ${needed} more transactions needed`);
      }
      if (!criteriaMet.referrals) {
        const needed = criteria.minimum_referrals - referralStats.successful_referrals;
        missing.push(`Referrals: ${needed} more successful referrals needed`);
      }

      return {
        eligible,
        criteria_met: criteriaMet,
        missing_requirements: missing,
        progress_percentage: Math.round(overallProgress)
      };

    } catch (error) {
      console.error('Error checking evolution eligibility:', error);
      return {
        eligible: false,
        criteria_met: {
          investment: false,
          staking: false,
          days_staked: false,
          transactions: false,
          referrals: false
        },
        missing_requirements: ['Error checking eligibility'],
        progress_percentage: 0
      };
    }
  }

  /**
   * Evolve NFT to 3D surprise version
   */
  static async evolveNFT(
    userId: string,
    baseNftId: string
  ): Promise<{ success: boolean; evolvedNft?: EvolutionNFT; error?: string }> {
    try {
      console.log(`🎭 Starting NFT evolution for user ${userId}, NFT ${baseNftId}`);

      // Check eligibility first
      const eligibility = await this.checkEvolutionEligibility(userId, baseNftId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: `Not eligible for evolution. Missing: ${eligibility.missing_requirements.join(', ')}`
        };
      }

      // Check if NFT is already evolved
      const { data: existingEvolution } = await supabase
        .from('user_evolutions')
        .select('*')
        .eq('user_id', userId)
        .eq('base_nft_id', baseNftId)
        .single();

      if (existingEvolution) {
        return {
          success: false,
          error: 'NFT has already been evolved'
        };
      }

      // Get available evolution NFTs for this base NFT
      const { data: availableEvolutions, error: evolutionError } = await supabase
        .from('evolution_nfts')
        .select('*')
        .eq('base_nft_id', baseNftId)
        .eq('is_surprise', true);

      if (evolutionError || !availableEvolutions || availableEvolutions.length === 0) {
        return {
          success: false,
          error: 'No evolution NFTs available for this base NFT'
        };
      }

      // Randomly select a surprise evolution (weighted by rarity)
      const selectedEvolution = this.selectRandomEvolution(availableEvolutions);

      // Create dedicated evolution wallet
      const evolutionWallet = `evolution_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      // Get user stats for evolution record
      const [investmentStats, stakingStats, transactionStats, referralStats] = await Promise.all([
        this.getUserInvestmentStats(userId),
        this.getUserStakingStats(userId),
        this.getUserTransactionStats(userId),
        this.getUserReferralStats(userId)
      ]);

      // Create evolution record
      const { data: evolution, error: creationError } = await supabase
        .from('user_evolutions')
        .insert({
          user_id: userId,
          base_nft_id: baseNftId,
          evolved_nft_id: selectedEvolution.id,
          evolution_date: new Date().toISOString(),
          investment_amount: investmentStats.total_invested,
          staking_amount: stakingStats.total_staked,
          days_staked: stakingStats.max_days_staked,
          transaction_count: transactionStats.total_transactions,
          referral_count: referralStats.successful_referrals,
          surprise_unlocked: true,
          evolution_wallet: evolutionWallet
        })
        .select()
        .single();

      if (creationError) {
        console.error('Error creating evolution record:', creationError);
        return {
          success: false,
          error: 'Failed to create evolution record'
        };
      }

      // Update user's NFT to evolved version
      await supabase
        .from('user_nfts')
        .update({
          nft_id: selectedEvolution.id,
          evolved: true,
          evolution_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('nft_id', baseNftId);

      // Send evolution notification email
      try {
        const { EmailService } = await import('@/lib/emailService');
        const { data: { user } } = await databaseAdapter.supabase.auth.getUser();
        
        if (user?.email) {
          await EmailService.sendEvolutionNotification(
            userId,
            user.email,
            user.user_metadata?.full_name || 'User',
            selectedEvolution.evolved_name,
            selectedEvolution.evolution_rarity
          );
        }
      } catch (emailError) {
        console.error('Error sending evolution notification:', emailError);
      }

      console.log(`✅ NFT evolution successful! Evolved to: ${selectedEvolution.evolved_name}`);
      return {
        success: true,
        evolvedNft: selectedEvolution
      };

    } catch (error) {
      console.error('Error evolving NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Evolution failed'
      };
    }
  }

  /**
   * Get user's evolved NFTs
   */
  static async getUserEvolvedNFTs(userId: string): Promise<UserEvolution[]> {
    try {
      const { data, error } = await supabase
        .from('user_evolutions')
        .select(`
          *,
          evolution_nfts (
            evolved_name,
            evolved_description,
            evolved_image_url,
            evolution_rarity,
            evolution_bonus_multiplier,
            fixed_earning_ratio,
            special_abilities
          )
        `)
        .eq('user_id', userId)
        .order('evolution_date', { ascending: false });

      if (error) {
        console.error('Error fetching user evolved NFTs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserEvolvedNFTs:', error);
      return [];
    }
  }

  /**
   * Calculate evolution earnings
   */
  static async calculateEvolutionEarnings(
    userId: string,
    evolutionId: string
  ): Promise<{ dailyEarnings: number; totalEarnings: number }> {
    try {
      // Get evolution details
      const { data: evolution, error } = await supabase
        .from('user_evolutions')
        .select(`
          *,
          evolution_nfts (fixed_earning_ratio)
        `)
        .eq('id', evolutionId)
        .eq('user_id', userId)
        .single();

      if (error || !evolution) {
        return { dailyEarnings: 0, totalEarnings: 0 };
      }

      const fixedRatio = evolution.evolution_nfts.fixed_earning_ratio;
      const daysSinceEvolution = Math.floor(
        (Date.now() - new Date(evolution.evolution_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      const dailyEarnings = evolution.investment_amount * (fixedRatio / 365);
      const totalEarnings = dailyEarnings * daysSinceEvolution;

      return {
        dailyEarnings: Math.round(dailyEarnings * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100
      };

    } catch (error) {
      console.error('Error calculating evolution earnings:', error);
      return { dailyEarnings: 0, totalEarnings: 0 };
    }
  }

  /**
   * Claim evolution earnings
   */
  static async claimEvolutionEarnings(
    userId: string,
    evolutionId: string
  ): Promise<{ success: boolean; amount?: number; error?: string }> {
    try {
      const earnings = await this.calculateEvolutionEarnings(userId, evolutionId);
      
      if (earnings.totalEarnings <= 0) {
        return {
          success: false,
          error: 'No earnings available to claim'
        };
      }

      // Add earnings to user's balance
      await supabase
        .from('user_loyalty_cards')
        .update({
          points_balance: databaseAdapter.supabase.sql`points_balance + ${earnings.totalEarnings}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Record the claim
      await supabase
        .from('evolution_earnings_claims')
        .insert({
          user_evolution_id: evolutionId,
          amount_claimed: earnings.totalEarnings,
          claimed_at: new Date().toISOString()
        });

      console.log(`✅ Evolution earnings claimed: ${earnings.totalEarnings} tokens`);
      return {
        success: true,
        amount: earnings.totalEarnings
      };

    } catch (error) {
      console.error('Error claiming evolution earnings:', error);
      return {
        success: false,
        error: 'Failed to claim earnings'
      };
    }
  }

  /**
   * Get evolution statistics
   */
  static async getEvolutionStats(): Promise<any> {
    try {
      const [totalEvolutions, rarityStats, topEvolvers] = await Promise.all([
        databaseAdapter.supabase.from('user_evolutions').select('id', { count: 'exact' }),
        databaseAdapter.supabase.from('user_evolutions').select(`
          evolution_nfts (evolution_rarity)
        `),
        databaseAdapter.supabase.from('user_evolutions').select(`
          user_id,
          profiles (full_name)
        `).limit(10)
      ]);

      // Count by rarity
      const rarityCount = {
        rare: 0,
        epic: 0,
        legendary: 0,
        mythic: 0
      };

      rarityStats.data?.forEach(evolution => {
        const rarity = evolution.evolution_nfts?.evolution_rarity;
        if (rarity && rarityCount.hasOwnProperty(rarity)) {
          rarityCount[rarity as keyof typeof rarityCount]++;
        }
      });

      return {
        total_evolutions: totalEvolutions.count || 0,
        rarity_distribution: rarityCount,
        top_evolvers: topEvolvers.data || []
      };

    } catch (error) {
      console.error('Error getting evolution stats:', error);
      return {
        total_evolutions: 0,
        rarity_distribution: { rare: 0, epic: 0, legendary: 0, mythic: 0 },
        top_evolvers: []
      };
    }
  }

  /**
   * Helper method to get user investment stats
   */
  private static async getUserInvestmentStats(userId: string): Promise<any> {
    const { data } = await supabase
      .from('nft_upgrade_payments')
      .select('amount_usdt')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalInvested = data?.reduce((sum, payment) => sum + payment.amount_usdt, 0) || 0;
    return { total_invested: totalInvested };
  }

  /**
   * Helper method to get user staking stats
   */
  private static async getUserStakingStats(userId: string): Promise<any> {
    const { data } = await supabase
      .from('stake_positions')
      .select('amount_staked, stake_date, unlock_date')
      .eq('user_id', userId);

    const totalStaked = data?.reduce((sum, pos) => sum + pos.amount_staked, 0) || 0;
    const maxDaysStaked = data?.reduce((max, pos) => {
      const days = Math.floor(
        (new Date(pos.unlock_date).getTime() - new Date(pos.stake_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(max, days);
    }, 0) || 0;

    return { total_staked: totalStaked, max_days_staked: maxDaysStaked };
  }

  /**
   * Helper method to get user transaction stats
   */
  private static async getUserTransactionStats(userId: string): Promise<any> {
    const { data } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId);

    return { total_transactions: data?.length || 0 };
  }

  /**
   * Helper method to get user referral stats
   */
  private static async getUserReferralStats(userId: string): Promise<any> {
    const { data } = await supabase
      .from('referral_settlements')
      .select('id')
      .eq('referrer_id', userId)
      .eq('status', 'completed');

    return { successful_referrals: data?.length || 0 };
  }

  /**
   * Randomly select evolution based on rarity weights
   */
  private static selectRandomEvolution(evolutions: EvolutionNFT[]): EvolutionNFT {
    const rarityWeights = {
      mythic: 1,    // 1% chance
      legendary: 4, // 4% chance  
      epic: 15,     // 15% chance
      rare: 80      // 80% chance
    };

    const weightedEvolutions: { nft: EvolutionNFT; weight: number }[] = evolutions.map(nft => ({
      nft,
      weight: rarityWeights[nft.evolution_rarity] || 1
    }));

    const totalWeight = weightedEvolutions.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const item of weightedEvolutions) {
      currentWeight += item.weight;
      if (random <= currentWeight) {
        console.log(`🎲 Selected ${item.nft.evolution_rarity} evolution: ${item.nft.evolved_name}`);
        return item.nft;
      }
    }

    // Fallback to first evolution
    return evolutions[0];
  }
}