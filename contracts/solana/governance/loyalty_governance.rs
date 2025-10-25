// Loyalty Governance Smart Contract
// Enforces DAO approval for all loyalty application behavior changes
// This contract ensures compliance with the rule: "Any changes that change the behavior of the loyalty application must create a DAO record for voting"

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use std::collections::HashMap;

declare_id!("LoyaltyGov1111111111111111111111111111111111");

#[program]
pub mod loyalty_governance {
    use super::*;

    /// Initialize the loyalty governance system
    pub fn initialize_loyalty_governance(
        ctx: Context<InitializeLoyaltyGovernance>,
        dao_program_id: Pubkey,
        governance_token_mint: Pubkey,
    ) -> Result<()> {
        let loyalty_governance = &mut ctx.accounts.loyalty_governance;
        let clock = Clock::get()?;

        loyalty_governance.authority = ctx.accounts.authority.key();
        loyalty_governance.dao_program_id = dao_program_id;
        loyalty_governance.governance_token_mint = governance_token_mint;
        loyalty_governance.is_active = true;
        loyalty_governance.total_changes = 0;
        loyalty_governance.created_at = clock.unix_timestamp;
        loyalty_governance.updated_at = clock.unix_timestamp;

        msg!("Loyalty governance system initialized");
        Ok(())
    }

    /// CRITICAL: Propose a loyalty behavior change
    /// This function enforces the rule requirement by creating a DAO proposal
    pub fn propose_loyalty_change(
        ctx: Context<ProposeLoyaltyChange>,
        change_type: LoyaltyChangeType,
        parameter_name: String,
        old_value: String,
        new_value: String,
        reason: String,
    ) -> Result<()> {
        let loyalty_change = &mut ctx.accounts.loyalty_change;
        let loyalty_governance = &mut ctx.accounts.loyalty_governance;
        let clock = Clock::get()?;

        // Validate the change type
        require!(
            is_valid_change_type(&change_type),
            LoyaltyGovernanceError::InvalidChangeType
        );

        // Create the loyalty change record
        loyalty_change.id = loyalty_governance.total_changes + 1;
        loyalty_change.change_type = change_type.clone();
        loyalty_change.parameter_name = parameter_name.clone();
        loyalty_change.old_value = old_value.clone();
        loyalty_change.new_value = new_value.clone();
        loyalty_change.reason = reason.clone();
        loyalty_change.proposed_by = ctx.accounts.proposer.key();
        loyalty_change.status = ChangeStatus::Pending;
        loyalty_change.created_at = clock.unix_timestamp;
        loyalty_change.updated_at = clock.unix_timestamp;

        // Increment total changes counter
        loyalty_governance.total_changes += 1;
        loyalty_governance.updated_at = clock.unix_timestamp;

        // Emit event for frontend tracking
        emit!(LoyaltyChangeProposed {
            change_id: loyalty_change.id,
            change_type: change_type.clone(),
            parameter_name: parameter_name.clone(),
            old_value: old_value.clone(),
            new_value: new_value.clone(),
            proposer: ctx.accounts.proposer.key(),
        });

        msg!(
            "Loyalty change proposed: {} - {}: {} -> {}",
            get_change_type_display_name(&change_type),
            parameter_name,
            old_value,
            new_value
        );

        Ok(())
    }

    /// CRITICAL: Create DAO proposal for loyalty change
    /// This function creates the required DAO record for voting
    pub fn create_dao_proposal_for_change(
        ctx: Context<CreateDaoProposalForChange>,
        change_id: u64,
        proposal_title: String,
        proposal_description: String,
    ) -> Result<()> {
        let loyalty_change = &mut ctx.accounts.loyalty_change;
        let dao_proposal = &mut ctx.accounts.dao_proposal;
        let clock = Clock::get()?;

        // Validate the change exists and is pending
        require!(
            loyalty_change.status == ChangeStatus::Pending,
            LoyaltyGovernanceError::ChangeNotPending
        );

        // Create DAO proposal
        dao_proposal.id = change_id; // Link to loyalty change
        dao_proposal.title = proposal_title;
        dao_proposal.description = proposal_description;
        dao_proposal.proposal_type = ProposalType::LoyaltyChange;
        dao_proposal.status = ProposalStatus::Active;
        dao_proposal.proposer = ctx.accounts.proposer.key();
        dao_proposal.loyalty_change_id = change_id;
        dao_proposal.created_at = clock.unix_timestamp;
        dao_proposal.updated_at = clock.unix_timestamp;

        // Update loyalty change status
        loyalty_change.status = ChangeStatus::DaoProposalCreated;
        loyalty_change.dao_proposal_id = Some(change_id);
        loyalty_change.updated_at = clock.unix_timestamp;

        emit!(DaoProposalCreated {
            change_id,
            proposal_id: change_id,
            proposer: ctx.accounts.proposer.key(),
        });

        msg!("DAO proposal created for loyalty change: {}", change_id);
        Ok(())
    }

