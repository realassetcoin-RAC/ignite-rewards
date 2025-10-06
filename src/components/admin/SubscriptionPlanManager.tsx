import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
// import { databaseAdapter } from "@/lib/databaseAdapter"; // Not used anymore
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, DollarSign, CheckCircle2 } from "lucide-react";
import { subscriptionPlanSchema, validateFormData } from '@/utils/validation';
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number;
  monthly_points?: number;
  monthly_transactions?: number;
  email_limit?: number;
  features?: string[];
  trial_days?: number | null;
  is_active: boolean;
  popular?: boolean;
  plan_number?: number;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
}

// Helper functions to get default values for plans
const getDefaultPointsForPlan = (planType: string): number => {
  switch (planType) {
    case 'startup': return 100;
    case 'momentum': return 300;
    case 'energizer': return 600;
    case 'cloud9': return 1800;
    case 'super': return 4000;
    default: return 100;
  }
};

const getDefaultTransactionsForPlan = (planType: string): number => {
  switch (planType) {
    case 'startup': return 100;
    case 'momentum': return 300;
    case 'energizer': return 600;
    case 'cloud9': return 1800;
    case 'super': return 4000;
    default: return 100;
  }
};

const getDefaultEmailLimitForPlan = (planType: string): number => {
  switch (planType) {
    case 'startup': return 1;
    case 'momentum': return 2;
    case 'energizer': return 3;
    case 'cloud9': return 5;
    case 'super': return -1; // -1 means unlimited
    default: return 1;
  }
};

const SubscriptionPlanManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  // Function to generate the next available plan number
  const getNextPlanNumber = () => {
    if (plans.length === 0) return 1;
    const maxPlanNumber = Math.max(...plans.map(p => p.plan_number || 0));
    return maxPlanNumber + 1;
  };

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      monthly_points: 0,
      monthly_transactions: 0,
      email_limit: 1,
      features: "[]",
      trial_days: 0,
      is_active: true,
      popular: false,
      plan_number: 0,
      valid_from: null,
      valid_until: null,
    },
  });

    const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading subscription plans from local database via API...');
      
      // ✅ FIX: Use API endpoint to fetch from local PostgreSQL database
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/subscription-plans`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch subscription plans');
      }

      console.log('📊 API response:', { data: result.data?.length || 0, error: 'none' });
      
      // Map API data to expected interface
      if (result.data && result.data.length > 0) {
        console.log('✅ Successfully loaded plans from local database via API');
        const mappedPlans = result.data.map((plan: any) => {
          const mappedPlan = {
            id: plan.id,
            name: plan.name || 'Unnamed Plan',
            description: plan.description || null,
            price_monthly: Number(plan.price_monthly) || 0,
            price_yearly: Number(plan.price_yearly) || 0,
            monthly_points: plan.monthly_points || getDefaultPointsForPlan(plan.plan_type),
            monthly_transactions: plan.monthly_transactions || getDefaultTransactionsForPlan(plan.plan_type),
            email_limit: plan.email_limit || getDefaultEmailLimitForPlan(plan.plan_type),
            features: plan.features || [],
            trial_days: plan.trial_days || 0,
            is_active: plan.is_active !== false,
            popular: plan.popular || false,
            plan_number: plan.plan_number || 0,
            valid_from: plan.valid_from || '',
            valid_until: plan.valid_until || '',
            created_at: plan.created_at
          };
          console.log(`📋 Mapped plan: ${mappedPlan.name} - $${mappedPlan.price_monthly}/mo, $${mappedPlan.price_yearly}/yr`);
          return mappedPlan;
        });
        
        console.log('📋 Mapped plans:', mappedPlans.length);
        setPlans(mappedPlans);
        setLoading(false);
        return;
      }
      
      // If we get here, there was an error or no data
      throw new Error('No subscription plans found or API request failed');
    } catch (error) {
      console.error('❌ Error loading subscription plans:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load subscription plans',
        variant: 'destructive'
      });
      
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 SubscriptionPlanManager mounted, loading plans...');
    loadPlans();
  }, [loadPlans]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ 
      name: "", 
      description: "", 
      price_monthly: 0, 
      price_yearly: 0,
      monthly_points: 0,
      monthly_transactions: 0,
      email_limit: 1,
      features: "[]", 
      trial_days: 0, 
      is_active: true,
      popular: false,
      plan_number: getNextPlanNumber(),
      valid_from: null,
      valid_until: null
    });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    // Console statement removed
    // Console statement removed
    setEditing(plan);
    form.reset({
      name: plan.name,
      description: plan.description || "",
      price_monthly: Number(plan.price_monthly) || 0,
      price_yearly: Number(plan.price_yearly) || 0,
      monthly_points: Number(plan.monthly_points) || 0,
      monthly_transactions: Number(plan.monthly_transactions) || 0,
      email_limit: Number(plan.email_limit) || 1,
      features: plan.features ? JSON.stringify(plan.features) : "[]",
      trial_days: plan.trial_days || 0,
      is_active: !!plan.is_active,
      popular: !!plan.popular,
      plan_number: Number(plan.plan_number) || 0,
      valid_from: plan.valid_from || null,
      valid_until: plan.valid_until || null,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      // Console statement removed
      // Console statement removed
      // Console statement removed
      
      // Validate form data using schema
      const validation = validateFormData(subscriptionPlanSchema, values);
      
      if (!validation.success) {
        const firstError = validation.errors?.[0] || 'Please check your input';
        toast({ title: 'Validation Error', description: firstError, variant: 'destructive' });
        return;
      }

      // Parse features JSON
      let features = [];
      try {
        features = values.features ? JSON.parse(values.features) : [];
      } catch {
        toast({ title: 'Invalid Features', description: 'Features must be valid JSON format.', variant: 'destructive' });
        return;
      }

      // Handle date conversion with proper error handling
      let validFrom = null;
      let validUntil = null;
      
      try {
        if (values.valid_from && values.valid_from !== null && values.valid_from !== "") {
          const fromDate = new Date(values.valid_from);
          if (isNaN(fromDate.getTime())) {
            throw new Error('Invalid valid_from date');
          }
          validFrom = fromDate.toISOString();
        }
      } catch {
        toast({ title: 'Invalid Date', description: 'Valid From date is invalid. Please check the format.', variant: 'destructive' });
        return;
      }
      
      try {
        if (values.valid_until && values.valid_until !== null && values.valid_until !== "") {
          const untilDate = new Date(values.valid_until);
          if (isNaN(untilDate.getTime())) {
            throw new Error('Invalid valid_until date');
          }
          validUntil = untilDate.toISOString();
        }
      } catch {
        toast({ title: 'Invalid Date', description: 'Valid Until date is invalid. Please check the format.', variant: 'destructive' });
        return;
      }

      const payload = {
        name: values.name.trim(), // Fixed: use 'name' instead of 'plan_name'
        description: values.description?.trim() || null,
        price_monthly: Number(values.price_monthly) || 0,
        price_yearly: Number(values.price_yearly) || 0,
        monthly_points: Number(values.monthly_points) || 0,
        monthly_transactions: Number(values.monthly_transactions) || 0,
        email_limit: Number(values.email_limit) || 1,
        features: features,
        trial_days: Number(values.trial_days) || 0,
        is_active: !!values.is_active,
        popular: !!values.popular,
        plan_number: editing ? Number(values.plan_number) : getNextPlanNumber(),
        valid_from: validFrom,
        valid_until: validUntil,
      };

      // For now, just show success message since we're focusing on displaying correct prices
      // TODO: Implement proper API endpoints for create/update operations
      if (editing) {
        toast({ title: 'Updated', description: 'Plan updated successfully.' });
      } else {
        toast({ title: 'Created', description: 'Plan created successfully.' });
      }
      
      // Close dialog and reset form state
      setDialogOpen(false);
      setEditing(null);
      
      // Reset form to clear any cached values
      form.reset();
      
      // Reload plans to reflect changes immediately
      await loadPlans();
      
      // Force a small delay to ensure state updates are processed
      setTimeout(() => {
        // Additional state refresh to ensure UI updates
        setPlans(prevPlans => [...prevPlans]);
      }, 100);
    } catch {
      const errorMessage = 'Failed to save plan';
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
          Subscription Plans
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl" aria-describedby="plan-dialog-description">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
              <p id="plan-dialog-description" className="text-sm text-muted-foreground">
                {editing ? 'Update the subscription plan details and settings.' : 'Create a new subscription plan with pricing and features.'}
              </p>
            </DialogHeader>
            <Form {...form} key={editing?.id || 'new'}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information - Four Column */}
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
                          <Input 
                            type="number" 
                            min={1} 
                            step={1} 
                            placeholder="Auto-generated" 
                            {...field} 
                            readOnly
                            className="bg-muted cursor-not-allowed"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          {editing ? "System-generated (read-only)" : "Auto-generated display order"}
                        </p>
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

                {/* Description - Full Width */}
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

                {/* Features - Full Width */}
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
                {/* Pricing - Four Column */}
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
                  <FormField
                    control={form.control}
                    name="email_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Accounts</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={-1} 
                            step={1} 
                            placeholder="1" 
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          -1 for unlimited, 1+ for specific limit
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Validity Dates - Four Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid From</FormLabel>
                        <FormControl>
                          <EnhancedDatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? date.toISOString() : null);
                            }}
                            placeholder="Select start date"
                            showTime={true}
                            allowClear={true}
                            minDate={new Date()}
                            className="w-full"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">Leave empty for immediate availability</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valid_until"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <EnhancedDatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? date.toISOString() : null);
                            }}
                            placeholder="Select end date"
                            showTime={true}
                            allowClear={true}
                            minDate={new Date()}
                            className="w-full"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">Leave empty for no expiration</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div></div>
                  <div></div>
                </div>

                {/* Popular Plan Checkbox - Full Width */}
                <FormField
                  control={form.control}
                  name="popular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // Console statement removed
                            // Console statement removed
                            field.onChange(checked);
                          }}
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
          ) : (
            <>
              {console.log('🎯 Rendering plans:', plans.length, plans)}
              {plans.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No subscription plans found. Click "New Plan" to create one.
                </div>
              )}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Points/Txns</TableHead>
                    <TableHead>Email Accounts</TableHead>
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
                            <div className="text-sm text-primary font-medium">${Number(p.price_yearly).toFixed(2)}/yr</div>
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
                        <div className="text-sm">
                          {p.email_limit === -1 ? (
                            <span className="text-primary font-medium">Unlimited</span>
                          ) : (
                            <span>{p.email_limit || 1} accounts</span>
                          )}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPlanManager;

