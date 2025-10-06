import { z } from 'zod';
import { useState, useEffect } from 'react';

// Standardized validation schemas
export const emailSchema = z.string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .max(255, 'Email is too long')
  .refine(email => {
    // Check for disposable email domains
    const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !disposableDomains.includes(domain);
  }, 'Please use a permanent email address');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
  .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, 'Password must contain at least one special character');

export const phoneSchema = z.string()
  .min(1, 'Phone number is required')
  .max(20, 'Phone number is too long')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (e.g., +1234567890)')
  .optional();

export const urlSchema = z.string()
  .url('Invalid URL format')
  .refine(url => url.startsWith('https://'), 'URL must use HTTPS for security')
  .optional()
  .or(z.literal(''));

export const imageUrlSchema = z.string()
  .url('Invalid image URL format')
  .refine(url => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return validExtensions.some(ext => url.toLowerCase().includes(ext));
  }, 'Image URL must be a valid image format (jpg, png, gif, webp, svg)')
  .optional()
  .or(z.literal(''));

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods');

export const businessNameSchema = z.string()
  .min(1, 'Business name is required')
  .max(100, 'Business name is too long')
  .regex(/^[a-zA-Z0-9\s\-'.&,()]+$/, 'Business name contains invalid characters');

// Predefined industry list
export const INDUSTRY_OPTIONS = [
  'Retail & E-commerce',
  'Food & Beverage',
  'Healthcare & Medical',
  'Technology & Software',
  'Financial Services',
  'Real Estate',
  'Education & Training',
  'Manufacturing',
  'Transportation & Logistics',
  'Entertainment & Media',
  'Professional Services',
  'Construction & Engineering',
  'Automotive',
  'Beauty & Personal Care',
  'Travel & Tourism',
  'Sports & Fitness',
  'Agriculture & Farming',
  'Energy & Utilities',
  'Government & Public Sector',
  'Non-profit & Charity',
  'Legal Services',
  'Consulting',
  'Marketing & Advertising',
  'Other'
] as const;

export const industrySchema = z.enum(INDUSTRY_OPTIONS, {
  errorMap: () => ({ message: 'Please select a valid industry' })
}).optional();

export const citySchema = z.string()
  .min(1, 'City is required')
  .max(50, 'City name is too long')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'City name can only contain letters, spaces, hyphens, apostrophes, and periods')
  .optional();

// City validation with API Ninjas
export const validateCityWithAPI = async (cityName: string, countryCode?: string): Promise<{ isValid: boolean; error?: string; data?: Record<string, unknown> }> => {
  try {
    if (!cityName || cityName.trim().length < 2) {
      return { isValid: false, error: 'City name must be at least 2 characters' };
    }

    const apiKey = import.meta.env.VITE_API_NINJAS_KEY;
    const url = new URL('https://api.api-ninjas.com/v1/city');
    url.searchParams.append('name', cityName.trim());
    if (countryCode) {
      url.searchParams.append('country', countryCode);
    }
    url.searchParams.append('limit', '5');

    if (!apiKey) {
      return { isValid: false, error: 'API Ninjas key not configured' };
    }

    const response = await fetch(url.toString(), {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { isValid: false, error: 'API key not configured. Please contact support.' };
      }
      return { isValid: false, error: 'Unable to validate city. Please try again.' };
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return { isValid: false, error: 'City not found. Please check the spelling.' };
    }

    // Check if the city name matches closely
    const exactMatch = data.find((city: Record<string, unknown>) => 
      city.name.toLowerCase() === cityName.toLowerCase()
    );
    
    if (exactMatch) {
      return { 
        isValid: true, 
        data: {
          name: exactMatch.name,
          country: exactMatch.country,
          population: exactMatch.population,
          latitude: exactMatch.latitude,
          longitude: exactMatch.longitude
        }
      };
    }

    // If no exact match, suggest the closest match
    const closestMatch = data[0];
    return { 
      isValid: false, 
      error: `Did you mean "${closestMatch.name}, ${closestMatch.country}"?`,
      data: closestMatch
    };

  } catch {
    // Console statement removed
    return { isValid: false, error: 'Unable to validate city. Please try again.' };
  }
};

export const referralCodeSchema = z.string()
  .min(1, 'Referral code is required')
  .max(20, 'Referral code is too long')
  .regex(/^[A-Z0-9]+$/, 'Referral code can only contain uppercase letters and numbers')
  .optional();

export const uuidSchema = z.string().uuid('Invalid UUID format');

// Numeric validation schemas
export const positiveNumberSchema = z.number()
  .min(0, 'Value cannot be negative')
  .max(999999.99, 'Value is too large');

export const percentageSchema = z.number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100%');

export const decimalSchema = z.number()
  .min(0, 'Value cannot be negative')
  .max(999999.99, 'Value is too large')
  .multipleOf(0.01, 'Value must have at most 2 decimal places');

// Form-specific schemas
export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  referralCode: referralCodeSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the Terms of Use'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the Privacy Policy')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const customerSignupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  city: citySchema,
  referralCode: referralCodeSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the Terms of Service'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the Privacy Policy')
});

