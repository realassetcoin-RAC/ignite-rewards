import { supabase } from '@/integrations/supabase/client';
import { EmailNotificationService } from './emailNotificationService';

export interface OTPCode {
  id: string;
  mobile_number: string;
  network_id: string;
  user_id: string;
  otp_code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

export interface OTPResult {
  success: boolean;
  message: string;
  otpId?: string;
  expiresIn?: number;
  error_code?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  isValid?: boolean;
  error_code?: string;
}

export class EnhancedLoyaltyOtp {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_VALIDITY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS_PER_HOUR = 5;
  private static readonly RESEND_COOLDOWN_MINUTES = 1;

  /**
   * Generate and send OTP for loyalty network linking
   */
  static async generateAndSendOTP(
    mobileNumber: string,
    networkId: string,
    userId: string
  ): Promise<OTPResult> {
    try {
      // Validate mobile number format
      if (!this.isValidMobileNumber(mobileNumber)) {
        return {
          success: false,
          message: 'Invalid mobile number format',
          error_code: 'INVALID_MOBILE'
        };
      }

      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(mobileNumber);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: `Too many attempts. Please wait ${rateLimitCheck.waitTime} minutes.`,
          error_code: 'RATE_LIMITED'
        };
      }

      // Check if there's a recent OTP that hasn't expired
      const recentOTP = await this.getRecentOTP(mobileNumber, networkId);
      if (recentOTP && !this.isOTPExpired(recentOTP.expires_at)) {
        const remainingTime = this.getRemainingTime(recentOTP.expires_at);
        return {
          success: false,
          message: `Please wait ${remainingTime} seconds before requesting a new OTP.`,
          error_code: 'COOLDOWN_ACTIVE'
        };
      }

      // Generate OTP code
      const otpCode = this.generateOTPCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_VALIDITY_MINUTES);

