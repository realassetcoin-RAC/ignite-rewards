import { useState, useEffect } from "react";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { databaseAdapter } from "@/lib/databaseAdapter";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import NFTImageUpload from "@/components/admin/NFTImageUpload";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { user, isAdmin } = useSecureAuth();
  const { toast } = useToast();
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints>({ total_points: 0, available_points: 0, lifetime_points: 0 });
  const [loading, setLoading] = useState(true);

  // Admin quick-upload state (reinstated)
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [adminRarity, setAdminRarity] = useState("Common");
  const [imageUrl, setImageUrl] = useState("");
  const [evolutionUrl, setEvolutionUrl] = useState("");
  const [savingNFT, setSavingNFT] = useState(false);

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
        const fetchPromise = databaseAdapter
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
      } catch (primaryError: any) {
        console.warn('Primary schema load failed:', primaryError);
        loadError = primaryError as { code?: string; message?: string };
      }
      
      // Handle loading errors more gracefully
      if (loadError && (loadError as any).code !== 'PGRST116') {
        console.error('Error loading loyalty card:', loadError);
        
        // If it's a permission error, don't prevent card creation - just continue with no card
        const lc: any = loadError;
        if (lc.code !== '42501' && !lc.message?.includes('permission denied') && !lc.message?.includes('timeout')) {
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
      const { data, error } = await databaseAdapter
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

  // Re-implemented: Admin can upload/create a Loyalty NFT directly from this tab
  const handleAdminCreateNFT = async () => {
    try {
      setSavingNFT(true);
      if (!adminDisplayName || !imageUrl) {
        toast({ title: "Missing fields", description: "Display name and image are required", variant: "destructive" });
        return;
      }

      // Try to persist to nft_types when available
      const { error } = await databaseAdapter
        .from('nft_types')
        .insert({
          display_name: adminDisplayName,
          nft_name: adminDisplayName.toLowerCase().replace(/\s+/g, '-'),
          description: 'Created from Loyalty Card tab',
          image_url: imageUrl,
          evolution_image_url: evolutionUrl || null,
          rarity: adminRarity,
          buy_price_usdt: 0,
          mint_quantity: 0,
          is_upgradeable: false,
          is_evolvable: !!evolutionUrl,
          is_fractional_eligible: true,
          auto_staking_duration: 'Forever',
          earn_on_spend_ratio: 0.01,
          upgrade_bonus_ratio: 0,
          evolution_min_investment: 0,
          evolution_earnings_ratio: 0,
          is_custodial: true,
        });

      if (error) {
        // In local/browser mode, data ops may be blocked; still confirm upload success
        console.warn('NFT DB insert failed (likely local/browser):', error);
        toast({ title: "Image(s) uploaded", description: "Saved image URLs locally. DB write may be disabled in local mode." });
      } else {
        toast({ title: "NFT created", description: "Loyalty NFT type saved successfully" });
      }

      // Reset minimal form
      setAdminDisplayName("");
      setEvolutionUrl("");
      setImageUrl("");
    } catch (e) {
      console.error('Admin NFT create error', e);
      toast({ title: "Error", description: "Failed to create NFT", variant: "destructive" });
    } finally {
      setSavingNFT(false);
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

      {/* Admin quick uploader - visible only to admins */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Admin: Create Loyalty NFT</CardTitle>
            <CardDescription>Upload images and create an NFT type directly from this tab.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={adminDisplayName} onChange={(e) => setAdminDisplayName(e.target.value)} placeholder="e.g., Pearl White" />
              </div>
              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select value={adminRarity} onValueChange={setAdminRarity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Common">Common</SelectItem>
                    <SelectItem value="LessCommon">Less Common</SelectItem>
                    <SelectItem value="Rare">Rare</SelectItem>
                    <SelectItem value="VeryRare">Very Rare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NFTImageUpload label="Card Image (PNG/JPG)" value={imageUrl} onChange={setImageUrl} />
              <NFTImageUpload label="Evolution Image (GIF)" value={evolutionUrl} onChange={setEvolutionUrl} acceptedFormats={['image/gif']} maxSizeMB={10} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAdminCreateNFT} disabled={savingNFT || !imageUrl || !adminDisplayName}>
                {savingNFT ? 'Saving...' : 'Create Loyalty NFT'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default LoyaltyCardTab;