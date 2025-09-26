import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { debugOAuthConfiguration, testGoogleOAuth, getOAuthTroubleshootingGuide } from '@/lib/oauthDebugger';
import { Loader2, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  showDebugInfo?: boolean;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  className,
  variant = 'default',
  size = 'default',
  children,
  showDebugInfo = false
}) => {
  const logger = createModuleLogger('GoogleOAuthButton');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugModal, setShowDebugModal] = useState(false);

  const handleGoogleSignIn = async () => {
    logger.info('Starting Google OAuth sign in');
    setLoading(true);

    try {
      // First, run diagnostics if debug mode is enabled
      if (showDebugInfo) {
        logger.info('Running OAuth diagnostics...');
        const diagnostics = await debugOAuthConfiguration();
        setDebugInfo(diagnostics);
        logger.info('OAuth diagnostics result:', diagnostics);

        if (diagnostics.error) {
          logger.error('OAuth configuration issue detected:', diagnostics.error);
          toast({
            title: "OAuth Configuration Issue",
            description: "There's a problem with the OAuth setup. Check the debug info for details.",
            variant: "destructive"
          });
          setShowDebugModal(true);
          setLoading(false);
          return;
        }
      }

      // Construct redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`;
      logger.info('OAuth redirect URL:', redirectUrl);

      // Attempt real Google OAuth directly, bypassing the database adapter
      logger.info('Attempting real Google OAuth (bypassing database adapter)...');
      
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
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
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
        logger.info('Redirecting to Google OAuth URL:', data.url);
        toast({
          title: "Redirecting to Google",
          description: "Please complete authentication with Google.",
        });
        
        // Redirect to the real Google OAuth URL
        window.location.href = data.url;
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

      if (onSuccess) {
        onSuccess();
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

  const handleDebugClick = async () => {
    logger.info('Running OAuth diagnostics...');
    const diagnostics = await debugOAuthConfiguration();
    setDebugInfo(diagnostics);
    setShowDebugModal(true);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant={variant}
          size={size}
          className={`w-full ${className}`}
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

        {showDebugInfo && (
          <Button
            onClick={handleDebugClick}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Debug OAuth Configuration
          </Button>
        )}
      </div>

      {/* Debug Modal */}
      <Dialog open={showDebugModal} onOpenChange={setShowDebugModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Google OAuth Debug Information
            </DialogTitle>
            <DialogDescription>
              Diagnostic information about the Google OAuth configuration
            </DialogDescription>
          </DialogHeader>

          {debugInfo && (
            <div className="space-y-4">
              {/* Configuration Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Supabase Client:</span>
                      <span className={debugInfo.supabaseClient ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.supabaseClient ? '✅ Available' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Auth Methods:</span>
                      <span className={debugInfo.authMethods ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.authMethods ? '✅ Available' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">OAuth Method:</span>
                      <span className={debugInfo.signInWithOAuth ? 'text-green-600' : 'text-red-600'}>
                        {debugInfo.signInWithOAuth ? '✅ Available' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Environment:</span>
                      <span className="text-blue-600">{debugInfo.environment}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* URL Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">URL Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Current URL:</span>
                      <p className="text-sm text-gray-600 font-mono">{debugInfo.currentUrl}</p>
                    </div>
                    <div>
                      <span className="font-medium">Redirect URL:</span>
                      <p className="text-sm text-gray-600 font-mono">{debugInfo.redirectUrl}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Troubleshooting Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Troubleshooting Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getOAuthTroubleshootingGuide(debugInfo).map((line, index) => (
                      <p key={index} className={`text-sm ${
                        line.startsWith('❌') ? 'text-red-600' :
                        line.startsWith('✅') ? 'text-green-600' :
                        line.startsWith('===') ? 'font-bold text-blue-600' :
                        line.startsWith('-') ? 'text-gray-600 ml-4' :
                        'text-gray-800'
                      }`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Error Information */}
              {debugInfo.error && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-800">Error Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700 font-mono text-sm">{debugInfo.error}</p>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Supabase Dashboard
                </Button>
                <Button
                  onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Cloud Console
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoogleOAuthButton;
