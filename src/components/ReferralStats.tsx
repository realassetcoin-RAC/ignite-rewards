import React, { useState, useEffect } from 'react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Gift, Users, Star, Copy, Share2 } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  totalPointsEarned: number;
  referralCode: string | null;
  recentReferrals: Array<{
    id: string;
    referred_user: {
      email: string;
      full_name?: string;
    };
    points_awarded: number;
    settlement_date: string;
  }>;
}

interface ReferralStatsProps {
  userId: string;
  className?: string;
}

export const ReferralStats: React.FC<ReferralStatsProps> = ({ userId, className }) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralStats();
  }, [userId]);

  const fetchReferralStats = async () => {
    try {
      // Try referral_settlements first, fallback to user_referrals if not available
      let data = null;
      let error = null;
      
      try {
        const result = await supabase
          .from('referral_settlements')
          .select(`
            *,
            referred_user:profiles!referral_settlements_referred_user_id_fkey(email, full_name)
          `)
          .eq('referrer_id', userId)
          .eq('status', 'completed')
          .order('settlement_date', { ascending: false });
        
        data = result.data;
        error = result.error;
      } catch (settlementsError) {
        console.warn('referral_settlements table not available, using user_referrals fallback');
        
        // Fallback to user_referrals table
        const fallbackResult = await supabase
          .from('user_referrals')
          .select(`
            *,
            referred_user:profiles!user_referrals_referred_user_id_fkey(email, full_name)
          `)
          .eq('referrer_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        throw error;
      }

      // Get referral code
      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('referrer_id', userId)
        .eq('is_used', false)
        .single();

      const totalReferrals = data?.length || 0;
      const totalPointsEarned = data?.reduce((sum, settlement) => sum + settlement.points_awarded, 0) || 0;
      const recentReferrals = data?.slice(0, 5) || [];

      setStats({
        totalReferrals,
        totalPointsEarned,
        referralCode: referralCode?.code || null,
        recentReferrals
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast({
        title: "Error",
        description: "Failed to load referral statistics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (!stats?.referralCode) return;

    try {
      await navigator.clipboard.writeText(stats.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy referral code.",
        variant: "destructive"
      });
    }
  };

  const shareReferralCode = async () => {
    if (!stats?.referralCode) return;

    const shareText = `Join PointBridge and earn rewards! Use my referral code: ${stats.referralCode}`;
    const shareUrl = `${window.location.origin}?ref=${stats.referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join PointBridge',
          text: shareText,
          url: shareUrl
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "Copied!",
          description: "Referral link copied to clipboard.",
        });
      } catch {
        toast({
          title: "Copy Failed",
          description: "Failed to copy referral link.",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Referrals</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Points Earned</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalPointsEarned || 0}</div>
          </div>
        </div>

        {/* Referral Code */}
        {stats?.referralCode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Referral Code</span>
              <Badge variant="secondary">{stats.referralCode}</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyReferralCode}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareReferralCode}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Recent Referrals */}
        {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Recent Referrals</h4>
            <div className="space-y-2">
              {stats.recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {referral.referred_user.full_name || referral.referred_user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.settlement_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    +{referral.points_awarded} pts
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Referrals Work</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Share your referral code with friends</li>
            <li>• They sign up using your code</li>
            <li>• You both earn bonus points when they join</li>
            <li>• No limit on how many friends you can refer</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
