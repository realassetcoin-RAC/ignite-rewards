import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, CheckCircle, Globe, Heart, DollarSign, Stethoscope } from 'lucide-react';

interface AssetInitiative {
  id: string;
  name: string;
  description: string;
  category: 'environmental' | 'social' | 'economic' | 'health';
  icon: string;
  is_active: boolean;
}

// interface UserAssetSelection {
//   id: string;
//   asset_initiative_id: string;
//   selected_at: string;
// }

interface AssetInitiativeSelectorProps {
  userId: string;
  onSelectionChange?: (initiative: AssetInitiative) => void;
  className?: string;
}

export const AssetInitiativeSelector: React.FC<AssetInitiativeSelectorProps> = ({
  userId,
  onSelectionChange,
  className
}) => {
  const { toast } = useToast();
  const [initiatives, setInitiatives] = useState<AssetInitiative[]>([]);
  const [selectedInitiative, setSelectedInitiative] = useState<AssetInitiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  useEffect(() => {
    fetchInitiatives();
    fetchUserSelection();
  }, [userId]);

  const fetchInitiatives = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_initiatives')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      setInitiatives(data || []);
    } catch {
      // console.error('Error fetching initiatives:', error);
      toast({
        title: "Error",
        description: "Failed to load asset initiatives.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSelection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_asset_selections')
        .select(`
          *,
          asset_initiatives!inner(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSelectedInitiative(data.asset_initiatives);
      }
    } catch {
      // console.error('Error fetching user selection:', error);
    }
  };

  const handleInitiativeSelect = async (initiative: AssetInitiative) => {
    setSaving(true);

    try {
      // Remove existing selection
      await supabase
        .from('user_asset_selections')
        .delete()
        .eq('user_id', userId);

      // Create new selection
      const { error } = await supabase
        .from('user_asset_selections')
        .insert({
          user_id: userId,
          asset_initiative_id: initiative.id
        });

      if (error) {
        throw error;
      }

      setSelectedInitiative(initiative);
      setShowSelectionDialog(false);
      onSelectionChange?.(initiative);

      toast({
        title: "Selection Updated",
        description: `You've selected "${initiative.name}" for your reward flow.`,
      });
    } catch {
      // console.error('Error updating selection:', error);
      toast({
        title: "Error",
        description: "Failed to update your selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environmental': return <Globe className="h-5 w-5" />;
      case 'social': return <Heart className="h-5 w-5" />;
      case 'economic': return <DollarSign className="h-5 w-5" />;
      case 'health': return <Stethoscope className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'bg-green-100 text-green-800';
      case 'social': return 'bg-pink-100 text-pink-800';
      case 'economic': return 'bg-blue-100 text-blue-800';
      case 'health': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'environmental': return 'Environmental';
      case 'social': return 'Social';
      case 'economic': return 'Economic';
      case 'health': return 'Health';
      default: return 'Other';
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
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Asset Initiative Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedInitiative ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{selectedInitiative.icon}</div>
                  <div>
                    <h3 className="font-medium">{selectedInitiative.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedInitiative.description}</p>
                  </div>
                </div>
                <Badge className={getCategoryColor(selectedInitiative.category)}>
                  {getCategoryIcon(selectedInitiative.category)}
                  <span className="ml-1">{getCategoryName(selectedInitiative.category)}</span>
                </Badge>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Selected:</strong> {new Date(selectedInitiative.selected_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your rewards will contribute to this initiative. You can change your selection at any time.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowSelectionDialog(true)}
                className="w-full"
              >
                Change Selection
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Initiative Selected</h3>
              <p className="text-muted-foreground mb-4">
                Choose an asset initiative to direct your rewards toward.
              </p>
              <Button onClick={() => setShowSelectionDialog(true)}>
                Select Initiative
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Dialog */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Asset Initiative</DialogTitle>
            <DialogDescription>
              Choose an initiative to direct your loyalty rewards toward. This helps ensure your points contribute to causes you care about.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {initiatives.map((initiative) => (
              <Card 
                key={initiative.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedInitiative?.id === initiative.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleInitiativeSelect(initiative)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{initiative.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{initiative.name}</h3>
                        <Badge className={getCategoryColor(initiative.category)}>
                          {getCategoryIcon(initiative.category)}
                          <span className="ml-1">{getCategoryName(initiative.category)}</span>
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{initiative.description}</p>
                    </div>
                    {selectedInitiative?.id === initiative.id && (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSelectionDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowSelectionDialog(false)}
              className="flex-1"
              disabled={!selectedInitiative}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Done'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
