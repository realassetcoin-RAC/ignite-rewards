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
import { Plus, Edit2, Eye, Trash2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [customCardTypes, setCustomCardTypes] = useState<string[]>([]);
  const [customPlans, setCustomPlans] = useState<string[]>([]);
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
      is_active: true,
      custom_card_type: "",
      custom_plan: ""
    }
  });

  useEffect(() => {
    loadCards();
  }, []);

  // Watch for pricing type changes to lock/unlock fee fields
  const watchPricingType = form.watch("pricing_type");

  const loadCards = async () => {
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
        .from('virtual_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading virtual cards:', error);
        if (error.code === 'PGRST301') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view virtual cards. Admin access required.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to load virtual cards: ${error.message}`,
            variant: "destructive",
          });
        }
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error('Error loading virtual cards:', error);
      toast({
        title: "Error", 
        description: "Failed to load virtual cards. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      // Handle custom card type
      let finalCardType = data.card_type;
      if (data.card_type === "custom" && data.custom_card_type) {
        finalCardType = data.custom_card_type;
        if (!customCardTypes.includes(data.custom_card_type)) {
          setCustomCardTypes([...customCardTypes, data.custom_card_type]);
        }
      }

      // Handle custom plan
      let finalPlan = data.subscription_plan;
      if (data.subscription_plan === "custom" && data.custom_plan) {
        finalPlan = data.custom_plan;
        if (!customPlans.includes(data.custom_plan)) {
          setCustomPlans([...customPlans, data.custom_plan]);
        }
      }

      const cardData = {
        ...data,
        card_type: finalCardType,
        subscription_plan: finalPlan,
        features: data.features ? JSON.parse(data.features) : null,
        one_time_fee: data.pricing_type === "free" ? 0 : Number(data.one_time_fee),
        monthly_fee: data.pricing_type === "free" ? 0 : Number(data.monthly_fee),
        annual_fee: data.pricing_type === "free" ? 0 : Number(data.annual_fee)
      };

      if (editingCard) {
        const { error } = await (supabase as any)
          .from("virtual_cards")
          .update(cardData)
          .eq("id", editingCard.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Virtual card updated successfully"
        });
      } else {
        const { error } = await (supabase as any)
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
    
    // Check if card type or plan is custom (not in predefined list)
    const standardTypes = ["loyalty", "loyalty_plus"];
    const standardPlans = ["basic", "premium", "enterprise"];
    
    const isCustomType = !standardTypes.includes(card.card_type);
    const isCustomPlan = !standardPlans.includes(card.subscription_plan || "");
    
    form.reset({
      card_name: card.card_name,
      card_type: isCustomType ? "custom" : card.card_type,
      custom_card_type: isCustomType ? card.card_type : "",
      description: card.description || "",
      image_url: card.image_url || "",
      subscription_plan: isCustomPlan ? "custom" : (card.subscription_plan || "basic"),
      custom_plan: isCustomPlan ? card.subscription_plan : "",
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
      const { error } = await (supabase as any)
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
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Virtual Cards</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCard(null);
              form.reset({
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
                is_active: true,
                custom_card_type: "",
                custom_plan: ""
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? "Edit Virtual Card" : "Create New Virtual Card"}
              </DialogTitle>
              <DialogDescription>
                Configure the virtual card details, pricing, and features.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="card_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Card Name
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>The display name for this virtual card</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            Card Type
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Category of the virtual card (rewards, loyalty, etc.)</p>
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
                              <SelectItem value="loyalty">Loyalty</SelectItem>
                              <SelectItem value="loyalty_plus">Loyalty Plus</SelectItem>
                              {customCardTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                              <SelectItem value="custom">Add Custom Type...</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("card_type") === "custom" && (
                    <FormField
                      control={form.control}
                      name="custom_card_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Card Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter custom card type" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Description and Image */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Description
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Detailed description of card benefits and features</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          Image URL
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>URL to the card's visual design image</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/card-image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subscription & Pricing */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Subscription & Pricing</h4>
                  <div className="grid grid-cols-2 gap-4">
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
                                <p>Required subscription tier to access this card</p>
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
                              <SelectItem value="basic">Basic (Free)</SelectItem>
                              <SelectItem value="premium">Premium - $99/month</SelectItem>
                              <SelectItem value="enterprise">Enterprise - $299/month</SelectItem>
                              {customPlans.map((plan) => (
                                <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                              ))}
                              <SelectItem value="custom">Add Custom Plan...</SelectItem>
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
                          <FormLabel className="flex items-center gap-2">
                            Pricing Type
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>How customers pay for this card (free, one-time, or subscription)</p>
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

                  {form.watch("subscription_plan") === "custom" && (
                    <FormField
                      control={form.control}
                      name="custom_plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Plan Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter custom plan name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Fee Fields - conditionally disabled based on pricing type */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* One Time Fee - Only show when pricing type is "one_time" */}
                    {(watchPricingType === "one_time" || watchPricingType === "free") && (
                      <FormField
                        control={form.control}
                        name="one_time_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              One Time Fee ($)
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Single payment amount for one-time purchases</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                disabled={watchPricingType === "free"}
                                className={watchPricingType === "free" ? "opacity-50" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Monthly Fee - Only show when pricing type is "subscription" */}
                    {(watchPricingType === "subscription" || watchPricingType === "free") && (
                      <FormField
                        control={form.control}
                        name="monthly_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Monthly Fee ($)
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Recurring monthly payment amount</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                disabled={watchPricingType === "free"}
                                className={watchPricingType === "free" ? "opacity-50" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Annual Fee - Only show when pricing type is "subscription" */}
                    {(watchPricingType === "subscription" || watchPricingType === "free") && (
                      <FormField
                        control={form.control}
                        name="annual_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Annual Fee ($)
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="w-3 h-3" />
                              </TooltipTrigger>
                                <TooltipContent>
                                  <p>Yearly payment amount (usually discounted from monthly)</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                disabled={watchPricingType === "free"}
                                className={watchPricingType === "free" ? "opacity-50" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {watchPricingType === "free" && (
                    <p className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded">
                      💡 Fee fields are locked because pricing type is set to "Free"
                    </p>
                  )}
                  {watchPricingType === "one_time" && (
                    <p className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
                      💡 Only One Time Fee field is available for one-time pricing
                    </p>
                  )}
                  {watchPricingType === "subscription" && (
                    <p className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
                      💡 Monthly and Annual Fee fields are available for subscription pricing
                    </p>
                  )}
                </div>

                {/* Features and Settings */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Features & Settings</h4>
                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Features (JSON)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>List of card features in JSON format, e.g., ["2% cashback", "No annual fee"]</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
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
                          <FormLabel className="text-base flex items-center gap-2">
                            Active
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3 h-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Whether this card is available for customers to apply for</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
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
                </div>

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
    </TooltipProvider>
  );
};

export default VirtualCardManager;