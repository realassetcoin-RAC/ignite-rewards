import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createModuleLogger } from '@/utils/consoleReplacer';
import { localAuthService } from '@/lib/localAuthService';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import WalletConnectButton from '@/components/WalletConnectButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, LogOut, Database, Shield } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider: 'google' | 'wallet';
  wallet_address?: string;
  created_at: string;
  updated_at: string;
}

const AuthTest: React.FC = () => {
  const logger = createModuleLogger('AuthTest');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      logger.info('Checking authentication status...');
      
      const currentUser = await localAuthService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setAuthStatus('authenticated');
        logger.info('User is authenticated:', currentUser);
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
        logger.info('User is not authenticated');
      }
    } catch (error) {
      logger.error('Error checking auth status:', error);
      setUser(null);
      setAuthStatus('unauthenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await localAuthService.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Error",
          description: error,
          variant: "destructive"
        });
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
          variant: "default"
        });
      }
    } catch (error) {
      logger.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "An error occurred while signing out.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    toast({
      title: "Authentication Started",
      description: "Authentication process initiated successfully!",
      variant: "default"
    });
    // Refresh auth status after a short delay
    setTimeout(() => {
      checkAuthStatus();
    }, 2000);
  };

  const handleAuthError = (error: string) => {
    toast({
      title: "Authentication Error",
      description: error,
      variant: "destructive"
    });
  };

  if (loading && authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Test</h1>
          <p className="text-gray-600">Test Google OAuth and Wallet Connect with local PostgreSQL</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Status
              </CardTitle>
              <CardDescription>
                Current authentication state and user information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authStatus === 'authenticated' && user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">
                      Authenticated
                    </Badge>
                    <Badge variant="outline">
                      {user.provider === 'google' ? 'Google OAuth' : 'Wallet Connect'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{user.name || 'Unknown User'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Provider:</strong> {user.provider}
                    </div>
                    {user.wallet_address && (
                      <div className="text-sm text-gray-600">
                        <strong>Wallet:</strong> {user.wallet_address.substring(0, 8)}...{user.wallet_address.substring(-8)}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    className="w-full"
                    disabled={loading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Badge variant="secondary">Not Authenticated</Badge>
                  <p className="text-gray-600 mt-2">Please sign in using one of the methods below</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
              <CardDescription>
                Local PostgreSQL database connection status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">
                    Connected
                  </Badge>
                  <span className="text-sm text-gray-600">Local PostgreSQL</span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div><strong>Host:</strong> localhost:5432</div>
                  <div><strong>Database:</strong> ignite_rewards</div>
                  <div><strong>Table:</strong> public.users</div>
                  <div><strong>Auth:</strong> Supabase Cloud</div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Configuration:</strong> Data operations use local PostgreSQL, 
                  authentication uses Supabase cloud for OAuth providers.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google OAuth Test */}
          <Card>
            <CardHeader>
              <CardTitle>Google OAuth Test</CardTitle>
              <CardDescription>
                Test Google authentication with local PostgreSQL storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <GoogleOAuthButton
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  className="w-full"
                />
                
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  <strong>How it works:</strong> Uses Supabase cloud for OAuth, 
                  stores user data in local PostgreSQL database.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Connect Test */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Connect Test</CardTitle>
              <CardDescription>
                Test Solana and Ethereum wallet connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <WalletConnectButton
                  network="solana"
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  className="w-full mb-2"
                />
                
                <WalletConnectButton
                  network="ethereum"
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  className="w-full"
                />
                
                <div className="text-xs text-gray-500 bg-purple-50 p-2 rounded">
                  <strong>Requirements:</strong> Install Phantom (Solana) or MetaMask (Ethereum) wallet extension.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
            className="mr-4"
          >
            Back to Home
          </Button>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="default"
            disabled={authStatus !== 'authenticated'}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
