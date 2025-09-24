// Merchant Governance Smart Contract
// Manages merchant-related parameter changes that require DAO approval
// This contract handles subscription limits, transaction windows, and merchant settings

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("MerchantGov1111111111111111111111111111111111");

#[program]
pub mod merchant_governance {
    use super::*;

    /// Initialize the merchant governance system
    pub fn initialize_merchant_governance(
        ctx: Context<InitializeMerchantGovernance>,
        dao_program_id: Pubkey,
    ) -> Result<()> {
        let merchant_governance = &mut ctx.accounts.merchant_governance;
        let clock = Clock::get()?;

        merchant_governance.authority = ctx.accounts.authority.key();
        merchant_governance.dao_program_id = dao_program_id;
        merchant_governance.is_active = true;
        merchant_governance.total_changes = 0;
        merchant_governance.created_at = clock.unix_timestamp;
        merchant_governance.updated_at = clock.unix_timestamp;

        msg!("Merchant governance system initialized");
        Ok(())
    }

    /// Propose a merchant parameter change
    pub fn propose_merchant_change(
        ctx: Context<ProposeMerchantChange>,
        change_type: MerchantChangeType,
        parameter_name: String,
        old_value: String,
        new_value: String,
        reason: String,
    ) -> Result<()> {
        let merchant_change = &mut ctx.accounts.merchant_change;
        let merchant_governance = &mut ctx.accounts.merchant_governance;
        let clock = Clock::get()?;

        // Validate the change type
        require!(
            is_valid_merchant_change_type(&change_type),
            MerchantGovernanceError::InvalidChangeType
        );

        // Create the merchant change record
        merchant_change.id = merchant_governance.total_changes + 1;
        merchant_change.change_type = change_type.clone();
        merchant_change.parameter_name = parameter_name.clone();
        merchant_change.old_value = old_value.clone();
        merchant_change.new_value = new_value.clone();
        merchant_change.reason = reason.clone();
        merchant_change.proposed_by = ctx.accounts.proposer.key();
        merchant_change.status = MerchantChangeStatus::Pending;
        merchant_change.created_at = clock.unix_timestamp;
        merchant_change.updated_at = clock.unix_timestamp;

        // Increment total changes counter
        merchant_governance.total_changes += 1;
        merchant_governance.updated_at = clock.unix_timestamp;

        // Emit event for frontend tracking
        emit!(MerchantChangeProposed {
            change_id: merchant_change.id,
            change_type: change_type.clone(),
            parameter_name: parameter_name.clone(),
            old_value: old_value.clone(),
            new_value: new_value.clone(),
            proposer: ctx.accounts.proposer.key(),
        });

        msg!(
            "Merchant change proposed: {} - {}: {} -> {}",
            get_merchant_change_type_display_name(&change_type),
            parameter_name,
            old_value,
            new_value
        );

        Ok(())
    }

    /// Create DAO proposal for merchant change
    pub fn create_dao_proposal_for_merchant_change(
        ctx: Context<CreateDaoProposalForMerchantChange>,
        change_id: u64,
        proposal_title: String,
        proposal_description: String,
    ) -> Result<()> {
        let merchant_change = &mut ctx.accounts.merchant_change;
        let dao_proposal = &mut ctx.accounts.dao_proposal;
        let clock = Clock::get()?;

        // Validate the change exists and is pending
        require!(
            merchant_change.status == MerchantChangeStatus::Pending,
            MerchantGovernanceError::ChangeNotPending
        );

        // Create DAO proposal
        dao_proposal.id = change_id;
        dao_proposal.title = proposal_title;
        dao_proposal.description = proposal_description;
        dao_proposal.proposal_type = ProposalType::MerchantChange;
        dao_proposal.status = ProposalStatus::Active;
        dao_proposal.proposer = ctx.accounts.proposer.key();
        dao_proposal.merchant_change_id = change_id;
        dao_proposal.created_at = clock.unix_timestamp;
        dao_proposal.updated_at = clock.unix_timestamp;

        // Update merchant change status
        merchant_change.status = MerchantChangeStatus::DaoProposalCreated;
        merchant_change.dao_proposal_id = Some(change_id);
        merchant_change.updated_at = clock.unix_timestamp;

        emit!(DaoProposalCreated {
            change_id,
            proposal_id: change_id,
            proposer: ctx.accounts.proposer.key(),
        });

        msg!("DAO proposal created for merchant change: {}", change_id);
        Ok(())
    }

