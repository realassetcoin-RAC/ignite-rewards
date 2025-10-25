import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { 
  Coins, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  Shield,
  Clock,
  Zap
} from "lucide-react";
import { 
  checkPointBalance, 
  convertPointsToTokens,
  type PointBalance 
} from "@/lib/thirdPartyLoyaltyApi";
import { getUserLoyaltyLinks } from "@/lib/loyaltyOtp";
import { databaseAdapter } from "@/lib/databaseAdapter";

interface UserLoyaltyLink {
  id: string;
  mobile_number: string;
  is_verified: boolean;
  linked_at: string;
  loyalty_networks: {
    id: string;
    name: string;
    display_name: string;
    logo_url?: string;
    conversion_rate: number;
    min_conversion_amount: number;
    max_conversion_amount: number;
  };
}

interface ConversionHistory {
  id: string;
  third_party_points: number;
  converted_tokens: number;
  conversion_rate: number;
  status: string;
  created_at: string;
  loyalty_networks: {
    display_name: string;
  };
}

interface PointConversionSystemProps {
  onConversionComplete?: () => void;
}

const PointConversionSystem = ({ onConversionComplete }: PointConversionSystemProps) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [userLinks, setUserLinks] = useState<UserLoyaltyLink[]>([]);
  const [pointBalances, setPointBalances] = useState<Record<string, PointBalance>>({});
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<UserLoyaltyLink | null>(null);
  const [conversionAmount, setConversionAmount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load user's linked accounts
      const linksResult = await getUserLoyaltyLinks(user.id);
      if (linksResult.success) {
        setUserLinks(linksResult.data || []);
        
        // Load point balances for each linked account
        const balancePromises = (linksResult.data || []).map(async (link) => {
          const balanceResult = await checkPointBalance(
            user.id,
            link.loyalty_networks.id,
            link.mobile_number
          );
          
          if (balanceResult.success && balanceResult.balance) {
            return { linkId: link.id, balance: balanceResult.balance };
          }
          return null;
        });

        const balances = await Promise.all(balancePromises);
        const balanceMap: Record<string, PointBalance> = {};
        balances.forEach(balance => {
          if (balance) {
            balanceMap[balance.linkId] = balance.balance;
          }
        });
        setPointBalances(balanceMap);

        // Load conversion history
        await loadConversionHistory();
      }
    } catch (error) {
      console.error('Error loading conversion data:', error);
      toast({
        title: "Error",
        description: "Failed to load point conversion data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversionHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_point_conversions')
        .select(`
          *,
          loyalty_networks (
            display_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading conversion history:', error);
        return;
      }

      setConversionHistory(data || []);
    } catch (error) {
      console.error('Error loading conversion history:', error);
    }
  };

  const handleRefreshBalance = async (link: UserLoyaltyLink) => {
    if (!user) return;

    try {
      const balanceResult = await checkPointBalance(
        user.id,
        link.loyalty_networks.id,
        link.mobile_number
      );

      if (balanceResult.success && balanceResult.balance) {
        setPointBalances(prev => ({
          ...prev,
          [link.id]: balanceResult.balance!
        }));
        
        toast({
          title: "Balance Updated",
          description: `Updated ${link.loyalty_networks.display_name} balance`,
        });
      } else {
        toast({
          title: "Error",
          description: balanceResult.error || "Failed to refresh balance",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast({
        title: "Error",
        description: "Failed to refresh balance",
        variant: "destructive",
      });
    }
  };

  const handleStartConversion = (link: UserLoyaltyLink) => {
    const balance = pointBalances[link.id];
    if (!balance) {
      toast({
        title: "Error",
        description: "Unable to load point balance",
        variant: "destructive",
      });
      return;
    }

    if (balance.points < link.loyalty_networks.min_conversion_amount) {
      toast({
        title: "Insufficient Points",
        description: `Minimum ${link.loyalty_networks.min_conversion_amount} points required for conversion`,
        variant: "destructive",
      });
      return;
    }

    setSelectedLink(link);
    setConversionAmount(link.loyalty_networks.min_conversion_amount);
    setConversionDialogOpen(true);
  };

  const handleConvertPoints = async () => {
    if (!user || !selectedLink) return;

    try {
      setConverting(selectedLink.id);
      
      const result = await convertPointsToTokens(
        user.id,
        selectedLink.loyalty_networks.id,
        selectedLink.mobile_number,
        conversionAmount
      );

      if (result.success && result.result) {
        toast({
          title: "Conversion Successful",
          description: `Converted ${conversionAmount} points to ${result.result.receivedTokens} tokens`,
        });

        // Refresh data
        await loadData();
        setConversionDialogOpen(false);
        setSelectedLink(null);
        onConversionComplete?.();
      } else {
        toast({
          title: "Conversion Failed",
          description: result.error || "Failed to convert points",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error converting points:', error);
      toast({
        title: "Error",
        description: "Failed to convert points",
        variant: "destructive",
      });
    } finally {
      setConverting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading point conversion data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Point Conversion
          </CardTitle>
          <CardDescription>
            Convert your third-party loyalty points into platform tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No linked loyalty accounts found</p>
            <p className="text-sm">Link your loyalty accounts to start converting points</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Point Conversion
          </CardTitle>
          <CardDescription>
            Convert your third-party loyalty points into platform tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userLinks.map((link) => {
              const balance = pointBalances[link.id];
              const canConvert = balance && 
                balance.points >= link.loyalty_networks.min_conversion_amount &&
                balance.points <= link.loyalty_networks.max_conversion_amount;

              return (
                <div key={link.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {link.loyalty_networks.logo_url ? (
                        <img 
                          src={link.loyalty_networks.logo_url} 
                          alt={link.loyalty_networks.display_name}
                          className="w-10 h-10 rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Shield className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{link.loyalty_networks.display_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {link.mobile_number}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRefreshBalance(link)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  {balance ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Balance</span>
                        <span className="text-lg font-bold">
                          {balance.points.toLocaleString()} {balance.currency || 'points'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Conversion Rate</span>
                        <span>{link.loyalty_networks.conversion_rate}x</span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Min/Max Conversion</span>
                        <span>
                          {link.loyalty_networks.min_conversion_amount.toLocaleString()} - {link.loyalty_networks.max_conversion_amount.toLocaleString()}
                        </span>
                      </div>

                      {canConvert ? (
                        <div className="pt-2">
                          <Button 
                            onClick={() => handleStartConversion(link)}
                            className="w-full"
                            disabled={converting === link.id}
                          >
                            {converting === link.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Converting...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Convert Points
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            {balance.points < link.loyalty_networks.min_conversion_amount
                              ? `Need ${link.loyalty_networks.min_conversion_amount - balance.points} more points to convert`
                              : `Balance exceeds maximum conversion limit`
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Loading balance...</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {conversionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Conversions
            </CardTitle>
            <CardDescription>
              Your recent point conversion history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionHistory.map((conversion) => (
                <div key={conversion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{conversion.loyalty_networks.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {conversion.third_party_points.toLocaleString()} points → {conversion.converted_tokens.toLocaleString()} tokens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(conversion.status)}>
                      {conversion.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(conversion.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Dialog */}
      <Dialog open={conversionDialogOpen} onOpenChange={setConversionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Points</DialogTitle>
            <DialogDescription>
              Convert your {selectedLink?.loyalty_networks.display_name} points to platform tokens
            </DialogDescription>
          </DialogHeader>

          {selectedLink && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  {selectedLink.loyalty_networks.logo_url ? (
                    <img 
                      src={selectedLink.loyalty_networks.logo_url} 
                      alt={selectedLink.loyalty_networks.display_name}
                      className="w-8 h-8 rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Shield className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{selectedLink.loyalty_networks.display_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Available: {pointBalances[selectedLink.id]?.points.toLocaleString()} points
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Points to Convert:</span>
                    <span className="font-medium">{conversionAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate:</span>
                    <span className="font-medium">{selectedLink.loyalty_networks.conversion_rate}x</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Tokens You'll Receive:</span>
                    <span className="text-green-600">
                      {Math.floor(conversionAmount * selectedLink.loyalty_networks.conversion_rate).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Conversion Amount</label>
                <input
                  type="range"
                  min={selectedLink.loyalty_networks.min_conversion_amount}
                  max={Math.min(
                    selectedLink.loyalty_networks.max_conversion_amount,
                    pointBalances[selectedLink.id]?.points || 0
                  )}
                  value={conversionAmount}
                  onChange={(e) => setConversionAmount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{selectedLink.loyalty_networks.min_conversion_amount.toLocaleString()}</span>
                  <span>{Math.min(
                    selectedLink.loyalty_networks.max_conversion_amount,
                    pointBalances[selectedLink.id]?.points || 0
                  ).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setConversionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConvertPoints}
                  disabled={converting === selectedLink.id}
                >
                  {converting === selectedLink.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Convert Points
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PointConversionSystem;
