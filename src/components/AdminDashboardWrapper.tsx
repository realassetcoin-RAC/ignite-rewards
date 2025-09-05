/**
 * Admin Dashboard Wrapper
 * 
 * This component provides a robust wrapper around admin dashboard functionality
 * with comprehensive error handling, authentication verification, and recovery mechanisms.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { verifyAdminAccess, diagnoseAdminIssues, AdminVerificationResult } from '@/utils/adminVerification';
import { 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Info,
  Settings,
  User
} from 'lucide-react';

interface AdminDashboardWrapperProps {
  children: React.ReactNode;
}

const AdminDashboardWrapper: React.FC<AdminDashboardWrapperProps> = ({ children }) => {
  const { user, profile, isAdmin, loading, error, refreshAuth } = useSecureAuth();
  const [verificationResult, setVerificationResult] = useState<AdminVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const lastVerifiedUserIdRef = useRef<string | null>(null);
  const hasTriggeredVerificationRef = useRef(false);

  // Run comprehensive verification when component mounts or auth state changes
  useEffect(() => {
    if (!loading && user) {
      if (lastVerifiedUserIdRef.current !== user.id) {
        lastVerifiedUserIdRef.current = user.id;
        hasTriggeredVerificationRef.current = false;
      }
      if (!hasTriggeredVerificationRef.current) {
        hasTriggeredVerificationRef.current = true;
        runVerification();
      }
    }
  }, [user?.id, loading]);

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const result = await verifyAdminAccess();
      setVerificationResult(result);
      
      if (!result.success) {
        console.warn('Admin verification failed, running diagnostics...');
        await diagnoseAdminIssues();
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification Error",
        description: "Failed to verify admin access. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshAuth();
      await runVerification();
      toast({
        title: "Refreshed",
        description: "Authentication state has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh authentication. Please try signing in again.",
        variant: "destructive"
      });
    }
  };

  // Show loading state
  if (loading || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {loading ? 'Loading...' : 'Verifying Admin Access...'}
          </h3>
          <p className="text-muted-foreground">
            {loading ? 'Please wait while we authenticate you.' : 'Running comprehensive security checks...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state for authentication failures
  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Authentication Error</CardTitle>
            <CardDescription>
              {error || 'You are not signed in. Please authenticate to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show admin verification results if access is denied
  if (verificationResult && !verificationResult.success && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* Main error card */}
          <Card className="border-destructive">
            <CardHeader className="text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl text-destructive">Admin Access Denied</CardTitle>
              <CardDescription>
                You don't have the necessary permissions to access the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>User:</strong> {verificationResult.email || 'Unknown'}
                </div>
                <div>
                  <strong>Role:</strong> {verificationResult.role || 'Not set'}
                </div>
                <div>
                  <strong>Profile Exists:</strong> 
                  {verificationResult.profileExists ? (
                    <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" />
                  ) : (
                    <XCircle className="inline h-4 w-4 text-red-500 ml-1" />
                  )}
                </div>
                <div>
                  <strong>Admin Status:</strong>
                  {verificationResult.isAdmin ? (
                    <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" />
                  ) : (
                    <XCircle className="inline h-4 w-4 text-red-500 ml-1" />
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={() => setShowDiagnostics(!showDiagnostics)} 
                  variant="outline" 
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostics panel */}
          {showDiagnostics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Diagnostic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Method results */}
                <div>
                  <h4 className="font-semibold mb-2">Authentication Methods:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>RPC is_admin:</span>
                      <Badge variant={verificationResult.methods.rpcIsAdmin === true ? 'default' : 'destructive'}>
                        {verificationResult.methods.rpcIsAdmin === null ? 'Failed' : 
                         verificationResult.methods.rpcIsAdmin ? 'Success' : 'Denied'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>RPC check_admin_access:</span>
                      <Badge variant={verificationResult.methods.rpcCheckAdminAccess === true ? 'default' : 'destructive'}>
                        {verificationResult.methods.rpcCheckAdminAccess === null ? 'Failed' : 
                         verificationResult.methods.rpcCheckAdminAccess ? 'Success' : 'Denied'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Direct Profile Query:</span>
                      <Badge variant={verificationResult.methods.directProfileQuery === true ? 'default' : 'destructive'}>
                        {verificationResult.methods.directProfileQuery === null ? 'Failed' : 
                         verificationResult.methods.directProfileQuery ? 'Success' : 'Denied'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {verificationResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-destructive">Errors:</h4>
                    <ul className="text-sm space-y-1">
                      {verificationResult.errors.map((error, index) => (
                        <li key={index} className="text-destructive">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {verificationResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">Recommendations:</h4>
                    <ul className="text-sm space-y-1">
                      {verificationResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-blue-600">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
            <Button onClick={() => navigate('/auth')} variant="outline">
              Sign Out & Re-authenticate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show success state - render the actual admin dashboard
  if (isAdmin || (verificationResult && verificationResult.success)) {
    return (
      <div className="min-h-screen bg-background">
        {/* Success indicator */}
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <div className="flex items-center justify-center text-sm text-green-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            Admin access verified successfully
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <CardTitle>Access Verification in Progress</CardTitle>
          <CardDescription>
            Please wait while we verify your admin permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Verification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardWrapper;