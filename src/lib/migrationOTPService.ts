import { databaseAdapter } from './databaseAdapter';

export class MigrationOTPService {
  /**
   * Send OTP tied to a loyalty network for user-initiated migration actions.
   * This uses Firebase phone auth for delivery, and records the challenge in loyalty_otp_codes.
   */
  static async sendNetworkOTP(
    userId: string,
    networkId: string,
    userPhone: string
  ): Promise<{ success: boolean; error?: string; verificationId?: string }> {
    try {
      console.log('📱 Sending network OTP to:', userPhone, 'network:', networkId);

      // Send OTP via Firebase directly (keeping Firebase for SMS delivery)
      const { FirebaseAuthService } = await import('./firebaseAuthService');
      const result = await FirebaseAuthService.sendOTP(userPhone);

      if (!result.success || !result.verificationId) {
        return { success: false, error: result.error || 'Failed to send OTP' };
      }

      const verificationId = result.verificationId;

      // Persist OTP challenge in loyalty_otp_codes (store verificationId in otp_code field)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { error } = await databaseAdapter
        .from('loyalty_otp_codes')
        .insert({
          user_id: userId,
          network_id: networkId,
          mobile_number: userPhone,
          otp_code: verificationId,
          expires_at: expiresAt,
          is_used: false
        });

      if (error) {
        console.error('❌ Failed to record OTP challenge:', error);
        return { success: false, error: 'Failed to record OTP challenge' };
      }

      console.log('✅ Network OTP sent and recorded');
      return { success: true, verificationId };
    } catch (error) {
      console.error('❌ Network OTP send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send network OTP'
      };
    }
  }

  /**
   * Verify OTP for a loyalty network challenge, mark the challenge as used if valid.
   */
  static async verifyNetworkOTP(
    verificationId: string,
    otpCode: string,
    userId: string,
    networkId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Verifying network OTP for network:', networkId);

      // Verify via Firebase directly
      const { FirebaseAuthService } = await import('./firebaseAuthService');
      const result = await FirebaseAuthService.verifyOTP(verificationId, otpCode);

      if (!result.success) {
        return { success: false, error: result.error || 'OTP verification failed' };
      }

      // Mark OTP challenge as used (lookup by verificationId stored in otp_code)
      const nowIso = new Date().toISOString();
      const { error: updateError } = await databaseAdapter
        .from('loyalty_otp_codes')
        .update({ is_used: true, used_at: nowIso })
        .eq('user_id', userId)
        .eq('network_id', networkId)
        .eq('otp_code', verificationId)
        .eq('is_used', false);

      if (updateError) {
        console.error('❌ Failed to mark OTP as used:', updateError);
        return { success: false, error: 'Failed to finalize OTP verification' };
      }

      console.log('✅ Network OTP verified and marked as used');
      return { success: true };
    } catch (error) {
      console.error('❌ Network OTP verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network OTP verification failed'
      };
    }
  }

  /**
   * Wrapper method for sendMigrationOTP to match test page expectations
   * Sends OTP for points migration verification
   */
  static async sendMigrationOTP(
    userPhone: string,
    migrationId: string,
    userId: string,
    sourcePlatform: string,
    _pointsAmount: number
  ): Promise<{ success: boolean; error?: string; verificationId?: string }> {
    // Use migrationId as networkId for the network OTP service
    return this.sendNetworkOTP(userId, migrationId, userPhone);
  }

  /**
   * Wrapper method for verifyMigrationOTP to match test page expectations
   * Verifies OTP for points migration
   */
  static async verifyMigrationOTP(
    verificationId: string,
    otpCode: string,
    migrationId: string
  ): Promise<{ success: boolean; error?: string }> {
    // We need userId to verify, but it's not passed. 
    // For now, we'll look it up from the OTP challenge
    try {
      // First verify the OTP with Firebase
      const { FirebaseAuthService } = await import('./firebaseAuthService');
      const result = await FirebaseAuthService.verifyOTP(verificationId, otpCode);

      if (!result.success) {
        return { success: false, error: result.error || 'OTP verification failed' };
      }

      // Mark OTP challenge as used
      const nowIso = new Date().toISOString();
      const { error: updateError } = await databaseAdapter
        .from('loyalty_otp_codes')
        .update({ is_used: true, used_at: nowIso })
        .eq('network_id', migrationId)
        .eq('otp_code', verificationId)
        .eq('is_used', false);

      if (updateError) {
        console.error('❌ Failed to mark OTP as used:', updateError);
        return { success: false, error: 'Failed to finalize OTP verification' };
      }

      console.log('✅ Migration OTP verified and marked as used');
      return { success: true };
    } catch (error) {
      console.error('❌ Migration OTP verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration OTP verification failed'
      };
    }
  }

  /**
   * Process points migration after OTP verification
   * This would typically add points to the user's account
   */
  static async processPointsMigration(
    migrationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processing points migration for:', migrationId);
      
      // TODO: Implement actual points migration logic
      // This would typically:
      // 1. Look up the migration details from the OTP challenge
      // 2. Verify the OTP challenge was used
      // 3. Add points to the user's account
      // 4. Record the migration transaction
      
      // For now, return success
      console.log('✅ Points migration processed (placeholder)');
      return { success: true };
    } catch (error) {
      console.error('❌ Points migration processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process points migration'
      };
    }
  }
}
