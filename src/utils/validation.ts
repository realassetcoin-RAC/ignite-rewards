import { z } from 'zod';

// Input validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const uuidSchema = z.string().uuid('Invalid UUID format');

export const virtualCardSchema = z.object({
  card_name: z.string().min(1, 'Card name is required').max(100, 'Card name too long'),
  card_type: z.string().min(1, 'Card type is required'),
  description: z.string().max(500, 'Description too long').optional(),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  subscription_plan: z.string().optional(),
  pricing_type: z.enum(['free', 'one_time', 'monthly', 'annual']),
  one_time_fee: z.number().min(0, 'Fee cannot be negative').optional(),
  monthly_fee: z.number().min(0, 'Fee cannot be negative').optional(),
  annual_fee: z.number().min(0, 'Fee cannot be negative').optional(),
  features: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const merchantSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100, 'Business name too long'),
  business_type: z.string().optional(),
  contact_email: emailSchema.optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  city: z.string().max(50, 'City name too long').optional(),
  country: z.string().max(50, 'Country name too long').optional(),
  subscription_plan: z.string().optional(),
  status: z.enum(['pending', 'active', 'suspended', 'inactive']).optional(),
  monthly_fee: z.number().min(0, 'Fee cannot be negative').optional(),
  annual_fee: z.number().min(0, 'Fee cannot be negative').optional(),
});

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeNumber = (input: number): number => {
  return Math.max(0, Math.round(input * 100) / 100); // Ensure positive and round to 2 decimals
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