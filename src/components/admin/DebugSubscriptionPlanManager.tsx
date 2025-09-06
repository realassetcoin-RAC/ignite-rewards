import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, DollarSign, CheckCircle2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  features?: any;
  trial_days?: number | null;
  is_active: boolean;
  created_at: string;
}

const DebugSubscriptionPlanManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price_monthly: 0,
      features: "[]",
      trial_days: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    debugAuthAndLoad();
  }, []);

  const debugAuthAndLoad = async () => {
    console.log('🚀 DEBUG: Starting comprehensive authentication and data loading debug...');
    
    try {
      // Step 1: Check authentication
      console.log('🔐 Step 1: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      const authInfo = {
        user: user ? {
          id: user.id,
          email: user.email,
          aud: user.aud,
          role: user.role,
          created_at: user.created_at
        } : null,
        error: authError ? {
          message: authError.message,
          status: authError.status
        } : null
      };
      
      console.log('🔐 Authentication result:', authInfo);
      
      if (authError) {
        console.error('❌ Authentication error:', authError);
        toast({
          title: 'Authentication Error',
          description: `Failed to get user: ${authError.message}`,
          variant: 'destructive'
        });
        return;
      }
      
      if (!user) {
        console.error('❌ No user found');
        toast({
          title: 'Not Authenticated',
          description: 'Please log in to access subscription plans.',
          variant: 'destructive'
        });
        return;
      }

      // Step 2: Check user profile
      console.log('👤 Step 2: Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const profileInfo = {
        profile: profile,
        error: profileError ? {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        } : null
      };

      console.log('👤 Profile result:', profileInfo);

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        toast({
          title: 'Profile Error',
          description: `Failed to load profile: ${profileError.message}`,
          variant: 'destructive'
        });
      }

      // Step 3: Test direct table access
      console.log('🗃️ Step 3: Testing direct table access...');
      
      // Test with different approaches
      const testResults = {};

      // Test 1: Basic select
      try {
        console.log('🧪 Test 1: Basic select query...');
        const { data: basicData, error: basicError } = await supabase
          .from('merchant_subscription_plans')
          .select('*');
        
        testResults.basicSelect = {
          success: !basicError,
          data: basicData,
          error: basicError ? {
            message: basicError.message,
            code: basicError.code,
            details: basicError.details,
            hint: basicError.hint
          } : null,
          count: basicData?.length || 0
        };
        
        console.log('🧪 Basic select result:', testResults.basicSelect);
      } catch (e) {
        console.error('🧪 Basic select exception:', e);
        testResults.basicSelect = { success: false, exception: e.message };
      }

      // Test 2: Count query
      try {
        console.log('🧪 Test 2: Count query...');
        const { count, error: countError } = await supabase
          .from('merchant_subscription_plans')
          .select('*', { count: 'exact', head: true });
        
        testResults.countQuery = {
          success: !countError,
          count: count,
          error: countError ? {
            message: countError.message,
            code: countError.code,
            details: countError.details,
            hint: countError.hint
          } : null
        };
        
        console.log('🧪 Count query result:', testResults.countQuery);
      } catch (e) {
        console.error('🧪 Count query exception:', e);
        testResults.countQuery = { success: false, exception: e.message };
      }

      // Test 3: Single row query
      try {
        console.log('🧪 Test 3: Single row query...');
        const { data: singleData, error: singleError } = await supabase
          .from('merchant_subscription_plans')
          .select('*')
          .limit(1)
          .single();
        
        testResults.singleQuery = {
          success: !singleError,
          data: singleData,
          error: singleError ? {
            message: singleError.message,
            code: singleError.code,
            details: singleError.details,
            hint: singleError.hint
          } : null
        };
        
        console.log('🧪 Single query result:', testResults.singleQuery);
      } catch (e) {
        console.error('🧪 Single query exception:', e);
        testResults.singleQuery = { success: false, exception: e.message };
      }

      // Step 4: Test insert capability
      console.log('🧪 Step 4: Testing insert capability...');
      try {
        const testPlanName = `DEBUG_TEST_${Date.now()}`;
        const { data: insertData, error: insertError } = await supabase
          .from('merchant_subscription_plans')
          .insert([{
            name: testPlanName,
            description: 'Debug test plan - will be deleted',
            price_monthly: 1.00,
            is_active: false
          }])
          .select();

        testResults.insertTest = {
          success: !insertError,
          data: insertData,
          error: insertError ? {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          } : null
        };

        console.log('🧪 Insert test result:', testResults.insertTest);

        // Clean up test record if successful
        if (insertData && insertData.length > 0) {
          await supabase
            .from('merchant_subscription_plans')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Cleaned up test record');
        }
      } catch (e) {
        console.error('🧪 Insert test exception:', e);
        testResults.insertTest = { success: false, exception: e.message };
      }

      // Update debug info
      setDebugInfo({
        timestamp: new Date().toISOString(),
        auth: authInfo,
        profile: profileInfo,
        tests: testResults
      });

      // Step 5: Load actual plans
      await loadPlans();

    } catch (error) {
      console.error('❌ Debug process failed:', error);
      toast({
        title: 'Debug Error',
        description: `Debug process failed: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading subscription plans...');
      
      const { data, error } = await supabase
        .from('merchant_subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 Load plans result:', { data, error });
      
      if (error) {
        console.error('❌ Failed to load plans:', error);
        
        // Enhanced error reporting
        const errorDetails = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          timestamp: new Date().toISOString()
        };
        
        console.error('📊 Detailed error info:', errorDetails);
        
        // Show detailed toast error
        toast({ 
          title: 'Database Error', 
          description: `${error.message} (Code: ${error.code})`, 
          variant: 'destructive' 
        });
        
        setPlans([]);
      } else {
        console.log('✅ Plans loaded successfully:', data?.length || 0, 'plans');
        setPlans(data || []);
        
        if (data && data.length > 0) {
          console.log('📋 Sample plan data:', data[0]);
        }
      }
    } catch (error: any) {
      console.error('❌ Exception during plan loading:', error);
      toast({ 
        title: 'Exception Error', 
        description: `Unexpected error: ${error.message}`, 
        variant: 'destructive' 
      });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: any) => {
    console.log('💾 Attempting to save plan:', values);
    
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        price_monthly: Number(values.price_monthly) || 0,
        features: values.features ? JSON.parse(values.features) : [],
        trial_days: Number(values.trial_days) || 0,
        is_active: !!values.is_active,
      };

      console.log('💾 Payload prepared:', payload);

      if (editing) {
        console.log('✏️ Updating existing plan:', editing.id);
        const { data, error } = await supabase
          .from('merchant_subscription_plans')
          .update(payload)
          .eq('id', editing.id)
          .select();
        
        console.log('✏️ Update result:', { data, error });
        
        if (error) {
          console.error('❌ Update failed:', error);
          throw error;
        }
        toast({ title: 'Updated', description: 'Plan updated successfully.' });
      } else {
        console.log('➕ Creating new plan');
        const { data, error } = await supabase
          .from('merchant_subscription_plans')
          .insert([payload])
          .select();
        
        console.log('➕ Insert result:', { data, error });
        
        if (error) {
          console.error('❌ Insert failed:', error);
          throw error;
        }
        toast({ title: 'Created', description: 'Plan created successfully.' });
      }
      
      setDialogOpen(false);
      setEditing(null);
      await loadPlans();
    } catch (error: any) {
      console.error('❌ Save operation failed:', error);
      const errorMessage = error?.message || 'Failed to save plan';
      toast({ 
        title: 'Save Error', 
        description: `Failed to save plan: ${errorMessage}`,
        variant: 'destructive' 
      });
    }
  };

  const openCreate = () => {
    console.log('➕ Opening create dialog');
    setEditing(null);
    form.reset({ name: "", description: "", price_monthly: 0, features: "[]", trial_days: 0, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    console.log('✏️ Opening edit dialog for plan:', plan.id);
    setEditing(plan);
    form.reset({
      name: plan.name,
      description: plan.description || "",
      price_monthly: Number(plan.price_monthly) || 0,
      features: plan.features ? JSON.stringify(plan.features) : "[]",
      trial_days: plan.trial_days || 0,
      is_active: !!plan.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Debug Information Panel */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">🐛 Debug Information</CardTitle>
          <CardDescription className="text-orange-700">
            Comprehensive debugging data for subscription plans access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono bg-white p-4 rounded border max-h-96 overflow-y-auto">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={debugAuthAndLoad} variant="outline">
              🔄 Re-run Debug
            </Button>
            <Button size="sm" onClick={loadPlans} variant="outline">
              📊 Reload Plans
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Original UI */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Subscription Plans (Debug Mode)
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Basic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features (JSON)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder='["Feature 1", "Feature 2", "Feature 3"]' 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Enter features as a JSON array of strings
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price_monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                            <Input 
                              type="number" 
                              min={0} 
                              step={0.01} 
                              placeholder="0.00"
                              className="pl-8"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trial_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial Days</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={1} placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={field.value ? 'true' : 'false'} onChange={(e) => field.onChange(e.target.value === 'true')}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {editing ? 'Update Plan' : 'Create Plan'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Plans (Debug Mode)
          </CardTitle>
          <CardDescription>Debug version with comprehensive logging and error tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading plans...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Trial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No subscription plans found. Check debug information above for details.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-muted-foreground">{p.description}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">${Number(p.price_monthly).toFixed(2)}</span>
                          <div className="text-xs text-muted-foreground">per month</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {p.features && Array.isArray(p.features) ? (
                              <div className="space-y-1">
                                {p.features.slice(0, 2).map((feature, index) => (
                                  <div key={index} className="text-xs bg-secondary/50 px-2 py-1 rounded">
                                    {feature}
                                  </div>
                                ))}
                                {p.features.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{p.features.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No features</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{p.trial_days || 0} days</TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? 'default' : 'secondary'}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugSubscriptionPlanManager;