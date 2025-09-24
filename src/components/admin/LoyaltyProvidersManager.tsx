import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
// import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Building2, Settings, Zap, Star } from "lucide-react";

interface LoyaltyProvider {
  id: string;
  provider_name: string;
  provider_logo_url?: string;
  description?: string;
  conversion_rate: number; // Points per 1 unit of provider currency
  minimum_conversion: number;
  maximum_conversion: number;
  is_active: boolean;
  api_endpoint?: string;
  requires_phone_verification: boolean;
  supported_countries: string[];
  created_at: string;
  updated_at: string;
}

const LoyaltyProvidersManager = () => {
  const { toast } = useToast();
  // const [providers, setProviders] = useState<LoyaltyProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<LoyaltyProvider | null>(null);

  const form = useForm({
    defaultValues: {
      provider_name: "",
      description: "",
      provider_logo_url: "",
      conversion_rate: 1.0,
      minimum_conversion: 100,
      maximum_conversion: 10000,
      is_active: true,
      api_endpoint: "",
      requires_phone_verification: true,
      supported_countries: ["US", "CA", "UK", "AU"]
    },
  });

  // Mock data for demonstration - replace with actual API calls
  const mockProviders: LoyaltyProvider[] = [
    {
      id: "1",
      provider_name: "Starbucks Rewards",
      provider_logo_url: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=100",
      description: "Convert your Starbucks Stars to PointBridge tokens",
      conversion_rate: 0.05, // 1 Star = 0.05 PointBridge tokens
      minimum_conversion: 25,
      maximum_conversion: 2000,
      is_active: true,
      api_endpoint: "https://api.starbucks.com/loyalty",
      requires_phone_verification: true,
      supported_countries: ["US", "CA", "UK"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2", 
      provider_name: "Marriott Bonvoy",
      provider_logo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100",
      description: "Convert your Marriott Bonvoy points to PointBridge tokens",
      conversion_rate: 0.008, // 1 Bonvoy Point = 0.008 PointBridge tokens
      minimum_conversion: 1000,
      maximum_conversion: 100000,
      is_active: true,
      api_endpoint: "https://api.marriott.com/loyalty",
      requires_phone_verification: true,
      supported_countries: ["US", "CA", "UK", "AU", "DE", "FR"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "3",
      provider_name: "American Airlines AAdvantage",
      provider_logo_url: "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=100", 
      description: "Convert your AAdvantage miles to PointBridge tokens",
      conversion_rate: 0.015, // 1 Mile = 0.015 PointBridge tokens
      minimum_conversion: 500,
      maximum_conversion: 50000,
      is_active: true,
      api_endpoint: "https://api.aa.com/loyalty",
      requires_phone_verification: true,
      supported_countries: ["US", "CA", "MX"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      
      // Load from real database
      const { data, error } = await supabase
        .from('loyalty_providers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading loyalty providers:', error);
        setProviders([]);
      } else {
        setProviders(data || []);
      }
      
      console.log('✅ Loyalty providers loaded successfully');
    } catch (error) {
      console.error('Failed to load loyalty providers:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load loyalty providers', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ 
      provider_name: "", 
      description: "", 
      provider_logo_url: "",
      conversion_rate: 1.0, 
      minimum_conversion: 100, 
      maximum_conversion: 10000, 
      is_active: true,
      api_endpoint: "",
      requires_phone_verification: true,
      supported_countries: ["US", "CA", "UK", "AU"]
    });
    setDialogOpen(true);
  };

  const openEdit = (provider: LoyaltyProvider) => {
    setEditing(provider);
    form.reset({
      provider_name: provider.provider_name,
      description: provider.description || "",
      provider_logo_url: provider.provider_logo_url || "",
      conversion_rate: provider.conversion_rate,
      minimum_conversion: provider.minimum_conversion,
      maximum_conversion: provider.maximum_conversion,
      is_active: !!provider.is_active,
      api_endpoint: provider.api_endpoint || "",
      requires_phone_verification: !!provider.requires_phone_verification,
      supported_countries: provider.supported_countries
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: any) => {
    try {
      if (!values.provider_name || values.conversion_rate <= 0) {
        toast({ 
          title: 'Missing fields', 
          description: 'Provider name and conversion rate are required.', 
          variant: 'destructive' 
        });
        return;
      }
      
      const payload = {
        provider_name: values.provider_name.trim(),
        description: values.description?.trim() || null,
        provider_logo_url: values.provider_logo_url?.trim() || null,
        conversion_rate: Number(values.conversion_rate),
        minimum_conversion: Number(values.minimum_conversion) || 100,
        maximum_conversion: Number(values.maximum_conversion) || 10000,
        is_active: !!values.is_active,
        api_endpoint: values.api_endpoint?.trim() || null,
        requires_phone_verification: !!values.requires_phone_verification,
        supported_countries: Array.isArray(values.supported_countries) ? values.supported_countries : ["US"]
      };
      
      if (editing) {
        // TODO: Replace with actual API call
        // const { error } = await supabase
        //   .from('loyalty_providers')
        //   .update(payload)
        //   .eq('id', editing.id);
        
        // For now, update mock data
        setProviders(prev => prev.map(p => 
          p.id === editing.id ? { ...p, ...payload, updated_at: new Date().toISOString() } : p
        ));
        
        toast({ title: 'Updated', description: 'Loyalty provider updated successfully.' });
      } else {
        // TODO: Replace with actual API call
        // const { error } = await supabase
        //   .from('loyalty_providers')
        //   .insert([payload]);
        
        // For now, add to mock data
        const newProvider: LoyaltyProvider = {
          ...payload,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProviders(prev => [newProvider, ...prev]);
        toast({ title: 'Created', description: 'Loyalty provider created successfully.' });
      }
      
      setDialogOpen(false);
      setEditing(null);
    } catch (error: any) {
      console.error('Failed to save loyalty provider:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to save loyalty provider',
        variant: 'destructive' 
      });
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Third-Party Loyalty Providers
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage external loyalty programs that users can link and convert points from
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {editing ? 'Edit Loyalty Provider' : 'Add New Loyalty Provider'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provider_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Starbucks Rewards" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="provider_logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
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
                        <Textarea
                          placeholder="Brief description of the loyalty program and conversion process"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="conversion_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conversion Rate *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.001" 
                            min="0" 
                            placeholder="1.0" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minimum_conversion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Conversion</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maximum_conversion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Conversion</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="api_endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Endpoint (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.provider.com/loyalty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Provider</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Allow users to link and convert from this provider
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requires_phone_verification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Phone Verification Required</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Require phone verification for account linking
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 btn-gradient">
                    <Settings className="w-4 h-4 mr-2" />
                    {editing ? 'Update Provider' : 'Add Provider'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
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
            <Star className="w-5 h-5 text-yellow-500" />
            Available Loyalty Providers
          </CardTitle>
          <CardDescription>
            Third-party loyalty programs that users can link and convert points from
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading providers...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {provider.provider_logo_url && (
                            <img
                              src={provider.provider_logo_url}
                              alt={provider.provider_name}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{provider.provider_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {provider.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-mono text-sm">
                            1 = {provider.conversion_rate} PB
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Min: {provider.minimum_conversion.toLocaleString()}
                          <br />
                          Max: {provider.maximum_conversion.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {provider.supported_countries.slice(0, 3).map(country => (
                            <Badge key={country} variant="outline" className="text-xs">
                              {country}
                            </Badge>
                          ))}
                          {provider.supported_countries.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{provider.supported_countries.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(provider.is_active)}`}>
                          {provider.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEdit(provider)}
                        >
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

export default LoyaltyProvidersManager;