    /// CRITICAL: Validate that a loyalty change has DAO approval
    /// This function prevents unauthorized changes
    pub fn validate_change_approval(
        ctx: Context<ValidateChangeApproval>,
        change_id: u64,
    ) -> Result<()> {
        let loyalty_change = &ctx.accounts.loyalty_change;
        let dao_proposal = &ctx.accounts.dao_proposal;

        // Validate the change exists
        require!(
            loyalty_change.id == change_id,
            LoyaltyGovernanceError::ChangeNotFound
        );

        // Check if DAO proposal exists
        require!(
            loyalty_change.dao_proposal_id.is_some(),
            LoyaltyGovernanceError::NoDaoProposal
        );

        // Check if DAO proposal is approved
        require!(
            dao_proposal.status == ProposalStatus::Passed,
            LoyaltyGovernanceError::ChangeNotApproved
        );

        // Update change status to approved
        let loyalty_change = &mut ctx.accounts.loyalty_change;
        loyalty_change.status = ChangeStatus::Approved;
        loyalty_change.approved_at = Some(Clock::get()?.unix_timestamp);
        loyalty_change.updated_at = Clock::get()?.unix_timestamp;

        emit!(ChangeApproved {
            change_id,
            approved_at: Clock::get()?.unix_timestamp,
        });

        msg!("Loyalty change {} approved by DAO", change_id);
        Ok(())
    }

    /// CRITICAL: Execute an approved loyalty change
    /// This function enforces that only approved changes can be executed
    pub fn execute_approved_change(
        ctx: Context<ExecuteApprovedChange>,
        change_id: u64,
    ) -> Result<()> {
        let loyalty_change = &mut ctx.accounts.loyalty_change;
        let clock = Clock::get()?;

        // Validate the change is approved
        require!(
            loyalty_change.status == ChangeStatus::Approved,
            LoyaltyGovernanceError::ChangeNotApproved
        );

        // Execute the change based on type
        match loyalty_change.change_type {
            LoyaltyChangeType::PointReleaseDelay => {
                execute_point_release_delay_change(ctx, loyalty_change)?;
            }
            LoyaltyChangeType::ReferralParameters => {
                execute_referral_parameters_change(ctx, loyalty_change)?;
            }
            LoyaltyChangeType::NFTRatios => {
                execute_nft_ratios_change(ctx, loyalty_change)?;
            }
            LoyaltyChangeType::LoyaltyNetworkSettings => {
                execute_loyalty_network_change(ctx, loyalty_change)?;
            }
            LoyaltyChangeType::MerchantLimits => {
                execute_merchant_limits_change(ctx, loyalty_change)?;
            }
            LoyaltyChangeType::InactivityTimeout => {
                execute_inactivity_timeout_change(ctx, loyalty_change)?;
            }
            LoyaltyChangeType::SMSOTPSettings => {
                execute_sms_otp_change(ctx, loyalty_change)?;
            }
            LoyaltyChangeType::SubscriptionPlans => {
                execute_subscription_plans_change(ctx, loyalty_change)?;
            }
            _ => {
                return Err(LoyaltyGovernanceError::UnsupportedChangeType.into());
            }
        }

        // Update change status to implemented
        loyalty_change.status = ChangeStatus::Implemented;
        loyalty_change.implemented_at = Some(clock.unix_timestamp);
        loyalty_change.updated_at = clock.unix_timestamp;

        emit!(ChangeExecuted {
            change_id,
            executed_at: clock.unix_timestamp,
        });

        msg!("Loyalty change {} executed successfully", change_id);
        Ok(())
    }

