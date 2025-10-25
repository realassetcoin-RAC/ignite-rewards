import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Cloud, Rocket } from 'lucide-react';
import { SUBSCRIPTION_PLANS, calculateYearlySavings } from '@/data/subscriptionPlans';
import { SubscriptionPlan } from '@/types/subscription';

interface SubscriptionPlansProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  currentPlanId?: string | undefined;
  showYearly?: boolean;
  className?: string;
  billingCycle?: 'monthly' | 'yearly';
  onBillingCycleChange?: (cycle: 'monthly' | 'yearly') => void;
}

const planIcons = {
  startup: <Zap className="h-6 w-6 text-blue-500" />,
  momentum: <Star className="h-6 w-6 text-purple-500" />,
  energizer: <Rocket className="h-6 w-6 text-orange-500" />,
  cloud9: <Cloud className="h-6 w-6 text-green-500" />,
  super: <Rocket className="h-6 w-6 text-red-500" />
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onSelectPlan,
  currentPlanId,
  showYearly = false,
  className = '',
  billingCycle: externalBillingCycle,
  onBillingCycleChange
}) => {
  const [internalBillingCycle, setInternalBillingCycle] = useState<'monthly' | 'yearly'>(showYearly ? 'yearly' : 'monthly');
  
  // Use external billing cycle if provided, otherwise use internal state
  const billingCycle = externalBillingCycle ?? internalBillingCycle;
  const setBillingCycle = onBillingCycleChange ?? setInternalBillingCycle;

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const period = billingCycle === 'yearly' ? 'yr' : 'mo';
    return (
      <span>
        ${price} /<span className="text-sm">{period}</span>
      </span>
    );
  };

  const getSavingsBadge = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      const { savings, percentage } = calculateYearlySavings(plan);
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Save ${savings} ({percentage}%)
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 bg-muted p-1 rounded-lg">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('monthly')}
            className="px-6"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('yearly')}
            className="px-6"
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isPopular = plan.popular;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-200 hover:shadow-lg ${
                isPopular 
                  ? 'ring-2 ring-primary shadow-lg scale-105' 
                  : 'hover:shadow-md'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  {planIcons[plan.id as keyof typeof planIcons]}
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold text-foreground">
                    {formatPrice(plan)}
                  </div>
                  {getSavingsBadge(plan)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Points:</span>
                    <span className="font-semibold">{plan.monthlyPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Transactions:</span>
                    <span className="font-semibold">{plan.monthlyTransactions.toLocaleString()}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-muted-foreground">
                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-muted-foreground">
                        +{plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-6"
                  variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                  onClick={() => onSelectPlan?.(plan)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include 24/7 customer support and 99.9% uptime guarantee.</p>
        <p>Cancel anytime. No setup fees. No hidden costs.</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;


