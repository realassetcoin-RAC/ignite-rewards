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
import { Share2, Copy, Users, Gift, TrendingUp, Calendar, ExternalLink, MessageSquare } from "lucide-react";

interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_email: string | null;
  referred_user_id: string | null;
  merchant_id: string | null;
  campaign_id: string | null;
  status: string;
  reward_points: number;
  completed_at: string | null;
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
}

const ReferralsTabImproved = () => {
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

      // Get user's referral code from database
      const { data: userReferral, error: referralError } = await supabase
        .from('user_referrals')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .single();

      if (referralError && referralError.code !== 'PGRST116') {
        console.error('Error fetching referral code:', referralError);
        // Fallback to generated code if not found
        const fallbackCode = `REF${user.id.slice(-8).toUpperCase()}${Date.now().toString().slice(-4)}`;
        setMyReferralCode(fallbackCode);
      } else if (userReferral) {
        setMyReferralCode(userReferral.referral_code);
      }

      // Load user's referrals from database
      const { data: referralsData, error: referralsError } = await supabase
        .from('user_referrals')
        .select(`
          id,
          referrer_id,
          referral_code,
          referred_email,
          referred_user_id,
          merchant_id,
          campaign_id,
          status,
          reward_points,
          completed_at,
          rewarded_at,
          created_at,
          updated_at
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Error loading referrals:', referralsError);
        toast({
          title: "Error",
          description: "Failed to load referral data. Please check your connection.",
          variant: "destructive",
        });
        setReferrals([]);
      } else {
        setReferrals(referralsData || []);
      }

      // Calculate stats
      const totalReferrals = referralsData?.length || 0;
      const completedReferrals = referralsData?.filter(r => r.status === 'completed').length || 0;
      const pendingReferrals = referralsData?.filter(r => r.status === 'pending').length || 0;
      const totalRewards = referralsData?.reduce((sum, r) => sum + (r.reward_points || 0), 0) || 0;

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

  const copyReferralCode = () => {
    if (myReferralCode) {
      navigator.clipboard.writeText(myReferralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${myReferralCode}`;
    navigator.clipboard.writeText(referralUrl);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareViaEmail = () => {
    const subject = "Join RAC Rewards - Exclusive Invitation";
    const body = `Hi there!\n\nI'd like to invite you to join RAC Rewards, an amazing loyalty platform where you can earn rewards from your favorite merchants.\n\nUse my referral code: ${myReferralCode}\nOr click this link: ${window.location.origin}/signup?ref=${myReferralCode}\n\nBest regards!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaSMS = () => {
    const message = `Join RAC Rewards with my referral code: ${myReferralCode} or visit: ${window.location.origin}/signup?ref=${myReferralCode}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
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
      {/* Compact Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-bold text-white">{stats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Completed</p>
                <p className="text-lg font-bold text-green-400">{stats.completedReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-xs text-gray-400">Pending</p>
                <p className="text-lg font-bold text-orange-400">{stats.pendingReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Rewards</p>
                <p className="text-lg font-bold text-blue-400">{stats.totalRewards} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Referral Code Section */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-primary" />
            Share & Earn
          </CardTitle>
          <CardDescription className="text-gray-300">
            Earn 10 points for each successful referral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {myReferralCode ? (
            <>
              {/* Referral Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="referral-code" className="text-gray-300">Your Referral Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="referral-code"
                      value={myReferralCode}
                      readOnly
                      className="font-mono bg-white/5 border-white/10 text-white"
                    />
                    <Button size="sm" variant="outline" onClick={copyReferralCode} className="bg-white/5 border-white/10 hover:bg-white/10">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="referral-link" className="text-gray-300">Referral Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="referral-link"
                      value={`${window.location.origin}/signup?ref=${myReferralCode}`}
                      readOnly
                      className="text-xs bg-white/5 border-white/10 text-white"
                    />
                    <Button size="sm" variant="outline" onClick={copyReferralLink} className="bg-white/5 border-white/10 hover:bg-white/10">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={shareViaEmail} className="bg-blue-500 hover:bg-blue-600">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button size="sm" onClick={shareViaSMS} className="bg-green-500 hover:bg-green-600">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </Button>
                <Button size="sm" onClick={copyReferralLink} className="bg-purple-500 hover:bg-purple-600">
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium">How it works:</p>
                <p className="text-xs text-gray-300 mt-1">
                  Share your code → Friend signs up → They make first payment → You earn 10 points
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-gray-400 mt-2">Generating your referral code...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referrals History */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-white">No referrals yet</h3>
              <p className="text-gray-400">
                Start sharing your referral code to earn rewards!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Reward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.slice(0, 5).map((referral) => (
                    <TableRow key={referral.id} className="border-white/10">
                      <TableCell>
                        <span className="text-sm text-gray-300">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-white">
                          {referral.referred_email || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(referral.status)}
                      </TableCell>
                      <TableCell>
                        {referral.reward_points > 0 ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            +{referral.reward_points} pts
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
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

export default ReferralsTabImproved;
