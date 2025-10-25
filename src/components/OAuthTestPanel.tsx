import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GoogleOAuthService } from '@/lib/googleOAuthService';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { environment } from '@/config/environment';
import { CheckCircle, XCircle, AlertCircle, Chrome, Database, Settings } from 'lucide-react';
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('OAuthTestPanel');

interface OAuthTestPanelProps {
  className?: string;
}

const OAuthTestPanel: React.FC<OAuthTestPanelProps> = ({ className }) => {
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    checkConfiguration();
    checkAuthStatus();
  }, []);

  const checkConfiguration = async () => {
    try {
      const initialized = await GoogleOAuthService.initialize();
      const config = GoogleOAuthService.getConfigStatus();
      
      setConfigStatus({
        initialized,
        ...config,
        environment: {
          hasClientId: !!environment.oauth.google.clientId,
          clientId: environment.oauth.google.clientId ? 'Set' : 'Not Set',
          redirectUri: environment.oauth.google.redirectUri,
          supabaseUrl: environment.database.supabase.url,
          hasAnonKey: !!environment.database.supabase.anonKey
        }
      });
    } catch (error) {
      logger.error('Configuration check failed:', error instanceof Error ? error : new Error(String(error)));
      setConfigStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const checkAuthStatus = async () => {
    try {
      const { data: { session }, error } = await databaseAdapter.supabase.auth.getSession();
      
      setAuthStatus({
        hasSession: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          provider: session.user.app_metadata?.provider,
          created_at: session.user.created_at
        } : null,
        error: error?.message
      });
    } catch (error) {
      logger.error('Auth status check failed:', error instanceof Error ? error : new Error(String(error)));
      setAuthStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const runOAuthTest = async (testType: 'supabase' | 'direct') => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      logger.info(`Running ${testType} OAuth test`);
      
      let result;
      if (testType === 'supabase') {
        result = await GoogleOAuthService.signInWithSupabase();
      } else {
        result = await GoogleOAuthService.signInWithGoogle();
      }

      const testResult = {
        id: testId,
        type: testType,
        success: result.success,
        error: result.error,
        timestamp: new Date().toISOString(),
        user: result.user
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results
      
      if (result.success) {
        await checkAuthStatus(); // Refresh auth status
      }
    } catch (error) {
      const testResult = {
        id: testId,
        type: testType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const result = await GoogleOAuthService.signOut();
      if (result.success) {
        await checkAuthStatus();
        setTestResults([]);
      }
    } catch (error) {
      logger.error('Sign out failed:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: boolean | undefined) => {
    if (status === true) return <Badge variant="default" className="bg-green-500">Ready</Badge>;
    if (status === false) return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            OAuth Configuration Status
          </CardTitle>
          <CardDescription>
            Current Google OAuth and Supabase configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Google OAuth</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Client ID</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(configStatus.hasClientId)}
                      <span>{configStatus.environment?.clientId || 'Not Set'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Google Library</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(configStatus.hasGoogleLibrary)}
                      {getStatusBadge(configStatus.hasGoogleLibrary)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Initialized</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(configStatus.initialized)}
                      {getStatusBadge(configStatus.initialized)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Supabase</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>URL</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(configStatus.environment?.supabaseUrl)}
                      <span className="text-xs">Configured</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Anon Key</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(configStatus.environment?.hasAnonKey)}
                      {getStatusBadge(configStatus.environment?.hasAnonKey)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Redirect URI</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs truncate max-w-32">
                        {configStatus.redirectUri}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Loading configuration...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Authentication Status
          </CardTitle>
          <CardDescription>
            Current user session and authentication state
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Session Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(authStatus.hasSession)}
                  {getStatusBadge(authStatus.hasSession)}
                </div>
              </div>
              
              {authStatus.user && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Current User</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Email:</strong> {authStatus.user.email}</div>
                    <div><strong>Provider:</strong> {authStatus.user.provider || 'email'}</div>
                    <div><strong>ID:</strong> {authStatus.user.id}</div>
                    <div><strong>Created:</strong> {new Date(authStatus.user.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
              
              {authStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>Error:</strong> {authStatus.error}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Loading authentication status...
            </div>
          )}
        </CardContent>
      </Card>

      {/* OAuth Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5" />
            OAuth Testing
          </CardTitle>
          <CardDescription>
            Test Google OAuth integration with different methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => runOAuthTest('supabase')}
              disabled={isLoading}
              variant="default"
              className="flex-1"
            >
              Test Supabase OAuth
            </Button>
            <Button
              onClick={() => runOAuthTest('direct')}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Test Direct OAuth
            </Button>
            <Button
              onClick={signOut}
              disabled={isLoading}
              variant="destructive"
            >
              Sign Out
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Test Results</h4>
            {testResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {testResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        <span className="font-medium capitalize">{result.type} OAuth</span>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {result.error && (
                      <div className="mt-2 text-sm text-red-800">
                        {result.error}
                      </div>
                    )}
                    {result.user && (
                      <div className="mt-2 text-sm">
                        <strong>User:</strong> {result.user.email}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No test results yet. Run a test to see results here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthTestPanel;
