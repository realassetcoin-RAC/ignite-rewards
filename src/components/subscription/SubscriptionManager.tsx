import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, CreditCard, TrendingUp, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Clock, Star } from 'lucide-react';
import { SubscriptionPlans } from './SubscriptionPlans';
import { SUBSCRIPTION_PLANS, getPlanById } from '@/data/subscriptionPlans';
import { SubscriptionPlan, MerchantSubscription, SubscriptionUsage } from '@/types/subscription';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionManagerProps {
  merchantId: string;
  className?: string;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  merchantId,
  className = ''
}) => {
  const [currentSubscription, setCurrentSubscription] = useState<MerchantSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<SubscriptionPlan | null>(null);
  const [pendingPlanChange, setPendingPlanChange] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();

  // Load real subscription data from database
  useEffect(() => {
    loadSubscriptionData();
  }, [merchantId]);

  const loadSubscriptionData = async () => {
    try {
      // Load merchant data to get subscription info
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select(`
          id,
          subscription_plan,
          subscription_start_date,
          subscription_end_date,
          trial_end_date,
          status
        `)
        .eq('id', merchantId)
        .single();

      if (merchantError) {
        console.error('Error loading merchant subscription data:', merchantError);
        return;
      }

      if (merchantData) {
        // Map database data to subscription format
        const subscription: MerchantSubscription = {
          id: merchantData.id,
          merchantId: merchantId,
          planId: merchantData.subscription_plan || 'basic',
          status: merchantData.trial_end_date ? 'trial' : 'active',
          startDate: merchantData.subscription_start_date || new Date().toISOString(),
          endDate: merchantData.subscription_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          trialEndDate: merchantData.trial_end_date,
          autoRenew: true,
          paymentMethod: null, // TODO: Add payment method to database
          nextBillingDate: merchantData.trial_end_date || merchantData.subscription_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        setCurrentSubscription(subscription);

        // Load usage data (mock for now, but can be implemented with real data)
        const usage: SubscriptionUsage = {
          planId: subscription.planId,
          currentMonth: {
            pointsUsed: 0, // TODO: Calculate from actual transactions
            transactionsUsed: 0, // TODO: Calculate from actual transactions
            pointsRemaining: 0, // TODO: Calculate from plan limits
            transactionsRemaining: 0 // TODO: Calculate from plan limits
          },
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        setUsage(usage);
      }
      } catch {
      console.error('Error loading subscription data:', error);
    }
  };

  const currentPlan = currentSubscription ? getPlanById(currentSubscription.planId) : null;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    console.log('Selected plan:', plan);
    // Here you would implement the plan selection logic
    setShowPlans(false);
  };

  const handlePayment = () => {
    // In a real app, this would integrate with a payment processor
    console.log('Opening payment flow for merchant:', merchantId);
    // For now, we'll show an alert
    alert('Payment integration would be implemented here. This would redirect to a secure payment form.');
  };

  const handlePlanChange = (newPlan: SubscriptionPlan) => {
    setSelectedNewPlan(newPlan);
    setShowPlanChangeDialog(true);
  };

  const confirmPlanChange = async () => {
    if (!selectedNewPlan || !currentSubscription) return;

    try {
      // In a real app, this would update the database
      // For now, we'll simulate the plan change
      setPendingPlanChange(selectedNewPlan);
      
      toast({
        title: "Plan Change Scheduled",
        description: `Your plan will change to ${selectedNewPlan.name} at your next renewal on ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}.`,
      });

      setShowPlanChangeDialog(false);
      setSelectedNewPlan(null);
      } catch {
      toast({
        title: "Error",
        description: "Failed to schedule plan change. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlanChangeType = (newPlan: SubscriptionPlan) => {
    if (!currentPlan) return 'unknown';
    if (newPlan.monthlyPrice > currentPlan.monthlyPrice) return 'upgrade';
    if (newPlan.monthlyPrice < currentPlan.monthlyPrice) return 'downgrade';
    return 'same';
  };

  const getPlanChangeIcon = (newPlan: SubscriptionPlan) => {
    const changeType = getPlanChangeType(newPlan);
    switch (changeType) {
      case 'upgrade': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'downgrade': return <ArrowDown className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPlanChangeColor = (newPlan: SubscriptionPlan) => {
    const changeType = getPlanChangeType(newPlan);
    switch (changeType) {
      case 'upgrade': return 'text-green-600 bg-green-50 border-green-200';
      case 'downgrade': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (showPlans) {
    return (
      <div className={className}>
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowPlans(false)}
            className="mb-4"
          >
            ← Back to Current Plan
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
          <p className="text-muted-foreground">Select the perfect plan for your business needs</p>
        </div>
        <SubscriptionPlans 
          onSelectPlan={handleSelectPlan}
          currentPlanId={currentSubscription?.planId}
          showYearly={true}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Subscription Management</h2>
          <p className="text-muted-foreground">Manage your subscription and usage</p>
        </div>
        <Button onClick={() => setShowPlans(true)}>
          Change Plan
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan Card */}
          {currentPlan && currentSubscription && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      {currentPlan.name}
                      <Badge className={getStatusColor(currentSubscription.status)}>
                        {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                      </Badge>
                      {currentPlan.popular && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </CardTitle>
                    
                    {currentSubscription.status === 'trial' && currentSubscription.trialEndDate && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Free Trial Active</p>
                            <p className="text-xs text-blue-700">
                              Trial ends on {new Date(currentSubscription.trialEndDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handlePayment()}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Add Payment Method
                          </Button>
                        </div>
                      </div>
                    )}

                    {pendingPlanChange && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium text-orange-900">Plan Change Scheduled</p>
                            <p className="text-xs text-orange-700">
                              Will change to {pendingPlanChange.name} at next renewal
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <CardDescription className="mt-2">
                      {currentPlan.description}
                    </CardDescription>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-foreground">
                      ${currentPlan.monthlyPrice}/month
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Billed monthly
                    </div>
                    {currentPlan.yearlyPrice && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ${currentPlan.yearlyPrice}/year (Save ${(currentPlan.monthlyPrice * 12) - currentPlan.yearlyPrice})
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Features */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Plan Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Limits */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{currentPlan.monthlyPoints.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Monthly Points</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{currentPlan.monthlyTransactions.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Monthly Transactions</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {currentSubscription.autoRenew ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-orange-500 mx-auto" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Auto Renewal</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {new Date(currentSubscription.nextBillingDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Next Billing</div>
                  </div>
                </div>

                {/* Plan Change Options */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Available Plans</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SUBSCRIPTION_PLANS.filter(plan => plan.id !== currentPlan.id).map((plan) => (
                      <div key={plan.id} className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getPlanChangeColor(plan)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getPlanChangeIcon(plan)}
                            <span className="font-medium text-sm">{plan.name}</span>
                          </div>
                          <span className="text-sm font-bold">${plan.monthlyPrice}/mo</span>
                        </div>
                        <p className="text-xs opacity-75 mb-2">{plan.description}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={() => handlePlanChange(plan)}
                        >
                          {getPlanChangeType(plan) === 'upgrade' ? 'Upgrade' : 
                           getPlanChangeType(plan) === 'downgrade' ? 'Downgrade' : 'Change'} Plan
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Plan changes take effect at your next renewal date
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Payment Method</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentSubscription?.paymentMethod || 'No payment method'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Billing Cycle</h3>
                    <p className="text-sm text-muted-foreground">Monthly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Usage Trend</h3>
                    <p className="text-sm text-muted-foreground">View detailed analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {usage && currentPlan && (
            <>
              {/* Usage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Points Usage</CardTitle>
                    <CardDescription>
                      {usage.currentMonth.pointsUsed} of {currentPlan.monthlyPoints} points used this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress 
                      value={(usage.currentMonth.pointsUsed / currentPlan.monthlyPoints) * 100} 
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{usage.currentMonth.pointsUsed} used</span>
                      <span>{usage.currentMonth.pointsRemaining} remaining</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Usage</CardTitle>
                    <CardDescription>
                      {usage.currentMonth.transactionsUsed} of {currentPlan.monthlyTransactions} transactions used this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress 
                      value={(usage.currentMonth.transactionsUsed / currentPlan.monthlyTransactions) * 100} 
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{usage.currentMonth.transactionsUsed} used</span>
                      <span>{usage.currentMonth.transactionsRemaining} remaining</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Reset Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm">
                        Usage resets on <span className="font-semibold">
                          {new Date(usage.resetDate).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Manage your billing and payment settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Payment Method</label>
                  <p className="text-sm text-muted-foreground">
                    {currentSubscription?.paymentMethod || 'No payment method on file'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Next Billing Date</label>
                  <p className="text-sm text-muted-foreground">
                    {currentSubscription ? new Date(currentSubscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Auto Renewal</label>
                  <p className="text-sm text-muted-foreground">
                    {currentSubscription?.autoRenew ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Subscription Status</label>
                  <p className="text-sm text-muted-foreground">
                    {currentSubscription?.status.charAt(0).toUpperCase() + currentSubscription?.status.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline">Update Payment Method</Button>
                <Button variant="outline">Download Invoice</Button>
                <Button variant="outline">Cancel Subscription</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Change Confirmation Dialog */}
      <Dialog open={showPlanChangeDialog} onOpenChange={setShowPlanChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNewPlan && getPlanChangeIcon(selectedNewPlan)}
              {selectedNewPlan && getPlanChangeType(selectedNewPlan) === 'upgrade' ? 'Upgrade' : 
               selectedNewPlan && getPlanChangeType(selectedNewPlan) === 'downgrade' ? 'Downgrade' : 'Change'} Plan
            </DialogTitle>
            <DialogDescription>
              {selectedNewPlan && (
                <>
                  You're about to {getPlanChangeType(selectedNewPlan)} from <strong>{currentPlan?.name}</strong> to <strong>{selectedNewPlan.name}</strong>.
                  <br /><br />
                  This change will take effect at your next renewal date: <strong>{currentSubscription && new Date(currentSubscription.nextBillingDate).toLocaleDateString()}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNewPlan && (
            <div className="space-y-4">
              {/* Plan Comparison */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm mb-2">Current Plan</h4>
                  <div className="text-lg font-bold">${currentPlan?.monthlyPrice}/month</div>
                  <div className="text-xs text-muted-foreground">{currentPlan?.monthlyPoints.toLocaleString()} points</div>
                  <div className="text-xs text-muted-foreground">{currentPlan?.monthlyTransactions.toLocaleString()} transactions</div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">New Plan</h4>
                  <div className="text-lg font-bold">${selectedNewPlan.monthlyPrice}/month</div>
                  <div className="text-xs text-muted-foreground">{selectedNewPlan.monthlyPoints.toLocaleString()} points</div>
                  <div className="text-xs text-muted-foreground">{selectedNewPlan.monthlyTransactions.toLocaleString()} transactions</div>
                </div>
              </div>

              {/* Price Difference */}
              {currentPlan && (
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {getPlanChangeType(selectedNewPlan) === 'upgrade' ? 'Additional cost' : 
                     getPlanChangeType(selectedNewPlan) === 'downgrade' ? 'Savings' : 'No price change'}:
                  </div>
                  <div className={`text-lg font-bold ${
                    getPlanChangeType(selectedNewPlan) === 'upgrade' ? 'text-green-600' : 
                    getPlanChangeType(selectedNewPlan) === 'downgrade' ? 'text-orange-600' : 'text-muted-foreground'
                  }`}>
                    ${Math.abs(selectedNewPlan.monthlyPrice - currentPlan.monthlyPrice)}/month
                  </div>
                </div>
              )}

              {/* Important Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Important Notice</p>
                    <p className="text-blue-700">
                      Plan changes are scheduled for your next renewal date. You'll continue using your current plan until then.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPlanChangeDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmPlanChange}
                  className={`flex-1 ${
                    getPlanChangeType(selectedNewPlan) === 'upgrade' ? 'bg-green-600 hover:bg-green-700' : 
                    getPlanChangeType(selectedNewPlan) === 'downgrade' ? 'bg-orange-600 hover:bg-orange-700' : 
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {getPlanChangeType(selectedNewPlan) === 'upgrade' ? 'Upgrade' : 
                   getPlanChangeType(selectedNewPlan) === 'downgrade' ? 'Downgrade' : 'Change'} Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManager;


