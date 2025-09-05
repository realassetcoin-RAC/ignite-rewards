import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Share2, Copy, Users, Gift, TrendingUp, Calendar } from "lucide-react";

interface Referral {
  id: string;
  referral_code: string;
  referred_email: string;
  referred_user_id: string;
  merchant_id: string;
  status: string;
  reward_points: number;
  completed_at: string;
  rewarded_at: string;
  created_at: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
}

const ReferralsTab = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [myReferralCode, setMyReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0, 
    pendingReferrals: 0,
    totalRewards: 0,
  });

  useEffect(() => {
    if (user) {
      loadReferrals();
    }
  }, [user]);

  const loadReferrals = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "User not authenticated. Please sign in.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // First, try to create a referral code if the user doesn't have one
      await ensureUserReferralCode();

      // Load user's referrals
      const { data: referralData, error: referralError } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralError) {
        console.error('Error loading referrals:', referralError);
        
        let errorMessage = "Failed to load referral data";
        switch (referralError.code) {
          case 'PGRST301':
            errorMessage = "You don't have permission to view referral data.";
            break;
          case '42501':
            errorMessage = "Insufficient permissions to access referrals table.";
            break;
          case 'PGRST116':
            errorMessage = "Referrals table not found. This feature may not be set up yet.";
            break;
          default:
            if (referralError.message?.includes('schema must be one of the following')) {
              errorMessage = "Database schema configuration error. The referrals feature may not be properly set up.";
            } else {
              errorMessage = `Failed to load referrals: ${referralError.message}`;
            }
        }
        
        toast({
          title: "Database Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Set empty state instead of failing completely
        setReferrals([]);
        setStats({
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalRewards: 0,
        });
        setLoading(false);
        return;
      }

      const referralsArray = referralData || [];
      setReferrals(referralsArray);

      // Find user's own referral code from the referrals
      if (referralsArray.length > 0) {
        setMyReferralCode(referralsArray[0].referral_code);
      }

      // Calculate stats
      const totalReferrals = referralsArray.length;
      const completedReferrals = referralsArray.filter(r => r.status === 'completed').length;
      const pendingReferrals = referralsArray.filter(r => r.status === 'pending').length;
      const totalRewards = referralsArray.reduce((sum, r) => sum + (r.reward_points || 0), 0);

      setStats({
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalRewards,
      });
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ensureUserReferralCode = async () => {
    if (!user?.id) return;

    try {
      // Check if user already has a referral code
      const { data: existingReferral, error: checkError } = await supabase
        .from('user_referrals')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .limit(1);

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing referral:', checkError);
        return;
      }

      // If user doesn't have a referral code, create one
      if (!existingReferral || existingReferral.length === 0) {
        const referralCode = `REF${user.id.slice(-8).toUpperCase()}${Date.now().toString().slice(-4)}`;
        
        const { error: insertError } = await supabase
          .from('user_referrals')
          .insert([{
            referrer_id: user.id,
            referral_code: referralCode,
            status: 'pending',
            reward_points: 0
          }]);

        if (insertError) {
          console.error('Error creating referral code:', insertError);
        } else {
          setMyReferralCode(referralCode);
        }
      }
    } catch (error) {
      console.error('Error ensuring referral code:', error);
    }
  };

  const copyReferralCode = () => {
    if (myReferralCode) {
      navigator.clipboard.writeText(myReferralCode);
      toast({
        title: "Copied",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}/?ref=${myReferralCode}`;
    navigator.clipboard.writeText(referralUrl);
    toast({
      title: "Copied",
      description: "Referral link copied to clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'rewarded':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Rewarded</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
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
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedReferrals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingReferrals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Total Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalRewards} pts</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share your unique referral code to earn rewards when merchants sign up and make their first payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {myReferralCode ? (
            <>
              <div>
                <Label htmlFor="referral-code">Referral Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="referral-code"
                    value={myReferralCode}
                    readOnly
                    className="font-mono"
                  />
                  <Button size="sm" variant="outline" onClick={copyReferralCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="referral-link">Referral Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="referral-link"
                    value={`${window.location.origin}/?ref=${myReferralCode}`}
                    readOnly
                    className="text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-medium text-primary mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Share your referral code or link with potential merchants</li>
                  <li>• When they sign up and make their first payment, you earn 10 points</li>
                  <li>• Track all your referrals and rewards in the table below</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-2">Generating your referral code...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referrals History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral History
          </CardTitle>
          <CardDescription>
            Track the status of your referrals and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
              <p className="text-muted-foreground">
                Start sharing your referral code to earn rewards!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {referral.referred_email || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {referral.merchant_id ? `Merchant #${referral.merchant_id.slice(-8)}` : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(referral.status)}
                      </TableCell>
                      <TableCell>
                        {referral.reward_points > 0 ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            +{referral.reward_points} pts
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {referral.completed_at 
                            ? new Date(referral.completed_at).toLocaleDateString()
                            : "-"
                          }
                        </span>
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

export default ReferralsTab;