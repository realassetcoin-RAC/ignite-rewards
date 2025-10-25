import { databaseAdapter } from '@/lib/databaseAdapter';
import { EmailNotificationService } from './emailNotificationService';

export interface ReferralCampaign {
  id: string;
  name: string;
  points_per_referral: number;
  max_referrals_per_user: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  referrer_id: string;
  campaign_id: string;
  created_at: string;
  is_used: boolean;
  used_by?: string;
  used_at?: string;
}

export interface ReferralSettlement {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  campaign_id: string;
  points_awarded: number;
  settlement_date: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface ReferralSignupResult {
  success: boolean;
  pointsAwarded?: number;
  error?: string;
  settlementId?: string;
}

export class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  static async generateReferralCode(userId: string, campaignId?: string): Promise<string | null> {
    try {
      // Get active campaign if not provided
      if (!campaignId) {
        const { data: campaign } = await databaseAdapter.supabase
          .from('referral_campaigns')
          .select('id')
          .eq('is_active', true)
          .single();

        if (!campaign) {
          throw new Error('No active referral campaign found');
        }
        campaignId = campaign.id;
      }

      // Check if user already has a referral code
      const { data: existingCode } = await databaseAdapter.supabase
        .from('referral_codes')
        .select('code')
        .eq('referrer_id', userId)
        .eq('campaign_id', campaignId)
        .single();

      if (existingCode) {
        return existingCode.code;
      }

      // Generate unique code
      const code = await this.generateUniqueCode();
      
      // Insert referral code
      const { error } = await databaseAdapter.supabase
        .from('referral_codes')
        .insert({
          code,
          referrer_id: userId,
          campaign_id: campaignId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return code;
    } catch (error) {
      console.error('Error generating referral code:', error);
      return null;
    }
  }

  /**
   * Process referral signup - called when a new user signs up with a referral code
   */
  static async processReferralSignup(referralCode: string, newUserId: string): Promise<ReferralSignupResult> {
    try {
      const normalizedCode = referralCode.trim().toUpperCase();

      // First try to find the referral code in referral_codes table
      const { data: referralCodeData, error: codeError } = await databaseAdapter.supabase
        .from('referral_codes')
        .select(`
          *,
          referral_campaigns!inner(*)
        `)
        .eq('code', normalizedCode)
        .eq('is_used', false)
        .eq('referral_campaigns.is_active', true)
        .maybeSingle();

      // If not found in referral_codes, try resolving as loyalty_number directly
      let resolvedReferrerId: string | null = null;
      let campaignId: string | null = null;
      let pointsPerReferral = 0;
      let referralCodeId: string | null = null;

      if (referralCodeData) {
        resolvedReferrerId = referralCodeData.referrer_id;
        campaignId = referralCodeData.campaign_id;
        pointsPerReferral = referralCodeData.referral_campaigns.points_per_referral;
        referralCodeId = referralCodeData.id;
      } else {
        // Resolve via profiles.loyalty_number
        const { data: refProfile } = await databaseAdapter.supabase
          .from('profiles')
          .select('id')
          .eq('loyalty_number', normalizedCode)
          .maybeSingle();

        if (!refProfile) {
          return { success: false, error: 'Invalid or expired referral code' };
        }

        resolvedReferrerId = refProfile.id;

        // Get active campaign for loyalty-number-based referrals
        const { data: activeCampaign } = await databaseAdapter.supabase
          .from('referral_campaigns')
          .select('id, points_per_referral, max_referrals_per_user')
          .eq('is_active', true)
          .maybeSingle();

        if (!activeCampaign) {
          return { success: false, error: 'No active referral campaign found' };
        }

        campaignId = activeCampaign.id;
        pointsPerReferral = activeCampaign.points_per_referral || 100;
      }

      // Prevent self referral
      if (resolvedReferrerId === newUserId) {
        return { success: false, error: 'Cannot use your own referral code' };
      }

      // Check campaign caps
      const { data: existingReferrals } = await databaseAdapter.supabase
        .from('referral_settlements')
        .select('id')
        .eq('referrer_id', resolvedReferrerId)
        .eq('campaign_id', campaignId)
        .eq('status', 'completed');

      const referralCount = existingReferrals?.length || 0;
      const maxReferrals = referralCodeData?.referral_campaigns?.max_referrals_per_user ?? 10;
      if (referralCount >= maxReferrals) {
        return { success: false, error: 'Referrer has reached maximum referral limit' };
      }

      // Mark referral code as used if it exists
      if (referralCodeId) {
        const { error: updateError } = await databaseAdapter.supabase
          .from('referral_codes')
          .update({ is_used: true, used_by: newUserId, used_at: new Date().toISOString() })
          .eq('id', referralCodeId);
        if (updateError) throw updateError;
      }

      // Create referral settlement
      const { data: settlement, error: settlementError } = await databaseAdapter.supabase
        .from('referral_settlements')
        .insert({
          referrer_id: resolvedReferrerId,
          referred_user_id: newUserId,
          campaign_id: campaignId,
          points_awarded: pointsPerReferral,
          status: 'pending'
        })
        .select()
        .single();
      if (settlementError) throw settlementError;

      // Award points to referrer
      const { error: pointsError } = await databaseAdapter.supabase
        .from('loyalty_points')
        .insert({
          user_id: resolvedReferrerId,
          points: pointsPerReferral,
          source: 'referral',
          description: `Referral bonus for ${normalizedCode}`,
          transaction_id: settlement.id
        });

      if (pointsError) {
        console.error('Error awarding referral points:', pointsError);
        // Don't fail the entire process for points error
      }

      // Complete settlement
      await databaseAdapter.supabase
        .from('referral_settlements')
        .update({ status: 'completed', settlement_date: new Date().toISOString() })
        .eq('id', settlement.id);

      // Send email notification to referrer (best effort)
      try {
        const { data: referrerProfile } = await databaseAdapter.supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', resolvedReferrerId)
          .single();

        const { data: newUserProfile } = await databaseAdapter.supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', newUserId)
          .single();

        if (referrerProfile?.email) {
          // Import and send email notification
          const { EmailNotificationService } = await import('./emailNotificationService');
          await EmailNotificationService.sendReferralWelcomeEmail(
            referrerProfile.email,
            newUserProfile?.full_name || newUserProfile?.email || 'New User',
            pointsPerReferral
          );
        }
      } catch (emailError) {
        console.error('Error sending referral email notification:', emailError);
        // Don't fail the referral process for email errors
      }

      return { success: true, pointsAwarded: pointsPerReferral, settlementId: settlement.id };
    } catch (error) {
      console.error('Error processing referral signup:', error);
      return { success: false, error: 'Failed to process referral code' };
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string | null;
    recentReferrals: any[];
  }> {
    try {
      // Get user's referral code
      const { data: referralCode } = await databaseAdapter.supabase
        .from('referral_codes')
        .select('code')
        .eq('referrer_id', userId)
        .eq('is_used', false)
        .single();

      // Get referral statistics
      const { data: settlements } = await databaseAdapter.supabase
        .from('referral_settlements')
        .select(`
          *,
          referred_user:profiles!referral_settlements_referred_user_id_fkey(email, full_name)
        `)
        .eq('referrer_id', userId)
        .eq('status', 'completed')
        .order('settlement_date', { ascending: false });

      const totalReferrals = settlements?.length || 0;
      const totalPointsEarned = settlements?.reduce((sum, s) => sum + s.points_awarded, 0) || 0;

      return {
        totalReferrals,
        totalPointsEarned,
        referralCode: referralCode?.code || null,
        recentReferrals: settlements?.slice(0, 5) || []
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return {
        totalReferrals: 0,
        totalPointsEarned: 0,
        referralCode: null,
        recentReferrals: []
      };
    }
  }

  /**
   * Get active referral campaigns
   */
  static async getActiveCampaigns(): Promise<ReferralCampaign[]> {
    try {
      const { data, error } = await databaseAdapter.supabase
        .from('referral_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting active campaigns:', error);
      return [];
    }
  }

  /**
   * Generate a unique referral code
   */
  private static async generateUniqueCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const { data: existing } = await databaseAdapter.supabase
      .from('referral_codes')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      // Recursively generate new code if collision
      return this.generateUniqueCode();
    }

    return code;
  }

  /**
   * Validate referral code format
   */
  static isValidReferralCode(code: string): boolean {
    return /^[A-Z0-9]{8}$/.test(code.toUpperCase());
  }
}
