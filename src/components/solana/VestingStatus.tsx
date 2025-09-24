import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Gift,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useSolanaRewards } from '@/hooks/useSolanaRewards';

interface VestingStatusProps {
  userId: string;
}

const VestingStatus: React.FC<VestingStatusProps> = ({ userId }) => {
  const {
    notionalEarnings,
    getVestingProgress,
    getDaysUntilVesting,
    loading
  } = useSolanaRewards(userId);

  const formatAmount = (amount: number) => {
    return (amount / 1000000).toFixed(2); // Assuming 6 decimal places
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vested':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'vesting':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // const _getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'vested':
  //       return 'bg-green-500/10 text-green-500 border-green-500/20';
  //     case 'vesting':
  //       return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  //     case 'cancelled':
  //       return 'bg-red-500/10 text-red-500 border-red-500/20';
  //     default:
  //       return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  //   }
  // };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading vesting status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const vestingEarnings = notionalEarnings.filter(earning => earning.status === 'vesting');
  const vestedEarnings = notionalEarnings.filter(earning => earning.status === 'vested');
  const cancelledEarnings = notionalEarnings.filter(earning => earning.status === 'cancelled');

  const totalVesting = vestingEarnings.reduce((sum, earning) => sum + earning.amount, 0);
  const totalVested = vestedEarnings.reduce((sum, earning) => sum + earning.amount, 0);
  const totalCancelled = cancelledEarnings.reduce((sum, earning) => sum + earning.amount, 0);

  return (
    <div className="space-y-6">
      {/* Vesting Summary */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Vesting Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-500">
                {formatAmount(totalVesting)}
              </div>
              <div className="text-sm text-muted-foreground">Currently Vesting</div>
              <div className="text-xs text-blue-500/70 mt-1">
                {vestingEarnings.length} rewards
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <div className="text-2xl font-bold text-green-500">
                {formatAmount(totalVested)}
              </div>
              <div className="text-sm text-muted-foreground">Fully Vested</div>
              <div className="text-xs text-green-500/70 mt-1">
                {vestedEarnings.length} rewards
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
              <div className="text-2xl font-bold text-red-500">
                {formatAmount(totalCancelled)}
              </div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
              <div className="text-xs text-red-500/70 mt-1">
                {cancelledEarnings.length} rewards
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Vesting */}
      {vestingEarnings.length > 0 && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Active Vesting ({vestingEarnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vestingEarnings.map((earning) => {
                const progress = getVestingProgress(earning.vesting_end_date);
                const daysLeft = getDaysUntilVesting(earning.vesting_end_date);
                const isNearCompletion = daysLeft <= 3;
                
                return (
                  <div key={earning.id} className="p-4 rounded-lg bg-gradient-to-r from-background/50 to-background/30 border border-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(earning.status)}
                        <div>
                          <div className="font-medium">
                            Transaction {earning.transaction_id.slice(-8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Started {formatDate(earning.vesting_start_date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatAmount(earning.amount)}
                        </div>
                        <Badge 
                          variant={isNearCompletion ? 'default' : 'secondary'}
                          className={isNearCompletion ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                        >
                          {daysLeft} days left
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Vesting Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Vesting ends: {formatDate(earning.vesting_end_date)}</span>
                        <span>{progress}% complete</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Vested */}
      {vestedEarnings.length > 0 && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Gift className="h-5 w-5" />
              Recently Vested ({vestedEarnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vestedEarnings.slice(0, 5).map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/5 to-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(earning.status)}
                    <div>
                      <div className="font-medium">
                        Transaction {earning.transaction_id.slice(-8)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Vested on {formatDate(earning.vesting_end_date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-500">
                      {formatAmount(earning.amount)}
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Ready to claim
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Rewards */}
      {cancelledEarnings.length > 0 && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              Cancelled Rewards ({cancelledEarnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cancelledEarnings.slice(0, 5).map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-500/5 to-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(earning.status)}
                    <div>
                      <div className="font-medium">
                        Transaction {earning.transaction_id.slice(-8)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cancelled on {formatDate(earning.updated_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-500">
                      {formatAmount(earning.amount)}
                    </div>
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                      Cancelled
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Vesting Data */}
      {notionalEarnings.length === 0 && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Vesting Data</h3>
            <p className="text-muted-foreground">
              Start earning rewards by making purchases at partner merchants to see your vesting progress here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VestingStatus;
