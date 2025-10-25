/**
 * MFA (Multi-Factor Authentication) utilities
 * Provides TOTP (Time-based One-Time Password) functionality for authenticator apps
 * Only applicable for email/social authentication users
 */

import { databaseAdapter } from '@/lib/databaseAdapter';

// Base32 alphabet for encoding/decoding
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Convert a string to base32 encoding
 */
function toBase32(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Convert base32 string to bytes
 */
function fromBase32(input: string): Uint8Array {
  const cleanInput = input.replace(/[^A-Z2-7]/g, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    const index = BASE32_ALPHABET.indexOf(char);
    
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Generate a random TOTP secret
 */
export function generateTOTPSecret(): string {
  const randomBytes = new Uint8Array(20); // 160 bits
  crypto.getRandomValues(randomBytes);
  return toBase32(String.fromCharCode(...randomBytes));
}

/**
 * Generate TOTP code from secret and timestamp
 */
export async function generateTOTPCode(secret: string, timestamp?: number): Promise<string> {
  const time = Math.floor((timestamp || Date.now()) / 1000 / 30); // 30-second window
  const key = fromBase32(secret);
  
  // Convert time to 8-byte big-endian array
  const timeBytes = new Uint8Array(8);
  let timeValue = time;
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = timeValue & 0xff;
    timeValue >>>= 8;
  }

  // HMAC-SHA1 (simplified implementation)
  const hmac = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', hmac, timeBytes);
  const signatureArray = new Uint8Array(signature);
  
  // Dynamic truncation
  const offset = signatureArray[19] & 0xf;
  const code = 
    ((signatureArray[offset] & 0x7f) << 24) |
    ((signatureArray[offset + 1] & 0xff) << 16) |
    ((signatureArray[offset + 2] & 0xff) << 8) |
    (signatureArray[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

/**
 * Verify TOTP code with tolerance for clock skew
 */
export async function verifyTOTPCode(secret: string, code: string, window: number = 1): Promise<boolean> {
  const currentTime = Math.floor(Date.now() / 1000 / 30);
  
  // Check current time and previous/next windows for clock skew tolerance
  for (let i = -window; i <= window; i++) {
    const testTime = currentTime + i;
    const testCode = await generateTOTPCode(secret, testTime * 30 * 1000);
    if (testCode === code) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate QR code URL for authenticator app setup
 */
export function generateQRCodeURL(secret: string, email: string, issuer: string = 'PointBridge'): string {
  const encodedSecret = encodeURIComponent(secret);
  const encodedEmail = encodeURIComponent(email);
  const encodedIssuer = encodeURIComponent(issuer);
  
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Check if user can use MFA (email/social auth only)
 */
export async function canUserUseMFA(userId: string): Promise<boolean> {
  try {
    // Check if user exists and is active (instead of RPC call)
    const { data, error } = await databaseAdapter
      .from('profiles')
      .select('id, is_active')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking MFA eligibility:', error);
      return false;
    }
    
    // User can use MFA if they have an active profile
    return data?.is_active === true;
  } catch (error) {
    console.error('MFA eligibility check failed:', error);
    return false;
  }
}

/**
 * Enable MFA for a user
 */
export async function enableMFA(userId: string, totpSecret: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    const { error } = await databaseAdapter.supabase.rpc('enable_mfa', {
      user_id: userId,
      totp_secret: totpSecret
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the generated backup codes
    const { data: profile } = await databaseAdapter.supabase
      .from('profiles')
      .select('backup_codes')
      .eq('id', userId)
      .single();

    return { 
      success: true, 
      backupCodes: profile?.backup_codes || [] 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to enable MFA' 
    };
  }
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await databaseAdapter.supabase.rpc('disable_mfa', { user_id: userId });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to disable MFA' 
    };
  }
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await databaseAdapter.supabase.rpc('verify_backup_code', {
      user_id: userId,
      code: code
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: data === true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify backup code' 
    };
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    const { data, error } = await databaseAdapter.supabase.rpc('regenerate_backup_codes', { user_id: userId });

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      backupCodes: data || [] 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to regenerate backup codes' 
    };
  }
}

/**
 * Get user's MFA status
 */
export async function getMFAStatus(userId: string): Promise<{
  mfaEnabled: boolean;
  canUseMFA: boolean;
  backupCodesCount: number;
  mfaSetupCompletedAt?: string;
}> {
  try {
    const [canUseMFA, { data: profile }] = await Promise.all([
      canUserUseMFA(userId),
      databaseAdapter.supabase
        .from('profiles')
        .select('mfa_enabled, backup_codes, mfa_setup_completed_at')
        .eq('id', userId)
        .single()
    ]);

    return {
      mfaEnabled: profile?.mfa_enabled || false,
      canUseMFA,
      backupCodesCount: profile?.backup_codes?.length || 0,
      mfaSetupCompletedAt: profile?.mfa_setup_completed_at
    };
  } catch (error) {
    console.error('Failed to get MFA status:', error);
    return {
      mfaEnabled: false,
      canUseMFA: false,
      backupCodesCount: 0
    };
  }
}

/**
 * Verify TOTP code for login
 */
export async function verifyTOTPForLogin(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's TOTP secret
    const { data: profile, error: profileError } = await databaseAdapter.supabase
      .from('profiles')
      .select('totp_secret')
      .eq('id', userId)
      .eq('mfa_enabled', true)
      .single();

    if (profileError || !profile?.totp_secret) {
      return { success: false, error: 'MFA not enabled or user not found' };
    }

    // Verify the TOTP code
    const isValid = await verifyTOTPCode(profile.totp_secret, code);
    
    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify TOTP code' 
    };
  }
}