import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  Clock, 
  TrendingUp, 
  Wallet, 
  Gift,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  X
} from 'lucide-react';
import { useSolanaRewards } from '@/hooks/useSolanaRewards';
import { useToast } from '@/hooks/use-toast';

interface RewardsTrackerProps {
  userId: string;
}

const RewardsTrackerImproved: React.FC<RewardsTrackerProps> = ({ userId }) => {
  const {
    userRewards,
    notionalEarnings,
    loading,
    claimRewards,
    getVestingProgress,
    getDaysUntilVesting,
    getTotalVesting,
    getTotalClaimable,
    refreshRewards
  } = useSolanaRewards(userId);

  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vesting' | 'vested' | 'claimed'>('all');

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

  const clearSearch = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Filter and search earnings
  const filteredEarnings = useMemo(() => {
    let filtered = notionalEarnings;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(earning => earning.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(earning => {
        const transactionId = earning.id?.toLowerCase() || '';
        const amount = formatAmount(earning.amount);
        const date = new Date(earning.created_at).toLocaleDateString().toLowerCase();
        const status = earning.status.toLowerCase();
        
        return transactionId.includes(query) ||
               amount.includes(query) ||
               date.includes(query) ||
               status.includes(query);
      });
    }

    return filtered;
  }, [notionalEarnings, searchQuery, statusFilter]);

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
  
  const totalClaimed = userRewards?.total_claimed || 0;
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">Earned This Month</span>
              </div>
              <div className="text-2xl font-bold text-primary">{formatAmount(currentMonthEarned)} RAC</div>
            </div>
            
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-center mb-2">
                <Wallet className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-500">Available to Claim</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{formatAmount(totalClaimable)} RAC</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-yellow-500">Currently Vesting</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">{formatAmount(totalVesting)} RAC</div>
            </div>
            
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center justify-center mb-2">
                <Gift className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-500">Total Claimed</span>
              </div>
              <div className="text-2xl font-bold text-blue-500">{formatAmount(totalClaimed)} RAC</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Button
              onClick={handleClaimRewards}
              disabled={totalClaimable === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Claim {formatAmount(totalClaimable)} RAC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by transaction ID, amount, date, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? '' : 'bg-white/5 border-white/10 hover:bg-white/10'}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'vesting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('vesting')}
                className={statusFilter === 'vesting' ? '' : 'bg-white/5 border-white/10 hover:bg-white/10'}
              >
                <Clock className="h-4 w-4 mr-1" />
                Vesting
              </Button>
              <Button
                variant={statusFilter === 'vested' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('vested')}
                className={statusFilter === 'vested' ? '' : 'bg-white/5 border-white/10 hover:bg-white/10'}
              >
                <Wallet className="h-4 w-4 mr-1" />
                Vested
              </Button>
              <Button
                variant={statusFilter === 'claimed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('claimed')}
                className={statusFilter === 'claimed' ? '' : 'bg-white/5 border-white/10 hover:bg-white/10'}
              >
                <Gift className="h-4 w-4 mr-1" />
                Claimed
              </Button>
            </div>
            
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredEarnings.length} of {notionalEarnings.length} transactions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEarnings.slice(0, 20).map((earning) => {
              const progress = earning.status === 'vesting' ? getVestingProgress(earning) : 100;
              const daysLeft = earning.status === 'vesting' ? getDaysUntilVesting(earning) : 0;
              
              return (
                <div key={earning.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-full">
                        <Coins className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-white">+{formatAmount(earning.amount)} RAC</p>
                        <p className="text-sm text-gray-400">
                          {new Date(earning.created_at).toLocaleDateString()} at {new Date(earning.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={earning.status === 'vested' ? 'default' : earning.status === 'vesting' ? 'secondary' : 'outline'}
                        className={
                          earning.status === 'vested' ? 'bg-green-500 text-white' :
                          earning.status === 'vesting' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'
                        }
                      >
                        {earning.status === 'vested' ? 'Available' : 
                         earning.status === 'vesting' ? 'Vesting' : 'Claimed'}
                      </Badge>
                      {earning.id && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          ID: {earning.id.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Vesting Progress */}
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
            
            {filteredEarnings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions match your search criteria</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </>
                ) : (
                  <>
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rewards activity yet</p>
                    <p className="text-sm">Start earning rewards to see your activity here</p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsTrackerImproved;
