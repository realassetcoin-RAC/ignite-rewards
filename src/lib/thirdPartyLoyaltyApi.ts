import { supabase } from "@/integrations/supabase/client";

export interface LoyaltyProvider {
  id: string;
  name: string;
  display_name: string;
  api_endpoint: string;
  api_key_encrypted?: string;
  conversion_rate: number;
  min_conversion_amount: number;
  max_conversion_amount: number;
}

export interface PointBalance {
  points: number;
  currency?: string;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ConversionResult {
  success: boolean;
  transactionId?: string;
  convertedPoints?: number;
  receivedTokens?: number;
  error?: string;
}

export interface LoyaltyAccountInfo {
  accountId: string;
  mobileNumber: string;
  pointsBalance: number;
  status: string;
  memberSince?: string;
  tier?: string;
}

/**
 * Base class for third-party loyalty API integrations
 */
abstract class LoyaltyProviderAPI {
  protected provider: LoyaltyProvider;
  protected apiKey: string;

  constructor(provider: LoyaltyProvider, apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  abstract getPointBalance(mobileNumber: string): Promise<PointBalance>;
  abstract convertPoints(mobileNumber: string, points: number): Promise<ConversionResult>;
  abstract validateAccount(mobileNumber: string): Promise<boolean>;
}

/**
 * Starbucks Rewards API Integration
 */
class StarbucksAPI extends LoyaltyProviderAPI {
  async getPointBalance(mobileNumber: string): Promise<PointBalance> {
    try {
      // Simulate API call to Starbucks
      const response = await this.makeAPICall('/balance', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber })
      });

      return {
        points: response.stars || 0,
        currency: 'stars',
        lastUpdated: new Date().toISOString(),
        status: response.status || 'active'
      };
    } catch (error) {
      console.error('Starbucks API error:', error);
      throw new Error('Failed to fetch Starbucks balance');
    }
  }

  async convertPoints(mobileNumber: string, points: number): Promise<ConversionResult> {
    try {
      const response = await this.makeAPICall('/convert', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber, points })
      });

      return {
        success: true,
        transactionId: response.transactionId,
        convertedPoints: points,
        receivedTokens: Math.floor(points * this.provider.conversion_rate)
      };
    } catch (error) {
      console.error('Starbucks conversion error:', error);
      return {
        success: false,
        error: 'Failed to convert Starbucks points'
      };
    }
  }

  async validateAccount(mobileNumber: string): Promise<boolean> {
    try {
      const response = await this.makeAPICall('/validate', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber })
      });
      return response.valid === true;
    } catch (error) {
      console.error('Starbucks validation error:', error);
      return false;
    }
  }

  private async makeAPICall(endpoint: string, options: RequestInit): Promise<any> {
    // In a real implementation, this would make actual API calls
    // For now, we'll simulate responses
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate different responses based on endpoint
        if (endpoint === '/balance') {
          resolve({
            stars: Math.floor(Math.random() * 1000) + 100,
            status: 'active'
          });
        } else if (endpoint === '/convert') {
          resolve({
            transactionId: `SB_${Date.now()}`,
            success: true
          });
        } else if (endpoint === '/validate') {
          resolve({
            valid: true,
            accountId: `SB_${mobileNumber.replace(/\D/g, '')}`
          });
        }
      }, 1000);
    });
  }
}

/**
 * McDonald's API Integration
 */
class McDonaldsAPI extends LoyaltyProviderAPI {
  async getPointBalance(mobileNumber: string): Promise<PointBalance> {
    try {
      const response = await this.makeAPICall('/points', {
        method: 'GET',
        headers: { 'X-Mobile': mobileNumber }
      });

      return {
        points: response.points || 0,
        currency: 'points',
        lastUpdated: new Date().toISOString(),
        status: response.status || 'active'
      };
    } catch (error) {
      console.error('McDonald\'s API error:', error);
      throw new Error('Failed to fetch McDonald\'s balance');
    }
  }

  async convertPoints(mobileNumber: string, points: number): Promise<ConversionResult> {
    try {
      const response = await this.makeAPICall('/redeem', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber, points })
      });

      return {
        success: true,
        transactionId: response.transactionId,
        convertedPoints: points,
        receivedTokens: Math.floor(points * this.provider.conversion_rate)
      };
    } catch (error) {
      console.error('McDonald\'s conversion error:', error);
      return {
        success: false,
        error: 'Failed to convert McDonald\'s points'
      };
    }
  }

  async validateAccount(mobileNumber: string): Promise<boolean> {
    try {
      const response = await this.makeAPICall('/account/validate', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber })
      });
      return response.valid === true;
    } catch (error) {
      console.error('McDonald\'s validation error:', error);
      return false;
    }
  }

  private async makeAPICall(endpoint: string, options: RequestInit): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/points') {
          resolve({
            points: Math.floor(Math.random() * 500) + 50,
            status: 'active'
          });
        } else if (endpoint === '/redeem') {
          resolve({
            transactionId: `MCD_${Date.now()}`,
            success: true
          });
        } else if (endpoint === '/account/validate') {
          resolve({
            valid: true,
            accountId: `MCD_${mobileNumber.replace(/\D/g, '')}`
          });
        }
      }, 1200);
    });
  }
}

/**
 * Generic API Integration for other providers
 */
class GenericLoyaltyAPI extends LoyaltyProviderAPI {
  async getPointBalance(mobileNumber: string): Promise<PointBalance> {
    try {
      const response = await this.makeAPICall('/api/balance', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber })
      });

      return {
        points: response.balance || 0,
        currency: response.currency || 'points',
        lastUpdated: new Date().toISOString(),
        status: response.status || 'active'
      };
    } catch (error) {
      console.error('Generic API error:', error);
      throw new Error('Failed to fetch point balance');
    }
  }

  async convertPoints(mobileNumber: string, points: number): Promise<ConversionResult> {
    try {
      const response = await this.makeAPICall('/api/convert', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber, points })
      });

      return {
        success: true,
        transactionId: response.transactionId,
        convertedPoints: points,
        receivedTokens: Math.floor(points * this.provider.conversion_rate)
      };
    } catch (error) {
      console.error('Generic conversion error:', error);
      return {
        success: false,
        error: 'Failed to convert points'
      };
    }
  }

  async validateAccount(mobileNumber: string): Promise<boolean> {
    try {
      const response = await this.makeAPICall('/api/validate', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber })
      });
      return response.valid === true;
    } catch (error) {
      console.error('Generic validation error:', error);
      return false;
    }
  }

  private async makeAPICall(endpoint: string, options: RequestInit): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/api/balance') {
          resolve({
            balance: Math.floor(Math.random() * 2000) + 200,
            currency: 'points',
            status: 'active'
          });
        } else if (endpoint === '/api/convert') {
          resolve({
            transactionId: `GEN_${Date.now()}`,
            success: true
          });
        } else if (endpoint === '/api/validate') {
          resolve({
            valid: true,
            accountId: `GEN_${mobileNumber.replace(/\D/g, '')}`
          });
        }
      }, 1500);
    });
  }
}

/**
 * Factory function to create appropriate API instance
 */
export function createLoyaltyAPI(provider: LoyaltyProvider, apiKey: string): LoyaltyProviderAPI {
  switch (provider.name.toLowerCase()) {
    case 'starbucks':
      return new StarbucksAPI(provider, apiKey);
    case 'mcdonalds':
      return new McDonaldsAPI(provider, apiKey);
    default:
      return new GenericLoyaltyAPI(provider, apiKey);
  }
}

/**
 * Get loyalty provider configuration from database
 */
export async function getLoyaltyProvider(networkId: string): Promise<{
  success: boolean;
  provider?: LoyaltyProvider;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('loyalty_networks')
      .select('*')
      .eq('id', networkId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Loyalty network not found' };
    }

    const provider: LoyaltyProvider = {
      id: data.id,
      name: data.name,
      display_name: data.display_name,
      api_endpoint: data.api_endpoint || '',
      api_key_encrypted: data.api_key_encrypted,
      conversion_rate: data.conversion_rate,
      min_conversion_amount: data.min_conversion_amount,
      max_conversion_amount: data.max_conversion_amount
    };

    return { success: true, provider };
  } catch (error) {
    console.error('Error getting loyalty provider:', error);
    return { success: false, error: 'Failed to get loyalty provider' };
  }
}