      // Store OTP in database
      const { data: otpRecord, error: insertError } = await supabase
        .from('loyalty_otp_codes')
        .insert({
          mobile_number: mobileNumber,
          network_id: networkId,
          user_id: userId,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          is_used: false
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Send OTP via SMS (integrate with SMS service)
      const smsResult = await this.sendSMS(mobileNumber, otpCode, networkId);
      if (!smsResult.success) {
        // Clean up the OTP record if SMS fails
        await supabase
          .from('loyalty_otp_codes')
          .delete()
          .eq('id', otpRecord.id);
        
        return {
          success: false,
          message: 'Failed to send SMS. Please try again.',
          error_code: 'SMS_FAILED'
        };
      }

      return {
        success: true,
        message: `OTP sent to ${this.maskMobileNumber(mobileNumber)}`,
        otpId: otpRecord.id,
        expiresIn: this.OTP_VALIDITY_MINUTES * 60
      };

    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        message: 'Failed to generate OTP. Please try again.',
        error_code: 'GENERATION_FAILED'
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(
    mobileNumber: string,
    networkId: string,
    userId: string,
    otpCode: string
  ): Promise<OTPVerificationResult> {
    try {
      // Find the OTP record
      const { data: otpRecord, error: findError } = await supabase
        .from('loyalty_otp_codes')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('network_id', networkId)
        .eq('user_id', userId)
        .eq('otp_code', otpCode)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !otpRecord) {
        return {
          success: false,
          message: 'Invalid OTP code',
          isValid: false,
          error_code: 'INVALID_OTP'
        };
      }

      // Check if OTP is expired
      if (this.isOTPExpired(otpRecord.expires_at)) {
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.',
          isValid: false,
          error_code: 'OTP_EXPIRED'
        };
      }

      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('loyalty_otp_codes')
        .update({ is_used: true })
        .eq('id', otpRecord.id);

      if (updateError) {
        console.error('Error marking OTP as used:', updateError);
        // Don't fail the verification for this error
      }

      // Send email notification for successful linking
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        const { data: network } = await supabase
          .from('loyalty_networks')
          .select('display_name')
          .eq('id', networkId)
          .single();

        if (userProfile?.email && network?.display_name) {
          await EmailNotificationService.sendLoyaltyLinkingEmail(
            userProfile.email,
            network.display_name,
            mobileNumber
          );
        }
      } catch (emailError) {
        console.error('Error sending loyalty linking email notification:', emailError);
        // Don't fail the OTP verification for email errors
      }

      return {
        success: true,
        message: 'OTP verified successfully',
        isValid: true
      };

    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
        error_code: 'VERIFICATION_FAILED'
      };
    }
  }

  /**
   * Resend OTP with cooldown check
   */
  static async resendOTP(
    mobileNumber: string,
    networkId: string,
    userId: string
  ): Promise<OTPResult> {
    try {
      // Check if user can resend (cooldown period)
      const recentOTP = await this.getRecentOTP(mobileNumber, networkId);
      if (recentOTP) {
        const timeSinceLastOTP = Date.now() - new Date(recentOTP.created_at).getTime();
        const cooldownMs = this.RESEND_COOLDOWN_MINUTES * 60 * 1000;
        
        if (timeSinceLastOTP < cooldownMs) {
          const remainingCooldown = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
          return {
            success: false,
            message: `Please wait ${remainingCooldown} seconds before resending OTP.`,
            error_code: 'RESEND_COOLDOWN'
          };
        }
      }

      // Generate and send new OTP
      return await this.generateAndSendOTP(mobileNumber, networkId, userId);

    } catch (error) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        message: 'Failed to resend OTP. Please try again.',
        error_code: 'RESEND_FAILED'
      };
    }
  }

  /**
   * Clean up expired OTPs
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      const { error } = await supabase
        .from('loyalty_otp_codes')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning up expired OTPs:', error);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Get OTP statistics for a user
   */
  static async getOTPStats(userId: string): Promise<{
    totalSent: number;
    successfulVerifications: number;
    failedAttempts: number;
    lastSent?: string;
  }> {
    try {
      const { data: otps, error } = await supabase
        .from('loyalty_otp_codes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const totalSent = otps?.length || 0;
      const successfulVerifications = otps?.filter(otp => otp.is_used).length || 0;
      const failedAttempts = totalSent - successfulVerifications;
      const lastSent = otps?.[0]?.created_at;

      return {
        totalSent,
        successfulVerifications,
        failedAttempts,
        lastSent
      };
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      return {
        totalSent: 0,
        successfulVerifications: 0,
        failedAttempts: 0
      };
    }
  }

  // Private helper methods

  private static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private static isValidMobileNumber(mobileNumber: string): boolean {
    // Basic mobile number validation (adjust regex as needed)
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;
    return mobileRegex.test(mobileNumber.replace(/\s/g, ''));
  }

  private static isOTPExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  private static getRemainingTime(expiresAt: string): number {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  private static maskMobileNumber(mobileNumber: string): string {
    if (mobileNumber.length <= 4) return mobileNumber;
    const start = mobileNumber.slice(0, 2);
    const end = mobileNumber.slice(-2);
    const middle = '*'.repeat(mobileNumber.length - 4);
    return `${start}${middle}${end}`;
  }

  private static async checkRateLimit(mobileNumber: string): Promise<{
    allowed: boolean;
    waitTime?: number;
  }> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data: recentOTPs, error } = await supabase
        .from('loyalty_otp_codes')
        .select('created_at')
        .eq('mobile_number', mobileNumber)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true }; // Allow on error to avoid blocking users
      }

      const attempts = recentOTPs?.length || 0;
      if (attempts >= this.MAX_ATTEMPTS_PER_HOUR) {
        const oldestAttempt = recentOTPs?.[0]?.created_at;
        if (oldestAttempt) {
          const waitTime = Math.ceil(
            (new Date(oldestAttempt).getTime() + 60 * 60 * 1000 - Date.now()) / (1000 * 60)
          );
          return { allowed: false, waitTime };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true };
    }
  }

  private static async getRecentOTP(mobileNumber: string, networkId: string): Promise<OTPCode | null> {
    try {
      const { data, error } = await supabase
        .from('loyalty_otp_codes')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('network_id', networkId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting recent OTP:', error);
      return null;
    }
  }

  private static async sendSMS(mobileNumber: string, otpCode: string, networkId: string): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    try {
      // Get network details for SMS template
      const { data: network, error: networkError } = await supabase
        .from('loyalty_networks')
        .select('display_name')
        .eq('id', networkId)
        .single();

      if (networkError) {
        throw networkError;
      }

      const message = `Your PointBridge verification code for ${network.display_name} is: ${otpCode}. Valid for 5 minutes. Do not share this code.`;

      // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
      // For now, simulate SMS sending
      console.log(`SMS to ${mobileNumber}: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, replace this with actual SMS service integration
      // Example with Twilio:
      // const twilio = require('twilio')(accountSid, authToken);
      // const message = await twilio.messages.create({
      //   body: message,
      //   from: '+1234567890',
      //   to: mobileNumber
      // });

      return {
        success: true,
        messageId: `msg_${Date.now()}`
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false
      };
    }
  }
}
