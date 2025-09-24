import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Edit, Save, X, Plus, Shield, Crown, Star, Zap } from 'lucide-react';

interface FeatureControl {
  id: string;
  feature_name: string;
  description: string;
  is_enabled: boolean;
  subscription_plans: string[];
  created_at: string;
  updated_at: string;
}

interface FeatureControlPanelProps {
  className?: string;
}

export const FeatureControlPanel: React.FC<FeatureControlPanelProps> = ({ className }) => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<FeatureControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureControl | null>(null);
  const [formData, setFormData] = useState({
    feature_name: '',
    description: '',
    is_enabled: true,
    subscription_plans: [] as string[]
  });

  const subscriptionPlans = [
    { id: 'basic', name: 'Basic', icon: <Star className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
    { id: 'premium', name: 'Premium', icon: <Crown className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
    { id: 'enterprise', name: 'Enterprise', icon: <Zap className="h-4 w-4" />, color: 'bg-gold-100 text-gold-800' }
  ];

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_feature_controls')
        .select('*')
        .order('feature_name');

      if (error) {
        throw error;
      }

      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast({
        title: "Error",
        description: "Failed to load feature controls.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (feature: FeatureControl) => {
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('admin_feature_controls')
        .update({
          is_enabled: !feature.is_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', feature.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setFeatures(prev => prev.map(f => f.id === feature.id ? data : f));
      toast({
        title: "Feature Updated",
        description: `${feature.feature_name} has been ${data.is_enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature status.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlan = (planId: string) => {
    setFormData(prev => ({
      ...prev,
      subscription_plans: prev.subscription_plans.includes(planId)
        ? prev.subscription_plans.filter(id => id !== planId)
        : [...prev.subscription_plans, planId]
    }));
  };

  const handleSaveFeature = async () => {
    if (!formData.feature_name.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Feature name and description are required.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      if (editingFeature) {
        // Update existing feature
        const { data, error } = await supabase
          .from('admin_feature_controls')
          .update({
            feature_name: formData.feature_name,
            description: formData.description,
            is_enabled: formData.is_enabled,
            subscription_plans: formData.subscription_plans,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFeature.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setFeatures(prev => prev.map(f => f.id === editingFeature.id ? data : f));
        toast({
          title: "Feature Updated",
          description: "Feature has been updated successfully.",
        });
      } else {
        // Create new feature
        const { data, error } = await supabase
          .from('admin_feature_controls')
          .insert({
            feature_name: formData.feature_name,
            description: formData.description,
            is_enabled: formData.is_enabled,
            subscription_plans: formData.subscription_plans
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setFeatures(prev => [...prev, data]);
        toast({
          title: "Feature Created",
          description: "New feature has been created successfully.",
        });
      }

      resetForm();
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error saving feature:', error);
      toast({
        title: "Error",
        description: "Failed to save feature. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      feature_name: '',
      description: '',
      is_enabled: true,
      subscription_plans: []
    });
    setEditingFeature(null);
  };

  const openEditDialog = (feature?: FeatureControl) => {
    if (feature) {
      setEditingFeature(feature);
      setFormData({
        feature_name: feature.feature_name,
        description: feature.description,
        is_enabled: feature.is_enabled,
        subscription_plans: feature.subscription_plans
      });
    } else {
      resetForm();
    }
    setShowEditDialog(true);
  };

  const getFeatureIcon = (featureName: string) => {
    if (featureName.includes('discount')) return <Shield className="h-4 w-4" />;
    if (featureName.includes('nft')) return <Crown className="h-4 w-4" />;
    if (featureName.includes('analytics')) return <Zap className="h-4 w-4" />;
    if (featureName.includes('email')) return <Star className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Controls
            </CardTitle>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getFeatureIcon(feature.feature_name)}
                    <div>
                      <h3 className="font-medium">{feature.feature_name}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feature.is_enabled}
                        onCheckedChange={() => handleToggleFeature(feature)}
                        disabled={saving}
                      />
                      <span className="text-sm text-muted-foreground">
                        {feature.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(feature)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subscription Plans */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Available for:</span>
                  <div className="flex gap-2">
                    {subscriptionPlans.map((plan) => (
                      <Badge
                        key={plan.id}
                        variant={feature.subscription_plans.includes(plan.id) ? 'default' : 'outline'}
                        className={`${feature.subscription_plans.includes(plan.id) ? plan.color : ''}`}
                      >
                        {plan.icon}
                        <span className="ml-1">{plan.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {features.length === 0 && (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No feature controls configured yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first feature control to manage subscription-based features.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        setShowEditDialog(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Edit Feature Control' : 'Add Feature Control'}
            </DialogTitle>
            <DialogDescription>
              {editingFeature 
                ? 'Update the feature control settings.'
                : 'Create a new feature control for subscription-based features.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Feature Name */}
            <div className="space-y-2">
              <Label htmlFor="feature_name">Feature Name *</Label>
              <Input
                id="feature_name"
                value={formData.feature_name}
                onChange={(e) => setFormData(prev => ({ ...prev, feature_name: e.target.value }))}
                placeholder="e.g., discount_codes, custom_nft, advanced_analytics"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this feature does and how it benefits merchants"
                rows={3}
                required
              />
            </div>

            {/* Enabled Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Feature Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this feature globally
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
              />
            </div>

            {/* Subscription Plans */}
            <div className="space-y-3">
              <Label>Available Subscription Plans</Label>
              <p className="text-sm text-muted-foreground">
                Select which subscription plans can access this feature
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      formData.subscription_plans.includes(plan.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                    onClick={() => handleTogglePlan(plan.id)}
                  >
                    <div className="flex items-center gap-2">
                      {plan.icon}
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="mt-2">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        formData.subscription_plans.includes(plan.id)
                          ? plan.color
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {formData.subscription_plans.includes(plan.id) ? 'Included' : 'Not Included'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowEditDialog(false);
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveFeature}
                disabled={saving || !formData.feature_name.trim() || !formData.description.trim()}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingFeature ? 'Update Feature' : 'Create Feature'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
