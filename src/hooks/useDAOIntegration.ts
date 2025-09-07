import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DAOProposal, 
  CreateProposalForm, 
  ProposalStatus, 
  VotingType 
} from '@/types/dao';

interface DAOIntegrationOptions {
  autoCreateProposal?: boolean;
  requireApproval?: boolean;
  defaultVotingType?: VotingType;
  defaultCategory?: string;
}

interface ChangeRequest {
  id: string;
  type: 'loyalty_rule_change' | 'reward_structure_change' | 'merchant_settings_change' | 'platform_config_change';
  title: string;
  description: string;
  affectedComponents: string[];
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresDAOApproval: boolean;
  currentValue?: any;
  proposedValue?: any;
  createdBy: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  daoProposalId?: string;
}

export const useDAOIntegration = (options: DAOIntegrationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    autoCreateProposal = true,
    requireApproval = true,
    defaultVotingType = 'simple_majority',
    defaultCategory = 'governance'
  } = options;

  // Create a DAO proposal for a loyalty application change
  const createProposalForChange = useCallback(async (
    changeRequest: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<DAOProposal | null> => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user is a DAO member
      const { data: membership } = await supabase
        .from('dao_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!membership) {
        throw new Error('User is not a DAO member');
      }

      // Check if user has enough tokens to create proposal
      const { data: dao } = await supabase
        .from('dao_organizations')
        .select('min_proposal_threshold')
        .eq('id', membership.dao_id)
        .single();

      if (membership.governance_tokens < (dao?.min_proposal_threshold || 1000)) {
        throw new Error('Insufficient governance tokens to create proposal');
      }

      // Create the proposal
      const proposalData = {
        dao_id: membership.dao_id,
        proposer_id: user.id,
        title: changeRequest.title,
        description: changeRequest.description,
        full_description: generateDetailedDescription(changeRequest),
        category: defaultCategory,
        voting_type: defaultVotingType,
        status: 'draft' as ProposalStatus,
        treasury_impact_amount: 0,
        treasury_impact_currency: 'SOL',
        tags: generateTags(changeRequest),
        external_links: {
          change_type: changeRequest.type,
          impact_level: changeRequest.impactLevel,
          affected_components: changeRequest.affectedComponents.join(', ')
        }
      };

      const { data: proposal, error } = await supabase
        .from('dao_proposals')
        .insert(proposalData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create change request record
      const changeRequestData = {
        type: changeRequest.type,
        title: changeRequest.title,
        description: changeRequest.description,
        affected_components: changeRequest.affectedComponents,
        impact_level: changeRequest.impactLevel,
        requires_dao_approval: changeRequest.requiresDAOApproval,
        current_value: changeRequest.currentValue,
        proposed_value: changeRequest.proposedValue,
        created_by: user.id,
        dao_proposal_id: proposal.id,
        status: 'pending'
      };

      const { error: changeError } = await supabase
        .from('loyalty_change_requests')
        .insert(changeRequestData);

      if (changeError) {
        console.error('Error creating change request:', changeError);
      }

      toast({
        title: "Proposal Created",
        description: "A DAO proposal has been created for this change.",
      });

      return proposal;

    } catch (error) {
      console.error('Error creating DAO proposal:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create DAO proposal",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [defaultCategory, defaultVotingType, toast]);

  // Check if a change requires DAO approval
  const requiresDAOApproval = useCallback((changeType: ChangeRequest['type'], impactLevel: ChangeRequest['impactLevel']): boolean => {
    if (!requireApproval) return false;

    // Critical changes always require DAO approval
    if (impactLevel === 'critical') return true;

    // High impact changes require DAO approval
    if (impactLevel === 'high') return true;

    // Medium impact changes for certain types require DAO approval
    if (impactLevel === 'medium') {
      return ['loyalty_rule_change', 'reward_structure_change', 'platform_config_change'].includes(changeType);
    }

    return false;
  }, [requireApproval]);

  // Automatically create proposal when loyalty application behavior changes
  const handleLoyaltyChange = useCallback(async (
    changeType: ChangeRequest['type'],
    title: string,
    description: string,
    affectedComponents: string[],
    impactLevel: ChangeRequest['impactLevel'],
    currentValue?: any,
    proposedValue?: any
  ) => {
    const needsApproval = requiresDAOApproval(changeType, impactLevel);

    if (!needsApproval) {
      // Log the change but don't create proposal
      console.log('Change does not require DAO approval:', { changeType, impactLevel });
      return;
    }

    if (autoCreateProposal) {
      const proposal = await createProposalForChange({
        type: changeType,
        title,
        description,
        affectedComponents,
        impactLevel,
        requiresDAOApproval: needsApproval,
        currentValue,
        proposedValue,
        createdBy: (await supabase.auth.getUser()).data.user?.id || ''
      });

      return proposal;
    } else {
      // Just log that approval is needed
      toast({
        title: "DAO Approval Required",
        description: "This change requires DAO approval before implementation.",
        variant: "destructive",
      });
    }
  }, [autoCreateProposal, createProposalForChange, requiresDAOApproval, toast]);

  // Get pending change requests
  const getPendingChanges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_change_requests')
        .select(`
          *,
          dao_proposals(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending changes:', error);
      return [];
    }
  }, []);

  // Approve a change request (called when DAO proposal passes)
  const approveChangeRequest = useCallback(async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('loyalty_change_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('dao_proposal_id', proposalId);

      if (error) throw error;

      toast({
        title: "Change Approved",
        description: "The change has been approved by the DAO and can now be implemented.",
      });
    } catch (error) {
      console.error('Error approving change request:', error);
      toast({
        title: "Error",
        description: "Failed to approve change request",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Reject a change request (called when DAO proposal fails)
  const rejectChangeRequest = useCallback(async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('loyalty_change_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('dao_proposal_id', proposalId);

      if (error) throw error;

      toast({
        title: "Change Rejected",
        description: "The change has been rejected by the DAO.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error rejecting change request:', error);
      toast({
        title: "Error",
        description: "Failed to reject change request",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    loading,
    createProposalForChange,
    handleLoyaltyChange,
    requiresDAOApproval,
    getPendingChanges,
    approveChangeRequest,
    rejectChangeRequest
  };
};

// Helper function to generate detailed proposal description
function generateDetailedDescription(changeRequest: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>): string {
  const impactDescriptions = {
    low: 'This change has minimal impact on the platform and users.',
    medium: 'This change will have moderate impact on platform functionality.',
    high: 'This change will significantly affect platform behavior and user experience.',
    critical: 'This change is critical and will fundamentally alter platform operations.'
  };

  return `
## Change Details

**Type:** ${changeRequest.type.replace(/_/g, ' ').toUpperCase()}
**Impact Level:** ${changeRequest.impactLevel.toUpperCase()}
**Affected Components:** ${changeRequest.affectedComponents.join(', ')}

## Description
${changeRequest.description}

## Impact Assessment
${impactDescriptions[changeRequest.impactLevel]}

## Current vs Proposed
${changeRequest.currentValue ? `**Current:** ${JSON.stringify(changeRequest.currentValue)}` : ''}
${changeRequest.proposedValue ? `**Proposed:** ${JSON.stringify(changeRequest.proposedValue)}` : ''}

## Implementation Notes
This change requires DAO approval before implementation. Once approved, the change will be implemented by the development team.

## Risk Assessment
- **Risk Level:** ${changeRequest.impactLevel}
- **Rollback:** ${changeRequest.impactLevel === 'critical' ? 'Complex - may require data migration' : 'Standard rollback procedures apply'}
- **Testing:** ${changeRequest.impactLevel === 'high' || changeRequest.impactLevel === 'critical' ? 'Extensive testing required' : 'Standard testing procedures'}
  `.trim();
}

// Helper function to generate tags based on change type and impact
function generateTags(changeRequest: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>): string[] {
  const tags = [changeRequest.type, `impact-${changeRequest.impactLevel}`];
  
  // Add specific tags based on change type
  switch (changeRequest.type) {
    case 'loyalty_rule_change':
      tags.push('loyalty', 'rules', 'governance');
      break;
    case 'reward_structure_change':
      tags.push('rewards', 'structure', 'economics');
      break;
    case 'merchant_settings_change':
      tags.push('merchants', 'settings', 'configuration');
      break;
    case 'platform_config_change':
      tags.push('platform', 'configuration', 'infrastructure');
      break;
  }

  // Add impact-specific tags
  if (changeRequest.impactLevel === 'critical') {
    tags.push('urgent', 'breaking-change');
  } else if (changeRequest.impactLevel === 'high') {
    tags.push('major-change');
  }

  return tags;
}
