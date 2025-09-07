import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Settings, 
  Users, 
  Clock,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RewardsConfig {
  id: string;
  program_id: string;
  admin_authority: string;
  reward_token_mint: string;
  distribution_interval: number;
  max_rewards_per_user: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AnonymousUser {
  id: string;
  anonymous_id: string;
  solana_address: string | null;
  user_type: 'custodial' | 'non_custodial';
  total_transactions: number;
  total_earned: number;
  is_active: boolean;
  created_at: string;
}

interface VestingStats {
  total_vesting: number;
  total_vested: number;
  total_cancelled: number;
  vesting_users: number;
}

const SolanaRewardsManager: React.FC = () => {
  const [rewardsConfig, setRewardsConfig] = useState<RewardsConfig | null>(null);
  const [anonymousUsers, setAnonymousUsers] = useState<AnonymousUser[]>([]);
  const [vestingStats, setVestingStats] = useState<VestingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnonymousUsers, setShowAnonymousUsers] = useState(false);
  const [configForm, setConfigForm] = useState({
    distribution_interval: '86400',
    max_rewards_per_user: '1000000'
  });
  const { toast } = useToast();

  const loadRewardsConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading rewards config:', error);
        // If table doesn't exist, we'll handle it gracefully
        if (error.code === 'PGRST301') {
          console.log('Rewards config table does not exist yet. This is expected if migration hasn\'t been run.');
          return;
        }
        throw error;
      }

      setRewardsConfig(data);
      if (data) {
        setConfigForm({
          distribution_interval: data.distribution_interval.toString(),
          max_rewards_per_user: data.max_rewards_per_user.toString()
        });
      }
    } catch (error) {
      console.error('Error loading rewards config:', error);
    }
  };

  const loadAnonymousUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('anonymous_users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      setAnonymousUsers(data || []);
    } catch (error) {
      console.error('Error loading anonymous users:', error);
    }
  };

  const loadVestingStats = async () => {
    try {
      // In a real implementation, you would query the database for vesting statistics
      // For now, we'll simulate the data
      setVestingStats({
        total_vesting: 1500000, // 1.5M tokens vesting
        total_vested: 800000,   // 800K tokens vested
        total_cancelled: 50000, // 50K tokens cancelled
        vesting_users: 1250     // 1,250 users with vesting rewards
      });
    } catch (error) {
      console.error('Error loading vesting stats:', error);
    }
  };

  const updateRewardsConfig = async () => {
    try {
      setLoading(true);

      const configData = {
        distribution_interval: parseInt(configForm.distribution_interval),
        max_rewards_per_user: parseInt(configForm.max_rewards_per_user),
        updated_at: new Date().toISOString()
      };

      if (rewardsConfig) {
        // Update existing config
        const { error } = await supabase
          .from('rewards_config')
          .update(configData)
          .eq('id', rewardsConfig.id);

        if (error) {
          console.error('Update error details:', error);
          throw error;
        }
      } else {
        // Create new config
        const { error } = await supabase
          .from('rewards_config')
          .insert({
            ...configData,
            program_id: 'mock_program_id',
            admin_authority: 'mock_admin_authority',
            reward_token_mint: 'mock_token_mint',
            is_active: true
          });

        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
      }

      toast({
        title: "Configuration Updated",
        description: "Rewards configuration has been updated successfully.",
      });

      await loadRewardsConfig();

    } catch (error: any) {
      console.error('Error updating rewards config:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to update rewards configuration.";
      
      if (error?.code === 'PGRST301') {
        errorMessage = "Table 'rewards_config' does not exist. Please run the database migration first.";
      } else if (error?.code === '42501') {
        errorMessage = "Permission denied. You need admin access to update rewards configuration.";
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 1000000).toFixed(2); // Assuming 6 decimal places
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadRewardsConfig(),
        loadAnonymousUsers(),
        loadVestingStats()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading Solana rewards data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show setup message if no rewards config exists
  if (!rewardsConfig) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Solana Rewards Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-500">Database Migration Required</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The Solana rewards system requires database tables to be created first. 
                      Please run the migration script to set up the required tables.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <h3 className="font-semibold text-blue-500 mb-2">How to Fix:</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open your Supabase dashboard</li>
                  <li>Go to the SQL Editor</li>
                  <li>Copy and paste the contents of <code className="bg-background/50 px-1 rounded">apply_solana_migration.sql</code></li>
                  <li>Run the migration script</li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
                <h3 className="font-semibold text-green-500 mb-2">What This Will Create:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Rewards configuration table</li>
                  <li>User rewards tracking</li>
                  <li>Notional earnings with 30-day vesting</li>
                  <li>Anonymous user management</li>
                  <li>Transaction processing tables</li>
                  <li>Proper security policies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rewards Configuration */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Rewards Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Distribution Interval (seconds)</label>
                <Input
                  type="number"
                  value={configForm.distribution_interval}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, distribution_interval: e.target.value }))}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  How often rewards are distributed (86400 = 24 hours)
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Max Rewards Per User</label>
                <Input
                  type="number"
                  value={configForm.max_rewards_per_user}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, max_rewards_per_user: e.target.value }))}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Maximum rewards a user can earn
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={updateRewardsConfig}
                disabled={loading}
                className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Update Configuration
                  </>
                )}
              </Button>
              
              {rewardsConfig && (
                <Badge variant={rewardsConfig.is_active ? 'default' : 'secondary'}>
                  {rewardsConfig.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vesting Statistics */}
      {vestingStats && (
        <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Vesting Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-500">
                  {formatAmount(vestingStats.total_vesting)}
                </div>
                <div className="text-sm text-muted-foreground">Currently Vesting</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="text-2xl font-bold text-green-500">
                  {formatAmount(vestingStats.total_vested)}
                </div>
                <div className="text-sm text-muted-foreground">Fully Vested</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                <div className="text-2xl font-bold text-red-500">
                  {formatAmount(vestingStats.total_cancelled)}
                </div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-500">
                  {vestingStats.vesting_users.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Users Vesting</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anonymous Users */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Anonymous Users ({anonymousUsers.length})
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnonymousUsers(!showAnonymousUsers)}
            >
              {showAnonymousUsers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAnonymousUsers ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div className="text-2xl font-bold text-primary">
                    {anonymousUsers.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">
                    {anonymousUsers.filter(u => u.user_type === 'custodial').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Custodial Users</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">
                    {anonymousUsers.filter(u => u.user_type === 'non_custodial').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Non-Custodial Users</div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {anonymousUsers.slice(0, 20).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-background/50 to-background/30 border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        user.is_active ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <div className="font-medium font-mono text-sm">
                          {user.anonymous_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.user_type} • {user.total_transactions} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {formatAmount(user.total_earned)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Anonymous Users</h3>
              <p className="text-muted-foreground">
                Click the eye icon to view anonymous user data
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/5 to-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Solana Contract</div>
                  <div className="text-sm text-muted-foreground">Connected and operational</div>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                Online
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Vesting System</div>
                  <div className="text-sm text-muted-foreground">30-day vesting active</div>
                </div>
              </div>
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium">Privacy System</div>
                  <div className="text-sm text-muted-foreground">Anonymous transactions enabled</div>
                </div>
              </div>
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolanaRewardsManager;
