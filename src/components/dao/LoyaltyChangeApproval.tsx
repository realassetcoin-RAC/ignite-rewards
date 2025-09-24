import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Vote, 
  Settings, 
  Info,
  ExternalLink,
  Plus,
  Eye,
  XCircle
} from 'lucide-react';
import { useDAOIntegration } from '@/hooks/useDAOIntegration';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LoyaltyChangeApprovalProps {
  onSettingsChange?: (changeType: string, newValue: any, oldValue: any) => void;
  className?: string;
}

interface PendingChange {
  id: string;
  type: string;
  title: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  daoProposalId?: string;
  daoVoteResult?: string;
  daoVotePercentage?: number;
}

const LoyaltyChangeApproval: React.FC<LoyaltyChangeApprovalProps> = ({
  className = ''
}) => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [showCreateChange, setShowCreateChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null);
  
  const { 
    handleLoyaltyChange, 
    getPendingChanges, 
    loading: daoLoading 
  } = useDAOIntegration({
    autoCreateProposal: true,
    requireApproval: true
  });
  
  const { toast } = useToast();

  // Form state for creating new change requests
  const [changeForm, setChangeForm] = useState({
    type: 'loyalty_rule_change',
    title: '',
    description: '',
    affectedComponents: [] as string[],
    impactLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    currentValue: '',
    proposedValue: ''
  });

  useEffect(() => {
    loadPendingChanges();
  }, []);

  const loadPendingChanges = async () => {
    try {
      setLoading(true);
      const changes = await getPendingChanges();
      setPendingChanges(changes as PendingChange[]);
    } catch (error) {
      console.error('Error loading pending changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChangeRequest = async () => {
    try {
      if (!changeForm.title || !changeForm.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const result = await handleLoyaltyChange(
        changeForm.type as any,
        changeForm.title,
        changeForm.description,
        changeForm.affectedComponents,
        changeForm.impactLevel,
        changeForm.currentValue ? JSON.parse(changeForm.currentValue) : undefined,
        changeForm.proposedValue ? JSON.parse(changeForm.proposedValue) : undefined
      );

      if (result) {
        toast({
          title: "Change Request Created",
          description: "A DAO proposal has been created for this change.",
        });
        
        setShowCreateChange(false);
        setChangeForm({
          type: 'loyalty_rule_change',
          title: '',
          description: '',
          affectedComponents: [],
          impactLevel: 'medium',
          currentValue: '',
          proposedValue: ''
        });
        
        await loadPendingChanges();
      }
    } catch (error) {
      console.error('Error creating change request:', error);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const changeTypes = [
    { value: 'loyalty_rule_change', label: 'Loyalty Rule Change' },
    { value: 'reward_structure_change', label: 'Reward Structure Change' },
    { value: 'merchant_settings_change', label: 'Merchant Settings Change' },
    { value: 'platform_config_change', label: 'Platform Configuration Change' },
    { value: 'user_interface_change', label: 'User Interface Change' },
    { value: 'security_policy_change', label: 'Security Policy Change' },
    { value: 'data_handling_change', label: 'Data Handling Change' }
  ];

  const impactLevels = [
    { value: 'low', label: 'Low Impact', description: 'Minimal impact on platform and users' },
    { value: 'medium', label: 'Medium Impact', description: 'Moderate impact on platform functionality' },
    { value: 'high', label: 'High Impact', description: 'Significant impact on platform behavior' },
    { value: 'critical', label: 'Critical Impact', description: 'Fundamental changes to platform operations' }
  ];

  const commonComponents = [
    'reward_calculation',
    'merchant_dashboard',
    'user_dashboard',
    'payment_processing',
    'wallet_integration',
    'transaction_handling',
    'notification_system',
    'analytics_engine',
    'security_layer',
    'api_endpoints'
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Loyalty Change Management</h2>
          <p className="text-muted-foreground">
            Manage changes to the loyalty platform that require DAO approval
          </p>
        </div>
        <Dialog open={showCreateChange} onOpenChange={setShowCreateChange}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Request Change
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Change Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="change-type">Change Type</Label>
                <Select 
                  value={changeForm.type} 
                  onValueChange={(value) => setChangeForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select change type" />
                  </SelectTrigger>
                  <SelectContent>
                    {changeTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={changeForm.title}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the change"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={changeForm.description}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the proposed change"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="impact-level">Impact Level</Label>
                <Select 
                  value={changeForm.impactLevel} 
                  onValueChange={(value: any) => setChangeForm(prev => ({ ...prev, impactLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact level" />
                  </SelectTrigger>
                  <SelectContent>
                    {impactLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Affected Components</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {commonComponents.map(component => (
                    <label key={component} className="flex items-center space-x-2">
                      <Checkbox
                        checked={changeForm.affectedComponents.includes(component)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setChangeForm(prev => ({
                              ...prev,
                              affectedComponents: [...prev.affectedComponents, component]
                            }));
                          } else {
                            setChangeForm(prev => ({
                              ...prev,
                              affectedComponents: prev.affectedComponents.filter(c => c !== component)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{component.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-value">Current Value (JSON)</Label>
                  <Textarea
                    id="current-value"
                    value={changeForm.currentValue}
                    onChange={(e) => setChangeForm(prev => ({ ...prev, currentValue: e.target.value }))}
                    placeholder='{"key": "value"}'
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="proposed-value">Proposed Value (JSON)</Label>
                  <Textarea
                    id="proposed-value"
                    value={changeForm.proposedValue}
                    onChange={(e) => setChangeForm(prev => ({ ...prev, proposedValue: e.target.value }))}
                    placeholder='{"key": "new_value"}'
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateChangeRequest}
                  disabled={daoLoading}
                  className="btn-gradient"
                >
                  {daoLoading ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Changes to the loyalty platform that have medium, high, or critical impact require DAO approval. 
          Once a change request is created, a DAO proposal will be automatically generated for community voting.
        </AlertDescription>
      </Alert>

      {/* Pending Changes */}
      <Card className="card-gradient border-primary/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Pending Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pending changes...</p>
            </div>
          ) : pendingChanges.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Pending Changes</h3>
              <p className="text-muted-foreground">
                All changes have been processed or no changes are currently pending DAO approval.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingChanges.map((change) => (
                <div 
                  key={change.id} 
                  className="p-4 rounded-lg bg-background/60 backdrop-blur-md border border-primary/20 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(change.status)}
                        <h3 className="font-semibold text-foreground">{change.title}</h3>
                        <Badge className={getImpactColor(change.impactLevel)}>
                          {change.impactLevel.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {change.type.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{change.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created {format(new Date(change.createdAt), 'MMM dd, yyyy')}</span>
                        {change.daoProposalId && (
                          <div className="flex items-center gap-1">
                            <Vote className="h-4 w-4" />
                            <span>DAO Proposal: {change.daoVoteResult || 'Pending'}</span>
                            {change.daoVotePercentage && (
                              <span>({change.daoVotePercentage.toFixed(1)}% yes)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {change.daoProposalId && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/dao#proposal-${change.daoProposalId}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Proposal
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedChange(change)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Details Dialog */}
      {selectedChange && (
        <Dialog open={!!selectedChange} onOpenChange={() => setSelectedChange(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Change Request Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedChange.title}</h3>
                <p className="text-muted-foreground">{selectedChange.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p className="text-sm">{selectedChange.type.replace(/_/g, ' ').toUpperCase()}</p>
                </div>
                <div>
                  <Label>Impact Level</Label>
                  <Badge className={getImpactColor(selectedChange.impactLevel)}>
                    {selectedChange.impactLevel.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedChange.status)}
                    <span className="text-sm capitalize">{selectedChange.status}</span>
                  </div>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{format(new Date(selectedChange.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              {selectedChange.daoProposalId && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold mb-2">DAO Proposal Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Proposal ID:</span>
                      <span className="font-mono text-sm">{selectedChange.daoProposalId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vote Result:</span>
                      <span className="capitalize">{selectedChange.daoVoteResult || 'Pending'}</span>
                    </div>
                    {selectedChange.daoVotePercentage && (
                      <div className="flex justify-between">
                        <span>Yes Votes:</span>
                        <span>{selectedChange.daoVotePercentage.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LoyaltyChangeApproval;
