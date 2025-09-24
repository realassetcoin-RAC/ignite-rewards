export interface SubscriptionPlan {
  id: string;
  name: string;
  planNumber: number;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPoints: number;
  monthlyTransactions: number;
  features: string[];
  popular?: boolean;
  description?: string;
}

export interface SubscriptionPlanComparison {
  plan: SubscriptionPlan;
  savings: number; // Yearly savings compared to monthly
  savingsPercentage: number;
}

export interface MerchantSubscription {
  id: string;
  merchantId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  nextBillingDate: string;
}

export interface SubscriptionUsage {
  planId: string;
  currentMonth: {
    pointsUsed: number;
    transactionsUsed: number;
    pointsRemaining: number;
    transactionsRemaining: number;
  };
  resetDate: string;
}


