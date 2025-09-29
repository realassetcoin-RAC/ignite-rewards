import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { Loader2 } from 'lucide-react';

interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  className,
  variant = 'default',
  size = 'default',
  children,
}) => {
  const logger = createModuleLogger('GoogleOAuthButton');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    logger.info('Starting Google OAuth sign in with popup');
    setLoading(true);

    try {
      // Construct popup callback URL
      const redirectUrl = `${window.location.origin}/auth/popup-callback`;
      logger.info('OAuth popup callback URL:', redirectUrl);

      // Attempt real Google OAuth directly, bypassing the database adapter
      logger.info('Attempting real Google OAuth with popup (bypassing database adapter)...');
      
      // Create a direct Supabase client instance to bypass the database adapter
      const { createClient } = await import('@supabase/supabase-js');
      const directSupabase = createClient(
        'https://wndswqvqogeblksrujpg.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
      );
      
      const { data, error } = await directSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Enable popup mode
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',  // Force account selection screen
          }
        }
      });

      if (error) {
        logger.error('Real Google OAuth error:', error);
        
        // Show detailed error information
        toast({
          title: "Google OAuth Failed",
          description: error.message || "Unable to initiate Google OAuth. Please try again.",
          variant: "destructive"
        });

        if (onError) {
          onError(error.message || 'OAuth failed');
        }
        setLoading(false);
        return;
      }

      logger.info('Real Google OAuth initiated successfully:', data);
      
      if (data?.url) {
        logger.info('Opening Google OAuth popup:', data.url);
        
        // Open OAuth in popup window
        const popup = window.open(
          data.url,
          'google-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            logger.info('OAuth popup success:', event.data.session);
            toast({
              title: "Sign In Successful",
              description: "Welcome back! You've successfully signed in with Google.",
            });
            
            if (onSuccess) {
              onSuccess();
            }
            window.removeEventListener('message', handleMessage);
          } else if (event.data.type === 'OAUTH_ERROR') {
            logger.error('OAuth popup error:', event.data.error);
            toast({
              title: "Sign In Failed",
              description: event.data.error || "Google sign-in failed. Please try again.",
              variant: "destructive"
            });
            
            if (onError) {
              onError(event.data.error || 'OAuth failed');
            }
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);

        // Fallback: check if popup is closed without completing auth
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            // Only show error if no success message was received
            setTimeout(() => {
              if (!popup.closed) return; // Check again in case it reopened
              toast({
                title: "Sign In Cancelled",
                description: "Google sign-in was cancelled or failed.",
                variant: "destructive"
              });
              
              if (onError) {
                onError('Sign-in cancelled');
              }
            }, 100);
          }
        }, 1000);
      } else {
        logger.error('No OAuth URL received from Google');
        toast({
          title: "Configuration Error",
          description: "Google OAuth is not properly configured. Please contact support.",
          variant: "destructive"
        });
        
        if (onError) {
          onError('No OAuth URL received');
        }
        setLoading(false);
        return;
      }

    } catch (error) {
      logger.error('Google OAuth error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Authentication Error",
        description: `Failed to sign in with Google: ${errorMessage}`,
        variant: "destructive"
      });

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <div>
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant={variant}
          size={size}
          className={className}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {children || 'Continue with Google'}
            </>
          )}
        </Button>

      </div>

    </>
  );
};

export default GoogleOAuthButton;
