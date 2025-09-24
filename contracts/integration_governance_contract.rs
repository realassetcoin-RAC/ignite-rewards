// Integration Governance Smart Contract
// Manages third-party integration parameter changes that require DAO approval
// This contract handles loyalty networks, SMS settings, and integration configurations

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("IntegrationGov1111111111111111111111111111111111");

#[program]
pub mod integration_governance {
    use super::*;

    /// Initialize the integration governance system
    pub fn initialize_integration_governance(
        ctx: Context<InitializeIntegrationGovernance>,
        dao_program_id: Pubkey,
    ) -> Result<()> {
        let integration_governance = &mut ctx.accounts.integration_governance;
        let clock = Clock::get()?;

        integration_governance.authority = ctx.accounts.authority.key();
        integration_governance.dao_program_id = dao_program_id;
        integration_governance.is_active = true;
        integration_governance.total_changes = 0;
        integration_governance.created_at = clock.unix_timestamp;
        integration_governance.updated_at = clock.unix_timestamp;

        msg!("Integration governance system initialized");
        Ok(())
    }

    /// Propose an integration parameter change
    pub fn propose_integration_change(
        ctx: Context<ProposeIntegrationChange>,
        change_type: IntegrationChangeType,
        parameter_name: String,
        old_value: String,
        new_value: String,
        reason: String,
    ) -> Result<()> {
        let integration_change = &mut ctx.accounts.integration_change;
        let integration_governance = &mut ctx.accounts.integration_governance;
        let clock = Clock::get()?;

        // Validate the change type
        require!(
            is_valid_integration_change_type(&change_type),
            IntegrationGovernanceError::InvalidChangeType
        );

        // Create the integration change record
        integration_change.id = integration_governance.total_changes + 1;
        integration_change.change_type = change_type.clone();
        integration_change.parameter_name = parameter_name.clone();
        integration_change.old_value = old_value.clone();
        integration_change.new_value = new_value.clone();
        integration_change.reason = reason.clone();
        integration_change.proposed_by = ctx.accounts.proposer.key();
        integration_change.status = IntegrationChangeStatus::Pending;
        integration_change.created_at = clock.unix_timestamp;
        integration_change.updated_at = clock.unix_timestamp;

        // Increment total changes counter
        integration_governance.total_changes += 1;
        integration_governance.updated_at = clock.unix_timestamp;

        // Emit event for frontend tracking
        emit!(IntegrationChangeProposed {
            change_id: integration_change.id,
            change_type: change_type.clone(),
            parameter_name: parameter_name.clone(),
            old_value: old_value.clone(),
            new_value: new_value.clone(),
            proposer: ctx.accounts.proposer.key(),
        });

        msg!(
            "Integration change proposed: {} - {}: {} -> {}",
            get_integration_change_type_display_name(&change_type),
            parameter_name,
            old_value,
            new_value
        );

        Ok(())
    }

    /// Create DAO proposal for integration change
    pub fn create_dao_proposal_for_integration_change(
        ctx: Context<CreateDaoProposalForIntegrationChange>,
        change_id: u64,
        proposal_title: String,
        proposal_description: String,
    ) -> Result<()> {
        let integration_change = &mut ctx.accounts.integration_change;
        let dao_proposal = &mut ctx.accounts.dao_proposal;
        let clock = Clock::get()?;

        // Validate the change exists and is pending
        require!(
            integration_change.status == IntegrationChangeStatus::Pending,
            IntegrationGovernanceError::ChangeNotPending
        );

        // Create DAO proposal
        dao_proposal.id = change_id;
        dao_proposal.title = proposal_title;
        dao_proposal.description = proposal_description;
        dao_proposal.proposal_type = ProposalType::IntegrationChange;
        dao_proposal.status = ProposalStatus::Active;
        dao_proposal.proposer = ctx.accounts.proposer.key();
        dao_proposal.integration_change_id = change_id;
        dao_proposal.created_at = clock.unix_timestamp;
        dao_proposal.updated_at = clock.unix_timestamp;

        // Update integration change status
        integration_change.status = IntegrationChangeStatus::DaoProposalCreated;
        integration_change.dao_proposal_id = Some(change_id);
        integration_change.updated_at = clock.unix_timestamp;

        emit!(DaoProposalCreated {
            change_id,
            proposal_id: change_id,
            proposer: ctx.accounts.proposer.key(),
        });

        msg!("DAO proposal created for integration change: {}", change_id);
        Ok(())
    }

