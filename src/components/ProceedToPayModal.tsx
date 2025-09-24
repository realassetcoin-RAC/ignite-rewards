/**
 * ✅ IMPLEMENT REQUIREMENT: "Proceed to Pay" popup for NFT purchases and upgrades
 * Professional payment modal with multiple payment methods
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Loader2, 
  Shield, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Crown,
  Sparkles
} from 'lucide-react';
import { PaymentService } from '@/lib/paymentService';

interface PaymentItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  type: 'nft_upgrade' | 'nft_purchase' | 'subscription';
  features?: string[];
  popular?: boolean;
}

interface ProceedToPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: PaymentItem;
  userId: string;
  currentNftId?: string; // For upgrades
  planId?: string; // For subscriptions
  billingPeriod?: 'monthly' | 'yearly';
}

type PaymentStep = 'method' | 'processing' | 'success' | 'error';
type PaymentMethod = 'stripe' | 'paypal' | 'square';

export const ProceedToPayModal: React.FC<ProceedToPayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
  userId,
  currentNftId,
  planId,
  billingPeriod = 'monthly'
}) => {
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  const paymentMethods = [
    {
      id: 'stripe' as PaymentMethod,
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: CreditCard,
      popular: true
    },
    {
      id: 'paypal' as PaymentMethod,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: Shield,
      popular: false
    },
    {
      id: 'square' as PaymentMethod,
      name: 'Square',
      description: 'Secure payment processing',
      icon: Shield,
      popular: false
    }
  ];

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setLoading(true);
    setPaymentStep('processing');

    try {
      let paymentResult;

      // Create payment based on item type
      switch (item.type) {
        case 'nft_upgrade':
          if (!currentNftId) {
            throw new Error('Current NFT ID required for upgrade');
          }
          paymentResult = await PaymentService.createNFTUpgradePayment(
            userId,
            currentNftId,
            item.id,
            item.price,
            item.currency
          );
          break;

        case 'subscription':
          if (!planId) {
            throw new Error('Plan ID required for subscription');
          }
          paymentResult = await PaymentService.createSubscriptionPayment(
            userId,
            planId,
            item.price,
            billingPeriod,
            item.currency
          );
          break;

        case 'nft_purchase':
          // For new NFT purchases, we can reuse the upgrade flow
          paymentResult = await PaymentService.createNFTUpgradePayment(
            userId,
            'none', // No current NFT for new purchases
            item.id,
            item.price,
            item.currency
          );
          break;

        default:
          throw new Error('Unsupported payment type');
      }

      if (!paymentResult.success || !paymentResult.paymentIntent) {
        throw new Error(paymentResult.error || 'Failed to create payment intent');
      }

      setPaymentIntentId(paymentResult.paymentIntent.id);
      console.log('✅ Payment intent created:', paymentResult.paymentIntent.id);

      // Simulate payment processing (in real app, this would integrate with Stripe Elements, PayPal SDK, etc.)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Confirm payment
      const confirmResult = await PaymentService.confirmPayment(
        paymentResult.paymentIntent.id,
        `pm_${selectedMethod}_${Date.now()}`
      );

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || 'Payment confirmation failed');
      }

      console.log('✅ Payment confirmed successfully');
      setPaymentStep('success');

      // Send success notification
      toast({
        title: "Payment Successful!",
        description: `Your ${item.name} purchase has been completed.`,
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('error');
      
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (paymentStep === 'processing') {
      // Cancel payment if in progress
      if (paymentIntentId) {
        PaymentService.cancelPayment(paymentIntentId);
      }
    }
    setPaymentStep('method');
    setPaymentIntentId('');
    onClose();
  };

  const renderPaymentMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Complete Your Purchase</h3>
        <p className="text-muted-foreground">
          Choose your preferred payment method to continue
        </p>
      </div>

      {/* Item Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {item.type === 'nft_upgrade' || item.type === 'nft_purchase' ? (
                <Crown className="h-8 w-8 text-primary" />
              ) : (
                <Sparkles className="h-8 w-8 text-primary" />
              )}
              <div>
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {item.popular && (
                  <Badge className="mt-1" variant="secondary">Most Popular</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${item.price}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {item.currency.toUpperCase()}
                </span>
              </div>
              {item.originalPrice && item.originalPrice > item.price && (
                <div className="text-sm text-muted-foreground line-through">
                  ${item.originalPrice}
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          {item.features && item.features.length > 0 && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <p className="text-sm font-medium mb-2">Included Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {item.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Payment Methods */}
      <div>
        <h4 className="font-medium mb-4">Select Payment Method</h4>
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethod === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.name}</span>
                        {method.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedMethod === method.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Shield className="h-4 w-4 text-green-500" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="flex-1"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Proceed to Pay ${item.price}
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      <h3 className="font-medium mb-2">Processing Payment</h3>
      <p className="text-muted-foreground mb-4">
        Please wait while we process your payment securely...
      </p>
      <div className="text-sm text-muted-foreground">
        Payment ID: {paymentIntentId}
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
      <h3 className="font-medium mb-2 text-green-600">Payment Successful!</h3>
      <p className="text-muted-foreground">
        Your {item.name} purchase has been completed successfully.
      </p>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="font-medium mb-2 text-red-600">Payment Failed</h3>
      <p className="text-muted-foreground mb-4">
        There was an issue processing your payment. Please try again.
      </p>
      <Button onClick={() => setPaymentStep('method')} variant="outline">
        Try Again
      </Button>
    </div>
  );

  const renderStepContent = () => {
    switch (paymentStep) {
      case 'method':
        return renderPaymentMethodSelection();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderPaymentMethodSelection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {paymentStep === 'method' && 'Complete Purchase'}
            {paymentStep === 'processing' && 'Processing Payment'}
            {paymentStep === 'success' && 'Payment Complete'}
            {paymentStep === 'error' && 'Payment Failed'}
          </DialogTitle>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};