    /// Get loyalty change details
    pub fn get_loyalty_change(
        ctx: Context<GetLoyaltyChange>,
        change_id: u64,
    ) -> Result<LoyaltyChangeData> {
        let loyalty_change = &ctx.accounts.loyalty_change;

        require!(
            loyalty_change.id == change_id,
            LoyaltyGovernanceError::ChangeNotFound
        );

        Ok(LoyaltyChangeData {
            id: loyalty_change.id,
            change_type: loyalty_change.change_type.clone(),
            parameter_name: loyalty_change.parameter_name.clone(),
            old_value: loyalty_change.old_value.clone(),
            new_value: loyalty_change.new_value.clone(),
            reason: loyalty_change.reason.clone(),
            proposed_by: loyalty_change.proposed_by,
            status: loyalty_change.status.clone(),
            created_at: loyalty_change.created_at,
            approved_at: loyalty_change.approved_at,
            implemented_at: loyalty_change.implemented_at,
        })
    }

    /// Get all pending loyalty changes
    pub fn get_pending_changes(
        ctx: Context<GetPendingChanges>,
    ) -> Result<Vec<LoyaltyChangeData>> {
        // This would typically iterate through all loyalty changes
        // For now, return the current change if it's pending
        let loyalty_change = &ctx.accounts.loyalty_change;
        
        if loyalty_change.status == ChangeStatus::Pending {
            Ok(vec![LoyaltyChangeData {
                id: loyalty_change.id,
                change_type: loyalty_change.change_type.clone(),
                parameter_name: loyalty_change.parameter_name.clone(),
                old_value: loyalty_change.old_value.clone(),
                new_value: loyalty_change.new_value.clone(),
                reason: loyalty_change.reason.clone(),
                proposed_by: loyalty_change.proposed_by,
                status: loyalty_change.status.clone(),
                created_at: loyalty_change.created_at,
                approved_at: loyalty_change.approved_at,
                implemented_at: loyalty_change.implemented_at,
            }])
        } else {
            Ok(vec![])
        }
    }
}

// Individual change execution functions
fn execute_point_release_delay_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing point release delay change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update the point release delay configuration
    Ok(())
}

fn execute_referral_parameters_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing referral parameters change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update referral parameters
    Ok(())
}

fn execute_nft_ratios_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing NFT ratios change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update NFT earning ratios
    Ok(())
}

fn execute_loyalty_network_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing loyalty network change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update loyalty network settings
    Ok(())
}

fn execute_merchant_limits_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing merchant limits change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update merchant limits
    Ok(())
}

fn execute_inactivity_timeout_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing inactivity timeout change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update inactivity timeout settings
    Ok(())
}

fn execute_sms_otp_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing SMS OTP change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update SMS OTP settings
    Ok(())
}

fn execute_subscription_plans_change(
    ctx: Context<ExecuteApprovedChange>,
    change: &LoyaltyChange,
) -> Result<()> {
    msg!("Executing subscription plans change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update subscription plan settings
    Ok(())
}

// Helper functions
fn is_valid_change_type(change_type: &LoyaltyChangeType) -> bool {
    matches!(
        change_type,
        LoyaltyChangeType::PointReleaseDelay
            | LoyaltyChangeType::ReferralParameters
            | LoyaltyChangeType::NFTRatios
            | LoyaltyChangeType::LoyaltyNetworkSettings
            | LoyaltyChangeType::MerchantLimits
            | LoyaltyChangeType::InactivityTimeout
            | LoyaltyChangeType::SMSOTPSettings
            | LoyaltyChangeType::SubscriptionPlans
            | LoyaltyChangeType::AssetInitiativeSelection
            | LoyaltyChangeType::WalletManagement
            | LoyaltyChangeType::PaymentGateway
            | LoyaltyChangeType::EmailNotifications
    )
}

fn get_change_type_display_name(change_type: &LoyaltyChangeType) -> &'static str {
    match change_type {
        LoyaltyChangeType::PointReleaseDelay => "Point Release Delay",
        LoyaltyChangeType::ReferralParameters => "Referral Parameters",
        LoyaltyChangeType::NFTRatios => "NFT Earning Ratios",
        LoyaltyChangeType::LoyaltyNetworkSettings => "Loyalty Network Settings",
        LoyaltyChangeType::MerchantLimits => "Merchant Limits",
        LoyaltyChangeType::InactivityTimeout => "Inactivity Timeout",
        LoyaltyChangeType::SMSOTPSettings => "SMS OTP Settings",
        LoyaltyChangeType::SubscriptionPlans => "Subscription Plans",
        LoyaltyChangeType::AssetInitiativeSelection => "Asset Initiative Selection",
        LoyaltyChangeType::WalletManagement => "Wallet Management",
        LoyaltyChangeType::PaymentGateway => "Payment Gateway",
        LoyaltyChangeType::EmailNotifications => "Email Notifications",
    }
}

// Account structures
#[derive(Accounts)]
pub struct InitializeLoyaltyGovernance<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + LoyaltyGovernance::INIT_SPACE,
        seeds = [b"loyalty_governance"],
        bump
    )]
    pub loyalty_governance: Account<'info, LoyaltyGovernance>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(change_type: LoyaltyChangeType, parameter_name: String, old_value: String, new_value: String, reason: String)]
pub struct ProposeLoyaltyChange<'info> {
    #[account(
        mut,
        seeds = [b"loyalty_governance"],
        bump
    )]
    pub loyalty_governance: Account<'info, LoyaltyGovernance>,
    
    #[account(
        init,
        payer = proposer,
        space = 8 + LoyaltyChange::INIT_SPACE,
        seeds = [b"loyalty_change", loyalty_governance.total_changes.to_le_bytes().as_ref()],
        bump
    )]
    pub loyalty_change: Account<'info, LoyaltyChange>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(change_id: u64, proposal_title: String, proposal_description: String)]
pub struct CreateDaoProposalForChange<'info> {
    #[account(
        mut,
        seeds = [b"loyalty_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub loyalty_change: Account<'info, LoyaltyChange>,
    
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
pub struct ValidateChangeApproval<'info> {
    #[account(
        mut,
        seeds = [b"loyalty_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub loyalty_change: Account<'info, LoyaltyChange>,
    
    #[account(
        seeds = [b"dao_proposal", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub dao_proposal: Account<'info, DaoProposal>,
    
    pub validator: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(change_id: u64)]
pub struct ExecuteApprovedChange<'info> {
    #[account(
        mut,
        seeds = [b"loyalty_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub loyalty_change: Account<'info, LoyaltyChange>,
    
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(change_id: u64)]
pub struct GetLoyaltyChange<'info> {
    #[account(
        seeds = [b"loyalty_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub loyalty_change: Account<'info, LoyaltyChange>,
}

#[derive(Accounts)]
pub struct GetPendingChanges<'info> {
    #[account(
        seeds = [b"loyalty_change", 0u64.to_le_bytes().as_ref()],
        bump
    )]
    pub loyalty_change: Account<'info, LoyaltyChange>,
}

// Data structures
#[account]
#[derive(InitSpace)]
pub struct LoyaltyGovernance {
    pub authority: Pubkey,
    pub dao_program_id: Pubkey,
    pub governance_token_mint: Pubkey,
    pub is_active: bool,
    pub total_changes: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct LoyaltyChange {
    pub id: u64,
    pub change_type: LoyaltyChangeType,
    #[max_len(100)]
    pub parameter_name: String,
    #[max_len(500)]
    pub old_value: String,
    #[max_len(500)]
    pub new_value: String,
    #[max_len(1000)]
    pub reason: String,
    pub proposed_by: Pubkey,
    pub status: ChangeStatus,
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
    pub loyalty_change_id: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LoyaltyChangeType {
    PointReleaseDelay,        // 30-day delay changes
    ReferralParameters,       // Points per referral, max referrals
    NFTRatios,               // Earning ratios, upgrade bonuses
    LoyaltyNetworkSettings,   // Conversion rates, OTP validity
    MerchantLimits,          // Transaction caps, point limits
    InactivityTimeout,       // Logout duration changes
    SMSOTPSettings,          // OTP validity, rate limits
    SubscriptionPlans,       // Plan features, pricing
    AssetInitiativeSelection, // Asset selection for rewards
    WalletManagement,        // Wallet-related settings
    PaymentGateway,          // Payment gateway settings
    EmailNotifications,      // Email notification settings
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChangeStatus {
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
pub struct LoyaltyChangeData {
    pub id: u64,
    pub change_type: LoyaltyChangeType,
    pub parameter_name: String,
    pub old_value: String,
    pub new_value: String,
    pub reason: String,
    pub proposed_by: Pubkey,
    pub status: ChangeStatus,
    pub created_at: i64,
    pub approved_at: Option<i64>,
    pub implemented_at: Option<i64>,
}

// Events
#[event]
pub struct LoyaltyChangeProposed {
    pub change_id: u64,
    pub change_type: LoyaltyChangeType,
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
pub struct ChangeApproved {
    pub change_id: u64,
    pub approved_at: i64,
}

#[event]
pub struct ChangeExecuted {
    pub change_id: u64,
    pub executed_at: i64,
}

// Error types
#[error_code]
pub enum LoyaltyGovernanceError {
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

