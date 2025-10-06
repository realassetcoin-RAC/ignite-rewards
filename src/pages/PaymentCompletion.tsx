// Payment Completion Page
// This page handles successful payment completion and triggers buy-back and burn

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { paymentCompletionService } from '@/lib/paymentCompletionService';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { Loader2, CheckCircle, XCircle, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const logger = createModuleLogger('PaymentCompletion');

const PaymentCompletion: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your payment...');
  const [buyBackInfo, setBuyBackInfo] = useState<{
    racTokensBurned: number;
    transactionHash: string;
  } | null>(null);

  useEffect(() => {
    handlePaymentCompletion();
  }, []);

  const handlePaymentCompletion = async () => {
    try {
      logger.info('Processing payment completion...');
      
      // Get payment type from URL params
      const paymentType = searchParams.get('type');
      const price = parseFloat(searchParams.get('price') || '0');
      const paymentTransactionHash = searchParams.get('transaction_hash');

      if (paymentType === 'merchant_subscription') {
        await handleMerchantSubscriptionCompletion(price, paymentTransactionHash);
      } else if (paymentType === 'nft_upgrade') {
        await handleNFTUpgradeCompletion(price, paymentTransactionHash);
      } else {
        throw new Error('Unknown payment type');
      }

    } catch (error) {
      logger.error('Payment completion failed:', error);
      setStatus('error');
      setMessage('Payment completion failed. Please contact support.');
      
      toast({
        title: "Payment Completion Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleMerchantSubscriptionCompletion = async (price: number, paymentTransactionHash?: string) => {
    try {
      // Get stored payment data
      const paymentData = paymentCompletionService.getStoredPaymentData();
      
      if (!paymentData) {
        throw new Error('Payment data not found. Please contact support.');
      }

      // Update payment data with transaction hash
      const updatedPaymentData = {
        ...paymentData,
        paymentTransactionHash: paymentTransactionHash || undefined
      };

      // Process payment completion with buy-back and burn
      const result = await paymentCompletionService.handleMerchantSubscriptionPaymentCompletion(
        updatedPaymentData
      );

      if (result.success && result.buyBackTransaction) {
        setStatus('success');
        setMessage('Your subscription has been activated successfully!');
        setBuyBackInfo({
          racTokensBurned: result.buyBackTransaction.rac_tokens_burned,
          transactionHash: result.buyBackTransaction.transaction_hash
        });

        // Clear stored payment data
        paymentCompletionService.clearStoredPaymentData();

        toast({
          title: "Subscription Activated!",
          description: `Your subscription is now active. ${result.buyBackTransaction.rac_tokens_burned} RAC tokens have been burned to reduce supply.`,
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        throw new Error(result.error || 'Payment completion failed');
      }

    } catch (error) {
      throw error;
    }
  };

  const handleNFTUpgradeCompletion = async (price: number, paymentTransactionHash?: string) => {
    try {
      // Get stored NFT upgrade data
      const storedData = sessionStorage.getItem('nftUpgradeData');
      if (!storedData) {
        throw new Error('NFT upgrade data not found. Please contact support.');
      }

      const upgradeData = JSON.parse(storedData);

      // Process payment completion with buy-back and burn
      const result = await paymentCompletionService.handleNFTUpgradePaymentCompletion(
        upgradeData.userId,
        upgradeData.upgradePrice,
        upgradeData.currentNftType,
        paymentTransactionHash
      );

      if (result.success && result.buyBackTransaction) {
        // Update the NFT to the next tier
        const { error: updateError } = await databaseAdapter
          .from('user_loyalty_cards')
          .update({
            card_type: upgradeData.nextTier,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', upgradeData.userId);

        if (updateError) {
          throw new Error('Failed to update NFT tier');
        }

        setStatus('success');
        setMessage('Your NFT has been upgraded successfully!');
        setBuyBackInfo({
          racTokensBurned: result.buyBackTransaction.rac_tokens_burned,
          transactionHash: result.buyBackTransaction.transaction_hash
        });

        // Clear stored upgrade data
        sessionStorage.removeItem('nftUpgradeData');

        toast({
          title: "NFT Upgraded Successfully!",
          description: `Your NFT has been upgraded to ${upgradeData.nextTier} tier. ${result.buyBackTransaction.rac_tokens_burned} RAC tokens have been burned to reduce supply.`,
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        throw new Error(result.error || 'NFT upgrade completion failed');
      }

    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10">
      <div className="max-w-md w-full mx-auto p-6">
        <Card className="bg-white/80 backdrop-blur-md rounded-lg shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Payment Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
                  <p className="text-gray-600">{message}</p>
                </div>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
                  <p className="text-gray-600">{message}</p>
                </div>
                
                {buyBackInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Coins className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">RAC Token Burn</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {buyBackInfo.racTokensBurned} RAC tokens have been burned to reduce supply
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Transaction: {buyBackInfo.transactionHash.substring(0, 10)}...
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard in a few seconds...
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
                  <p className="text-gray-600">{message}</p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Return to Dashboard
                </button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCompletion;
