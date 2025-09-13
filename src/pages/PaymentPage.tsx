import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentData {
  planId: string;
  planName: string;
  price: number;
  billingPeriod: string;
  billingPeriodText: string;
  monthlyPoints: number;
  monthlyTransactions: number;
  merchantData: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    website: string;
    industry: string;
    address: string;
    userId: string;
  };
}

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Get payment data from sessionStorage
    const storedData = sessionStorage.getItem('merchantPaymentData');
    if (storedData) {
      setPaymentData(JSON.parse(storedData));
    } else {
      // If no payment data, redirect back to home
      navigate('/');
    }
  }, [navigate]);

  const handlePayment = async () => {
    if (!paymentData) return;

    setProcessing(true);

    try {
      // Simulate payment processing
      // In a real implementation, you would integrate with:
      // - Stripe
      // - PayPal
      // - Razorpay
      // - Other payment gateways
      
      toast({
        title: "Payment Processing",
        description: "Redirecting to secure payment gateway...",
      });

      // Simulate redirect to payment gateway
      setTimeout(() => {
        // In a real implementation, this would be your payment gateway URL
        // For demo purposes, we'll simulate a successful payment
        toast({
          title: "Payment Successful!",
          description: "Your subscription has been activated. Welcome to the platform!",
        });
        
        // Clear payment data
        sessionStorage.removeItem('merchantPaymentData');
        
        // Redirect to merchant dashboard
        navigate('/merchant');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
      setProcessing(false);
    }
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">Secure payment processing for your business</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card className="rounded-none" style={{ borderRadius: '0px' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-none" style={{ borderRadius: '0px' }}>
                <h3 className="text-xl font-bold mb-2">{paymentData.planName}</h3>
                <div className="text-3xl font-bold text-primary mb-2">
                  ${paymentData.price}
                </div>
                {paymentData.billingPeriod === 'yearly' && (
                  <div className="text-sm text-muted-foreground">
                    ${Math.round(paymentData.price / 12)} billed yearly
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Plan Features:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{paymentData.monthlyPoints} points per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{paymentData.monthlyTransactions} transactions per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>24/7 Customer Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Advanced Analytics</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="rounded-none" style={{ borderRadius: '0px' }}>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Information */}
              <div className="space-y-3">
                <h4 className="font-semibold">Business Details:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Business:</strong> {paymentData.merchantData.businessName}</p>
                  <p><strong>Contact:</strong> {paymentData.merchantData.contactName}</p>
                  <p><strong>Email:</strong> {paymentData.merchantData.email}</p>
                  <p><strong>Phone:</strong> {paymentData.merchantData.phone}</p>
                </div>
              </div>

              {/* Payment Gateway Integration */}
              <div className="space-y-4">
                <h4 className="font-semibold">Payment Method:</h4>
                <div className="p-4 border border-border rounded-none bg-muted/50" style={{ borderRadius: '0px' }}>
                  <p className="text-sm text-muted-foreground mb-2">
                    This is where your payment gateway integration would go:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Stripe Elements</li>
                    <li>• PayPal SDK</li>
                    <li>• Razorpay Integration</li>
                    <li>• Other payment providers</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={processing}
                  className="flex-1 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm rounded-none"
                  style={{ borderRadius: '0px' }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm rounded-none"
                  variant="outline"
                  style={{ borderRadius: '0px' }}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${paymentData.price}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
