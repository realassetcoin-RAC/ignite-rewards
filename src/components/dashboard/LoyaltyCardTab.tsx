import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Wallet, CreditCard, Copy, Download } from "lucide-react";
import SolanaWalletManager from "@/components/web3/SolanaWalletManager";

interface LoyaltyCard {
  id: string;
  loyalty_number: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

interface UserPoints {
  total_points: number;
  available_points: number;
  lifetime_points: number;
}

const LoyaltyCardTab = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints>({ total_points: 0, available_points: 0, lifetime_points: 0 });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (user) {
      loadLoyaltyCard();
      loadUserPoints();
    }
  }, [user]);

  const loadLoyaltyCard = async () => {
    try {
      // Try to load from user_loyalty_cards with multiple schema attempts
      let loyaltyData = null;
      let loadError = null;
      
      // Try public schema first
      try {
        console.log('Loading from public.user_loyalty_cards...');
        const { data, error } = await supabase
          .schema('public')
          .from('user_loyalty_cards')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        loyaltyData = data;
        console.log('Loaded from public schema:', data);
      } catch (publicError) {
        console.warn('Public schema load failed:', publicError);
        loadError = publicError;
        
        // Fallback to default schema
        try {
          console.log('Loading from default user_loyalty_cards...');
          const { data, error } = await supabase
            .from('user_loyalty_cards')
            .select('*')
            .eq('user_id', user?.id)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          loyaltyData = data;
          console.log('Loaded from default schema:', data);
        } catch (defaultError) {
          console.error('Default schema load also failed:', defaultError);
          loadError = defaultError;
        }
      }
      
      // Only show error if it's not a "no rows" error and we couldn't load from either schema
      if (loadError && loadError.code !== 'PGRST116') {
        console.error('Error loading loyalty card:', loadError);
        return;
      }

      setLoyaltyCard(loyaltyData);
    } catch (error) {
      console.error('Error loading loyalty card:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('total_points, available_points, lifetime_points')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user points:', error);
        return;
      }

      if (data) {
        setUserPoints(data);
      }
    } catch (error) {
      console.error('Error loading user points:', error);
    }
  };

  const createLoyaltyCard = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Generate loyalty number using the database function with multiple fallbacks
      let loyaltyNumber;
      
      // Try multiple approaches to generate loyalty number
      const generateLoyaltyNumber = async () => {
        const attempts = [
          // Attempt 1: api.generate_loyalty_number with email
          () => supabase.rpc('generate_loyalty_number', { user_email: user?.email || '' }),
          // Attempt 2: public.generate_loyalty_number with email  
          () => supabase.schema('public').rpc('generate_loyalty_number', { user_email: user?.email || '' }),
          // Attempt 3: api.generate_loyalty_number without params
          () => supabase.rpc('generate_loyalty_number'),
          // Attempt 4: public.generate_loyalty_number without params
          () => supabase.schema('public').rpc('generate_loyalty_number')
        ];
        
        for (let i = 0; i < attempts.length; i++) {
          try {
            console.log(`Attempting loyalty number generation method ${i + 1}...`);
            const { data: generatedNumber, error: numberError } = await attempts[i]();
            
            if (!numberError && generatedNumber) {
              console.log(`Success with method ${i + 1}, generated:`, generatedNumber);
              return generatedNumber;
            } else if (numberError) {
              console.warn(`Method ${i + 1} failed:`, numberError.message);
            }
          } catch (e) {
            console.warn(`Method ${i + 1} exception:`, e);
          }
        }
        
        // Final fallback: client-side generation
        console.log('All RPC methods failed, using client-side generation');
        const initial = (user?.email || 'U').charAt(0).toUpperCase();
        const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return initial + randomDigits;
      };
      
      loyaltyNumber = await generateLoyaltyNumber();
      console.log('Final loyalty number to use:', loyaltyNumber);

      // Insert into user_loyalty_cards with multiple schema attempts
      console.log('Attempting to insert loyalty card...');
      
      const insertData = {
        user_id: user?.id,
        loyalty_number: loyaltyNumber,
        full_name: formData.full_name.trim(),
        email: user?.email || '',
        phone: formData.phone.trim() || null,
        is_active: true
      };
      
      let insertResult = null;
      let insertError = null;
      
      // Try public schema first (this is the main table now)
      try {
        console.log('Trying public.user_loyalty_cards...');
        const { data, error } = await supabase
          .schema('public')
          .from('user_loyalty_cards')
          .insert(insertData)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        insertResult = data;
        console.log('Successfully inserted into public.user_loyalty_cards:', data);
      } catch (publicError) {
        console.warn('Public schema insert failed:', publicError);
        insertError = publicError;
        
        // Fallback to default schema (should resolve to public anyway)
        try {
          console.log('Trying default schema user_loyalty_cards...');
          const { data, error } = await supabase
            .from('user_loyalty_cards')
            .insert(insertData)
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          insertResult = data;
          console.log('Successfully inserted into user_loyalty_cards:', data);
        } catch (defaultError) {
          console.error('Default schema insert also failed:', defaultError);
          throw defaultError;
        }
      }
      
      if (!insertResult) {
        throw new Error('Failed to insert loyalty card record');
      }

      setLoyaltyCard(insertResult);
      setShowCreateDialog(false);
      setFormData({ full_name: "", phone: "" });

      toast({
        title: "Success",
        description: "Your loyalty card has been created successfully!",
      });
    } catch (error: any) {
      console.error('Error creating loyalty card:', error);
      
      let errorMessage = 'Failed to create loyalty card. Please try again.';
      
      // Provide specific error messages based on common issues
      if (error?.code === 'PGRST301') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error?.code === '42501') {
        errorMessage = 'Insufficient permissions to create loyalty card.';
      } else if (error?.code === 'PGRST116') {
        errorMessage = 'Loyalty card table not accessible. Please contact support.';
      } else if (error?.code === '23505') {
        errorMessage = 'A loyalty card already exists for your account.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyLoyaltyNumber = () => {
    if (loyaltyCard?.loyalty_number) {
      navigator.clipboard.writeText(loyaltyCard.loyalty_number);
      toast({
        title: "Copied",
        description: "Loyalty number copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userPoints.available_points}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPoints.total_points}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{userPoints.lifetime_points}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Card */}
      {!loyaltyCard ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Create Your Loyalty Card
            </CardTitle>
            <CardDescription>
              Get started by creating your digital loyalty card to earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Create Loyalty Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Your Loyalty Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <Button onClick={createLoyaltyCard} disabled={creating} className="w-full">
                    {creating ? "Creating..." : "Create Card"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Digital Loyalty Card
              </CardTitle>
              <Badge variant={loyaltyCard.is_active ? "default" : "secondary"}>
                {loyaltyCard.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Loyalty Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-lg font-mono bg-muted px-2 py-1 rounded">
                    {loyaltyCard.loyalty_number}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyLoyaltyNumber}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Cardholder Name</Label>
                <p className="text-lg font-medium mt-1">{loyaltyCard.full_name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-sm mt-1">{loyaltyCard.email}</p>
              </div>
              {loyaltyCard.phone && (
                <div>
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  <p className="text-sm mt-1">{loyaltyCard.phone}</p>
                </div>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">Member Since</Label>
                <p className="text-sm mt-1">
                  {new Date(loyaltyCard.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solana Wallet Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Web3 Wallet
          </CardTitle>
          <CardDescription>
            Manage your Solana wallet for blockchain-based rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SolanaWalletManager />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyCardTab;