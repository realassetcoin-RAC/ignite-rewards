import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { verifyAdminAccess, robustAdminCheck } from '@/utils/adminVerification';
// import { supabase } from '@/integrations/supabase/client';

const AdminDebug = () => {
  const { user, profile, isAdmin, loading, error } = useSecureAuth();
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    console.log('🔍 Starting comprehensive admin debug test...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      user: null,
      profile: null,
      isAdmin: null,
      adminVerification: null,
      robustCheck: null,
      rpcTests: {},
      profileQuery: null,
      knownAdminCheck: null
    };

    try {
      // 1. Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      results.user = {
        email: currentUser?.email,
        id: currentUser?.id,
        error: userError?.message
      };

      // 2. Test profile from useSecureAuth
      results.profile = profile;
      results.isAdmin = isAdmin;

      // 3. Test admin verification
      try {
        const verification = await verifyAdminAccess();
        results.adminVerification = verification;
      } catch (error) {
        results.adminVerification = { error: error.message };
      }

      // 4. Test robust admin check
      try {
        const robustResult = await robustAdminCheck();
        results.robustCheck = robustResult;
      } catch (error) {
        results.robustCheck = { error: error.message };
      }

      // 5. Test individual RPC functions
      try {
        const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
        results.rpcTests.is_admin = { data: isAdminData, error: isAdminError?.message };
      } catch (error) {
        results.rpcTests.is_admin = { error: error.message };
      }

      try {
        const { data: checkAdminData, error: checkAdminError } = await supabase.rpc('check_admin_access');
        results.rpcTests.check_admin_access = { data: checkAdminData, error: checkAdminError?.message };
      } catch (error) {
        results.rpcTests.check_admin_access = { error: error.message };
      }

      // 6. Test direct profile query
      if (currentUser?.id) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, role, full_name')
            .eq('id', currentUser.id)
            .single();
          results.profileQuery = { data: profileData, error: profileError?.message };
        } catch (error) {
          results.profileQuery = { error: error.message };
        }
      }

      // 7. Test known admin email check
      if (currentUser?.email) {
        const knownAdminEmails = ['realassetcoin@gmail.com'];
        results.knownAdminCheck = {
          userEmail: currentUser.email,
          knownEmails: knownAdminEmails,
          isKnownAdmin: knownAdminEmails.includes(currentUser.email.toLowerCase())
        };
      }

      setDebugResults(results);
      console.log('Debug results:', results);

    } catch (error) {
      console.error('Debug test failed:', error);
      results.error = error.message;
      setDebugResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run test when component mounts and user is available
    if (user && !debugResults && !isRunning) {
      runComprehensiveTest();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Authentication Debug Panel</CardTitle>
            <CardDescription>
              This page helps debug admin authentication issues and routing problems.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong>User Status:</strong>
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? "Logged In" : "Not Logged In"}
                </Badge>
              </div>
              <div>
                <strong>Admin Status:</strong>
                <Badge variant={isAdmin ? "default" : "destructive"}>
                  {isAdmin ? "Admin" : "Not Admin"}
                </Badge>
              </div>
              <div>
                <strong>Profile Role:</strong>
                <Badge variant="outline">
                  {profile?.role || "Unknown"}
                </Badge>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                <strong>Authentication Error:</strong> {error}
              </div>
            )}

            <Button onClick={runComprehensiveTest} disabled={isRunning}>
              {isRunning ? "Running Tests..." : "Run Comprehensive Test"}
            </Button>
          </CardContent>
        </Card>

        {debugResults && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
              <CardDescription>
                Comprehensive test results for admin authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Current User</h3>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugResults.user, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">useSecureAuth Hook Results</h3>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify({
                      profile: debugResults.profile,
                      isAdmin: debugResults.isAdmin
                    }, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Admin Verification Result</h3>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugResults.adminVerification, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Robust Admin Check</h3>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugResults.robustCheck, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">RPC Function Tests</h3>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugResults.rpcTests, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Direct Profile Query</h3>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugResults.profileQuery, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Known Admin Email Check</h3>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugResults.knownAdminCheck, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Expected Routing Decision</h3>
                  <div className="bg-muted p-3 rounded">
                    {debugResults.isAdmin || debugResults.robustCheck ? (
                      <Badge variant="default">Should redirect to /admin-panel</Badge>
                    ) : (
                      <Badge variant="destructive">Will redirect to /user dashboard</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDebug;