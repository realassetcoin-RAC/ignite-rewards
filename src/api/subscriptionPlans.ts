// API endpoint for subscription plans using local PostgreSQL
// Following .cursorrules: Local PostgreSQL for data operations

// import { environment } from '@/config/environment';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  monthly_points: number;
  monthly_transactions: number;
  popular: boolean;
  is_active: boolean;
  features: Record<string, unknown>;
  plan_number: number;
  trial_days?: number;
  valid_from?: string;
  valid_until?: string;
  billing_period?: string;
  created_at: string;
  updated_at: string;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    // ✅ FIX: Fetch from local PostgreSQL database via API endpoint
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/subscription-plans`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch subscription plans');
    }

    if (!result.data || result.data.length === 0) {
      console.warn('No subscription plans found in database');
      return [];
    }

    // Transform API data to match interface
    const plans: SubscriptionPlan[] = result.data.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price_monthly: Number(plan.price_monthly),
      price_yearly: Number(plan.price_yearly),
      monthly_points: Number(plan.monthly_points || 0),
      monthly_transactions: Number(plan.monthly_transactions || 0),
      popular: Boolean(plan.popular),
      is_active: Boolean(plan.is_active),
      features: plan.features || {},
      plan_number: Number(plan.plan_number || 0),
      trial_days: Number(plan.trial_days || 14),
      valid_from: plan.valid_from,
      valid_until: plan.valid_until,
      billing_period: plan.billing_period,
      created_at: plan.created_at,
      updated_at: plan.updated_at
    }));

    console.log('✅ Fetched subscription plans from local database via API:', plans.length, 'plans');
    return plans;
    
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error('Failed to fetch subscription plans');
  }
}
