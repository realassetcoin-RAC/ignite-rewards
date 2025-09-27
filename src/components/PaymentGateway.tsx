import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PaymentService } from '@/lib/paymentService';
import { CreditCard, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentGatewayProps {
  userId: string;
  amount: number;
  currency?: string;
  paymentType: 'nft_upgrade' | 'subscription';
  currentNftId?: string;
  targetNftId?: string;
  planId?: string;
  billingPeriod?: 'monthly' | 'yearly';
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  userId,
  amount,
  currency = 'usd',
  paymentType,
  currentNftId,
  targetNftId,
  planId,
  billingPeriod,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let paymentResult;

      if (paymentType === 'nft_upgrade' && currentNftId && targetNftId) {
        paymentResult = await PaymentService.createNFTUpgradePayment(
          userId,
          currentNftId,
          targetNftId,
          amount,
          currency
        );
      } else if (paymentType === 'subscription' && planId && billingPeriod) {
        paymentResult = await PaymentService.createSubscriptionPayment(
          userId,
          planId,
          amount,
          billingPeriod,
          currency
        );
      } else {
        throw new Error('Invalid payment parameters');
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment creation failed');
      }

      // Simulate payment confirmation (in production, this would be handled by the payment provider)
      setTimeout(async () => {
        try {
          const confirmResult = await PaymentService.confirmPayment(
            paymentResult.paymentIntent!.id
          );

          if (confirmResult.success) {
            toast({
              title: "Payment Successful!",
              description: `Your ${paymentType === 'nft_upgrade' ? 'NFT upgrade' : 'subscription'} has been processed.`,
              variant: "default"
            });
            onPaymentSuccess(paymentResult.paymentIntent!.id);
          } else {
            throw new Error(confirmResult.error || 'Payment confirmation failed');
          }
        } catch (confirmError) {
          console.error('Payment confirmation error:', confirmError);
          onPaymentError(confirmError instanceof Error ? confirmError.message : 'Payment confirmation failed');
        } finally {
          setLoading(false);
        }
      }, 3000); // Simulate 3-second processing time

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      onPaymentError(errorMessage);
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Gateway
        </CardTitle>
        <CardDescription>
          Secure payment processing for your {paymentType === 'nft_upgrade' ? 'NFT upgrade' : 'subscription'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Amount */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">
            {currency.toUpperCase()} {amount.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            {paymentType === 'nft_upgrade' ? 'NFT Upgrade Payment' : 'Subscription Payment'}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('card')}
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Card
            </Button>
            <Button
              variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('paypal')}
            >
              PayPal
            </Button>
            <Button
              variant={paymentMethod === 'crypto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('crypto')}
            >
              Crypto
            </Button>
          </div>
        </div>

        {/* Card Details Form */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails(prev => ({
                  ...prev,
                  number: formatCardNumber(e.target.value)
                }))}
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails(prev => ({
                    ...prev,
                    expiry: formatExpiry(e.target.value)
                  }))}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails(prev => ({
                    ...prev,
                    cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                  }))}
                  maxLength={4}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) => setCardDetails(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
              />
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-sm text-green-800">
            <div className="font-medium">Secure Payment</div>
            <div>Your payment information is encrypted and secure. We never store your card details.</div>
          </div>
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={loading || (paymentMethod === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name))}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {currency.toUpperCase()} {amount.toFixed(2)}
            </>
          )}
        </Button>

        {/* Payment Status */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <div className="text-sm text-blue-800">
              Processing your payment securely...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
