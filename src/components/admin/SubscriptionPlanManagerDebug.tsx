import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number;
  monthly_points?: number;
  monthly_transactions?: number;
  features?: any;
  trial_days?: number | null;
  is_active: boolean;
  popular?: boolean;
  plan_number?: number;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
}

const SubscriptionPlanManagerDebug = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      monthly_points: 0,
      monthly_transactions: 0,
      features: "[]",
      trial_days: 0,
      is_active: true,
      popular: false,
      plan_number: 0,
      valid_from: "",
      valid_until: "",
    },
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setDebugInfo("Starting to load plans...");
      
      console.log('🔍 Loading subscription plans from public.merchant_subscription_plans...');
      
      // First, let's test the connection
      const { error: testError } = await supabase
        .from('merchant_subscription_plans')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Test query failed:', testError);
        setDebugInfo(`Test query failed: ${testError.message}`);
        throw testError;
      }
      
      setDebugInfo("Test query successful, loading full data...");
      
      // Now load the actual data
      const { data, error } = await supabase
        .from('merchant_subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 Raw data from Supabase:', data);
      console.log('❌ Error from Supabase:', error);
      
      if (error) {
        console.error('Failed to load plans:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        setDebugInfo(`Error: ${error.message} (Code: ${error.code})`);
        
        // Don't set plans to empty array - show the error instead
        toast({ 
          title: 'Database Error', 
          description: `Failed to load plans: ${error.message}`, 
          variant: 'destructive' 
        });
        
        // Set debug info instead of empty plans
        setPlans([]);
      } else {
        console.log('✅ Successfully loaded plans:', data);
        setDebugInfo(`Successfully loaded ${data?.length || 0} plans`);
        setPlans(data || []);
        
        if (!data || data.length === 0) {
          setDebugInfo("No plans found in database");
        }
      }
    } catch (error: any) {
      console.error('Failed to load plans:', error);
      setDebugInfo(`Exception: ${error.message}`);
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred while loading plans', 
        variant: 'destructive' 
      });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ 
      name: "", 
      description: "", 
      price_monthly: 0, 
      price_yearly: 0,
      monthly_points: 0,
      monthly_transactions: 0,
      features: "[]", 
      trial_days: 0, 
      is_active: true,
      popular: false,
      plan_number: 0,
      valid_from: "",
      valid_until: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    form.reset({
      name: plan.name,
      description: plan.description || "",
      price_monthly: Number(plan.price_monthly) || 0,
      price_yearly: Number(plan.price_yearly) || 0,
      monthly_points: Number(plan.monthly_points) || 0,
      monthly_transactions: Number(plan.monthly_transactions) || 0,
      features: plan.features ? JSON.stringify(plan.features) : "[]",
      trial_days: plan.trial_days || 0,
      is_active: !!plan.is_active,
      popular: !!plan.popular,
      plan_number: Number(plan.plan_number) || 0,
      valid_from: plan.valid_from ? new Date(plan.valid_from).toISOString().slice(0, 16) : "",
      valid_until: plan.valid_until ? new Date(plan.valid_until).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: any) => {
    try {
      if (!values.name?.trim()) {
        toast({ title: 'Missing Information', description: 'Plan name is required.', variant: 'destructive' });
        return;
      }

      // Parse features JSON
      let features = [];
      try {
        features = values.features ? JSON.parse(values.features) : [];
      } catch (parseError) {
        console.error('Error parsing features JSON:', parseError);
        toast({ title: 'Invalid Features', description: 'Features must be valid JSON format.', variant: 'destructive' });
        return;
      }

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        price_monthly: Number(values.price_monthly) || 0,
        price_yearly: Number(values.price_yearly) || 0,
        monthly_points: Number(values.monthly_points) || 0,
        monthly_transactions: Number(values.monthly_transactions) || 0,
        features: features,
        trial_days: Number(values.trial_days) || 0,
        is_active: !!values.is_active,
        popular: !!values.popular,
        plan_number: Number(values.plan_number) || 0,
        valid_from: values.valid_from ? new Date(values.valid_from).toISOString() : null,
        valid_until: values.valid_until ? new Date(values.valid_until).toISOString() : null,
      };

      if (editing) {
        const { error } = await supabase
          .from('merchant_subscription_plans')
          .update(payload)
          .eq('id', editing.id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({ title: 'Updated', description: 'Plan updated successfully.' });
      } else {
        const { error } = await supabase
          .from('merchant_subscription_plans')
          .insert([payload]);
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        toast({ title: 'Created', description: 'Plan created successfully.' });
      }
      setDialogOpen(false);
      setEditing(null);
      await loadPlans();
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      const errorMessage = error?.message || 'Failed to save plan';
      toast({ 
        title: 'Error', 
        description: `Failed to save plan: ${errorMessage}`,
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Subscription Plans (Debug Version)
        </h3>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Plan
        </Button>
      </div>

      {/* Debug Information */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            Debug Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Status:</strong> {loading ? 'Loading...' : 'Loaded'}</p>
            <p><strong>Plans Count:</strong> {plans.length}</p>
            <p><strong>Debug Info:</strong> {debugInfo}</p>
            <p><strong>Current User:</strong> {supabase.auth.getUser() ? 'Authenticated' : 'Not authenticated'}</p>
            <Button onClick={loadPlans} variant="outline" size="sm">
              Reload Plans
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Plans
          </CardTitle>
          <CardDescription>Create, update, and toggle active subscription plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No plans found or error loading plans.</p>
              <p className="text-sm text-muted-foreground mt-2">Check debug information above.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Points/Txns</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">{p.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">${Number(p.price_monthly).toFixed(2)}/mo</div>
                          {p.price_yearly && p.price_yearly > 0 && (
                            <div className="text-xs text-muted-foreground">${Number(p.price_yearly).toFixed(2)}/yr</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>{p.monthly_points || 0} points</div>
                          <div>{p.monthly_transactions || 0} txns</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {p.valid_from && (
                            <div className="text-xs">From: {new Date(p.valid_from).toLocaleDateString()}</div>
                          )}
                          {p.valid_until && (
                            <div className="text-xs">Until: {new Date(p.valid_until).toLocaleDateString()}</div>
                          )}
                          {!p.valid_from && !p.valid_until && (
                            <div className="text-xs text-muted-foreground">Always valid</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? 'default' : 'secondary'}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.popular ? (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            Popular
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for creating/editing plans - same as original */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Form fields - same as original component */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., StartUp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plan_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Number</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} placeholder="1" {...field} />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">Display order (1-5)</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  name="price_yearly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Price</FormLabel>
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
                  name="monthly_points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Points</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthly_transactions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Transactions</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="popular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-4 w-4 rounded border border-input"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Mark as Popular Plan
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        This plan will be highlighted with a "Popular" badge in the merchant signup modal
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {editing ? 'Update Plan' : 'Create Plan'}
                </Button>
                <Button type="button" onClick={() => setDialogOpen(false)} className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlanManagerDebug;


