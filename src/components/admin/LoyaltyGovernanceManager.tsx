import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { LoyaltyGovernanceService, LoyaltyChangeType, type LoyaltyChange } from '@/lib/loyaltyGovernanceService';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Plus,
  Eye,
  // Settings,
  // AlertTriangle,
  Vote,
  FileText
} from 'lucide-react';

interface LoyaltyGovernanceManagerProps {
  className?: string;
}

export const LoyaltyGovernanceManager: React.FC<LoyaltyGovernanceManagerProps> = ({ className }) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [changes, setChanges] = useState<LoyaltyChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedChange, setSelectedChange] = useState<LoyaltyChange | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Form state for creating new changes
  const [formData, setFormData] = useState({
    changeType: '',
    parameterName: '',
    oldValue: '',
    newValue: '',
    reason: ''
  });

  useEffect(() => {
    loadPendingChanges();
  }, []);

  const loadPendingChanges = async () => {
    try {
      setLoading(true);
      const { changes: pendingChanges, error } = await LoyaltyGovernanceService.getPendingChanges();
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      setChanges(pendingChanges);
    } catch (error) {
      console.error('Error loading pending changes:', error);
      toast({
        title: "Error",
        description: "Failed to load pending changes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChange = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await LoyaltyGovernanceService.createDAOProposalForLoyaltyChange({
        changeType: formData.changeType as LoyaltyChangeType,
        parameterName: formData.parameterName,
        oldValue: formData.oldValue,
        newValue: formData.newValue,
        reason: formData.reason,
        proposedBy: user.id
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `DAO proposal created successfully. Proposal ID: ${result.proposalId}`,
        });
        
        setShowCreateDialog(false);
        setFormData({
          changeType: '',
          parameterName: '',
          oldValue: '',
          newValue: '',
          reason: ''
        });
        
        loadPendingChanges();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create DAO proposal",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating loyalty change:', error);
      toast({
        title: "Error",
        description: "Failed to create loyalty change",
        variant: "destructive"
      });
    }
  };

  const handleExecuteChange = async (changeId: string) => {
    try {
      const result = await LoyaltyGovernanceService.executeApprovedChange(changeId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Change executed successfully",
        });
        loadPendingChanges();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to execute change",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error executing change:', error);
      toast({
        title: "Error",
        description: "Failed to execute change",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'implemented':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><CheckCircle className="h-3 w-3 mr-1" />Implemented</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChangeTypeDisplayName = (changeType: string) => {
    const displayNames: Record<string, string> = {
      'point_release_delay': 'Point Release Delay',
      'referral_parameters': 'Referral Parameters',
      'nft_earning_ratios': 'NFT Earning Ratios',
      'loyalty_network_settings': 'Loyalty Network Settings',
      'merchant_limits': 'Merchant Limits',
      'inactivity_timeout': 'Inactivity Timeout',
      'sms_otp_settings': 'SMS OTP Settings',
      'subscription_plans': 'Subscription Plans',
      'asset_initiative_selection': 'Asset Initiative Selection',
      'wallet_management': 'Wallet Management',
      'payment_gateway': 'Payment Gateway',
      'email_notifications': 'Email Notifications'
    };
    return displayNames[changeType] || changeType;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Loyalty Governance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Loyalty Governance
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Propose Change
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Propose Loyalty Behavior Change</DialogTitle>
                <DialogDescription>
                  Create a DAO proposal for any loyalty application behavior change. All changes must be approved by the community.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="changeType">Change Type</Label>
                  <Select value={formData.changeType} onValueChange={(value) => setFormData({...formData, changeType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select change type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(LoyaltyChangeType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getChangeTypeDisplayName(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parameterName">Parameter Name</Label>
                  <Input
                    id="parameterName"
                    value={formData.parameterName}
                    onChange={(e) => setFormData({...formData, parameterName: e.target.value})}
                    placeholder="e.g., release_delay_days, points_per_referral"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldValue">Current Value</Label>
                    <Input
                      id="oldValue"
                      value={formData.oldValue}
                      onChange={(e) => setFormData({...formData, oldValue: e.target.value})}
                      placeholder="Current value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newValue">Proposed Value</Label>
                    <Input
                      id="newValue"
                      value={formData.newValue}
                      onChange={(e) => setFormData({...formData, newValue: e.target.value})}
                      placeholder="Proposed value"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Change</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Explain why this change is needed..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChange}>
                    Create DAO Proposal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {changes.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Changes</h3>
            <p className="text-muted-foreground mb-4">
              All loyalty application behavior changes are properly governed.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Propose First Change
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {changes.map((change) => (
              <Card key={change.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{getChangeTypeDisplayName(change.changeType)}</h4>
                        {getStatusBadge(change.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>{change.parameterName}:</strong> {change.oldValue} → {change.newValue}
                      </p>
                      <p className="text-sm">{change.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Proposed: {new Date(change.createdAt).toLocaleDateString()}</span>
                        {change.daoProposalId && (
                          <span className="flex items-center gap-1">
                            <Vote className="h-3 w-3" />
                            DAO Proposal: {change.daoProposalId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedChange(change);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {change.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleExecuteChange(change.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Change Details
            </DialogTitle>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Change Type</Label>
                  <p className="text-sm">{getChangeTypeDisplayName(selectedChange.changeType)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedChange.status)}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Parameter</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedChange.parameterName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Current Value</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{selectedChange.oldValue}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Proposed Value</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{selectedChange.newValue}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <p className="text-sm bg-muted p-2 rounded">{selectedChange.reason}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedChange.createdAt).toLocaleString()}</p>
                </div>
                {selectedChange.approvedAt && (
                  <div>
                    <Label className="text-sm font-medium">Approved</Label>
                    <p className="text-sm">{new Date(selectedChange.approvedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {selectedChange.daoProposalId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Vote className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium text-blue-800">DAO Proposal</Label>
                  </div>
                  <p className="text-sm text-blue-700 font-mono">{selectedChange.daoProposalId}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    This change is linked to a DAO proposal for community voting.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