export const merchantSignupSchema = z.object({
  businessName: businessNameSchema,
  contactName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  website: urlSchema,
  industry: industrySchema,
  city: citySchema,
  country: z.string().min(2, 'Country code is required').max(2, 'Country code must be 2 characters').optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the Terms of Service'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the Privacy Policy')
});

export const virtualCardSchema = z.object({
  card_name: z.string().min(1, 'Card name is required').max(100, 'Card name too long'),
  card_type: z.string().min(1, 'Card type is required'),
  description: z.string().max(500, 'Description too long').optional(),
  image_url: imageUrlSchema,
  evolution_image_url: imageUrlSchema,
  subscription_plan: z.enum(['basic', 'professional', 'enterprise']).optional(),
  pricing_type: z.enum(['free', 'one_time', 'monthly', 'annual']),
  one_time_fee: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(positiveNumberSchema).optional(),
  monthly_fee: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(positiveNumberSchema).optional(),
  annual_fee: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(positiveNumberSchema).optional(),
  features: z.string().optional(),
  is_active: z.boolean().optional(),
  // NFT-specific fields
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  rarity: z.enum(['Common', 'Less Common', 'Rare', 'Very Rare']),
  mint_quantity: z.number().int().min(1, 'Mint quantity must be at least 1').max(1000000, 'Mint quantity too large'),
  is_upgradeable: z.boolean(),
  is_evolvable: z.boolean(),
  is_fractional_eligible: z.boolean(),
  is_custodial: z.boolean(),
  auto_staking_duration: z.enum(['Forever', '1 Year', '2 Years', '5 Years']),
  earn_on_spend_ratio: decimalSchema,
  upgrade_bonus_ratio: decimalSchema,
  evolution_min_investment: positiveNumberSchema,
  evolution_earnings_ratio: decimalSchema
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Plan name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price_monthly: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(positiveNumberSchema),
  price_yearly: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(positiveNumberSchema),
  monthly_points: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(z.number().int().min(0, 'Monthly points cannot be negative')),
  monthly_transactions: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(z.number().int().min(0, 'Monthly transactions cannot be negative')),
  features: z.string().optional(),
  trial_days: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(num)) throw new Error('Invalid number format');
    return num;
  }).pipe(z.number().int().min(0, 'Trial days cannot be negative').max(365, 'Trial days cannot exceed 365')),
  is_active: z.boolean(),
  popular: z.boolean(),
  plan_number: z.number().int().min(1, 'Plan number must be at least 1').optional(),
  valid_from: z.string().nullable().optional().refine((val) => {
    if (!val || val === null || val.trim() === '') return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid datetime format'),
  valid_until: z.string().nullable().optional().refine((val) => {
    if (!val || val === null || val.trim() === '') return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid datetime format')
});

export const referralCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100, 'Campaign name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  user_to_user_points: z.number().int().min(0, 'Points cannot be negative'),
  user_to_merchant_points: z.number().int().min(0, 'Points cannot be negative'),
  start_date: z.string().datetime('Invalid start date format'),
  end_date: z.string().datetime('Invalid end date format'),
  is_active: z.boolean()
}).refine(data => new Date(data.start_date) < new Date(data.end_date), {
  message: "End date must be after start date",
  path: ["end_date"]
});

export const loyaltyProviderSchema = z.object({
  provider_name: z.string().min(1, 'Provider name is required').max(100, 'Provider name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  provider_logo_url: imageUrlSchema,
  conversion_rate: z.number().min(0.01, 'Conversion rate must be at least 0.01').max(100, 'Conversion rate cannot exceed 100'),
  minimum_conversion: z.number().int().min(1, 'Minimum conversion must be at least 1'),
  maximum_conversion: z.number().int().min(1, 'Maximum conversion must be at least 1'),
  is_active: z.boolean(),
  api_endpoint: urlSchema,
  requires_phone_verification: z.boolean(),
  supported_countries: z.array(z.string()).min(1, 'At least one country must be supported')
}).refine(data => data.minimum_conversion <= data.maximum_conversion, {
  message: "Minimum conversion must be less than or equal to maximum conversion",
  path: ["maximum_conversion"]
});

// DAO Organization Schema
export const daoOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Organization name too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  logo_url: urlSchema,
  website_url: urlSchema,
  discord_url: urlSchema,
  twitter_url: urlSchema,
  github_url: urlSchema,
  governance_token_address: z.string().max(100, 'Token address too long').optional(),
  governance_token_symbol: z.string().min(1, 'Token symbol is required').max(10, 'Token symbol too long'),
  governance_token_decimals: z.number().int().min(0, 'Decimals cannot be negative').max(18, 'Decimals cannot exceed 18'),
  min_proposal_threshold: z.number().int().min(0, 'Threshold cannot be negative'),
  voting_period_days: z.number().int().min(1, 'Voting period must be at least 1 day').max(365, 'Voting period cannot exceed 365 days'),
  execution_delay_hours: z.number().int().min(0, 'Execution delay cannot be negative').max(168, 'Execution delay cannot exceed 168 hours'),
  quorum_percentage: z.number().min(0, 'Quorum cannot be negative').max(100, 'Quorum cannot exceed 100%'),
  super_majority_threshold: z.number().min(0, 'Super majority threshold cannot be negative').max(100, 'Super majority threshold cannot exceed 100%'),
  treasury_address: z.string().max(100, 'Treasury address too long').optional()
});

