import React, { useState, useEffect } from 'react';
// Points tracking component for merchants
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Coins, AlertTriangle, CheckCircle } from 'lucide-react';

interface MonthlyPointsData {
  id: string;
  year: number;
  month: number;
  points_distributed: number;
  points_cap: number;
  created_at: string;
  updated_at: string;
}

interface MerchantPointsTrackerProps {
  merchantId: string;
  subscriptionPlan?: {
    monthly_points_cap?: number;
    name: string;
  } | null;
}

export const MerchantPointsTracker: React.FC<MerchantPointsTrackerProps> = ({
  merchantId,
  subscriptionPlan
}) => {
  const [currentMonthData, setCurrentMonthData] = useState<MonthlyPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const pointsCap = subscriptionPlan?.monthly_points_cap || 1000;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

  useEffect(() => {
    loadCurrentMonthData();
  }, [merchantId, currentYear, currentMonth]);

  const loadCurrentMonthData = async () => {
    try {
      setLoading(true);
      
      // Check if supabase is properly initialized
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      // Try to get existing data for current month
      let data, error;
      try {
        const result = await supabase
          .from('merchant_monthly_points')
          .select('*')
          .eq('merchant_id', merchantId)
          .eq('year', currentYear)
          .eq('month', currentMonth)
          .single();
        data = result.data;
        error = result.error;
      } catch (queryError) {
        console.error('Query execution error:', queryError);
        error = queryError;
        data = null;
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading points data:', error);
        // Only show error toast for actual errors, not missing data or table not found
        if (error.code !== '42501' && 
            !error.message?.includes('permission denied') && 
            !error.message?.includes('relation') && 
            !error.message?.includes('does not exist')) {
          toast({
            title: "Error",
            description: "Failed to load points tracking data.",
            variant: "destructive",
          });
        }
        // If table doesn't exist, show error
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.error('merchant_monthly_points table does not exist');
          toast({
            title: "Database Error",
            description: "Points tracking table not found. Please contact support.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data) {
        setCurrentMonthData(data);
      } else {
        // Create new record for current month if it doesn't exist
        const { data: newData, error: createError } = await supabase
          .from('merchant_monthly_points')
          .insert({
            merchant_id: merchantId,
            year: currentYear,
            month: currentMonth,
            points_distributed: 0,
            points_cap: pointsCap
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating points record:', createError);
          // If table doesn't exist, show error
          if (createError.message?.includes('relation') || createError.message?.includes('does not exist')) {
            console.error('merchant_monthly_points table does not exist');
            toast({
              title: "Database Error",
              description: "Points tracking table not found. Please contact support.",
              variant: "destructive",
            });
            return;
          }
          toast({
            title: "Error",
            description: "Failed to initialize points tracking.",
            variant: "destructive",
          });
          return;
        }

        setCurrentMonthData(newData);
      }
    } catch (error) {
      console.error('Error loading points data:', error);
      // Only show error toast for critical errors, not network issues or table not found
      if (error instanceof Error && 
          !error.message.includes('fetch') && 
          !error.message.includes('relation') && 
          !error.message.includes('does not exist')) {
        toast({
          title: "Error",
          description: "Failed to load points tracking data.",
          variant: "destructive",
        });
      }
      // If table doesn't exist, show error
      if (error instanceof Error && 
          (error.message.includes('relation') || error.message.includes('does not exist'))) {
        console.error('merchant_monthly_points table does not exist');
        toast({
          title: "Database Error",
          description: "Points tracking table not found. Please contact support.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // const _updatePointsDistributed = async (additionalPoints: number) => {
  //   // Function removed - was unused
  // };

  const getUsagePercentage = () => {
    if (!currentMonthData || pointsCap === 0) return 0;
    return Math.round((currentMonthData.points_distributed / pointsCap) * 100);
  };

  const getRemainingPoints = () => {
    if (!currentMonthData) return pointsCap;
    return Math.max(0, pointsCap - currentMonthData.points_distributed);
  };

  const getStatusColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return <AlertTriangle className="w-4 h-4" />;
    if (percentage >= 75) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'Near Limit';
    if (percentage >= 75) return 'High Usage';
    return 'Normal';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Monthly Points Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading points data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Monthly Points Tracking
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Month Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {subscriptionPlan?.name || 'Current'} Plan
            </p>
          </div>

          {/* Points Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Points Distributed</span>
              <span className="font-medium">
                {currentMonthData?.points_distributed || 0} / {pointsCap}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage()} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{getUsagePercentage()}% used</span>
              <span>{getRemainingPoints()} remaining</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentMonthData?.points_distributed || 0}
              </div>
              <div className="text-xs text-muted-foreground">Distributed</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {getRemainingPoints()}
              </div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Warning Messages */}
          {getUsagePercentage() >= 90 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Points limit nearly reached
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                You have used {getUsagePercentage()}% of your monthly points allocation. 
                Consider upgrading your plan for higher limits.
              </p>
            </div>
          )}

          {getUsagePercentage() >= 75 && getUsagePercentage() < 90 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  High points usage
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                You have used {getUsagePercentage()}% of your monthly points allocation.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Export a function to update points (to be used by other components)
export const updateMerchantPoints = async (
  merchantId: string, 
  pointsToAdd: number
): Promise<boolean> => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get current month data
    const { data, error } = await supabase
      .from('merchant_monthly_points')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading points data:', error);
      return false;
    }

    if (!data) {
      console.error('No points data found for current month');
      return false;
    }

    const newTotal = data.points_distributed + pointsToAdd;
    
    if (newTotal > data.points_cap) {
      console.error('Points cap exceeded');
      return false;
    }

    // Update points
    const { error: updateError } = await supabase
      .from('merchant_monthly_points')
      .update({ 
        points_distributed: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);

    if (updateError) {
      console.error('Error updating points:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating merchant points:', error);
    return false;
  }
};
