import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit2, Plus, Trash2, Settings, ExternalLink, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useDAOIntegration } from "@/hooks/useDAOIntegration";

interface LoyaltyNetwork {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  api_endpoint: string | null;
  logo_url: string | null;
  is_active: boolean;
  requires_mobile_verification: boolean;
  conversion_rate: number;
  min_conversion_amount: number;
  max_conversion_amount: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface LoyaltyNetworkManagerProps {
  onStatsUpdate: () => void;
}

const LoyaltyNetworkManager = ({ onStatsUpdate }: LoyaltyNetworkManagerProps) => {
  const [networks, setNetworks] = useState<LoyaltyNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<LoyaltyNetwork | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | "create">("view");
  const { toast } = useToast();
  const { createChangeRequest } = useDAOIntegration();

  const form = useForm({
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      api_endpoint: "",
      logo_url: "",
      is_active: true,
      requires_mobile_verification: true,
      conversion_rate: 1.0,
      min_conversion_amount: 100,
      max_conversion_amount: 100000
    }
  });

  useEffect(() => {
    loadNetworks();
  }, []);

  const loadNetworks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loyalty_networks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      console.error('Error loading loyalty networks:', error);
      toast({
        title: "Error",
        description: "Failed to load loyalty networks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (viewMode === "create") {
        const { error } = await supabase
          .from('loyalty_networks')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Loyalty network created successfully",
        });

