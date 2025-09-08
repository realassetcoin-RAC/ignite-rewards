import React, { useState, useEffect } from 'react';
// Points tracking component for merchants
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Coins, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

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
      
      // Try to get existing data for current month
      const { data, error } = await supabase
        .from('merchant_monthly_points')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading points data:', error);
        toast({
          title: "Error",
          description: "Failed to load points tracking data.",
          variant: "destructive",
        });
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
      toast({
        title: "Error",
        description: "Failed to load points tracking data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePointsDistributed = async (additionalPoints: number) => {
    if (!currentMonthData) return;

    const newTotal = currentMonthData.points_distributed + additionalPoints;
    
    if (newTotal > pointsCap) {
      toast({
        title: "Points Cap Exceeded",
        description: `Cannot distribute ${additionalPoints} points. This would exceed your monthly cap of ${pointsCap} points.`,
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('merchant_monthly_points')
        .update({ 
          points_distributed: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMonthData.id);

      if (error) {
        console.error('Error updating points:', error);
        toast({
          title: "Error",
          description: "Failed to update points distribution.",
          variant: "destructive",
        });
        return false;
      }

      setCurrentMonthData(prev => prev ? {
        ...prev,
        points_distributed: newTotal,
        updated_at: new Date().toISOString()
      } : null);

      return true;
    } catch (error) {
      console.error('Error updating points:', error);
      toast({
        title: "Error",
        description: "Failed to update points distribution.",
        variant: "destructive",
      });
      return false;
    }
  };

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
