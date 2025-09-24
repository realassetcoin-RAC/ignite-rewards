import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, CreditCard, User, Mail, Phone } from "lucide-react";

interface UserLoyaltyCard {
  id: string;
  user_id: string;
  loyalty_number: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface UserLoyaltyCardManagerProps {
  onStatsUpdate: () => void;
}

const UserLoyaltyCardManager = ({ onStatsUpdate }: UserLoyaltyCardManagerProps) => {
  const [loyaltyCards, setLoyaltyCards] = useState<UserLoyaltyCard[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<UserLoyaltyCard | null>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      user_id: "",
      loyalty_number: "",
      full_name: "",
      email: "",
      phone: "",
      is_active: true
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user profiles for selection
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true });

      if (profilesError) {
        console.error("Failed to load user profiles:", profilesError);
      } else {
        setUserProfiles(profilesData || []);
      }

      // Load existing loyalty cards with improved error handling
      let loyaltyData = null;
      let loadError = null;
      
      // Try to load from user_loyalty_cards (API schema focus)
      try {
        console.log('Loading loyalty cards from configured schema...');
        const { data, error } = await supabase
          .from('user_loyalty_cards')
          .select(`
            *,
            profiles:user_id (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false });
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        loyaltyData = data;
        console.log('Loaded loyalty cards from configured schema:', data?.length || 0);
      } catch (primaryError) {
        console.warn('Primary schema load failed:', primaryError);
        loadError = primaryError;
        
        // Try explicit API schema reference
        try {
          console.log('Loading with explicit api schema reference...');
          const { data, error } = await supabase
            .schema('api')
            .from('user_loyalty_cards')
            .select(`
              *,
              profiles:user_id (
                full_name,
                email
              )
            `)
            .order('created_at', { ascending: false });
            
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          loyaltyData = data;
          console.log('Loaded with explicit api schema:', data?.length || 0);
        } catch (secondaryError) {
          console.error('All load attempts failed:', secondaryError);
          loadError = secondaryError;
        }
      }
      
      // Handle loading results
      if (loyaltyData) {
        setLoyaltyCards(loyaltyData as any || []);
      } else if (loadError && loadError.code !== 'PGRST116' && loadError.code !== '42501') {
        toast({
          title: "Loading Error",
          description: "Failed to load loyalty cards. Check console for details.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load loyalty card data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate loyalty number (admin version with better uniqueness)
  const generateLoyaltyNumber = (email: string = '') => {
    const initial = email ? email.charAt(0).toUpperCase() : 'A';
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 random digits
    return initial + timestamp + random;
  };

  const handleSubmit = async (data: any) => {
    try {
      // Find the selected user's profile info
      const selectedProfile = userProfiles.find(p => p.id === data.user_id);
      if (!selectedProfile && !editingCard) {
        toast({
          title: "Error",
          description: "Please select a user to create a loyalty card for.",
          variant: "destructive"
        });
        return;
      }

      // Generate loyalty number if not provided
      let loyaltyNumber = data.loyalty_number.trim();
      if (!loyaltyNumber) {
        loyaltyNumber = generateLoyaltyNumber(data.email || selectedProfile?.email || '');
      }

      const cardData = {
        user_id: data.user_id,
        loyalty_number: loyaltyNumber,
        full_name: data.full_name.trim() || selectedProfile?.full_name || '',
        email: data.email.trim() || selectedProfile?.email || '',
        phone: data.phone.trim() || null,
        is_active: data.is_active
      };

      let result = null;
      // let insertError = null;

      if (editingCard) {
        // Update existing card
        try {
          console.log('Updating loyalty card in configured schema...');
          const { data: updateData, error } = await supabase
            .from("user_loyalty_cards")
            .update(cardData)
            .eq("id", editingCard.id)
            .select()
            .single();
          
          if (error) throw error;
          result = updateData;
          console.log('Successfully updated loyalty card:', result);
        } catch (primaryError) {
          console.warn('Primary update failed:', primaryError);
          // const _insertError = primaryError;
          
          // Try explicit API schema reference
          try {
            console.log('Trying explicit api schema reference for update...');
            const { data: updateData, error } = await supabase
              .schema('api')
              .from("user_loyalty_cards")
              .update(cardData)
              .eq("id", editingCard.id)
              .select()
              .single();
              
            if (error) throw error;
            result = updateData;
            console.log('Successfully updated with explicit api schema:', result);
          } catch (secondaryError) {
            console.error('All update attempts failed:', secondaryError);
            throw secondaryError;
          }
        }

        toast({
          title: "Success",
          description: "Loyalty card updated successfully"
        });
      } else {
        // Create new card
        try {
          console.log('Creating loyalty card in configured schema...');
          const { data: insertData, error } = await supabase
            .from("user_loyalty_cards")
            .insert([cardData])
            .select()
            .single();
          
          if (error) throw error;
          result = insertData;
          console.log('Successfully created loyalty card:', result);
        } catch (primaryError) {
          console.warn('Primary insert failed:', primaryError);
          // const _insertError = primaryError;
          
          // Try explicit API schema reference
          try {
            console.log('Trying explicit api schema reference for insert...');
            const { data: insertData, error } = await supabase
              .schema('api')
              .from("user_loyalty_cards")
              .insert([cardData])
              .select()
              .single();
              
            if (error) throw error;
            result = insertData;
            console.log('Successfully created with explicit api schema:', result);
          } catch (secondaryError) {
            console.error('All insert attempts failed:', secondaryError);
            
            // Provide helpful error messages based on error type
            let errorMessage = 'Failed to create loyalty card';
            if (secondaryError?.code === '42501' || secondaryError?.message?.includes('permission denied')) {
              errorMessage = 'Permission denied. Admin may not have rights to create loyalty cards.';
            } else if (secondaryError?.code === '23505') {
              errorMessage = 'A loyalty card with this number already exists.';
            } else if (secondaryError?.code === 'PGRST116') {
              errorMessage = 'Loyalty card table not accessible. Please contact system administrator.';
            }
            
            toast({
              title: "Creation Failed",
              description: errorMessage,
              variant: "destructive"
            });
            return;
          }
        }

        toast({
          title: "Success",
          description: `Loyalty card created successfully for ${cardData.full_name}`
        });
      }

      setDialogOpen(false);
      setEditingCard(null);
      form.reset();
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      console.error("Failed to save loyalty card:", error);
      
      let errorMessage = 'Failed to save loyalty card';
      if (error?.code === '42501' || error?.message?.includes('permission denied')) {
        errorMessage = 'Permission denied. Admin may not have rights to create loyalty cards.';
      } else if (error?.code === '23505') {
        errorMessage = 'A loyalty card with this number already exists.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (card: UserLoyaltyCard) => {
    setEditingCard(card);
    form.reset({
      user_id: card.user_id,
      loyalty_number: card.loyalty_number,
      full_name: card.full_name,
      email: card.email,
      phone: card.phone || "",
      is_active: card.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, cardName: string) => {
    if (!confirm(`Are you sure you want to delete the loyalty card for ${cardName}?`)) return;

    try {
        // const deleteError = null;
      
      // Try to delete from configured schema first
      try {
        const { error } = await supabase
          .from("user_loyalty_cards")
          .delete()
          .eq("id", id);

        if (error) throw error;
        console.log('Successfully deleted from configured schema');
      } catch (primaryError) {
        console.warn('Primary delete failed:', primaryError);
        // const deleteError = primaryError;
        
        // Try explicit API schema reference
        try {
          const { error } = await supabase
            .schema('api')
            .from("user_loyalty_cards")
            .delete()
            .eq("id", id);

          if (error) throw error;
          console.log('Successfully deleted with explicit api schema');
        } catch (secondaryError) {
          console.error('All delete attempts failed:', secondaryError);
          throw secondaryError;
        }
      }

      toast({
        title: "Success",
        description: "Loyalty card deleted successfully"
      });
      
      loadData();
      onStatsUpdate();
    } catch (error: any) {
      console.error("Failed to delete loyalty card:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete loyalty card",
        variant: "destructive"
      });
    }
  };

  const handleUserSelect = (userId: string) => {
    const selectedUser = userProfiles.find(u => u.id === userId);
    if (selectedUser) {
      form.setValue("full_name", selectedUser.full_name || "");
      form.setValue("email", selectedUser.email || "");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">User Loyalty Cards</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage loyalty cards for users
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCard(null);
              form.reset({
                user_id: "",
                loyalty_number: "",
                full_name: "",
                email: "",
                phone: "",
                is_active: true
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Loyalty Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? "Edit Loyalty Card" : "Create New Loyalty Card"}
              </DialogTitle>
              <DialogDescription>
                {editingCard 
                  ? "Update the loyalty card details below"
                  : "Create a new loyalty card for a user. Select a user to auto-fill their details."
                }
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* User Selection */}
                {!editingCard && (
                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select User *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleUserSelect(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a user..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userProfiles.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">{user.full_name || "No Name"}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Card Details */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="loyalty_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loyalty Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Leave empty to auto-generate" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="User's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="user@example.com" {...field} />
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Card
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this loyalty card active and usable
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
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading loyalty cards...</p>
        </div>
      ) : loyaltyCards.length === 0 ? (
        <div className="text-center py-8">
          <Card className="p-8">
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Loyalty Cards</h3>
              <p className="text-muted-foreground mb-4">
                Create loyalty cards for users to help them participate in your loyalty program.
              </p>
              <Button onClick={() => {
                setEditingCard(null);
                form.reset();
                setDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Loyalty Card
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Loyalty Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loyaltyCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{card.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {card.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {card.loyalty_number}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {card.email}
                      </div>
                      {card.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {card.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
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
                        onClick={() => handleDelete(card.id, card.full_name)}
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

export default UserLoyaltyCardManager;