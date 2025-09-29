import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, TrendingUp, Shield, Globe, Zap, Target } from 'lucide-react';

interface AssetInitiative {
  id: string;
  name: string;
  description: string;
  category: 'environmental' | 'social' | 'governance' | 'technology' | 'healthcare' | 'education';
  impact_score: number; // 1-10 scale
  risk_level: 'low' | 'medium' | 'high';
  expected_return: number; // percentage
  min_investment: number;
  max_investment: number;
  current_funding: number;
  target_funding: number;
  is_active: boolean;
  image_url?: string;
  website_url?: string;
  created_at: string;
}

interface AssetInitiativeSelectorProps {
  userId: string;
  onSelectionChange: (selectedAsset: AssetInitiative | null) => void;
  currentSelection?: AssetInitiative | null;
}

export const AssetInitiativeSelector: React.FC<AssetInitiativeSelectorProps> = ({
  userId,
  onSelectionChange,
  currentSelection
}) => {
  const { toast } = useToast();
  const [assets, setAssets] = useState<AssetInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AssetInitiative | null>(currentSelection || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssets();
    loadUserSelection();
  }, [userId]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_initiatives')
        .select('*')
        .eq('is_active', true)
        .order('impact_score', { ascending: false });

      if (error) {
        throw error;
      }

      setAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast({
        title: "Failed to Load Assets",
        description: "Could not load available asset initiatives. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserSelection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_asset_selections')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.asset_initiative_id) {
        // Load the asset initiative details separately
        const { data: assetData } = await supabase
          .from('asset_initiatives')
          .select('*')
          .eq('id', data.asset_initiative_id)
          .single();
        
        if (assetData) {
          setSelectedAsset(assetData);
          onSelectionChange(assetData);
        }
      }
    } catch (error) {
      console.error('Error loading user selection:', error);
    }
  };

  const handleAssetSelection = async (asset: AssetInitiative) => {
    if (selectedAsset?.id === asset.id) {
      // Deselect if already selected
      await saveSelection(null);
      return;
    }

    await saveSelection(asset);
  };

  const saveSelection = async (asset: AssetInitiative | null) => {
    setSaving(true);

    try {
      if (asset) {
        // Deactivate current selection
        await supabase
          .from('user_asset_selections')
          .update({ is_active: false })
          .eq('user_id', userId);

        // Create new selection
        const { error } = await supabase
          .from('user_asset_selections')
          .insert({
            user_id: userId,
            asset_initiative_id: asset.id,
            selected_at: new Date().toISOString(),
            is_active: true
          });

        if (error) {
          throw error;
        }

        setSelectedAsset(asset);
        onSelectionChange(asset);

        toast({
          title: "Asset Selected",
          description: `You've selected "${asset.name}" for your reward flow.`,
          variant: "default"
        });
      } else {
        // Deactivate current selection
        const { error } = await supabase
          .from('user_asset_selections')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        setSelectedAsset(null);
        onSelectionChange(null);

        toast({
          title: "Asset Deselected",
          description: "You've removed your asset selection.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      toast({
        title: "Failed to Save Selection",
        description: "Could not save your asset selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environmental':
        return <Globe className="h-4 w-4" />;
      case 'social':
        return <Shield className="h-4 w-4" />;
      case 'governance':
        return <Target className="h-4 w-4" />;
      case 'technology':
        return <Zap className="h-4 w-4" />;
      case 'healthcare':
        return <Shield className="h-4 w-4" />;
      case 'education':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental':
        return 'bg-green-100 text-green-800';
      case 'social':
        return 'bg-blue-100 text-blue-800';
      case 'governance':
        return 'bg-purple-100 text-purple-800';
      case 'technology':
        return 'bg-orange-100 text-orange-800';
      case 'healthcare':
        return 'bg-red-100 text-red-800';
      case 'education':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading assets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Your Asset/Initiative</h2>
        <p className="text-muted-foreground">
          Choose one asset or initiative for your reward flow. This determines where your earned rewards are invested.
        </p>
      </div>

      {selectedAsset && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Currently Selected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedAsset.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedAsset.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAssetSelection(selectedAsset)}
                disabled={saving}
              >
                Change Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Card
            key={asset.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedAsset?.id === asset.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleAssetSelection(asset)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(asset.category)}
                  <Badge className={getCategoryColor(asset.category)}>
                    {asset.category}
                  </Badge>
                </div>
                {selectedAsset?.id === asset.id && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardTitle className="text-lg">{asset.name}</CardTitle>
              <CardDescription>{asset.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Impact Score</span>
                <Badge variant="outline">{asset.impact_score}/10</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Level</span>
                <Badge className={getRiskColor(asset.risk_level)}>
                  {asset.risk_level}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Return</span>
                <span className="text-sm font-semibold text-green-600">
                  {asset.expected_return}%
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Funding Progress</span>
                  <span>
                    {Math.round((asset.current_funding / asset.target_funding) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min((asset.current_funding / asset.target_funding) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Min: ${asset.min_investment.toLocaleString()} • 
                Max: ${asset.max_investment.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No asset initiatives available at the moment.</p>
        </div>
      )}
    </div>
  );
};