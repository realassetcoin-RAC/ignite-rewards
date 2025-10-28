import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { log } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { DirectGoogleOAuth } from '@/lib/directGoogleOAuth';
import { DirectAuthService } from '@/lib/directAuthService';
import { Loader2, AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface GoogleOAuthButtonProps {
  onSuccess?: (user?: any) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
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
  const logger = log.withContext('GoogleOAuthButton');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);

  useEffect(() => {
    const initializeOAuth = async () => {
      try {
        const initialized = await DirectGoogleOAuth.initialize();
        setIsInitialized(initialized);
        setConfigStatus(DirectGoogleOAuth.getConfigStatus());
        logger.info('Direct Google OAuth initialization result:', { initialized, config: DirectGoogleOAuth.getConfigStatus() });
      } catch (error) {
        logger.error('Failed to initialize Direct Google OAuth:', error instanceof Error ? error : new Error(String(error)));
        setIsInitialized(false);
      }
    };

    initializeOAuth();
  }, []);

  const handleGoogleSignIn = async () => {
    logger.info('Starting Direct Google OAuth sign in');
    setLoading(true);

    try {
      // Check if we're in test mode (Ctrl+Click)
      const isTestMode = window.event && (window.event as any).ctrlKey;
      
      if (isTestMode) {
        logger.info('Test mode detected, using mock authentication');
        
        // Create mock authentication
        const mockUser = {
          id: 'test_user_' + Date.now(),
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://via.placeholder.com/150',
          verified_email: true
        };

        const session = {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            user_metadata: {
              full_name: mockUser.name,
              avatar_url: mockUser.picture,
              email_verified: mockUser.verified_email
            },
            email_confirmed_at: mockUser.verified_email ? new Date().toISOString() : null
          },
          access_token: 'mock_token_' + Date.now(),
          expires_at: Date.now() + (3600 * 1000) // 1 hour
        };

        // Save to localStorage
        localStorage.setItem('google_user', JSON.stringify(mockUser));
        localStorage.setItem('google_access_token', session.access_token);
        localStorage.setItem('auth_session', JSON.stringify(session));
        localStorage.setItem('auth_user', JSON.stringify(session.user));

        // Trigger events
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('auth-state-change', {
          detail: { event: 'SIGNED_IN', session }
        }));

        logger.info('Mock authentication successful');
        toast({
          title: "Test Sign In Successful",
          description: "Welcome! You've successfully signed in with test account.",
        });
        
        if (onSuccess) {
          onSuccess(mockUser);
        }
        
        return;
      }

      if (!isInitialized) {
        logger.warn('Google OAuth not initialized, but allowing test mode or fallback');
        // Don't throw error, allow test mode to work
      }

      const result = await DirectAuthService.signInWithGoogle();

      if (!result.success) {
        logger.error('Direct Google OAuth failed:', result.error ? new Error(result.error) : new Error('Unknown OAuth error'));
        toast({
          title: "Google Sign-In Failed",
          description: result.error || "Unable to complete Google sign-in. Please try again.",
          variant: "destructive"
        });

        if (onError) {
          onError(result.error || 'OAuth failed');
        }
        return;
      }

      logger.info('Direct Google OAuth successful');
      toast({
        title: "Sign In Successful",
        description: "Welcome! You've successfully signed in with Google.",
      });
      
      if (onSuccess) {
        onSuccess(result.user);
      }

    } catch (error) {
      logger.error('Direct Google OAuth error:', error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Google sign-in failed. Please try again.",
        variant: "destructive"
      });
      
      if (onError) {
        onError(error instanceof Error ? error.message : 'OAuth failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show configuration status for debugging
  const showConfigWarning = configStatus && (!configStatus.hasClientId || !configStatus.hasGoogleLibrary);

  return (
    <div className="w-full">
      {showConfigWarning && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 text-yellow-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Google OAuth configuration incomplete. Hold Ctrl+Click to use test mode.</span>
          </div>
        </div>
      )}
      
      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 w-full ${className || ''}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {children || 'Google'}
      </Button>
    </div>
  );
};

export default GoogleOAuthButton;