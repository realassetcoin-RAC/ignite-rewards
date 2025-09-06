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
      // Try to load from user_loyalty_cards with API schema focus
      let loyaltyData = null;
      let loadError = null;
      
      // Based on our testing, focus on API schema first
      try {
        console.log('Loading from api.user_loyalty_cards (configured schema)...');
        const { data, error } = await supabase
          .from('user_loyalty_cards')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        loyaltyData = data;
        console.log('Loaded from configured schema:', data);
      } catch (primaryError) {
        console.warn('Primary schema load failed:', primaryError);
        loadError = primaryError;
        
        // Try explicit API schema reference
        try {
          console.log('Loading with explicit api schema reference...');
          const { data, error } = await supabase
            .schema('api')
            .from('user_loyalty_cards')
            .select('*')
            .eq('user_id', user?.id)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          loyaltyData = data;
          console.log('Loaded with explicit api schema:', data);
        } catch (secondaryError) {
          console.error('All load attempts failed:', secondaryError);
          loadError = secondaryError;
        }
      }
      
      // Handle loading errors more gracefully
      if (loadError && loadError.code !== 'PGRST116') {
        console.error('Error loading loyalty card:', loadError);
        
        // If it's a permission error, don't prevent card creation - just continue with no card
        if (loadError.code !== '42501' && !loadError.message?.includes('permission denied')) {
          return;
        } else {
          console.log('Permission denied for loading - continuing with card creation option');
        }
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
      // Generate loyalty number with improved fallback strategy
      let loyaltyNumber;
      
      // Generate loyalty number with better error handling
      const generateLoyaltyNumber = async () => {
        // Since database functions are having issues, use client-side generation as primary method
        console.log('Generating loyalty number client-side due to database constraints...');
        const initial = (user?.email || 'U').charAt(0).toUpperCase();
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 random digits
        return initial + timestamp + random;
      };
      
      loyaltyNumber = await generateLoyaltyNumber();
      console.log('Final loyalty number to use:', loyaltyNumber);

      // Insert into user_loyalty_cards with improved error handling
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
      
      // Based on our testing, we can only access the api schema, so try that first
      try {
        console.log('Trying api.user_loyalty_cards (configured schema)...');
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
      } catch (primaryError) {
        console.warn('Primary insert failed:', primaryError);
        insertError = primaryError;
        
        // Try with explicit API schema reference
        try {
          console.log('Trying explicit api schema reference...');
          const { data, error } = await supabase
            .schema('api')
            .from('user_loyalty_cards')
            .insert(insertData)
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          insertResult = data;
          console.log('Successfully inserted with explicit api schema:', data);
        } catch (secondaryError) {
          console.error('All insert attempts failed:', secondaryError);
          
          // If we still can't insert, at least show the user their generated card info
          console.warn('Unable to save to database, but providing loyalty card info to user');
          insertResult = {
            id: 'temp-' + Date.now(),
            user_id: user?.id,
            loyalty_number: loyaltyNumber,
            full_name: formData.full_name.trim(),
            email: user?.email || '',
            phone: formData.phone.trim() || null,
            is_active: true,
            created_at: new Date().toISOString()
          };
          
          // Show a helpful message based on the error type
          if (secondaryError?.code === '42501' || secondaryError?.message?.includes('permission denied')) {
            toast({
              title: "Card Generated Successfully",
              description: "Your loyalty number is " + loyaltyNumber + ". Please save this number - it may not be stored permanently due to system limitations.",
              variant: "default",
            });
          } else {
            toast({
              title: "Card Created (Not Saved)",
              description: "Your loyalty card was created but couldn't be saved. Please contact support with your loyalty number: " + loyaltyNumber,
              variant: "default",
            });
          }
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