/**
 * Check point balance for a user's loyalty account
 */
export async function checkPointBalance(
  userId: string,
  networkId: string,
  mobileNumber: string
): Promise<{
  success: boolean;
  balance?: PointBalance;
  error?: string;
}> {
  try {
    // Get provider configuration
    const providerResult = await getLoyaltyProvider(networkId);
    if (!providerResult.success || !providerResult.provider) {
      return { success: false, error: providerResult.error };
    }

    // Create API instance (in real implementation, decrypt API key)
    const apiKey = providerResult.provider.api_key_encrypted || 'demo-key';
    const api = createLoyaltyAPI(providerResult.provider, apiKey);

    // Get point balance
    const balance = await api.getPointBalance(mobileNumber);

    // Store balance snapshot
    await supabase
      .from('loyalty_point_balances')
      .insert({
        user_loyalty_link_id: userId, // This should be the link ID, not user ID
        points_balance: balance.points,
        last_checked: balance.lastUpdated
      });

    return { success: true, balance };
  } catch (error) {
    console.error('Error checking point balance:', error);
    return { success: false, error: 'Failed to check point balance' };
  }
}

/**
 * Convert points to platform tokens
 */
export async function convertPointsToTokens(
  userId: string,
  networkId: string,
  mobileNumber: string,
  points: number
): Promise<{
  success: boolean;
  result?: ConversionResult;
  error?: string;
}> {
  try {
    // Get provider configuration
    const providerResult = await getLoyaltyProvider(networkId);
    if (!providerResult.success || !providerResult.provider) {
      return { success: false, error: providerResult.error };
    }

    const provider = providerResult.provider;

    // Validate conversion amount
    if (points < provider.min_conversion_amount) {
      return { 
        success: false, 
        error: `Minimum conversion amount is ${provider.min_conversion_amount} points` 
      };
    }

    if (points > provider.max_conversion_amount) {
      return { 
        success: false, 
        error: `Maximum conversion amount is ${provider.max_conversion_amount} points` 
      };
    }

    // Create API instance
    const apiKey = provider.api_key_encrypted || 'demo-key';
    const api = createLoyaltyAPI(provider, apiKey);

    // Convert points
    const result = await api.convertPoints(mobileNumber, points);

    if (result.success) {
      // Record conversion transaction
      const { error: insertError } = await supabase
        .from('loyalty_point_conversions')
        .insert({
          user_id: userId,
          loyalty_network_id: networkId,
          user_loyalty_link_id: userId, // This should be the link ID
          third_party_points: points,
          converted_tokens: result.receivedTokens || 0,
          conversion_rate: provider.conversion_rate,
          transaction_id: result.transactionId,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error recording conversion:', insertError);
        // Don't fail the conversion, just log the error
      }
    }

    return { success: result.success, result, error: result.error };
  } catch (error) {
    console.error('Error converting points:', error);
    return { success: false, error: 'Failed to convert points' };
  }
}

/**
 * Validate loyalty account
 */
export async function validateLoyaltyAccount(
  networkId: string,
  mobileNumber: string
): Promise<{
  success: boolean;
  valid?: boolean;
  accountInfo?: LoyaltyAccountInfo;
  error?: string;
}> {
  try {
    const providerResult = await getLoyaltyProvider(networkId);
    if (!providerResult.success || !providerResult.provider) {
      return { success: false, error: providerResult.error };
    }

    const apiKey = providerResult.provider.api_key_encrypted || 'demo-key';
    const api = createLoyaltyAPI(providerResult.provider, apiKey);

    const isValid = await api.validateAccount(mobileNumber);

    return { 
      success: true, 
      valid: isValid,
      accountInfo: isValid ? {
        accountId: `${providerResult.provider.name}_${mobileNumber.replace(/\D/g, '')}`,
        mobileNumber,
        pointsBalance: 0, // Will be fetched separately
        status: 'active'
      } : undefined
    };
  } catch (error) {
    console.error('Error validating loyalty account:', error);
    return { success: false, error: 'Failed to validate account' };
  }
}