    /// Validate that an integration change has DAO approval
    pub fn validate_integration_change_approval(
        ctx: Context<ValidateIntegrationChangeApproval>,
        change_id: u64,
    ) -> Result<()> {
        let integration_change = &ctx.accounts.integration_change;
        let dao_proposal = &ctx.accounts.dao_proposal;

        // Validate the change exists
        require!(
            integration_change.id == change_id,
            IntegrationGovernanceError::ChangeNotFound
        );

        // Check if DAO proposal exists
        require!(
            integration_change.dao_proposal_id.is_some(),
            IntegrationGovernanceError::NoDaoProposal
        );

        // Check if DAO proposal is approved
        require!(
            dao_proposal.status == ProposalStatus::Passed,
            IntegrationGovernanceError::ChangeNotApproved
        );

        // Update change status to approved
        let integration_change = &mut ctx.accounts.integration_change;
        integration_change.status = IntegrationChangeStatus::Approved;
        integration_change.approved_at = Some(Clock::get()?.unix_timestamp);
        integration_change.updated_at = Clock::get()?.unix_timestamp;

        emit!(IntegrationChangeApproved {
            change_id,
            approved_at: Clock::get()?.unix_timestamp,
        });

        msg!("Integration change {} approved by DAO", change_id);
        Ok(())
    }

    /// Execute an approved integration change
    pub fn execute_approved_integration_change(
        ctx: Context<ExecuteApprovedIntegrationChange>,
        change_id: u64,
    ) -> Result<()> {
        let integration_change = &mut ctx.accounts.integration_change;
        let clock = Clock::get()?;

        // Validate the change is approved
        require!(
            integration_change.status == IntegrationChangeStatus::Approved,
            IntegrationGovernanceError::ChangeNotApproved
        );

        // Execute the change based on type
        match integration_change.change_type {
            IntegrationChangeType::LoyaltyNetworkSettings => {
                execute_loyalty_network_settings_change(ctx, integration_change)?;
            }
            IntegrationChangeType::SMSOTPSettings => {
                execute_sms_otp_settings_change(ctx, integration_change)?;
            }
            IntegrationChangeType::EmailNotificationSettings => {
                execute_email_notification_settings_change(ctx, integration_change)?;
            }
            IntegrationChangeType::PaymentGatewaySettings => {
                execute_payment_gateway_settings_change(ctx, integration_change)?;
            }
            IntegrationChangeType::ThirdPartyAPISettings => {
                execute_third_party_api_settings_change(ctx, integration_change)?;
            }
            _ => {
                return Err(IntegrationGovernanceError::UnsupportedChangeType.into());
            }
        }

        // Update change status to implemented
        integration_change.status = IntegrationChangeStatus::Implemented;
        integration_change.implemented_at = Some(clock.unix_timestamp);
        integration_change.updated_at = clock.unix_timestamp;

        emit!(IntegrationChangeExecuted {
            change_id,
            executed_at: clock.unix_timestamp,
        });

        msg!("Integration change {} executed successfully", change_id);
        Ok(())
    }

    /// Get integration change details
    pub fn get_integration_change(
        ctx: Context<GetIntegrationChange>,
        change_id: u64,
    ) -> Result<IntegrationChangeData> {
        let integration_change = &ctx.accounts.integration_change;

        require!(
            integration_change.id == change_id,
            IntegrationGovernanceError::ChangeNotFound
        );

        Ok(IntegrationChangeData {
            id: integration_change.id,
            change_type: integration_change.change_type.clone(),
            parameter_name: integration_change.parameter_name.clone(),
            old_value: integration_change.old_value.clone(),
            new_value: integration_change.new_value.clone(),
            reason: integration_change.reason.clone(),
            proposed_by: integration_change.proposed_by,
            status: integration_change.status.clone(),
            created_at: integration_change.created_at,
            approved_at: integration_change.approved_at,
            implemented_at: integration_change.implemented_at,
        })
    }
}

