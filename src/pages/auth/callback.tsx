import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { ReferralService } from '@/lib/referralService';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshAuth } = useSecureAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session?.user) {
          // Process referral code if it was stored during OAuth
          const pendingReferralCode = sessionStorage.getItem('pending_referral_code');
          if (pendingReferralCode) {
            try {
              const referralResult = await ReferralService.processReferralSignup(
                pendingReferralCode, 
                data.session.user.id
              );
              
              if (referralResult.success) {
                toast({
                  title: "Referral Code Applied!",
                  description: "You've earned bonus points from the referral!",
                });
              } else {
                toast({
                  title: "Referral Code Issue",
                  description: referralResult.error || "Invalid referral code",
                  variant: "destructive"
                });
              }
            } catch (referralError) {
              console.error('Referral processing error:', referralError);
              toast({
                title: "Referral Processing Error",
                description: "Referral code could not be processed, but you're signed in successfully.",
                variant: "destructive"
              });
            } finally {
              // Clear the pending referral code
              sessionStorage.removeItem('pending_referral_code');
            }
          }

          toast({
            title: "Welcome!",
            description: "You have successfully signed in.",
          });
          
          refreshAuth();
          
          // Redirect to dashboard or home page
          router.push('/');
        } else {
          throw new Error('No session found');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : "Unable to complete authentication. Please try again.",
          variant: "destructive"
        });
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router, toast, refreshAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Completing Sign In...</h2>
        <p className="text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

export default AuthCallback;

