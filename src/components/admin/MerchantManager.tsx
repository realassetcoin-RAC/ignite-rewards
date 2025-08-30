import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit2, CreditCard, Calendar, Plus, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface MerchantManagerProps {
  onStatsUpdate: () => void;
}

const MerchantManager = ({ onStatsUpdate }: MerchantManagerProps) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
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
      subscription_plan: "",
      subscription_start_date: "",
      subscription_end_date: ""
    }
  });

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      
      // First check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please sign in to access admin features",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await (supabase as any)
        .from('api.merchants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading merchants:', error);
        if (error.code === 'PGRST301') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view merchants. Admin access required.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to load merchants: ${error.message}`,
            variant: "destructive",
          });
        }
        return;
      }

      setMerchants(data || []);
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
        const merchantData = {
          ...data,
          user_id: crypto.randomUUID(), // In production, this should be selected from existing users
        };

        const { error } = await (supabase as any)
          .from("api.merchants")
          .insert([merchantData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Merchant created successfully"
        });
      } else if (selectedMerchant) {
        const updateData = {
          business_name: data.business_name,
          business_type: data.business_type,
          contact_email: data.contact_email,
          phone: data.phone,
          city: data.city,
          country: data.country,
          status: data.status,
          subscription_plan: data.subscription_plan,
          subscription_start_date: data.subscription_start_date || null,
          subscription_end_date: data.subscription_end_date || null
        };

        const { error } = await (supabase as any)
          .from("api.merchants")
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
      subscription_plan: merchant.subscription_plan || "",
      subscription_start_date: merchant.subscription_start_date?.split('T')[0] || "",
      subscription_end_date: merchant.subscription_end_date?.split('T')[0] || ""
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
      subscription_plan: "",
      subscription_start_date: "",
      subscription_end_date: ""
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
    <TooltipProvider>
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

          {selectedMerchant && (
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="business_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Business Name
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>The official registered name of the business</p>
                                  </TooltipContent>
                                </Tooltip>
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
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Type of business (e.g., Retail, Restaurant, E-commerce)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter business type" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contact_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Contact Email
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Primary business contact email address</p>
                                  </TooltipContent>
                                </Tooltip>
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
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Business contact phone number</p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                City
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>City where the business is located</p>
                                  </TooltipContent>
                                </Tooltip>
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
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Country where the business is registered</p>
                                  </TooltipContent>
                                </Tooltip>
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Status
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Current merchant account status</p>
                                  </TooltipContent>
                                </Tooltip>
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
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>The subscription plan assigned to this merchant</p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">No Plan</SelectItem>
                                  <SelectItem value="basic">Basic (Free)</SelectItem>
                                  <SelectItem value="premium">Premium - $99/month</SelectItem>
                                  <SelectItem value="enterprise">Enterprise - $299/month</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="subscription_start_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Subscription Start Date
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>When the subscription begins</p>
                                  </TooltipContent>
                                </Tooltip>
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
                          name="subscription_end_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Subscription End Date
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-3 h-3" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>When the subscription expires (optional)</p>
                                  </TooltipContent>
                                </Tooltip>
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
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
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
    </TooltipProvider>
  );
};

export default MerchantManager;