// DAO Proposal Schema
export const daoProposalSchema = z.object({
  dao_id: uuidSchema,
  title: z.string().min(1, 'Proposal title is required').max(200, 'Proposal title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  full_description: z.string().max(5000, 'Full description too long').optional(),
  category: z.enum(['governance', 'treasury', 'technical', 'community', 'partnership', 'marketing', 'rewards', 'general']),
  voting_type: z.enum(['simple_majority', 'super_majority', 'unanimous', 'weighted', 'quadratic']),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  execution_time: z.string().datetime().optional(),
  treasury_impact_amount: z.number().min(0, 'Treasury impact cannot be negative').optional(),
  treasury_impact_currency: z.string().max(10, 'Currency code too long').optional(),
  tags: z.array(z.string()).optional(),
  external_links: z.record(z.string()).optional(),
  attachments: z.record(z.string()).optional()
});

// Marketplace Listing Schema
export const marketplaceListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  short_description: z.string().max(500, 'Short description too long').optional(),
  image_url: imageUrlSchema,
  listing_type: z.enum(['asset', 'service', 'investment', 'nft']),
  campaign_type: z.enum(['open_ended', 'time_limited', 'goal_based']),
  total_funding_goal: z.number().min(0, 'Funding goal cannot be negative'),
  minimum_investment: z.number().min(0, 'Minimum investment cannot be negative'),
  maximum_investment: z.number().min(0, 'Maximum investment cannot be negative').optional(),
  expected_return_rate: z.number().min(0, 'Return rate cannot be negative').max(1000, 'Return rate too high').optional(),
  expected_return_period: z.number().int().min(1, 'Return period must be at least 1 day').max(3650, 'Return period cannot exceed 10 years').optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  asset_type: z.string().max(50, 'Asset type too long').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  is_featured: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  tags: z.array(z.string()).optional()
}).refine(data => !data.maximum_investment || data.minimum_investment <= data.maximum_investment, {
  message: "Minimum investment must be less than or equal to maximum investment",
  path: ["maximum_investment"]
});

// Validation utility functions
export const validateFormData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

export const validateField = (schema: z.ZodSchema, value: unknown): { isValid: boolean; error?: string } => {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || 'Invalid input' };
    }
    return { isValid: false, error: 'Invalid input' };
  }
};

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeNumber = (input: number): number => {
  return Math.max(0, Math.round(input * 100) / 100); // Ensure positive and round to 2 decimals
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Rate limiting utilities (for client-side)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Error message sanitization
export const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Remove potentially sensitive information from error messages
    return error.message.replace(/\b[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}\b/g, '[ID]');
  }
  return 'An unexpected error occurred';
};

// Real-time validation hook
export const useFieldValidation = (schema: z.ZodSchema, value: unknown, debounceMs: number = 300) => {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    if (!value || value === '') {
      setError(null);
      return;
    }
    
    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const result = validateField(schema, value);
      setError(result.error || null);
      setIsValidating(false);
    }, debounceMs);
    
    return () => {
      clearTimeout(timeoutId);
      setIsValidating(false);
    };
  }, [value, schema, debounceMs]);
  
  return { error, isValidating };
};

// Form validation hook
export const useFormValidation = <T>(schema: z.ZodSchema<T>, data: T) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    const result = validateFormData(schema, data);
    if (result.success) {
      setErrors({});
      setIsValid(true);
    } else {
      const errorMap: Record<string, string> = {};
      result.errors?.forEach(error => {
        const [field, message] = error.split(': ');
        if (field && message) {
          errorMap[field] = message;
        }
      });
      setErrors(errorMap);
      setIsValid(false);
    }
  }, [data, schema]);
  
  return { errors, isValid };
};