        // Create DAO proposal for new loyalty network
        await createChangeRequest({
          title: `Add New Loyalty Network: ${data.display_name}`,
          description: `Request to add ${data.display_name} as a new third-party loyalty network with conversion rate ${data.conversion_rate}`,
          changeType: 'loyalty_network_addition',
          priority: 'medium',
          requiresApproval: true,
          metadata: {
            networkName: data.name,
            displayName: data.display_name,
            conversionRate: data.conversion_rate
          }
        });

      } else if (viewMode === "edit" && selectedNetwork) {
        const { error } = await supabase
          .from('loyalty_networks')
          .update(data)
          .eq('id', selectedNetwork.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Loyalty network updated successfully",
        });

        // Create DAO proposal for loyalty network changes
        await createChangeRequest({
          title: `Update Loyalty Network: ${data.display_name}`,
          description: `Request to update ${data.display_name} loyalty network settings`,
          changeType: 'loyalty_network_update',
          priority: 'medium',
          requiresApproval: true,
          metadata: {
            networkId: selectedNetwork.id,
            networkName: data.name,
            displayName: data.display_name,
            conversionRate: data.conversion_rate,
            changes: data
          }
        });
      }

      setDialogOpen(false);
      loadNetworks();
      onStatsUpdate();
    } catch (error) {
      console.error('Error saving loyalty network:', error);
      toast({
        title: "Error",
        description: "Failed to save loyalty network",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (network: LoyaltyNetwork) => {
    if (!confirm(`Are you sure you want to delete ${network.display_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('loyalty_networks')
        .delete()
        .eq('id', network.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Loyalty network deleted successfully",
      });

      // Create DAO proposal for loyalty network removal
      await createChangeRequest({
        title: `Remove Loyalty Network: ${network.display_name}`,
        description: `Request to remove ${network.display_name} from available loyalty networks`,
        changeType: 'loyalty_network_removal',
        priority: 'high',
        requiresApproval: true,
        metadata: {
          networkId: network.id,
          networkName: network.name,
          displayName: network.display_name
        }
      });

      loadNetworks();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting loyalty network:', error);
      toast({
        title: "Error",
        description: "Failed to delete loyalty network",
        variant: "destructive",
      });
    }
  };

  const handleCreateNetwork = () => {
    setSelectedNetwork(null);
    setViewMode("create");
    form.reset({
      name: "",
      display_name: "",
      description: "",
      api_endpoint: "",
      logo_url: "",
      is_active: true,
      requires_mobile_verification: true,
      conversion_rate: 1.0,
      min_conversion_amount: 100,
      max_conversion_amount: 100000
    });
    setDialogOpen(true);
  };

  const handleEditNetwork = (network: LoyaltyNetwork) => {
    setSelectedNetwork(network);
    setViewMode("edit");
    form.reset({
      name: network.name,
      display_name: network.display_name,
      description: network.description || "",
      api_endpoint: network.api_endpoint || "",
      logo_url: network.logo_url || "",
      is_active: network.is_active,
      requires_mobile_verification: network.requires_mobile_verification,
      conversion_rate: network.conversion_rate,
      min_conversion_amount: network.min_conversion_amount,
      max_conversion_amount: network.max_conversion_amount
    });
    setDialogOpen(true);
  };

  const handleViewNetwork = (network: LoyaltyNetwork) => {
    setSelectedNetwork(network);
    setViewMode("view");
    setDialogOpen(true);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Active" : "Inactive";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Loyalty Networks</h3>
          <p className="text-sm text-muted-foreground">
            Manage third-party loyalty networks and conversion rates
          </p>
        </div>
        <Button onClick={handleCreateNetwork}>
          <Plus className="w-4 h-4 mr-2" />
          Add Network
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading loyalty networks...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Min/Max Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {networks.map((network) => (
                <TableRow key={network.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {network.logo_url ? (
                        <img 
                          src={network.logo_url} 
                          alt={network.display_name}
                          className="w-6 h-6 rounded"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                          <Shield className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      {network.name}
                    </div>
                  </TableCell>
                  <TableCell>{network.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {network.conversion_rate}x
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {network.min_conversion_amount.toLocaleString()} - {network.max_conversion_amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(network.is_active)}>
                      {getStatusText(network.is_active)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(network.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewNetwork(network)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNetwork(network)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(network)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "create" && "Add New Loyalty Network"}
              {viewMode === "edit" && "Edit Loyalty Network"}
              {viewMode === "view" && "Loyalty Network Details"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "create" && "Add a new third-party loyalty network to the platform"}
              {viewMode === "edit" && "Update the loyalty network settings and conversion rates"}
              {viewMode === "view" && "View detailed information about this loyalty network"}
            </DialogDescription>
          </DialogHeader>

          {viewMode === "view" && selectedNetwork ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedNetwork.logo_url && (
                      <img 
                        src={selectedNetwork.logo_url} 
                        alt={selectedNetwork.display_name}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    {selectedNetwork.display_name}
                  </CardTitle>
                  <CardDescription>{selectedNetwork.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Network ID</label>
                      <p className="text-sm text-muted-foreground">{selectedNetwork.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge className={getStatusColor(selectedNetwork.is_active)}>
                        {getStatusText(selectedNetwork.is_active)}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Conversion Rate</label>
                      <p className="text-sm text-muted-foreground">{selectedNetwork.conversion_rate}x</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Mobile Verification</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedNetwork.requires_mobile_verification ? "Required" : "Not Required"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Min Conversion</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedNetwork.min_conversion_amount.toLocaleString()} points
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Conversion</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedNetwork.max_conversion_amount.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                  {selectedNetwork.api_endpoint && (
                    <div>
                      <label className="text-sm font-medium">API Endpoint</label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedNetwork.api_endpoint}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network ID</FormLabel>
                        <FormControl>
                          <Input placeholder="starbucks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Starbucks Rewards" {...field} />
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
                        <Textarea placeholder="Brief description of the loyalty program" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="api_endpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Endpoint</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.starbucks.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logo_url"
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

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="conversion_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conversion Rate</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.0001" 
                            min="0" 
                            placeholder="1.0000" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="min_conversion_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Points</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="100" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max_conversion_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Points</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="100000" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requires_mobile_verification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Requires Mobile Verification</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {viewMode === "create" ? "Create Network" : "Update Network"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyNetworkManager;
