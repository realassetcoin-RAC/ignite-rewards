/**
 * Admin Test Panel
 * 
 * This component allows testing the admin authentication fixes
 * without needing to apply database migrations first.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { runComprehensiveAdminTest, testCurrentUserAdminAccess } from '@/utils/testAdminAccess';
import { verifyAdminAccess } from '@/utils/adminVerification';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TestTube, 
  Shield,
  User,
  Database,
  Settings
} from 'lucide-react';

const AdminTestPanel: React.FC = () => {
  const { user, profile, isAdmin, loading, error, refreshAuth, isWalletUser, mfaEnabled } = useSecureAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingRunning, setIsTestingRunning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const runTests = async () => {
    setIsTestingRunning(true);
    try {
      console.log('🚀 Running comprehensive admin tests...');
      
      // Run the comprehensive test suite
      const results = await runComprehensiveAdminTest();
      setTestResults(results);
      
      // Run verification
      const verification = await verifyAdminAccess();
      setVerificationResult(verification);
      
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: error.toString() });
    } finally {
      setIsTestingRunning(false);
    }
  };

  const quickAdminTest = async () => {
    setIsTestingRunning(true);
    try {
      const result = await testCurrentUserAdminAccess();
      console.log('Quick admin test result:', result);
    } finally {
      setIsTestingRunning(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      // Automatically run a quick test when component loads
      quickAdminTest();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <span>Loading authentication status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="h-6 w-6 mr-2" />
            Admin Authentication Test Panel
          </CardTitle>
          <CardDescription>
            Test and verify the admin authentication fixes for realassetcoin@gmail.com
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Current Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="font-semibold">User</div>
              <Badge variant={user ? "default" : "destructive"}>
                {user ? "Authenticated" : "Not Logged In"}
              </Badge>
            </div>
            <div className="text-center">
              <div className="font-semibold">Email</div>
              <div className="text-sm text-muted-foreground">
                {user?.email || "N/A"}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Profile</div>
              <Badge variant={profile ? "default" : "secondary"}>
                {profile ? "Loaded" : "Missing"}
              </Badge>
            </div>
            <div className="text-center">
              <div className="font-semibold">Admin Status</div>
              <Badge variant={isAdmin ? "default" : "destructive"}>
                {isAdmin ? "Admin" : "Not Admin"}
              </Badge>
            </div>
          </div>

          {profile && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Profile Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Role:</strong> {profile.role || "Not set"}</div>
                <div><strong>Name:</strong> {profile.full_name || "Not set"}</div>
                <div><strong>MFA:</strong> {mfaEnabled ? "Enabled" : "Disabled"}</div>
                <div><strong>Wallet User:</strong> {isWalletUser ? "Yes" : "No"}</div>
              </div>
            </div>
          )}

          {error && (
            <Alert className="border-destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Authentication Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={runTests} 
              disabled={isTestingRunning}
              className="flex items-center"
            >
              {isTestingRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Run Comprehensive Tests
            </Button>
            
            <Button 
              onClick={quickAdminTest} 
              disabled={isTestingRunning}
              variant="outline"
              className="flex items-center"
            >
              <Shield className="h-4 w-4 mr-2" />
              Quick Admin Check
            </Button>
            
            <Button 
              onClick={refreshAuth} 
              disabled={isTestingRunning}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Auth
            </Button>
          </div>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> For complete testing, the database migration should be applied. 
              However, these tests will show if the frontend fixes are working correctly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Results */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Verification Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="font-semibold">Overall Success</div>
                {verificationResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mx-auto" />
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold">Profile Exists</div>
                {verificationResult.profileExists ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mx-auto" />
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold">Admin Role</div>
                {verificationResult.isAdmin ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mx-auto" />
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold">Role Value</div>
                <Badge variant={verificationResult.role === 'admin' ? 'default' : 'secondary'}>
                  {verificationResult.role || 'None'}
                </Badge>
              </div>
            </div>

            {/* Method Results */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Authentication Method Results:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>RPC is_admin</span>
                  <Badge variant={verificationResult.methods.rpcIsAdmin === true ? 'default' : 'destructive'}>
                    {verificationResult.methods.rpcIsAdmin === null ? 'Failed' : 
                     verificationResult.methods.rpcIsAdmin ? 'Success' : 'Denied'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>RPC check_admin_access</span>
                  <Badge variant={verificationResult.methods.rpcCheckAdminAccess === true ? 'default' : 'destructive'}>
                    {verificationResult.methods.rpcCheckAdminAccess === null ? 'Failed' : 
                     verificationResult.methods.rpcCheckAdminAccess ? 'Success' : 'Denied'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>Direct Profile Query</span>
                  <Badge variant={verificationResult.methods.directProfileQuery === true ? 'default' : 'destructive'}>
                    {verificationResult.methods.directProfileQuery === null ? 'Failed' : 
                     verificationResult.methods.directProfileQuery ? 'Success' : 'Denied'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Errors and Recommendations */}
            {verificationResult.errors && verificationResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-destructive mb-2">Errors:</h4>
                <ul className="text-sm space-y-1">
                  {verificationResult.errors.map((error: string, index: number) => (
                    <li key={index} className="text-destructive">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {verificationResult.recommendations && verificationResult.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-blue-600 mb-2">Recommendations:</h4>
                <ul className="text-sm space-y-1">
                  {verificationResult.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-blue-600">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Console Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Console Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <p className="mb-2">Open browser console and run:</p>
            <div className="space-y-1">
              <div>• <code>await window.testAdminAccess.runComprehensive()</code></div>
              <div>• <code>await window.testAdminAccess.testCurrentUser()</code></div>
              <div>• <code>await window.testAdminAccess.testFunctions()</code></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTestPanel;