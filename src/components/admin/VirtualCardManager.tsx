import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Eye, Trash2 } from "lucide-react";

interface VirtualCard {
  id: string;
  card_name: string;
  card_type: string;
  description: string;
  image_url: string;
  subscription_plan: string;
  pricing_type: string;
  one_time_fee: number;
  monthly_fee: number;
  annual_fee: number;
  features: any;
  is_active: boolean;
  created_at: string;
}

interface VirtualCardManagerProps {
  onStatsUpdate: () => void;
}

const VirtualCardManager = ({ onStatsUpdate }: VirtualCardManagerProps) => {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<VirtualCard | null>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      card_name: "",
      card_type: "rewards",
      description: "",
      image_url: "",
      subscription_plan: "basic",
      pricing_type: "free",
      one_time_fee: 0,
      monthly_fee: 0,
      annual_fee: 0,
      features: "",
      is_active: true
    }
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from("virtual_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error("Failed to load cards:", error);
      toast({
        title: "Error",
        description: "Failed to load virtual cards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const cardData = {
        ...data,
        features: data.features ? JSON.parse(data.features) : null,
        one_time_fee: Number(data.one_time_fee),
        monthly_fee: Number(data.monthly_fee),
        annual_fee: Number(data.annual_fee)
      };

      if (editingCard) {
        const { error } = await supabase
          .from("virtual_cards")
          .update(cardData)
          .eq("id", editingCard.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Virtual card updated successfully"
        });
      } else {
        const { error } = await supabase
          .from("virtual_cards")
          .insert([cardData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Virtual card created successfully"
        });
      }

      setDialogOpen(false);
      setEditingCard(null);
      form.reset();
      loadCards();
      onStatsUpdate();
    } catch (error) {
      console.error("Failed to save card:", error);
      toast({
        title: "Error",
        description: "Failed to save virtual card",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (card: VirtualCard) => {
    setEditingCard(card);
    form.reset({
      card_name: card.card_name,
      card_type: card.card_type,
      description: card.description || "",
      image_url: card.image_url || "",
      subscription_plan: card.subscription_plan || "basic",
      pricing_type: card.pricing_type,
      one_time_fee: card.one_time_fee,
      monthly_fee: card.monthly_fee,
      annual_fee: card.annual_fee,
      features: card.features ? JSON.stringify(card.features) : "",
      is_active: card.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this virtual card?")) return;

    try {
      const { error } = await supabase
        .from("virtual_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Virtual card deleted successfully"
      });
      
      loadCards();
      onStatsUpdate();
    } catch (error) {
      console.error("Failed to delete card:", error);
      toast({
        title: "Error",
        description: "Failed to delete virtual card",
        variant: "destructive"
      });
    }
  };

  const getPricingDisplay = (card: VirtualCard) => {
    if (card.pricing_type === "free") return "Free";
    if (card.pricing_type === "one_time") return `$${card.one_time_fee}`;
    return `$${card.monthly_fee}/mo`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Virtual Cards</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCard(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? "Edit Virtual Card" : "Create New Virtual Card"}
              </DialogTitle>
              <DialogDescription>
                Configure the virtual card details, pricing, and features.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="card_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Premium Rewards Card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="card_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rewards">Rewards</SelectItem>
                            <SelectItem value="loyalty">Loyalty</SelectItem>
                            <SelectItem value="membership">Membership</SelectItem>
                            <SelectItem value="gift">Gift</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Textarea placeholder="Card description and benefits..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/card-image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subscription_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pricing_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="one_time">One Time Fee</SelectItem>
                            <SelectItem value="subscription">Subscription</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="one_time_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>One Time Fee ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthly_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Fee ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="annual_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Fee ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
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
                        <Textarea 
                          placeholder='["Feature 1", "Feature 2", "Feature 3"]'
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this card available for customers
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCard ? "Update Card" : "Create Card"}
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
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading virtual cards...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.card_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {card.card_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {card.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPricingDisplay(card)}</TableCell>
                  <TableCell>
                    <Badge variant={card.is_active ? "default" : "secondary"}>
                      {card.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(card.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(card)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(card.id)}
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
    </div>
  );
};

export default VirtualCardManager;