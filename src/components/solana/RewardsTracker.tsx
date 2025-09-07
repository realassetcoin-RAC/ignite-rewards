import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  Clock, 
  TrendingUp, 
  Wallet, 
  Gift,
  Calendar,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { useSolanaRewards } from '@/hooks/useSolanaRewards';
import { useToast } from '@/hooks/use-toast';

interface RewardsTrackerProps {
  userId: string;
}

const RewardsTracker: React.FC<RewardsTrackerProps> = ({ userId }) => {
  const {
    userRewards,
    notionalEarnings,
    loading,
    claimRewards,
    getVestingProgress,
    getDaysUntilVesting,
    getTotalVested,
    getTotalVesting,
    getTotalClaimable,
    refreshRewards
  } = useSolanaRewards(userId);

  const { toast } = useToast();

  const formatAmount = (amount: number) => {
    return (amount / 1000000).toFixed(2); // Assuming 6 decimal places
  };

  const handleClaimRewards = async () => {
    const claimableAmount = getTotalClaimable();
    if (claimableAmount > 0) {
      await claimRewards(claimableAmount);
    } else {
      toast({
        title: "No Rewards to Claim",
        description: "You don't have any vested rewards available to claim.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refreshRewards();
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading rewards...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarned = userRewards?.total_earned || 0;
  const totalClaimed = userRewards?.total_claimed || 0;
  const totalVested = getTotalVested();
  const totalVesting = getTotalVesting();
  const totalClaimable = getTotalClaimable();

  return (
    <div className="space-y-6">
      {/* Rewards Overview */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Rewards Overview
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {formatAmount(totalEarned)}
              </div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <div className="text-2xl font-bold text-green-500">
                {formatAmount(totalVested)}
              </div>
              <div className="text-sm text-muted-foreground">Vested</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-500">
                {formatAmount(totalVesting)}
              </div>
              <div className="text-sm text-muted-foreground">Vesting</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-500">
                {formatAmount(totalClaimed)}
              </div>
              <div className="text-sm text-muted-foreground">Claimed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claimable Rewards */}
      {totalClaimable > 0 && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Gift className="h-5 w-5" />
              Claimable Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {formatAmount(totalClaimable)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Ready to claim
                </div>
              </div>
              <Button
                onClick={handleClaimRewards}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Claim Rewards
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vesting Progress */}
      {notionalEarnings.length > 0 && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Vesting Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notionalEarnings
                .filter(earning => earning.status === 'vesting')
                .slice(0, 5)
                .map((earning) => {
                  const progress = getVestingProgress(earning.vesting_end_date);
                  const daysLeft = getDaysUntilVesting(earning.vesting_end_date);
                  
                  return (
                    <div key={earning.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {earning.transaction_id.slice(-8)}
                          </Badge>
                          <span className="text-sm font-medium">
                            {formatAmount(earning.amount)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {daysLeft} days left
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Vesting started</span>
                        <span>{progress}% complete</span>
                      </div>
                    </div>
                  );
                })}
              
              {notionalEarnings.filter(earning => earning.status === 'vesting').length > 5 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm">
                    View All Vesting Rewards
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notionalEarnings.slice(0, 5).map((earning) => (
              <div key={earning.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    earning.status === 'vested' ? 'bg-green-500' :
                    earning.status === 'vesting' ? 'bg-blue-500' :
                    earning.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <div className="font-medium">
                      {earning.status === 'vested' ? 'Reward Vested' :
                       earning.status === 'vesting' ? 'Reward Vesting' :
                       earning.status === 'cancelled' ? 'Reward Cancelled' : 'Reward Earned'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(earning.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatAmount(earning.amount)}
                  </div>
                  <Badge 
                    variant={earning.status === 'vested' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {earning.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsTracker;
