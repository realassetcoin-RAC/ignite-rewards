import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Star, Zap, Cloud, Rocket } from 'lucide-react';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { getSubscriptionPlans } from '@/api/subscriptionPlans';
import { calculateYearlySavings } from '@/data/subscriptionPlans';
import { SubscriptionPlan } from '@/types/subscription';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { createModuleLogger } from '@/utils/consoleReplacer';

const SubscriptionPlansPage: React.FC = () => {
  const logger = createModuleLogger('SubscriptionPlansPage');
  const navigate = useNavigate();
  const { user, profile } = useSecureAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    // Here you would implement the plan selection logic
    logger.info('Selected plan', plan);
  };

  const handleBackNavigation = () => {
    // If user is logged in as a merchant, go back to merchant dashboard
    if (user && profile?.role?.toLowerCase() === 'merchant') {
      navigate('/merchant');
    } else {
      // Otherwise, go back to homepage
      navigate('/');
    }
  };

  // Load subscription plans from API
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const apiPlans = await getSubscriptionPlans();
        
        // Transform API plans to match the expected format
        const transformedPlans: SubscriptionPlan[] = apiPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          planNumber: plan.plan_number,
          monthlyPrice: plan.price_monthly,
          yearlyPrice: plan.price_yearly,
          monthlyPoints: plan.monthly_points,
          monthlyTransactions: plan.monthly_transactions,
          features: Array.isArray(plan.features) ? plan.features : Object.values(plan.features || {}),
          description: plan.description || '',
          popular: plan.popular
        }));
        
        setPlans(transformedPlans);
        logger.info('Loaded subscription plans from API:', transformedPlans.length);
      } catch (error) {
        logger.error('Failed to load subscription plans:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [logger]);

  const planIcons = {
    startup: <Zap className="h-8 w-8 text-blue-500" />,
    momentum: <Star className="h-8 w-8 text-purple-500" />,
    energizer: <Rocket className="h-8 w-8 text-orange-500" />,
    cloud9: <Cloud className="h-8 w-8 text-green-500" />,
    super: <Rocket className="h-8 w-8 text-red-500" />
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Top-right back button */}
          <div className="flex justify-end mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackNavigation}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Select the subscription plan that best fits your business needs. 
              All plans include our core features with different usage limits and premium benefits.
            </p>
          </div>
        </div>

        {/* Quick Comparison Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            variant={showComparison ? "default" : "outline"}
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? 'Hide' : 'Show'} Quick Comparison
          </Button>
        </div>

        {/* Quick Comparison Table */}
        {showComparison && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
              <CardDescription>Compare all plans at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Plan</th>
                      <th className="text-center p-3 font-semibold">Monthly Price</th>
                      <th className="text-center p-3 font-semibold">Yearly Price</th>
                      <th className="text-center p-3 font-semibold">Monthly Points</th>
                      <th className="text-center p-3 font-semibold">Monthly Transactions</th>
                      <th className="text-center p-3 font-semibold">Yearly Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => {
                      const { savings, percentage } = calculateYearlySavings(plan);
                      return (
                        <tr key={plan.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {planIcons[plan.id as keyof typeof planIcons]}
                              <div>
                                <div className="font-semibold">{plan.name}</div>
                                {plan.popular && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-3 font-semibold">
                            ${plan.monthlyPrice} /<span className="text-sm">mo</span>
                          </td>
                          <td className="text-center p-3 font-semibold">
                            ${plan.yearlyPrice} /<span className="text-sm">yr</span>
                          </td>
                          <td className="text-center p-3">{plan.monthlyPoints.toLocaleString()}</td>
                          <td className="text-center p-3">{plan.monthlyTransactions.toLocaleString()}</td>
                          <td className="text-center p-3">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ${savings} ({percentage}%)
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Plans Display */}
        <SubscriptionPlans 
          plans={plans}
          loading={loading}
          onSelectPlan={handleSelectPlan}
          currentPlanId={selectedPlan?.id || undefined}
          showYearly={true}
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />

        {/* Selected Plan Confirmation */}
        {selectedPlan && (
          <Card className="mt-8 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Plan Selected: {selectedPlan.name}
              </CardTitle>
              <CardDescription>
                You've selected the {selectedPlan.name} plan. Click below to proceed with your subscription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {billingCycle === 'yearly' 
                      ? (
                        <span>
                          ${selectedPlan.yearlyPrice} /<span className="text-lg">yr</span>
                        </span>
                      )
                      : (
                        <span>
                          ${selectedPlan.monthlyPrice} /<span className="text-lg">mo</span>
                        </span>
                      )
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedPlan.monthlyPoints} points • {selectedPlan.monthlyTransactions} transactions
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      (${Math.round(selectedPlan.yearlyPrice / 12)} /<span className="text-xs">mo</span> when billed yearly)
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                    Cancel
                  </Button>
                  <Button>
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change my plan anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and we'll prorate any billing differences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my limits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  If you exceed your monthly limits, we'll notify you and you can either upgrade your plan 
                  or purchase additional usage at a per-unit rate.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! All plans come with a 14-day free trial. No credit card required to start, 
                  and you can cancel anytime during the trial period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer custom enterprise plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! For businesses with unique needs, we offer custom enterprise plans 
                  with dedicated support, custom integrations, and flexible pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;


