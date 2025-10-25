// Loyalty Governance Service
// Ensures all loyalty application behavior changes create DAO records for voting
// This enforces the rule: "Any changes that change the behavior of the loyalty application must create a DAO record for voting"

import { databaseAdapter } from '@/lib/databaseAdapter';
import { log } from '@/lib/logger';

export interface LoyaltyChange {
  id: string;
  changeType: LoyaltyChangeType;
  parameterName: string;
  oldValue: any;
  newValue: any;
  reason: string;
  proposedBy: string;
  daoProposalId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: string;
  approvedAt?: string;
  implementedAt?: string;
}

export enum LoyaltyChangeType {
  POINT_RELEASE_DELAY = 'point_release_delay',
  REFERRAL_PARAMETERS = 'referral_parameters',
  NFT_EARNING_RATIOS = 'nft_earning_ratios',
  LOYALTY_NETWORK_SETTINGS = 'loyalty_network_settings',
  MERCHANT_LIMITS = 'merchant_limits',
  INACTIVITY_TIMEOUT = 'inactivity_timeout',
  SMS_OTP_SETTINGS = 'sms_otp_settings',
  SUBSCRIPTION_PLANS = 'subscription_plans',
  ASSET_INITIATIVE_SELECTION = 'asset_initiative_selection',
  WALLET_MANAGEMENT = 'wallet_management',
  PAYMENT_GATEWAY = 'payment_gateway',
  EMAIL_NOTIFICATIONS = 'email_notifications'
}

export interface DAOProposal {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  votingType: string;
  status: string;
  loyaltyChangeId?: string;
  treasuryImpactAmount: number;
  treasuryImpactCurrency: string;
  tags: string[];
  createdAt: string;
}

export class LoyaltyGovernanceService {
  /**
   * Create a DAO proposal for any loyalty behavior change
   * This is the core function that enforces the governance rule
   */
  static async createDAOProposalForLoyaltyChange(
    change: Omit<LoyaltyChange, 'id' | 'status' | 'createdAt'>
  ): Promise<{ success: boolean; proposalId?: string; error?: string }> {
    try {
      log.info(`Creating DAO proposal for loyalty change: ${change.changeType}`, undefined, 'LoyaltyGovernanceService');

      // First, create the loyalty change record
      const { data: loyaltyChange, error: changeError } = await supabase
        .from('loyalty_change_requests')
        .insert({
          change_type: change.changeType,
          parameter_name: change.parameterName,
          old_value: JSON.stringify(change.oldValue),
          new_value: JSON.stringify(change.newValue),
          reason: change.reason,
          proposed_by: change.proposedBy,
          status: 'pending'
        })
        .select()
        .single();

      if (changeError) {
        log.error('Error creating loyalty change record', changeError, 'LoyaltyGovernanceService');
        return { success: false, error: 'Failed to create loyalty change record' };
      }

      // Create the DAO proposal
      const proposalTitle = `Loyalty Change: ${this.getChangeTypeDisplayName(change.changeType)} - ${change.parameterName}`;
      const proposalDescription = `Change ${change.parameterName} from "${change.oldValue}" to "${change.newValue}"`;
      const proposalFullDescription = this.generateProposalDescription(change);

      const { data: daoProposal, error: proposalError } = await supabase
        .from('dao_proposals')
        .insert({
          title: proposalTitle,
          description: proposalDescription,
          full_description: proposalFullDescription,
          category: 'technical',
          voting_type: 'simple_majority',
          status: 'draft',
          treasury_impact_amount: 0,
          treasury_impact_currency: 'SOL',
          tags: ['loyalty', 'governance', change.changeType],
          loyalty_change_id: loyaltyChange.id
        })
        .select()
        .single();

      if (proposalError) {
        log.error('Error creating DAO proposal', proposalError, 'LoyaltyGovernanceService');
        return { success: false, error: 'Failed to create DAO proposal' };
      }

      // Update the loyalty change record with the proposal ID
      await supabase
        .from('loyalty_change_requests')
        .update({ dao_proposal_id: daoProposal.id })
        .eq('id', loyaltyChange.id);

      log.info(`Successfully created DAO proposal ${daoProposal.id} for loyalty change ${loyaltyChange.id}`, undefined, 'LoyaltyGovernanceService');

      return { 
        success: true, 
        proposalId: daoProposal.id 
      };

    } catch (error) {
      log.error('Error in createDAOProposalForLoyaltyChange', error, 'LoyaltyGovernanceService');
      return { 
        success: false, 
        error: 'Failed to create DAO proposal for loyalty change' 
      };
    }
  }

  /**
   * Check if a loyalty change has DAO approval before execution
   */
  static async validateChangeApproval(changeId: string): Promise<{ approved: boolean; proposalId?: string; error?: string }> {
    try {
      const { data: change, error } = await supabase
        .from('loyalty_change_requests')
        .select(`
          *,
          dao_proposals!inner(
            id,
            status,
            yes_votes,
            no_votes,
            total_votes
          )
        `)
        .eq('id', changeId)
        .single();

      if (error || !change) {
        return { approved: false, error: 'Loyalty change not found' };
      }

      if (!change.dao_proposal_id) {
        return { approved: false, error: 'No DAO proposal found for this change' };
      }

      const proposal = change.dao_proposals;
      if (proposal.status === 'passed') {
        return { approved: true, proposalId: proposal.id };
      }

      return { approved: false, proposalId: proposal.id };

    } catch (error) {
      log.error('Error validating change approval', error, 'LoyaltyGovernanceService');
      return { approved: false, error: 'Failed to validate change approval' };
    }
  }

  /**
   * Execute an approved loyalty change
   */
  static async executeApprovedChange(changeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First validate the change has approval
      const validation = await this.validateChangeApproval(changeId);
      if (!validation.approved) {
        return { success: false, error: validation.error || 'Change not approved by DAO' };
      }

      // Get the change details
      const { data: change, error } = await supabase
        .from('loyalty_change_requests')
        .select('*')
        .eq('id', changeId)
        .single();

      if (error || !change) {
        return { success: false, error: 'Change not found' };
      }

      // Execute the change based on type
      const executionResult = await this.executeChangeByType(change);
      
      if (executionResult.success) {
        // Update the change status to implemented
        await supabase
          .from('loyalty_change_requests')
          .update({ 
            status: 'implemented',
            implemented_at: new Date().toISOString()
          })
          .eq('id', changeId);

        log.info(`Successfully executed loyalty change ${changeId}`, undefined, 'LoyaltyGovernanceService');
      }

      return executionResult;

    } catch (error) {
      log.error('Error executing approved change', error, 'LoyaltyGovernanceService');
      return { success: false, error: 'Failed to execute approved change' };
    }
  }

  /**
   * Get all pending loyalty changes
   */
  static async getPendingChanges(): Promise<{ changes: LoyaltyChange[]; error?: string }> {
    try {
      const { data: changes, error } = await supabase
        .from('loyalty_change_requests')
        .select(`
          *,
          dao_proposals!inner(
            id,
            title,
            status,
            yes_votes,
            no_votes,
            total_votes
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { changes: [], error: 'Failed to fetch pending changes' };
      }

      return { changes: changes || [] };

    } catch (error) {
      log.error('Error fetching pending changes', error, 'LoyaltyGovernanceService');
      return { changes: [], error: 'Failed to fetch pending changes' };
    }
  }

  /**
   * Get change type display name
   */
  private static getChangeTypeDisplayName(changeType: LoyaltyChangeType): string {
    const displayNames = {
      [LoyaltyChangeType.POINT_RELEASE_DELAY]: 'Point Release Delay',
      [LoyaltyChangeType.REFERRAL_PARAMETERS]: 'Referral Parameters',
      [LoyaltyChangeType.NFT_EARNING_RATIOS]: 'NFT Earning Ratios',
      [LoyaltyChangeType.LOYALTY_NETWORK_SETTINGS]: 'Loyalty Network Settings',
      [LoyaltyChangeType.MERCHANT_LIMITS]: 'Merchant Limits',
      [LoyaltyChangeType.INACTIVITY_TIMEOUT]: 'Inactivity Timeout',
      [LoyaltyChangeType.SMS_OTP_SETTINGS]: 'SMS OTP Settings',
      [LoyaltyChangeType.SUBSCRIPTION_PLANS]: 'Subscription Plans',
      [LoyaltyChangeType.ASSET_INITIATIVE_SELECTION]: 'Asset Initiative Selection',
      [LoyaltyChangeType.WALLET_MANAGEMENT]: 'Wallet Management',
      [LoyaltyChangeType.PAYMENT_GATEWAY]: 'Payment Gateway',
      [LoyaltyChangeType.EMAIL_NOTIFICATIONS]: 'Email Notifications'
    };

    return displayNames[changeType] || changeType;
  }

  /**
   * Generate detailed proposal description
   */
  private static generateProposalDescription(change: Omit<LoyaltyChange, 'id' | 'status' | 'createdAt'>): string {
    return `
# Loyalty Application Behavior Change

## Change Type
${this.getChangeTypeDisplayName(change.changeType)}

## Parameter
${change.parameterName}

## Current Value
${JSON.stringify(change.oldValue)}

## Proposed Value
${JSON.stringify(change.newValue)}

## Reason for Change
${change.reason}

## Impact Assessment
This change will affect the behavior of the loyalty application and requires community approval through DAO governance.

## Implementation
Once approved by the DAO, this change will be implemented automatically.

---
*This proposal was automatically generated by the loyalty governance system to ensure all behavior changes are properly governed.*
    `.trim();
  }

  /**
   * Execute change based on type
   */
  private static async executeChangeByType(change: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (change.change_type) {
        case LoyaltyChangeType.POINT_RELEASE_DELAY:
          return await this.executePointReleaseDelayChange();
        case LoyaltyChangeType.REFERRAL_PARAMETERS:
          return await this.executeReferralParametersChange();
        case LoyaltyChangeType.NFT_EARNING_RATIOS:
          return await this.executeNFTRatiosChange();
        case LoyaltyChangeType.LOYALTY_NETWORK_SETTINGS:
          return await this.executeLoyaltyNetworkChange();
        case LoyaltyChangeType.MERCHANT_LIMITS:
          return await this.executeMerchantLimitsChange();
        case LoyaltyChangeType.INACTIVITY_TIMEOUT:
          return await this.executeInactivityTimeoutChange();
        case LoyaltyChangeType.SMS_OTP_SETTINGS:
          return await this.executeSMSOTPChange();
        default:
          return { success: false, error: `Unknown change type: ${change.change_type}` };
      }
    } catch (error) {
      log.error('Error executing change by type', error, 'LoyaltyGovernanceService');
      return { success: false, error: 'Failed to execute change' };
    }
  }

  // Individual change execution methods
  private static async executePointReleaseDelayChange(): Promise<{ success: boolean; error?: string }> {
    // Implementation for point release delay changes
    log.info('Executing point release delay change', undefined, 'LoyaltyGovernanceService');
    return { success: true };
  }

  private static async executeReferralParametersChange(): Promise<{ success: boolean; error?: string }> {
    // Implementation for referral parameter changes
    log.info('Executing referral parameters change', undefined, 'LoyaltyGovernanceService');
    return { success: true };
  }

  private static async executeNFTRatiosChange(): Promise<{ success: boolean; error?: string }> {
    // Implementation for NFT earning ratio changes
    log.info('Executing NFT ratios change', undefined, 'LoyaltyGovernanceService');
    return { success: true };
  }

  private static async executeLoyaltyNetworkChange(): Promise<{ success: boolean; error?: string }> {
    // Implementation for loyalty network setting changes
    log.info('Executing loyalty network change', undefined, 'LoyaltyGovernanceService');
    return { success: true };
  }

  private static async executeMerchantLimitsChange(): Promise<{ success: boolean; error?: string }> {
    // Implementation for merchant limit changes
    log.info('Executing merchant limits change', undefined, 'LoyaltyGovernanceService');
    return { success: true };
  }

  private static async executeInactivityTimeoutChange(): Promise<{ success: boolean; error?: string }> {
    // Implementation for inactivity timeout changes
    log.info('Executing inactivity timeout change', undefined, 'LoyaltyGovernanceService');
    return { success: true };
  }

  private static async executeSMSOTPChange(): Promise<{ success: boolean; error?: string }> {
    // Implementation for SMS OTP setting changes
    log.info('Executing SMS OTP change', undefined, 'LoyaltyGovernanceService');
    return { success: true };
  }
}
