
export interface LoyaltyNetwork {
  id: string;
  network_name: string;
  display_name: string;
  description?: string;
  logo_url?: string;
  conversion_rate: number;
  minimum_conversion: number;
  maximum_conversion: number;
  is_active: boolean;
  requires_mobile_verification: boolean;
  supported_countries: string[];
  api_endpoint?: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyLink {
  id: string;
  user_id: string;
  network_id: string;
  mobile_number: string;
  is_verified: boolean;
  linked_at: string;
  last_conversion?: string;
  total_converted: number;
}

export interface OTPVerificationResult {
  success: boolean;
  error?: string;
  linkId?: string;
}

export interface LoyaltyApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Mock data for loyalty networks (replace with actual database calls)
const mockLoyaltyNetworks: LoyaltyNetwork[] = [
  {
    id: "starbucks",
    network_name: "starbucks_rewards",
    display_name: "Starbucks Rewards",
    description: "Convert your Starbucks Stars to PointBridge tokens",
    logo_url: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=100",
    conversion_rate: 0.05,
    minimum_conversion: 25,
    maximum_conversion: 2000,
    is_active: true,
    requires_mobile_verification: true,
    supported_countries: ["US", "CA", "UK"],
    api_endpoint: "https://api.starbucks.com/loyalty",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "marriott",
    network_name: "marriott_bonvoy",
    display_name: "Marriott Bonvoy",
    description: "Convert your Marriott Bonvoy points to PointBridge tokens",
    logo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100",
    conversion_rate: 0.008,
    minimum_conversion: 1000,
    maximum_conversion: 100000,
    is_active: true,
    requires_mobile_verification: true,
    supported_countries: ["US", "CA", "UK", "AU", "DE", "FR"],
    api_endpoint: "https://api.marriott.com/loyalty",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "american_airlines",
    network_name: "aadvantage",
    display_name: "American Airlines AAdvantage",
    description: "Convert your AAdvantage miles to PointBridge tokens",
    logo_url: "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=100",
    conversion_rate: 0.015,
    minimum_conversion: 500,
    maximum_conversion: 50000,
    is_active: true,
    requires_mobile_verification: true,
    supported_countries: ["US", "CA", "MX"],
    api_endpoint: "https://api.aa.com/loyalty",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "hilton",
    network_name: "hilton_honors",
    display_name: "Hilton Honors",
    description: "Convert your Hilton Honors points to PointBridge tokens",
    logo_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=100",
    conversion_rate: 0.006,
    minimum_conversion: 1000,
    maximum_conversion: 150000,
    is_active: true,
    requires_mobile_verification: true,
    supported_countries: ["US", "CA", "UK", "AU", "JP", "DE", "FR"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "delta",
    network_name: "delta_skymiles",
    display_name: "Delta SkyMiles",
    description: "Convert your Delta SkyMiles to PointBridge tokens",
    logo_url: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100",
    conversion_rate: 0.012,
    minimum_conversion: 500,
    maximum_conversion: 75000,
    is_active: true,
    requires_mobile_verification: true,
    supported_countries: ["US", "CA", "UK", "MX"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock storage for user links and OTP codes (in production, use database)
const mockUserLinks: { [userId: string]: LoyaltyLink[] } = {};
const mockOTPCodes: { [key: string]: { code: string; expires: number; attempts: number } } = {};

/**
 * Get available loyalty networks for users to link
 */
export const getAvailableLoyaltyNetworks = async (): Promise<LoyaltyApiResponse<LoyaltyNetwork[]>> => {
  try {
    // TODO: Replace with actual database call
    // const { data, error } = await supabase
    //   .from('loyalty_networks')
    //   .select('*')
    //   .eq('is_active', true)
    //   .order('display_name');

    // For now, return mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: mockLoyaltyNetworks.filter(network => network.is_active)
    };
  } catch (error) {
    console.error('Error loading loyalty networks:', error);
    return {
      success: false,
      error: 'Failed to load loyalty networks'
    };
  }
};

/**
 * Get user's linked loyalty accounts
 */
export const getUserLoyaltyLinks = async (): Promise<LoyaltyApiResponse<any[]>> => {
  try {
    // TODO: Replace with actual database call
    // const { data, error } = await supabase
    //   .from('user_loyalty_links')
    //   .select(`
    //     *,
    //     loyalty_networks (*)
    //   `)
    //   .eq('user_id', userId)
    //   .eq('is_verified', true);

    // For now, return mock data
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const userLinks = mockUserLinks[userId] || [];
    const linkedWithNetworks = userLinks.map(link => ({
      ...link,
      loyalty_networks: mockLoyaltyNetworks.find(network => network.id === link.network_id)
    }));
    
    return {
      success: true,
      data: linkedWithNetworks
    };
  } catch (error) {
    console.error('Error loading user loyalty links:', error);
    return {
      success: false,
      error: 'Failed to load linked accounts'
    };
  }
};

/**
 * Check if user already has a link for a specific network
 */
export const checkExistingLoyaltyLink = async (
  userId: string,
  networkId: string
): Promise<LoyaltyApiResponse<boolean>> => {
  try {
    // TODO: Replace with actual database call
    // const { data, error } = await supabase
    //   .from('user_loyalty_links')
    //   .select('id')
    //   .eq('user_id', userId)
    //   .eq('network_id', networkId)
    //   .single();

    // For now, check mock data
    const userLinks = mockUserLinks[userId] || [];
    const exists = userLinks.some(link => link.network_id === networkId);
    
    return {
      success: true,
      data: exists,
      exists
    };
  } catch (error) {
    console.error('Error checking existing loyalty link:', error);
    return {
      success: false,
      error: 'Failed to check existing link'
    };
  }
};

/**
 * Generate OTP for mobile verification
 */
export const generateLoyaltyOTP = async (
  userId: string, 
  networkId: string, 
  mobileNumber: string
): Promise<LoyaltyApiResponse> => {
  try {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + (10 * 60 * 1000); // 10 minutes
    const otpKey = `${userId}-${networkId}-${mobileNumber}`;
    
    // Store OTP (in production, use database and send SMS)
    mockOTPCodes[otpKey] = {
      code: otpCode,
      expires,
      attempts: 0
    };
    
    // TODO: Send actual SMS using Twilio or similar service
    console.log(`🔐 Generated OTP for ${mobileNumber}: ${otpCode} (expires in 10 minutes)`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'OTP sent successfully'
    };
  } catch (error) {
    console.error('Error generating OTP:', error);
    return {
      success: false,
      error: 'Failed to generate OTP'
    };
  }
};

/**
 * Verify OTP and create loyalty link
 */
export const verifyLoyaltyOTP = async (
  userId: string,
  networkId: string, 
  mobileNumber: string,
  otpCode: string
): Promise<OTPVerificationResult> => {
  try {
    const otpKey = `${userId}-${networkId}-${mobileNumber}`;
    const storedOTP = mockOTPCodes[otpKey];
    
    if (!storedOTP) {
      return {
        success: false,
        error: 'OTP not found or expired'
      };
    }
    
    // Check if OTP is expired
    if (Date.now() > storedOTP.expires) {
      delete mockOTPCodes[otpKey];
      return {
        success: false,
        error: 'OTP has expired'
      };
    }
    
    // Check attempts limit
    if (storedOTP.attempts >= 3) {
      delete mockOTPCodes[otpKey];
      return {
        success: false,
        error: 'Too many failed attempts'
      };
    }
    
    // Verify OTP code
    if (storedOTP.code !== otpCode) {
      storedOTP.attempts++;
      return {
        success: false,
        error: `Invalid OTP code. ${3 - storedOTP.attempts} attempts remaining.`
      };
    }
    
    // OTP verified, create loyalty link
    const linkId = `${userId}-${networkId}-${Date.now()}`;
    const newLink: LoyaltyLink = {
      id: linkId,
      user_id: userId,
      network_id: networkId,
      mobile_number: mobileNumber,
      is_verified: true,
      linked_at: new Date().toISOString(),
      total_converted: 0
    };
    
    // Store link (in production, use database)
    if (!mockUserLinks[userId]) {
      mockUserLinks[userId] = [];
    }
    mockUserLinks[userId].push(newLink);
    
    // Clean up OTP
    delete mockOTPCodes[otpKey];
    
    // TODO: Replace with actual database call
    // const { data, error } = await supabase
    //   .from('user_loyalty_links')
    //   .insert([{
    //     user_id: userId,
    //     network_id: networkId,
    //     mobile_number: mobileNumber,
    //     is_verified: true,
    //     linked_at: new Date().toISOString()
    //   }]);
    
    return {
      success: true,
      linkId
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: 'Failed to verify OTP'
    };
  }
};

/**
 * Convert points from linked loyalty account
 */
export const convertLoyaltyPoints = async (
  userId: string,
  linkId: string,
  pointsToConvert: number
): Promise<LoyaltyApiResponse> => {
  try {
    // TODO: Implement actual point conversion logic
    // This would involve:
    // 1. Calling external API to verify and deduct points
    // 2. Converting to PointBridge tokens based on conversion rate
    // 3. Adding tokens to user's balance
    // 4. Recording the transaction
    
    console.log(`Converting ${pointsToConvert} points for user ${userId} from link ${linkId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      message: 'Points converted successfully'
    };
  } catch (error) {
    console.error('Error converting loyalty points:', error);
    return {
      success: false,
      error: 'Failed to convert points'
    };
  }
};

/**
 * Get conversion history for a user
 */
export const getLoyaltyConversionHistory = async (): Promise<LoyaltyApiResponse<any[]>> => {
  try {
    // TODO: Replace with actual database call
    // const { data, error } = await supabase
    //   .from('loyalty_conversions')
    //   .select(`
    //     *,
    //     loyalty_networks (display_name, logo_url)
    //   `)
    //   .eq('user_id', userId)
    //   .order('converted_at', { ascending: false });
    
    // For now, return empty array
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error loading conversion history:', error);
    return {
      success: false,
      error: 'Failed to load conversion history'
    };
  }
};
