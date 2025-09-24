import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit2, CreditCard, Calendar, Plus, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import CustomTooltip from "@/components/ui/custom-tooltip";

interface Merchant {
  id: string;
  business_name: string;
  business_type: string;
  contact_email: string;
  phone: string;
  city: string;
  country: string;
  subscription_plan: string;
  status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  monthly_points: number;
  monthly_transactions: number;
  is_active: boolean;
}

interface MerchantManagerProps {
  onStatsUpdate: () => void;
}

const MerchantManager = ({ onStatsUpdate }: MerchantManagerProps) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | "create">("view");
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      business_name: "",
      business_type: "",
      contact_email: "",
      phone: "",
      city: "",
      country: "",
      status: "pending",
      subscription_plan: "none",
      subscription_start_date: new Date().toISOString().split('T')[0], // ✅ IMPLEMENT REQUIREMENT: Default to current date
      subscription_end_date: "",
      free_trial_months: "0"
    }
  });

  useEffect(() => {
    loadMerchants();
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('plan_number', { ascending: true });
      
      if (error) {
        console.error('Failed to load subscription plans:', error);
        
        // Provide specific error message for PGRST002
        if (error.code === 'PGRST002') {
          toast({ 
            title: 'Database Temporarily Unavailable', 
            description: 'Supabase is experiencing schema cache issues. Please try again in a few minutes.', 
            variant: 'destructive' 
          });
        } else {
          toast({ 
            title: 'Error', 
            description: `Failed to load subscription plans: ${error.message}`, 
            variant: 'destructive' 
          });
        }
        return;
      }
      
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const loadMerchants = async () => {
    try {
      setLoading(true);
      
      // Use enhanced loading with fallback methods
      const { loadMerchants } = await import('@/utils/enhancedAdminLoading');
      const result = await loadMerchants();
      
      if (result.success) {
        setMerchants(result.data || []);
        if (result.data && result.data.length === 0) {
          console.log('No merchants found, but loading was successful');
        }
        console.log(`✅ Merchants loaded from ${result.source}`);
      } else {
        console.error('Failed to load merchants:', result.errors);
        toast({
          title: "Loading Error",
          description: result.message || "Failed to load merchants",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading merchants:', error);
      toast({
        title: "Error",
        description: "Failed to load merchants. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (viewMode === "create") {
        // For new merchants, we need a user_id - in a real app this would come from user selection
        // For demo purposes, we'll use a placeholder
        const trialMonthsNum = Number(data.free_trial_months || 0);
        const startDate = data.subscription_start_date || new Date().toISOString().split('T')[0];
        const endDate = trialMonthsNum > 0
          ? new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + trialMonthsNum)).toISOString()
          : (data.subscription_end_date || null);

        const merchantData = {
          ...data,
          user_id: crypto.randomUUID(), // In production, this should be selected from existing users
          subscription_start_date: startDate,
          subscription_end_date: endDate,
          subscription_plan: data.subscription_plan === "none" ? null : data.subscription_plan,
        };

        const { error } = await supabase
          .from("merchants")
          .insert([merchantData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Merchant created successfully"
        });
      } else if (selectedMerchant) {
        const trialMonthsNum = Number(data.free_trial_months || 0);
        const startDate = data.subscription_start_date || selectedMerchant.subscription_start_date || new Date().toISOString().split('T')[0];
        const endDate = trialMonthsNum > 0
          ? new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + trialMonthsNum)).toISOString()
          : (data.subscription_end_date || null);

        const updateData = {
          business_name: data.business_name,
          business_type: data.business_type,
          contact_email: data.contact_email,
          phone: data.phone,
          city: data.city,
          country: data.country,
          status: data.status,
          subscription_plan: data.subscription_plan === "none" ? null : data.subscription_plan,
          subscription_start_date: startDate,
          subscription_end_date: endDate
        };

        const { error } = await supabase
          .from("merchants")
          .update(updateData)
          .eq("id", selectedMerchant.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Merchant updated successfully"
        });
      }

      setDialogOpen(false);
      setSelectedMerchant(null);
      loadMerchants();
      onStatsUpdate();
    } catch (error) {
      console.error("Failed to save merchant:", error);
      toast({
        title: "Error",
        description: "Failed to save merchant",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !selectedMerchant) return;
      const fileExt = file.name.split('.').pop();
      const path = `merchant-logos/${selectedMerchant.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(path, file, {
        cacheControl: '3600', upsert: true
      });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (publicUrl) {
        const { error } = await supabase.from('merchants').update({ logo_url: publicUrl }).eq('id', selectedMerchant.id);
        if (error) throw error;
        toast({ title: 'Logo Updated', description: 'Merchant logo uploaded successfully.' });
        await loadMerchants();
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
      toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
    }
  };

  const handleViewMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setViewMode("view");
    setDialogOpen(true);
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setViewMode("edit");
    form.reset({
      business_name: merchant.business_name,
      business_type: merchant.business_type,
      contact_email: merchant.contact_email,
      phone: merchant.phone,
      city: merchant.city,
      country: merchant.country,
      status: merchant.status,
      subscription_plan: merchant.subscription_plan || "none",
      subscription_start_date: merchant.subscription_start_date?.split('T')[0] || "",
      subscription_end_date: merchant.subscription_end_date?.split('T')[0] || "",
      free_trial_months: "0"
    });
    setDialogOpen(true);
  };

  const handleCreateMerchant = () => {
    setSelectedMerchant(null);
    setViewMode("create");
    form.reset({
      business_name: "",
      business_type: "",
      contact_email: "",
      phone: "",
      city: "",
      country: "",
      status: "pending",
      subscription_plan: "none",
      subscription_start_date: "",
      subscription_end_date: "",
      free_trial_months: "0"
    });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": return "secondary";
      case "suspended": return "destructive";
      case "cancelled": return "outline";
      default: return "secondary";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "basic": return "secondary";
      case "premium": return "default";
      case "enterprise": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Merchants</h3>
          <Button onClick={handleCreateMerchant}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Merchant
          </Button>
        </div>

      {loading ? (
        <div className="text-center py-8">Loading merchants...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Merchant ID</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{merchant.business_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {merchant.business_type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(merchant.id);
                        toast({
                          title: "Copied",
                          description: "Merchant ID copied to clipboard",
                        });
                      }}
                      title="Click to copy full ID"
                    >
                      {merchant.id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click to copy full ID
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{merchant.profiles?.full_name || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">
                        {merchant.contact_email || merchant.profiles?.email || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {merchant.city && merchant.country 
                        ? `${merchant.city}, ${merchant.country}`
                        : "Not specified"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {merchant.subscription_plan ? (
                      <Badge variant={getPlanColor(merchant.subscription_plan)} className="capitalize">
                        {merchant.subscription_plan}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No plan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(merchant.status)} className="capitalize">
                      {merchant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(merchant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewMerchant(merchant)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditMerchant(merchant)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "view" ? "Merchant Details" : 
               viewMode === "edit" ? "Edit Merchant" : "Create New Merchant"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "view" 
                ? "View merchant information and subscription details"
                : viewMode === "edit"
                ? "Update merchant information and subscription settings"
                : "Create a new merchant with business details and subscription"
              }
            </DialogDescription>
          </DialogHeader>

          {(selectedMerchant || viewMode === "create") && (
            <div className="space-y-6">
              {viewMode === "view" ? (
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Business Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Logo</label>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {selectedMerchant.logo_url ? (
                              <img src={selectedMerchant.logo_url} alt={selectedMerchant.business_name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <label className="cursor-pointer text-sm px-3 py-2 border rounded">
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                        <div>{selectedMerchant.business_name}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <div>{selectedMerchant.business_type || "Not specified"}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact</label>
                        <div>{selectedMerchant.contact_email || "Not specified"}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <div>{selectedMerchant.phone || "Not specified"}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <div>
                          {selectedMerchant.city && selectedMerchant.country 
                            ? `${selectedMerchant.city}, ${selectedMerchant.country}`
                            : "Not specified"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Subscription Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div>
                          <Badge variant={getStatusColor(selectedMerchant.status)} className="capitalize">
                            {selectedMerchant.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Plan</label>
                        <div>
                          {selectedMerchant.subscription_plan ? (
                            <Badge variant={getPlanColor(selectedMerchant.subscription_plan)} className="capitalize">
                              {selectedMerchant.subscription_plan}
                            </Badge>
                          ) : (
                            "No active plan"
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                        <div>
                          {selectedMerchant.subscription_start_date 
                            ? new Date(selectedMerchant.subscription_start_date).toLocaleDateString()
                            : "Not set"}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">End Date</label>
                        <div>
                          {selectedMerchant.subscription_end_date 
                            ? new Date(selectedMerchant.subscription_end_date).toLocaleDateString()
                            : "Not set"}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Registered</label>
                        <div>{new Date(selectedMerchant.created_at).toLocaleDateString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Business Information Section */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Business Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="business_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Business Name
                                <CustomTooltip content="The official registered name of the business" />
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter business name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="business_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Business Type
                                <CustomTooltip content="Type of business (e.g., Retail, Restaurant, E-commerce)" />
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter business type" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contact_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Contact Email
                                <CustomTooltip content="Primary business contact email address" />
                              </FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="business@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Phone Number
                                <CustomTooltip content="Business contact phone number" />
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                City
                                <CustomTooltip content="City where the business is located" />
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Country
                                <CustomTooltip content="Country where the business is registered" />
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Subscription Section */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Subscription Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Status
                                <CustomTooltip content="Current merchant account status" />
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="suspended">Suspended</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subscription_plan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Subscription Plan
                                <CustomTooltip content="The subscription plan assigned to this merchant" />
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">No Plan</SelectItem>
                                  {subscriptionPlans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.name}>
                                      {plan.name} - ${plan.price_monthly} /<span className="text-sm">mo</span>
                                      {plan.monthly_points > 0 && ` (${plan.monthly_points} points, ${plan.monthly_transactions} transactions)`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="subscription_start_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Subscription Start Date
                                <CustomTooltip content="When the subscription begins (cannot be in the past)" />
                              </FormLabel>
                              <FormControl>
                                <input 
                                  type="date" 
                                  min={new Date().toISOString().split('T')[0]} // ✅ IMPLEMENT REQUIREMENT: No past date selection
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground">
                                Start date defaults to today. Past dates are not allowed.
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subscription_end_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Subscription End Date
                                <CustomTooltip content="When the subscription expires (optional)" />
                              </FormLabel>
                              <FormControl>
                                <input 
                                  type="date" 
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="free_trial_months"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Free Trial
                                <CustomTooltip content="Assign a 1–3 month free trial" />
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">No Trial</SelectItem>
                                  <SelectItem value="1">1 Month</SelectItem>
                                  <SelectItem value="2">2 Months</SelectItem>
                                  <SelectItem value="3">3 Months</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                        {viewMode === "create" ? "Create Merchant" : "Update Merchant"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
  );
};

export default MerchantManager;