import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { CreditCard, Copy, Crown, Sparkles } from "lucide-react";

interface LoyaltyCardData {
  id: string;
  user_id: string;
  nft_type_id: string;
  loyalty_number: string;
  card_number: string;
  full_name: string;
  email: string;
  phone?: string;
  points_balance: number;
  tier_level: string;
  is_active: boolean;
  nft_name: string;
  nft_display_name: string;
  nft_rarity: string;
  nft_earn_ratio: number;
  created_at: string;
}

const LoyaltyCardHeader = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchLoyaltyCard();
    }
  }, [user?.id]);

  const fetchLoyaltyCard = async () => {
    try {
      setLoading(true);
      console.log('🎯 Fetching user loyalty card...');

      const { data } = await supabase.rpc('get_user_loyalty_card', { 
        user_uuid: user?.id 
      });

      const result = await data();
      console.log('📋 Loyalty card data:', result);

      if (result.data) {
        setLoyaltyCard(result.data);
      } else {
        // If no loyalty card exists, create one automatically
        await assignFreeLoyaltyCard();
      }
    } catch (error) {
      console.error('❌ Error fetching loyalty card:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignFreeLoyaltyCard = async () => {
    try {
      console.log('🎁 Assigning free loyalty card...');
      
      const { data } = await supabase.rpc('assign_free_loyalty_card', {
        user_uuid: user?.id,
        email: user?.email,
        full_name: user?.user_metadata?.full_name || 'User',
        phone: user?.user_metadata?.phone || null
      });

      const result = await data();
      console.log('✅ Assigned loyalty card:', result);

      if (result.data) {
        // Refresh the loyalty card data
        fetchLoyaltyCard();
        toast({
          title: "Welcome! 🎉",
          description: "Your free loyalty NFT card has been activated!",
        });
      }
    } catch (error) {
      console.error('❌ Error assigning loyalty card:', error);
      toast({
        title: "Error",
        description: "Failed to activate your loyalty card. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyLoyaltyNumber = async () => {
    if (loyaltyCard?.loyalty_number) {
      try {
        await navigator.clipboard.writeText(loyaltyCard.loyalty_number);
        toast({
          title: "Copied!",
          description: "Loyalty number copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'diamond': return 'bg-gradient-to-r from-cyan-400 to-blue-400';
      case 'platinum': return 'bg-gradient-to-r from-gray-300 to-gray-400';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
      case 'silver': return 'bg-gradient-to-r from-gray-200 to-gray-300';
      default: return 'bg-gradient-to-r from-orange-400 to-red-400';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'very rare': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-purple-500';
      case 'less common': return 'from-green-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-white/70">Loading your loyalty card...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyCard) {
    return (
      <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-8 w-8 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">No Loyalty Card Found</h3>
                <p className="text-white/70">Unable to load your loyalty card</p>
              </div>
            </div>
            <Button onClick={assignFreeLoyaltyCard} className="bg-gradient-to-r from-purple-500 to-pink-500">
              Activate Free Card
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-white/20 backdrop-blur-xl shadow-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Card Info */}
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${getRarityColor(loyaltyCard.nft_rarity)} shadow-lg`}>
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white">{loyaltyCard.nft_display_name} NFT</h3>
                <Badge className={`${getTierColor(loyaltyCard.tier_level)} text-white border-0 capitalize`}>
                  {loyaltyCard.tier_level}
                </Badge>
                <Badge className={`bg-gradient-to-r ${getRarityColor(loyaltyCard.nft_rarity)} text-white border-0`}>
                  {loyaltyCard.nft_rarity}
                </Badge>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <span className="text-sm">Loyalty Number:</span>
                <code className="bg-white/10 px-3 py-1 rounded-md text-lg font-mono tracking-wider">
                  {loyaltyCard.loyalty_number}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyLoyaltyNumber}
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-white/70">
                Earn {(loyaltyCard.nft_earn_ratio * 100).toFixed(2)}% on every spend
              </div>
            </div>
          </div>

          {/* Right side - Points & Actions */}
          <div className="text-right space-y-2">
            <div className="flex items-center justify-end space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {loyaltyCard.points_balance.toLocaleString()}
              </span>
              <span className="text-white/70">points</span>
            </div>
            <div className="text-sm text-white/70">
              Card: {loyaltyCard.card_number}
            </div>
            <div className="text-xs text-white/50">
              Active since {new Date(loyaltyCard.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoyaltyCardHeader;
