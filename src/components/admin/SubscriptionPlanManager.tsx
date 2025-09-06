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

const SubscriptionPlanManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Plan | null>(null);

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
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading subscription plans from api.merchant_subscription_plans...');
      const { data, error } = await supabase
        .from('merchant_subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to load plans:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Provide more specific error messages
        if (error.message?.includes('permission denied')) {
          toast({ 
            title: 'Access Denied', 
            description: 'You don\'t have permission to view subscription plans. Please contact an administrator.', 
            variant: 'destructive' 
          });
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          toast({ 
            title: 'Database Error', 
            description: 'The subscription plans table is not properly configured. Please run the database migrations.', 
            variant: 'destructive' 
          });
        } else if (error.message?.includes('schema must be one of the following')) {
          toast({ 
            title: 'Configuration Error', 
            description: 'Database schema configuration error. The subscription plans feature may not be properly set up.', 
            variant: 'destructive' 
          });
        } else {
          toast({ 
            title: 'Error', 
            description: `Failed to load plans: ${error.message}`, 
            variant: 'destructive' 
          });
        }
        
        // Still show empty state instead of crashing
        setPlans([]);
      } else {
        setPlans(data || []);
      }
    } catch (error: any) {
      console.error('Failed to load plans:', error);
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
    form.reset({ name: "", description: "", price_monthly: 0, features: "[]", trial_days: 0, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
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
        features: features,
        trial_days: Number(values.trial_days) || 0,
        is_active: !!values.is_active,
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
          Subscription Plans
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
            <DollarSign className="w-5 h-5" /> Plans
          </CardTitle>
          <CardDescription>Create, update, and toggle active subscription plans.</CardDescription>
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
                  {plans.map((p) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPlanManager;

