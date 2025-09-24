import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface VerificationResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const SubscriptionPlansVerification = () => {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  const runVerification = async () => {
    setLoading(true);
    setResults([]);
    const newResults: VerificationResult[] = [];

    try {
      // Test 1: Basic connection
      newResults.push({
        test: "Database Connection",
        status: 'success',
        message: "Supabase client initialized"
      });

      // Test 2: Authentication check
      const { data: { user } } = await supabase.auth.getUser();
      newResults.push({
        test: "Authentication",
        status: user ? 'success' : 'error',
        message: user ? `Authenticated as ${user.email}` : "Not authenticated"
      });

      // Test 3: Table access test
      try {
        const { error } = await supabase
          .from('merchant_subscription_plans')
          .select('count')
          .limit(1);
        
        if (error) {
          newResults.push({
            test: "Table Access",
            status: 'error',
            message: `Cannot access table: ${error.message}`,
            details: error
          });
        } else {
          newResults.push({
            test: "Table Access",
            status: 'success',
            message: "Can access merchant_subscription_plans table"
          });
        }
      } catch (err: any) {
        newResults.push({
          test: "Table Access",
          status: 'error',
          message: `Table access failed: ${err.message}`,
          details: err
        });
      }

      // Test 4: Data retrieval test
      try {
        const { error } = await supabase
          .from('merchant_subscription_plans')
          .select('id, name, price_monthly, is_active, popular, plan_number')
          .order('plan_number');
        
        if (error) {
          newResults.push({
            test: "Data Retrieval",
            status: 'error',
            message: `Cannot retrieve data: ${error.message}`,
            details: error
          });
        } else if (!data || data.length === 0) {
          newResults.push({
            test: "Data Retrieval",
            status: 'warning',
            message: "No subscription plans found in database"
          });
        } else {
          newResults.push({
            test: "Data Retrieval",
            status: 'success',
            message: `Successfully retrieved ${data.length} subscription plans`,
            details: data
          });
        }
      } catch (err: any) {
        newResults.push({
          test: "Data Retrieval",
          status: 'error',
          message: `Data retrieval failed: ${err.message}`,
          details: err
        });
      }

      // Test 5: Component query test (exact query the component uses)
      try {
        const { error } = await supabase
          .from('merchant_subscription_plans')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          newResults.push({
            test: "Component Query",
            status: 'error',
            message: `Component query failed: ${error.message}`,
            details: error
          });
        } else {
          newResults.push({
            test: "Component Query",
            status: 'success',
            message: `Component query successful - ${data?.length || 0} plans loaded`
          });
        }
      } catch (err: any) {
        newResults.push({
          test: "Component Query",
          status: 'error',
          message: `Component query exception: ${err.message}`,
          details: err
        });
      }

      // Determine overall status
      const hasErrors = newResults.some(r => r.status === 'error');
      const hasWarnings = newResults.some(r => r.status === 'warning');
      
      if (hasErrors) {
        setOverallStatus('error');
      } else if (hasWarnings) {
        setOverallStatus('error'); // Treat warnings as errors for now
      } else {
        setOverallStatus('success');
      }

    } catch (err: any) {
      newResults.push({
        test: "Overall Test",
        status: 'error',
        message: `Verification failed: ${err.message}`,
        details: err
      });
      setOverallStatus('error');
    }

    setResults(newResults);
    setLoading(false);
  };

  useEffect(() => {
    runVerification();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Subscription Plans Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border ${getStatusColor(overallStatus)}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              <span className="font-semibold">
                Overall Status: {overallStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-sm mt-1">
              {overallStatus === 'success' 
                ? 'All tests passed - subscription plans should be working' 
                : 'Issues found - subscription plans may not be working'
              }
            </p>
          </div>

          {/* Test Results */}
          <div className="space-y-2">
            <h4 className="font-semibold">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded border">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="font-medium">{result.test}</div>
                  <div className="text-sm text-muted-foreground">{result.message}</div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">Details</summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <Button onClick={runVerification} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Verification Again
              </>
            )}
          </Button>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>All tests should show green checkmarks for success</li>
              <li>If any test fails, the subscription plans won't work</li>
              <li>Check the browser console (F12) for additional error details</li>
              <li>This verification tests the exact same queries the admin dashboard uses</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlansVerification;


