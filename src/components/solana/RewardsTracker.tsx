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

  // Calculate current month data (from beginning of current month)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const currentMonthEarnings = notionalEarnings.filter(earning => 
    new Date(earning.created_at) >= currentMonthStart
  );
  
  const currentMonthEarned = currentMonthEarnings.reduce((sum, earning) => sum + earning.amount, 0);
  const currentMonthVested = currentMonthEarnings
    .filter(earning => earning.status === 'vested')
    .reduce((sum, earning) => sum + earning.amount, 0);
  
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
            Current Month Summary ({now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
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
                {formatAmount(currentMonthEarned)}
              </div>
              <div className="text-sm text-muted-foreground">This Month Earned</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <div className="text-2xl font-bold text-green-500">
                {formatAmount(currentMonthVested)}
              </div>
              <div className="text-sm text-muted-foreground">This Month Vested</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-500">
                {formatAmount(totalVesting)}
              </div>
              <div className="text-sm text-muted-foreground">Total Vesting</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-500">
                {formatAmount(totalClaimed)}
              </div>
              <div className="text-sm text-muted-foreground">Total Claimed</div>
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


      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notionalEarnings.slice(0, 10).map((earning) => {
              const progress = earning.status === 'vesting' ? getVestingProgress(earning.vesting_end_date) : 0;
              const daysLeft = earning.status === 'vesting' ? getDaysUntilVesting(earning.vesting_end_date) : 0;
              
              return (
                <div key={earning.id} className="space-y-3">
                  {/* Transaction Row */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
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
                  
                  {/* Vesting Data (shown below each transaction) */}
                  {earning.status === 'vesting' && (
                    <div className="ml-8 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-500">Vesting Progress</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {daysLeft} days left
                        </div>
                      </div>
                      <Progress value={progress} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Vesting started {new Date(earning.created_at).toLocaleDateString()}</span>
                        <span>{progress}% complete</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {notionalEarnings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rewards activity yet</p>
                <p className="text-sm">Start earning rewards to see your activity here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsTracker;
