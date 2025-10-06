import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { localAuthService } from '@/lib/localAuthService';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const logger = createModuleLogger('AuthCallback');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      logger.info('Processing authentication callback...');
      
      // Get the current user from the authentication service
      const user = await localAuthService.getCurrentUser();
      
      if (user) {
        logger.info('Authentication successful:', user);
        setStatus('success');
        setMessage('Authentication successful! Setting up your account...');
        
        // ✅ IMPLEMENT REQUIREMENT: Create custodial wallet for Google OAuth users
        try {
          // Check if user profile exists
          const { data: existingProfile } = await databaseAdapter
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!existingProfile) {
            // Create user profile with custodial type
            const { error: profileError } = await databaseAdapter
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.name,
                user_type: 'custodial',
                provider: 'google',
                terms_accepted: true, // Google OAuth users accept terms
                privacy_accepted: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (profileError) {
              logger.error('Profile creation error:', profileError);
            }

            // Create custodial wallet
            const { error: walletError } = await databaseAdapter
              .from('user_solana_wallets')
              .insert({
                user_id: user.id,
                address: `custodial_${user.id}_${Date.now()}`,
                seed_phrase: 'custodial_wallet_managed_by_platform',
                wallet_type: 'custodial',
                is_active: true,
                created_at: new Date().toISOString()
              });

            if (walletError) {
              logger.error('Wallet creation error:', walletError);
            }

            // ✅ IMPLEMENT REQUIREMENT: Assign free Pearl White NFT to custodial users
            try {
              const { NFTAssignmentService } = await import('@/lib/nftAssignmentService');
              const nftResult = await NFTAssignmentService.assignFreeNFT(user.id);
              
              if (!nftResult.success) {
                logger.error('Free NFT assignment error:', nftResult.error);
              } else {
                logger.info('✅ Successfully assigned free Pearl White NFT');
              }
            } catch (nftError) {
              logger.error('Free NFT assignment failed:', nftError);
            }
          }
        } catch (walletError) {
          logger.error('Wallet creation failed:', walletError);
          // Don't fail the authentication if wallet creation fails
        }
        
        toast({
          title: "Welcome!",
          description: `Successfully signed in as ${user.name || user.email}`,
          variant: "default"
        });

        // Redirect to dashboard or home page
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('No user found after authentication');
      }
    } catch (error) {
      logger.error('Authentication callback error:', error);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
      
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });

      // Redirect to login page after error
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Authentication</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;