// Individual change execution functions
fn execute_loyalty_network_settings_change(
    ctx: Context<ExecuteApprovedIntegrationChange>,
    change: &IntegrationChange,
) -> Result<()> {
    msg!("Executing loyalty network settings change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update loyalty network settings
    Ok(())
}

fn execute_sms_otp_settings_change(
    ctx: Context<ExecuteApprovedIntegrationChange>,
    change: &IntegrationChange,
) -> Result<()> {
    msg!("Executing SMS OTP settings change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update SMS OTP settings
    Ok(())
}

fn execute_email_notification_settings_change(
    ctx: Context<ExecuteApprovedIntegrationChange>,
    change: &IntegrationChange,
) -> Result<()> {
    msg!("Executing email notification settings change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update email notification settings
    Ok(())
}

fn execute_payment_gateway_settings_change(
    ctx: Context<ExecuteApprovedIntegrationChange>,
    change: &IntegrationChange,
) -> Result<()> {
    msg!("Executing payment gateway settings change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update payment gateway settings
    Ok(())
}

fn execute_third_party_api_settings_change(
    ctx: Context<ExecuteApprovedIntegrationChange>,
    change: &IntegrationChange,
) -> Result<()> {
    msg!("Executing third-party API settings change: {} -> {}", change.old_value, change.new_value);
    // Implementation would update third-party API settings
    Ok(())
}

// Helper functions
fn is_valid_integration_change_type(change_type: &IntegrationChangeType) -> bool {
    matches!(
        change_type,
        IntegrationChangeType::LoyaltyNetworkSettings
            | IntegrationChangeType::SMSOTPSettings
            | IntegrationChangeType::EmailNotificationSettings
            | IntegrationChangeType::PaymentGatewaySettings
            | IntegrationChangeType::ThirdPartyAPISettings
    )
}

fn get_integration_change_type_display_name(change_type: &IntegrationChangeType) -> &'static str {
    match change_type {
        IntegrationChangeType::LoyaltyNetworkSettings => "Loyalty Network Settings",
        IntegrationChangeType::SMSOTPSettings => "SMS OTP Settings",
        IntegrationChangeType::EmailNotificationSettings => "Email Notification Settings",
        IntegrationChangeType::PaymentGatewaySettings => "Payment Gateway Settings",
        IntegrationChangeType::ThirdPartyAPISettings => "Third-Party API Settings",
    }
}

// Account structures
#[derive(Accounts)]
pub struct InitializeIntegrationGovernance<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + IntegrationGovernance::INIT_SPACE,
        seeds = [b"integration_governance"],
        bump
    )]
    pub integration_governance: Account<'info, IntegrationGovernance>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(change_type: IntegrationChangeType, parameter_name: String, old_value: String, new_value: String, reason: String)]
pub struct ProposeIntegrationChange<'info> {
    #[account(
        mut,
        seeds = [b"integration_governance"],
        bump
    )]
    pub integration_governance: Account<'info, IntegrationGovernance>,
    
    #[account(
        init,
        payer = proposer,
        space = 8 + IntegrationChange::INIT_SPACE,
        seeds = [b"integration_change", integration_governance.total_changes.to_le_bytes().as_ref()],
        bump
    )]
    pub integration_change: Account<'info, IntegrationChange>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(change_id: u64, proposal_title: String, proposal_description: String)]
pub struct CreateDaoProposalForIntegrationChange<'info> {
    #[account(
        mut,
        seeds = [b"integration_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub integration_change: Account<'info, IntegrationChange>,
    
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
pub struct ValidateIntegrationChangeApproval<'info> {
    #[account(
        mut,
        seeds = [b"integration_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub integration_change: Account<'info, IntegrationChange>,
    
    #[account(
        seeds = [b"dao_proposal", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub dao_proposal: Account<'info, DaoProposal>,
    
    pub validator: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(change_id: u64)]
pub struct ExecuteApprovedIntegrationChange<'info> {
    #[account(
        mut,
        seeds = [b"integration_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub integration_change: Account<'info, IntegrationChange>,
    
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(change_id: u64)]
pub struct GetIntegrationChange<'info> {
    #[account(
        seeds = [b"integration_change", change_id.to_le_bytes().as_ref()],
        bump
    )]
    pub integration_change: Account<'info, IntegrationChange>,
}

// Data structures
#[account]
#[derive(InitSpace)]
pub struct IntegrationGovernance {
    pub authority: Pubkey,
    pub dao_program_id: Pubkey,
    pub is_active: bool,
    pub total_changes: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct IntegrationChange {
    pub id: u64,
    pub change_type: IntegrationChangeType,
    #[max_len(100)]
    pub parameter_name: String,
    #[max_len(500)]
    pub old_value: String,
    #[max_len(500)]
    pub new_value: String,
    #[max_len(1000)]
    pub reason: String,
    pub proposed_by: Pubkey,
    pub status: IntegrationChangeStatus,
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
    pub integration_change_id: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum IntegrationChangeType {
    LoyaltyNetworkSettings,      // Conversion rates, OTP validity
    SMSOTPSettings,             // OTP validity, rate limits
    EmailNotificationSettings,  // Email notification configurations
    PaymentGatewaySettings,     // Payment gateway configurations
    ThirdPartyAPISettings,      // Third-party API configurations
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum IntegrationChangeStatus {
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
    IntegrationChange,      // Integration parameter change proposals
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
pub struct IntegrationChangeData {
    pub id: u64,
    pub change_type: IntegrationChangeType,
    pub parameter_name: String,
    pub old_value: String,
    pub new_value: String,
    pub reason: String,
    pub proposed_by: Pubkey,
    pub status: IntegrationChangeStatus,
    pub created_at: i64,
    pub approved_at: Option<i64>,
    pub implemented_at: Option<i64>,
}

// Events
#[event]
pub struct IntegrationChangeProposed {
    pub change_id: u64,
    pub change_type: IntegrationChangeType,
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
pub struct IntegrationChangeApproved {
    pub change_id: u64,
    pub approved_at: i64,
}

#[event]
pub struct IntegrationChangeExecuted {
    pub change_id: u64,
    pub executed_at: i64,
}

// Error types
#[error_code]
pub enum IntegrationGovernanceError {
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

