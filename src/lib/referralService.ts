import { supabase } from '@/integrations/supabase/client';
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
        const { data: campaign } = await supabase
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
      const { data: existingCode } = await supabase
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
      const { error } = await supabase
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
    } catch {
      // Console statement removed
      return null;
    }
  }

  /**
   * Process referral signup - called when a new user signs up with a referral code
   */
  static async processReferralSignup(referralCode: string, newUserId: string): Promise<ReferralSignupResult> {
    try {
      // Find the referral code
      const { data: referralCodeData, error: codeError } = await supabase
        .from('referral_codes')
        .select(`
          *,
          referral_campaigns!inner(*)
        `)
        .eq('code', referralCode.toUpperCase())
        .eq('is_used', false)
        .eq('referral_campaigns.is_active', true)
        .single();

      if (codeError || !referralCodeData) {
        return {
          success: false,
          error: 'Invalid or expired referral code'
        };
      }

      // Check if user is trying to refer themselves
      if (referralCodeData.referrer_id === newUserId) {
        return {
          success: false,
          error: 'Cannot use your own referral code'
        };
      }

      // Check campaign limits
      const { data: existingReferrals } = await supabase
        .from('referral_settlements')
        .select('id')
        .eq('referrer_id', referralCodeData.referrer_id)
        .eq('campaign_id', referralCodeData.campaign_id)
        .eq('status', 'completed');

      const referralCount = existingReferrals?.length || 0;
      const maxReferrals = referralCodeData.referral_campaigns.max_referrals_per_user;

      if (referralCount >= maxReferrals) {
        return {
          success: false,
          error: 'Referrer has reached maximum referral limit'
        };
      }

      // Mark referral code as used
      const { error: updateError } = await supabase
        .from('referral_codes')
        .update({
          is_used: true,
          used_by: newUserId,
          used_at: new Date().toISOString()
        })
        .eq('id', referralCodeData.id);

      if (updateError) {
        throw updateError;
      }

      // Create settlement record
      const { data: settlement, error: settlementError } = await supabase
        .from('referral_settlements')
        .insert({
          referrer_id: referralCodeData.referrer_id,
          referred_user_id: newUserId,
          campaign_id: referralCodeData.campaign_id,
          points_awarded: referralCodeData.referral_campaigns.points_per_referral,
          status: 'pending'
        })
        .select()
        .single();

      if (settlementError) {
        throw settlementError;
      }

      // Award points to referrer
      const { error: pointsError } = await supabase
        .from('loyalty_points')
        .insert({
          user_id: referralCodeData.referrer_id,
          points: referralCodeData.referral_campaigns.points_per_referral,
          source: 'referral',
          description: `Referral bonus for ${referralCode}`,
          transaction_id: settlement.id
        });

      if (pointsError) {
        // Console statement removed
        // Don't fail the entire process for points error
      }

      // Update settlement status
      await supabase
        .from('referral_settlements')
        .update({
          status: 'completed',
          settlement_date: new Date().toISOString()
        })
        .eq('id', settlement.id);

      // Send email notification to referrer
      try {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', referralCodeData.referrer_id)
          .single();

        const { data: newUserProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', newUserId)
          .single();

        if (referrerProfile?.email) {
          await EmailNotificationService.sendReferralWelcomeEmail(
            referrerProfile.email,
            newUserProfile?.full_name || newUserProfile?.email || 'New User',
            referralCodeData.referral_campaigns.points_per_referral
          );
        }
      } catch {
        // Console statement removed
        // Don't fail the referral process for email errors
      }

      return {
        success: true,
        pointsAwarded: referralCodeData.referral_campaigns.points_per_referral,
        settlementId: settlement.id
      };

    } catch {
      // Console statement removed
      return {
        success: false,
        error: 'Failed to process referral code'
      };
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string | null;
    recentReferrals: Record<string, unknown>[];
  }> {
    try {
      // Get user's referral code
      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('referrer_id', userId)
        .eq('is_used', false)
        .single();

      // Get referral statistics
      const { data: settlements } = await supabase
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
    } catch {
      // Console statement removed
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
      const { data, error } = await supabase
        .from('referral_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch {
      // Console statement removed
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
    const { data: existing } = await supabase
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
