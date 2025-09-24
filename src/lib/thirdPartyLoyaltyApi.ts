// import { supabase } from "@/integrations/supabase/client";

export interface PointBalance {
  points: number;
  currency?: string;
  last_updated: string;
  provider_name: string;
}

export interface ConversionResult {
  originalPoints: number;
  conversionRate: number;
  receivedTokens: number;
  transactionId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  balance?: PointBalance;
  result?: ConversionResult;
}

// Mock point balances for different loyalty programs
const mockBalances: Record<string, PointBalance> = {
  'starbucks': {
    points: 1250,
    currency: 'stars',
    last_updated: new Date().toISOString(),
    provider_name: 'Starbucks Rewards'
  },
  'marriott': {
    points: 45000,
    currency: 'points',
    last_updated: new Date().toISOString(),
    provider_name: 'Marriott Bonvoy'
  },
  'american_airlines': {
    points: 15600,
    currency: 'miles',
    last_updated: new Date().toISOString(),
    provider_name: 'American Airlines AAdvantage'
  },
  'hilton': {
    points: 78200,
    currency: 'points',
    last_updated: new Date().toISOString(),
    provider_name: 'Hilton Honors'
  },
  'delta': {
    points: 23400,
    currency: 'miles',
    last_updated: new Date().toISOString(),
    provider_name: 'Delta SkyMiles'
  }
};

/**
 * Check point balance for a linked loyalty account
 * In production, this would call the third-party API
 */
export const checkPointBalance = async (
  userId: string,
  networkId: string,
  mobileNumber: string
): Promise<ApiResponse<PointBalance>> => {
  try {
    console.log(`Checking balance for ${networkId} - ${mobileNumber}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get mock balance
    const balance = mockBalances[networkId];
    
    if (!balance) {
      return {
        success: false,
        error: `No balance data available for ${networkId}`
      };
    }
    
    // Add some randomness to simulate real data
    const randomVariation = Math.floor(Math.random() * 200) - 100; // ±100 points variation
    const adjustedBalance = {
      ...balance,
      points: Math.max(0, balance.points + randomVariation),
      last_updated: new Date().toISOString()
    };

      return {
        success: true,
      balance: adjustedBalance
      };
    } catch (error) {
    console.error('Error checking point balance:', error);
      return {
        success: false,
      error: 'Failed to check point balance'
    };
  }
};

/**
 * Convert loyalty points to platform tokens
 * In production, this would call third-party API to deduct points and credit tokens
 */
export const convertPointsToTokens = async (
  userId: string,
  networkId: string,
  mobileNumber: string,
  pointsToConvert: number
): Promise<ApiResponse<ConversionResult>> => {
  try {
    console.log(`Converting ${pointsToConvert} points from ${networkId} for user ${userId}`);
    
    // Get current balance
    const balanceResult = await checkPointBalance(userId, networkId, mobileNumber);
    if (!balanceResult.success || !balanceResult.balance) {
      return {
        success: false,
        error: 'Unable to verify point balance'
      };
    }
    
    const currentBalance = balanceResult.balance;
    if (currentBalance.points < pointsToConvert) {
      return {
        success: false,
        error: 'Insufficient point balance'
      };
    }
    
    // Get conversion rate (mock data - in production, get from database)
    const conversionRates: Record<string, number> = {
      'starbucks': 0.05,
      'marriott': 0.008,
      'american_airlines': 0.015,
      'hilton': 0.006,
      'delta': 0.012
    };
    
    const conversionRate = conversionRates[networkId] || 0.01;
    const receivedTokens = Math.floor(pointsToConvert * conversionRate);
    
    // Simulate API call delay for both deduction and token credit
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // TODO: In production:
    // 1. Call third-party API to deduct points
    // 2. Credit PointBridge tokens to user's account
    // 3. Record transaction in database
    
    // Update mock balance
    if (mockBalances[networkId]) {
      mockBalances[networkId].points -= pointsToConvert;
      mockBalances[networkId].last_updated = new Date().toISOString();
    }
    
    const conversionResult: ConversionResult = {
      originalPoints: pointsToConvert,
      conversionRate,
      receivedTokens,
      transactionId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // TODO: Record conversion in database
    // const { error } = await supabase
    //   .from('loyalty_point_conversions')
    //   .insert([{
    //     user_id: userId,
    //     network_id: networkId,
    //     mobile_number: mobileNumber,
    //     third_party_points: pointsToConvert,
    //     converted_tokens: receivedTokens,
    //     conversion_rate: conversionRate,
    //     transaction_id: conversionResult.transactionId,
    //     status: 'completed'
    //   }]);

      return {
        success: true,
      result: conversionResult
      };
    } catch (error) {
    console.error('Error converting points to tokens:', error);
      return {
        success: false,
        error: 'Failed to convert points'
      };
    }
};

/**
 * Get available conversion options for a user
 */
export const getConversionOptions = async (): Promise<ApiResponse<any[]>> => {
  try {
    // TODO: Get user's linked accounts and their current balances
    // For now, return mock conversion opportunities
    
    const opportunities = [
      {
        networkId: 'starbucks',
        networkName: 'Starbucks Rewards',
        availablePoints: 1250,
        minConversion: 25,
        maxConversion: 2000,
        conversionRate: 0.05,
        estimatedTokens: 62
      },
      {
        networkId: 'marriott',
        networkName: 'Marriott Bonvoy', 
        availablePoints: 45000,
        minConversion: 1000,
        maxConversion: 100000,
        conversionRate: 0.008,
        estimatedTokens: 360
      }
    ];
    
    return {
      success: true,
      data: opportunities
    };
  } catch (error) {
    console.error('Error getting conversion options:', error);
    return {
      success: false,
      error: 'Failed to get conversion options'
    };
  }
};

/**
 * Validate mobile number format for different countries
 */
export const validateMobileNumber = (phoneNumber: string, countryCode: string = 'US'): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  switch (countryCode.toLowerCase()) {
    case 'us':
    case 'ca':
      // US/Canada: 10 digits (with or without country code)
      return digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'));
    case 'uk':
      // UK: 10-11 digits
      return digitsOnly.length >= 10 && digitsOnly.length <= 11;
    case 'au':
      // Australia: 9 digits (mobile) + country code
      return digitsOnly.length === 9 || (digitsOnly.length === 11 && digitsOnly.startsWith('61'));
    default:
      // Generic: 7-15 digits
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }
};

/**
 * Format mobile number for display
 */
export const formatMobileNumber = (phoneNumber: string, countryCode: string = 'US'): string => {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  switch (countryCode.toLowerCase()) {
    case 'us':
    case 'ca':
      if (digitsOnly.length === 10) {
        return `+1 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
      }
      if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        const number = digitsOnly.slice(1);
        return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
      }
      break;
    case 'uk':
      if (digitsOnly.length === 11 && digitsOnly.startsWith('44')) {
        const number = digitsOnly.slice(2);
        return `+44 ${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
      }
      if (digitsOnly.length === 10) {
        return `+44 ${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
      }
      break;
  }
  
  // Fallback: just add country code
  return phoneNumber;
};