    /// Validate that a merchant change has DAO approval
    pub fn validate_merchant_change_approval(
        ctx: Context<ValidateMerchantChangeApproval>,
        change_id: u64,
    ) -> Result<()> {
        let merchant_change = &ctx.accounts.merchant_change;
        let dao_proposal = &ctx.accounts.dao_proposal;

        // Validate the change exists
        require!(
            merchant_change.id == change_id,
            MerchantGovernanceError::ChangeNotFound
        );

        // Check if DAO proposal exists
        require!(
            merchant_change.dao_proposal_id.is_some(),
            MerchantGovernanceError::NoDaoProposal
        );

        // Check if DAO proposal is approved
        require!(
            dao_proposal.status == ProposalStatus::Passed,
            MerchantGovernanceError::ChangeNotApproved
        );

        // Update change status to approved
        let merchant_change = &mut ctx.accounts.merchant_change;
        merchant_change.status = MerchantChangeStatus::Approved;
        merchant_change.approved_at = Some(Clock::get()?.unix_timestamp);
        merchant_change.updated_at = Clock::get()?.unix_timestamp;

        emit!(MerchantChangeApproved {
            change_id,
            approved_at: Clock::get()?.unix_timestamp,
        });

        msg!("Merchant change {} approved by DAO", change_id);
        Ok(())
    }

    /// Execute an approved merchant change
    pub fn execute_approved_merchant_change(
        ctx: Context<ExecuteApprovedMerchantChange>,
        change_id: u64,
    ) -> Result<()> {
        let merchant_change = &mut ctx.accounts.merchant_change;
        let clock = Clock::get()?;

        // Validate the change is approved
        require!(
            merchant_change.status == MerchantChangeStatus::Approved,
            MerchantGovernanceError::ChangeNotApproved
        );

        // Execute the change based on type
        match merchant_change.change_type {
            MerchantChangeType::SubscriptionLimits => {
                execute_subscription_limits_change(ctx, merchant_change)?;
            }
            MerchantChangeType::TransactionEditWindow => {
                execute_transaction_edit_window_change(ctx, merchant_change)?;
            }
            MerchantChangeType::DiscountCodePolicies => {
                execute_discount_code_policies_change(ctx, merchant_change)?;
            }
            MerchantChangeType::PointDistributionLimits => {
                execute_point_distribution_limits_change(ctx, merchant_change)?;
            }
            MerchantChangeType::MerchantVerification => {
                execute_merchant_verification_change(ctx, merchant_change)?;
            }
            _ => {
                return Err(MerchantGovernanceError::UnsupportedChangeType.into());
            }
        }

        // Update change status to implemented
        merchant_change.status = MerchantChangeStatus::Implemented;
        merchant_change.implemented_at = Some(clock.unix_timestamp);
        merchant_change.updated_at = clock.unix_timestamp;

        emit!(MerchantChangeExecuted {
            change_id,
            executed_at: clock.unix_timestamp,
        });

        msg!("Merchant change {} executed successfully", change_id);
        Ok(())
    }

    /// Get merchant change details
    pub fn get_merchant_change(
        ctx: Context<GetMerchantChange>,
        change_id: u64,
    ) -> Result<MerchantChangeData> {
        let merchant_change = &ctx.accounts.merchant_change;

        require!(
            merchant_change.id == change_id,
            MerchantGovernanceError::ChangeNotFound
        );

        Ok(MerchantChangeData {
            id: merchant_change.id,
            change_type: merchant_change.change_type.clone(),
            parameter_name: merchant_change.parameter_name.clone(),
            old_value: merchant_change.old_value.clone(),
            new_value: merchant_change.new_value.clone(),
            reason: merchant_change.reason.clone(),
            proposed_by: merchant_change.proposed_by,
            status: merchant_change.status.clone(),
            created_at: merchant_change.created_at,
            approved_at: merchant_change.approved_at,
            implemented_at: merchant_change.implemented_at,
        })
    }
}

