import { SubscriptionPlan } from '@/types/subscription';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'startup',
    name: 'StartUp',
    planNumber: 1,
    monthlyPrice: 20,
    yearlyPrice: 150,
    monthlyPoints: 100,
    monthlyTransactions: 100,
    features: [
      '100 Points limit for distribution',
      '100 Transactions limit for distribution',
      '1 Email (Registered Signup Email) account can access',
      'Merchant Dashboard with Standard Analytics',
      'Email and Chat Support'
    ],
    description: 'Perfect for small businesses just getting started'
  },
  {
    id: 'momentum',
    name: 'Momentum Plan',
    planNumber: 2,
    monthlyPrice: 50,
    yearlyPrice: 500,
    monthlyPoints: 300,
    monthlyTransactions: 300,
    features: [
      '300 Points limit for distribution',
      '300 Transactions limit for distribution',
      '2 Email (Registered Signup Email + 1) account can access',
      'Merchant Dashboard with Standard Analytics',
      'Email and Chat Support'
    ],
    description: 'Ideal for growing businesses with moderate transaction volume'
  },
  {
    id: 'energizer',
    name: 'Energizer Plan',
    planNumber: 3,
    monthlyPrice: 100,
    yearlyPrice: 1000,
    monthlyPoints: 600,
    monthlyTransactions: 600,
    features: [
      '600 Points limit for distribution',
      '600 Transactions limit for distribution',
      '3 Email (Registered Signup Email + 2) account can access',
      'Merchant Dashboard with Advanced Analytics',
      'Email and Chat Support'
    ],
    description: 'For established businesses with high transaction volume',
    popular: true
  },
  {
    id: 'cloud9',
    name: 'Cloud9 Plan',
    planNumber: 4,
    monthlyPrice: 250,
    yearlyPrice: 2500,
    monthlyPoints: 1800,
    monthlyTransactions: 1800,
    features: [
      '1800 Points limit for distribution',
      '1800 Transactions limit for distribution',
      '5 Email (Registered Signup Email + 4) account can access',
      'Merchant Dashboard with Advanced Analytics',
      'Priority Email and Chat Support 24/7'
    ],
    description: 'For large businesses requiring enterprise-level features'
  },
  {
    id: 'super',
    name: 'Super Plan',
    planNumber: 5,
    monthlyPrice: 500,
    yearlyPrice: 5000,
    monthlyPoints: 4000,
    monthlyTransactions: 4000,
    features: [
      '4000 Points limit for distribution',
      '4000 Transactions limit for distribution',
      'Unlimited Email (Registered Signup Email) account can access',
      'Merchant Dashboard with Custom Analytics',
      'Dedicated Account Manager, Priority Email and Chat Support 24/7'
    ],
    description: 'For enterprise clients with maximum transaction volume'
  }
];

export const getPlanById = (id: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
};

export const getPlanByNumber = (planNumber: number): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.planNumber === planNumber);
};

export const calculateYearlySavings = (plan: SubscriptionPlan): { savings: number; percentage: number } => {
  const monthlyTotal = plan.monthlyPrice * 12;
  const savings = monthlyTotal - plan.yearlyPrice;
  const percentage = Math.round((savings / monthlyTotal) * 100);
  
  return { savings, percentage };
};

export const getRecommendedPlan = (monthlyTransactions: number): SubscriptionPlan => {
  // Find the plan that best fits the transaction volume
  const suitablePlans = SUBSCRIPTION_PLANS.filter(plan => plan.monthlyTransactions >= monthlyTransactions);
  
  if (suitablePlans.length === 0) {
    // If no plan fits, return the highest plan
    return SUBSCRIPTION_PLANS[SUBSCRIPTION_PLANS.length - 1]!;
  }
  
  // Return the plan with the closest transaction limit
  return suitablePlans.reduce((closest, current) => 
    current.monthlyTransactions < closest.monthlyTransactions ? current : closest
  );
};


