import { supabase } from "@/integrations/supabase/client";

export interface OTPSession {
  id: string;
  user_id: string;
  loyalty_network_id: string;
  mobile_number: string;
  otp_code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

export interface LoyaltyNetwork {
  id: string;
  name: string;
  display_name: string;
  requires_mobile_verification: boolean;
  is_active: boolean;
}

/**
 * Generate and send OTP for loyalty account verification
 */
export async function generateLoyaltyOTP(
  userId: string,
  loyaltyNetworkId: string,
  mobileNumber: string
): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  try {
    // Validate mobile number format
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return { success: false, error: 'Invalid mobile number format' };
    }

    // Check if loyalty network exists and is active
    const { data: network, error: networkError } = await supabase
      .from('loyalty_networks')
      .select('id, name, display_name, requires_mobile_verification, is_active')
      .eq('id', loyaltyNetworkId)
      .eq('is_active', true)
      .single();

    if (networkError || !network) {
      return { success: false, error: 'Loyalty network not found or inactive' };
    }

    if (!network.requires_mobile_verification) {
      return { success: false, error: 'This loyalty network does not require mobile verification' };
    }

    // Check for existing unexpired OTP sessions
    const { data: existingSessions, error: sessionError } = await supabase
      .from('loyalty_otp_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('loyalty_network_id', loyaltyNetworkId)
      .eq('mobile_number', cleanMobile)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString());

    if (sessionError) {
      console.error('Error checking existing OTP sessions:', sessionError);
    }

    if (existingSessions && existingSessions.length > 0) {
      return { success: false, error: 'OTP already sent. Please wait before requesting another.' };
    }

    // Generate OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create OTP session
    const { data: session, error: insertError } = await supabase
      .from('loyalty_otp_sessions')
      .insert({
        user_id: userId,
        loyalty_network_id: loyaltyNetworkId,
        mobile_number: cleanMobile,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating OTP session:', insertError);
      return { success: false, error: 'Failed to create OTP session' };
    }

    // In a real implementation, you would send the OTP via SMS
    // For now, we'll log it to console for development
    console.log(`OTP for ${network.display_name} (${cleanMobile}): ${otpCode}`);
    
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // await sendSMS(cleanMobile, `Your ${network.display_name} verification code is: ${otpCode}`);

    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error('Error generating loyalty OTP:', error);
    return { success: false, error: 'Failed to generate OTP' };
  }
}

/**
 * Verify OTP code for loyalty account linking
 */
export async function verifyLoyaltyOTP(
  userId: string,
  loyaltyNetworkId: string,
  mobileNumber: string,
  otpCode: string
): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  try {
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    const cleanOtp = otpCode.replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      return { success: false, error: 'OTP code must be 6 digits' };
    }

    // Find valid OTP session
    const { data: session, error: sessionError } = await supabase
      .from('loyalty_otp_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('loyalty_network_id', loyaltyNetworkId)
      .eq('mobile_number', cleanMobile)
      .eq('otp_code', cleanOtp)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('loyalty_otp_sessions')
      .update({ is_used: true })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
      return { success: false, error: 'Failed to verify OTP' };
    }

    // Create or update user loyalty link
    const { data: link, error: linkError } = await supabase
      .from('user_loyalty_links')
      .upsert({
        user_id: userId,
        loyalty_network_id: loyaltyNetworkId,
        mobile_number: cleanMobile,
        is_verified: true,
        linked_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,loyalty_network_id'
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating loyalty link:', linkError);
      return { success: false, error: 'Failed to create loyalty link' };
    }

    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error('Error verifying loyalty OTP:', error);
    return { success: false, error: 'Failed to verify OTP' };
  }
}

/**
 * Get user's linked loyalty accounts
 */
export async function getUserLoyaltyLinks(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_loyalty_links')
      .select(`
        *,
        loyalty_networks (
          id,
          name,
          display_name,
          logo_url,
          conversion_rate,
          min_conversion_amount,
          max_conversion_amount
        )
      `)
      .eq('user_id', userId)
      .eq('is_verified', true);

    if (error) {
      console.error('Error fetching user loyalty links:', error);
      return { success: false, error: 'Failed to fetch loyalty links' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting user loyalty links:', error);
    return { success: false, error: 'Failed to get loyalty links' };
  }
}

/**
 * Get available loyalty networks for linking
 */
export async function getAvailableLoyaltyNetworks(): Promise<{
  success: boolean;
  data?: LoyaltyNetwork[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('loyalty_networks')
      .select('id, name, display_name, requires_mobile_verification, is_active, logo_url')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      console.error('Error fetching loyalty networks:', error);
      return { success: false, error: 'Failed to fetch loyalty networks' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting loyalty networks:', error);
    return { success: false, error: 'Failed to get loyalty networks' };
  }
}

/**
 * Clean up expired OTP sessions
 */
export async function cleanupExpiredOTPSessions(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_otp_sessions');

    if (error) {
      console.error('Error cleaning up expired OTP sessions:', error);
      return { success: false, error: 'Failed to cleanup expired sessions' };
    }

    return { success: true, deletedCount: data || 0 };
  } catch (error) {
    console.error('Error cleaning up OTP sessions:', error);
    return { success: false, error: 'Failed to cleanup OTP sessions' };
  }
}

/**
 * Check if user already has a loyalty link for a specific network
 */
export async function checkExistingLoyaltyLink(
  userId: string,
  loyaltyNetworkId: string
): Promise<{ success: boolean; exists?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_loyalty_links')
      .select('id')
      .eq('user_id', userId)
      .eq('loyalty_network_id', loyaltyNetworkId)
      .eq('is_verified', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing loyalty link:', error);
      return { success: false, error: 'Failed to check existing link' };
    }

    return { success: true, exists: !!data };
  } catch (error) {
    console.error('Error checking loyalty link:', error);
    return { success: false, error: 'Failed to check loyalty link' };
  }
}
