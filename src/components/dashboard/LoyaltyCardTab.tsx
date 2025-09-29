import { useState, useEffect } from "react";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { CreditCard, Copy, Info } from "lucide-react";

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

  useEffect(() => {
    if (user) {
      loadLoyaltyCard();
      loadUserPoints();
    }
  }, [user]);

  // Smart data refresh - refreshes loyalty card data when returning to app
  const refreshLoyaltyData = async () => {
    console.log('🔄 Refreshing loyalty card data...');
    if (user) {
      await loadLoyaltyCard();
      await loadUserPoints();
    }
  };

  useSmartDataRefresh(refreshLoyaltyData, {
    debounceMs: 2000, // 2 second debounce for loyalty data
    enabled: !!user,
    dependencies: [user?.id] // Refresh when user changes
  });

  const loadLoyaltyCard = async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Try to load from user_loyalty_cards with public schema focus
      let loyaltyData = null;
      let loadError = null;
      
      try {
        console.log('Loading from user_loyalty_cards (public schema)...');
        const fetchPromise = supabase
          .from('user_loyalty_cards')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle();
          
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        loyaltyData = data;
        console.log('Loaded from public schema:', data);
      } catch (primaryError) {
        console.warn('Primary schema load failed:', primaryError);
        loadError = primaryError;
      }
      
      // Handle loading errors more gracefully
      if (loadError && loadError.code !== 'PGRST116') {
        console.error('Error loading loyalty card:', loadError);
        
        // If it's a permission error, don't prevent card creation - just continue with no card
        if (loadError.code !== '42501' && !loadError.message?.includes('permission denied') && !loadError.message?.includes('timeout')) {
          return;
        } else {
          console.log('Permission denied or timeout for loading - continuing with card creation option');
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

      {/* Loyalty Card Display or Info Message */}
      {!loyaltyCard ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              No Loyalty Card Found
            </CardTitle>
            <CardDescription>
              You don't have a loyalty card yet. Create one to start earning rewards and participating in the loyalty program.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>To create your virtual loyalty card:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the <strong>"Add Loyalty Card"</strong> button in the main dashboard</li>
                <li>Fill in your details to generate a unique loyalty number</li>
                <li>Start earning points with your new loyalty card</li>
              </ul>
            </div>
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

    </div>
  );
};

export default LoyaltyCardTab;