// Individual change execution functions
fn execute_subscription_limits_change(
    ctx: Context<ExecuteApprovedMerchantChange>,
    change: &MerchantChange,
) -> Result<()> {
    msg!("Executing subscription limits change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update subscription limits
    Ok(())
}

fn execute_transaction_edit_window_change(
    ctx: Context<ExecuteApprovedMerchantChange>,
    change: &MerchantChange,
) -> Result<()> {
    msg!("Executing transaction edit window change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update transaction edit window
    Ok(())
}

fn execute_discount_code_policies_change(
    ctx: Context<ExecuteApprovedMerchantChange>,
    change: &MerchantChange,
) -> Result<()> {
    msg!("Executing discount code policies change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update discount code policies
    Ok(())
}

fn execute_point_distribution_limits_change(
    ctx: Context<ExecuteApprovedMerchantChange>,
    change: &MerchantChange,
) -> Result<()> {
    msg!("Executing point distribution limits change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update point distribution limits
    Ok(())
}

fn execute_merchant_verification_change(
    ctx: Context<ExecuteApprovedMerchantChange>,
    change: &MerchantChange,
) -> Result<()> {
    msg!("Executing merchant verification change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update merchant verification settings
    Ok(())
}

// Helper functions
fn is_valid_merchant_change_type(change_type: &MerchantChangeType) -> bool {
    matches!(
        change_type,
        MerchantChangeType::SubscriptionLimits
            | MerchantChangeType::TransactionEditWindow
            | MerchantChangeType::DiscountCodePolicies
            | MerchantChangeType::PointDistributionLimits
            | MerchantChangeType::MerchantVerification
    )
}

fn get_merchant_change_type_display_name(change_type: &MerchantChangeType) -> &'static str {
    match change_type {
        MerchantChangeType::SubscriptionLimits => "Subscription Limits",
        MerchantChangeType::TransactionEditWindow => "Transaction Edit Window",
        MerchantChangeType::DiscountCodePolicies => "Discount Code Policies",
        MerchantChangeType::PointDistributionLimits => "Point Distribution Limits",
        MerchantChangeType::MerchantVerification => "Merchant Verification",
    }
}

// Account structures
#[derive(Accounts)]
pub struct InitializeMerchantGovernance<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MerchantGovernance::INIT_SPACE,
        seeds = [b"merchant_governance"],
        bump
    )]
    pub merchant_governance: Account<'info, MerchantGovernance>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(change_type: MerchantChangeType, parameter_name: String, old_value: String, new_value: String, reason: String)]
pub struct ProposeMerchantChange<'info> {
    #[account(
        mut,
        seeds = [b"merchant_governance"],
        bump
    )]
    pub merchant_governance: Account<'info, MerchantGovernance>,
    
    #[account(
        init,
        payer = proposer,
        space = 8 + MerchantChange::INIT_SPACE,
        seeds = [b"merchant_change", merchant_governance.total_changes.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_change: Account<'info, MerchantChange>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(change_id: u64, proposal_title: String, proposal_description: String)]
pub struct CreateDaoProposalForMerchantChange<'info> {
    #[account(
        mut,
        seeds = [b"merchant_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_change: Account<'info, MerchantChange>,
    
    #[account(
        init,
        payer = proposer,
        space = 8 + DaoProposal::INIT_SPACE,
        seeds = [b"dao_proposal", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub dao_proposal: Account<'info, DaoProposal>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(change_id: u64)]
pub struct ValidateMerchantChangeApproval<'info> {
    #[account(
        mut,
        seeds = [b"merchant_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_change: Account<'info, MerchantChange>,
    
    #[account(
        seeds = [b"dao_proposal", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub dao_proposal: Account<'info, DaoProposal>,
    
    pub validator: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(change_id: u64)]
pub struct ExecuteApprovedMerchantChange<'info> {
    #[account(
        mut,
        seeds = [b"merchant_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_change: Account<'info, MerchantChange>,
    
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(change_id: u64)]
pub struct GetMerchantChange<'info> {
    #[account(
        seeds = [b"merchant_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_change: Account<'info, MerchantChange>,
}

// Data structures
#[account]
#[derive(InitSpace)]
pub struct MerchantGovernance {
    pub authority: Pubkey,
    pub dao_program_id: Pubkey,
    pub is_active: bool,
    pub total_changes: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct MerchantChange {
    pub id: u64,
    pub change_type: MerchantChangeType,
    #[max_len(100)]
    pub parameter_name: String,
    #[max_len(500)]
    pub old_value: String,
    #[max_len(500)]
    pub new_value: String,
    #[max_len(1000)]
    pub reason: String,
    pub proposed_by: Pubkey,
    pub status: MerchantChangeStatus,
    pub dao_proposal_id: Option<u64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub approved_at: Option<i64>,
    pub implemented_at: Option<i64>,
}

#[account]
#[derive(InitSpace)]
pub struct DaoProposal {
    pub id: u64,
    #[max_len(200)]
    pub title: String,
    #[max_len(2000)]
    pub description: String,
    pub proposal_type: ProposalType,
    pub status: ProposalStatus,
    pub proposer: Pubkey,
    pub merchant_change_id: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MerchantChangeType {
    SubscriptionLimits,        // Transaction caps, point limits
    TransactionEditWindow,     // 30-day edit window changes
    DiscountCodePolicies,      // Discount code management
    PointDistributionLimits,   // Point distribution settings
    MerchantVerification,      // Merchant verification requirements
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MerchantChangeStatus {
    Pending,                 // Awaiting DAO proposal creation
    DaoProposalCreated,      // DAO proposal created, awaiting voting
    Approved,               // Approved by DAO
    Rejected,               // Rejected by DAO
    Implemented,            // Successfully implemented
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalType {
    General,                // General DAO proposals
    LoyaltyChange,          // Loyalty behavior change proposals
    MerchantChange,         // Merchant parameter change proposals
    Treasury,               // Treasury management
    Governance,             // Governance changes
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Draft,                  // Draft proposal
    Active,                 // Active voting
    Passed,                 // Passed by DAO
    Rejected,               // Rejected by DAO
    Executed,               // Executed
}

// Return data structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MerchantChangeData {
    pub id: u64,
    pub change_type: MerchantChangeType,
    pub parameter_name: String,
    pub old_value: String,
    pub new_value: String,
    pub reason: String,
    pub proposed_by: Pubkey,
    pub status: MerchantChangeStatus,
    pub created_at: i64,
    pub approved_at: Option<i64>,
    pub implemented_at: Option<i64>,
}

// Events
#[event]
pub struct MerchantChangeProposed {
    pub change_id: u64,
    pub change_type: MerchantChangeType,
    pub parameter_name: String,
    pub old_value: String,
    pub new_value: String,
    pub proposer: Pubkey,
}

#[event]
pub struct DaoProposalCreated {
    pub change_id: u64,
    pub proposal_id: u64,
    pub proposer: Pubkey,
}

#[event]
pub struct MerchantChangeApproved {
    pub change_id: u64,
    pub approved_at: i64,
}

#[event]
pub struct MerchantChangeExecuted {
    pub change_id: u64,
    pub executed_at: i64,
}

// Error types
#[error_code]
pub enum MerchantGovernanceError {
    #[msg("Invalid change type")]
    InvalidChangeType,
    #[msg("Change not found")]
    ChangeNotFound,
    #[msg("Change is not pending")]
    ChangeNotPending,
    #[msg("No DAO proposal found for this change")]
    NoDaoProposal,
    #[msg("Change not approved by DAO")]
    ChangeNotApproved,
    #[msg("Unsupported change type")]
    UnsupportedChangeType,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid parameter value")]
    InvalidParameterValue,
}

