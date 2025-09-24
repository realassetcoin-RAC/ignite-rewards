import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SimpleSubscriptionTest = () => {
  const [result, setResult] = useState<string>("Not tested yet");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("Testing...");
    
    try {
      console.log("🔍 Testing Supabase connection...");
      
      // Test 1: Basic connection
        const { error } = await supabase
        .from('merchant_subscription_plans')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error("❌ Error:", error);
        setResult(`ERROR: ${error.message} (Code: ${error.code})`);
      } else {
        console.log("✅ Connection successful");
        
        // Test 2: Get actual data
        const { data: plans, error: plansError } = await supabase
          .from('merchant_subscription_plans')
          .select('id, name, price_monthly, is_active')
          .limit(5);
        
        if (plansError) {
          console.error("❌ Plans error:", plansError);
          setResult(`PLANS ERROR: ${plansError.message}`);
        } else {
          console.log("✅ Plans loaded:", plans);
          setResult(`SUCCESS: Found ${plans?.length || 0} plans. First plan: ${plans?.[0]?.name || 'None'}`);
        }
      }
    } catch (err: any) {
      console.error("❌ Exception:", err);
      setResult(`EXCEPTION: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simple Subscription Plans Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p><strong>Test Result:</strong> {result}</p>
          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Again"}
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Check the browser console (F12) for detailed logs.</p>
            <p>This component tests the basic Supabase connection and data retrieval.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleSubscriptionTest;


