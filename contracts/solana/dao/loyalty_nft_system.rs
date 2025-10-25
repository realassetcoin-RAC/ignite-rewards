use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, self, Transfer, MintTo, SetAuthority};
use anchor_spl::associated_token::AssociatedToken;
use spl_token::instruction::AuthorityType;

declare_id!("81y1B91W78o5zLz6Lg8P96Y7JvW4Y9q6D8W2o7Jz8K9"); // Replace with your program ID

/// An enum to define the two types of NFTs.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CustodyType {
    NonCustodial,
    Custodial,
}

/// An enum to define proposal types.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalType {
    General,           // 0 - General DAO proposals
    ConfigUpdate,      // 1 - Rewards configuration updates
    Treasury,          // 2 - Treasury management
    Governance,        // 3 - Governance changes
    LoyaltyChange,     // 4 - Loyalty application behavior changes
}

/// Configuration proposal status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ConfigProposalStatus {
    Pending,     // 0 - Awaiting DAO approval
    Approved,    // 1 - Approved by DAO
    Rejected,    // 2 - Rejected by DAO
    Implemented, // 3 - Changes have been applied
}

/// Generic proposal status for lifecycle
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Draft,      // Created but not yet activated (voting not started)
    Active,     // Voting open
    Approved,   // Voting passed (can be executed)
    Rejected,   // Voting failed
    Executed,   // Effects executed on-chain
}

/// The core program module for our DAO and NFT system.
#[program]
pub mod solana_dao_nft_contract {
    use super::*;

    /// Initializes the DAO's governance token ($RAC) with a max supply,
    /// and mints an initial amount. The mint authority is retained by the admin.
    pub fn create_rac_mint(ctx: Context<CreateRacMint>) -> Result<()> {
        let dao_config = &mut ctx.accounts.dao_config;

        dao_config.rac_mint = ctx.accounts.rac_mint.key();
        dao_config.total_supply = 1_500_000_000; // The maximum total supply is 1.5 billion
        dao_config.proposal_count = 0;

        let initial_mint_amount = 100_000_000; // The initial mint is 100 million

        // CPI to mint the initial 100 million tokens to the DAO's vault.
        let cpi_accounts = MintTo {
            mint: ctx.accounts.rac_mint.to_account_info(),
            to: ctx.accounts.dao_vault.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, initial_mint_amount)?;

        msg!("$RAC token mint created. Initial supply: 100 million. Max supply: 1.5 billion.");
        Ok(())
    }

    /// Initializes the rewards configuration system.
    pub fn initialize_rewards_config(
        ctx: Context<InitializeRewardsConfig>,
        distribution_interval: u64,
        max_rewards_per_user: u64,
    ) -> Result<()> {
        let rewards_config = &mut ctx.accounts.rewards_config;
        let current_timestamp = Clock::get()?.unix_timestamp;

        rewards_config.program_id = ctx.accounts.program_id.key();
        rewards_config.admin_authority = ctx.accounts.admin.key();
        rewards_config.reward_token_mint = ctx.accounts.reward_token_mint.key();
        rewards_config.distribution_interval = distribution_interval;
        rewards_config.max_rewards_per_user = max_rewards_per_user;
        rewards_config.is_active = true;
        rewards_config.created_at = current_timestamp;
        rewards_config.updated_at = current_timestamp;

        msg!("Rewards configuration initialized with distribution interval: {} seconds", distribution_interval);
        Ok(())
    }

    /// Initializes a new NFT within the system with all the new fields.
    pub fn create_nft(
        ctx: Context<CreateNft>, 
        collection_name: String,
        nft_name: String,
        display_name: String,
        symbol: String, 
        uri: String,
        is_custodial: bool,
        buy_price_usdt: u64,
        rarity: String,
        mint_quantity: u64,
        is_upgradeable: bool,
        is_evolvable: bool,
        is_fractional_eligible: bool,
        auto_staking_duration: String,
        earn_on_spend_ratio: u64,
        upgrade_bonus_ratio: u64,
        evolution_min_investment: u64,
        evolution_earnings_ratio: u64,
        passive_income_rate: u64,
        custodial_income_rate: Option<u64>,
        fractional_supply: Option<u64>,
    ) -> Result<()> {
        let nft_account = &mut ctx.accounts.nft;
        let current_timestamp = Clock::get()?.unix_timestamp;

        // Basic Information
        nft_account.admin = ctx.accounts.admin.key();
        nft_account.collection_name = collection_name;
        nft_account.nft_name = nft_name.clone();
        nft_account.display_name = display_name;
        nft_account.symbol = symbol.clone();
        nft_account.uri = uri;
        
        // Pricing & Minting
        nft_account.buy_price_usdt = buy_price_usdt;
        nft_account.rarity = rarity;
        nft_account.mint_quantity = mint_quantity;
        
        // Features & Capabilities
        nft_account.is_upgradeable = is_upgradeable;
        nft_account.is_evolvable = is_evolvable;
        nft_account.is_fractional_eligible = is_fractional_eligible;
        
        // Auto Staking
        nft_account.auto_staking_duration = auto_staking_duration;
        
        // Earning Ratios
        nft_account.earn_on_spend_ratio = earn_on_spend_ratio;
        nft_account.upgrade_bonus_ratio = upgrade_bonus_ratio;
        
        // Evolution Settings
        nft_account.evolution_min_investment = evolution_min_investment;
        nft_account.evolution_earnings_ratio = evolution_earnings_ratio;
        
        // Legacy fields for backward compatibility
        nft_account.passive_income_rate = passive_income_rate;
        nft_account.last_distribution_timestamp = current_timestamp;
        
        // Metadata
        nft_account.is_active = true;
        nft_account.created_at = current_timestamp;
        nft_account.updated_at = current_timestamp;

        if is_custodial {
            nft_account.custody_type = CustodyType::Custodial;
            nft_account.custodial_income_rate = custodial_income_rate;
            msg!("Custodial NFT created with name: {}", nft_account.nft_name);
        } else {
            // FIX: Safely handle optional accounts for non-custodial NFTs
            let supply = fractional_supply.ok_or(CustomError::MissingFractionalSupply)?;
            nft_account.custody_type = CustodyType::NonCustodial;
            nft_account.custodial_income_rate = None;

            if let (Some(frac_nft_acc), Some(frac_mint_acc), Some(frac_vault_acc)) = 
                (ctx.accounts.fractional_nft.as_mut(), ctx.accounts.fractional_mint.as_ref(), ctx.accounts.fractional_vault.as_ref()) {
                
                frac_nft_acc.parent_nft = nft_account.key();
                frac_nft_acc.mint = frac_mint_acc.key();
                frac_nft_acc.total_supply = supply;
                frac_nft_acc.supply_cap = supply;
                
                let cpi_accounts = MintTo {
                    mint: frac_mint_acc.to_account_info(),
                    to: frac_vault_acc.to_account_info(),
                    authority: ctx.accounts.admin.to_account_info(),
                };
                let cpi_program = ctx.accounts.token_program.to_account_info();
                let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
                token::mint_to(cpi_ctx, supply)?;
                
                msg!("Non-Custodial NFT created with name: {}", nft_account.nft_name);
            } else {
                return err!(CustomError::MissingRequiredAccountsForNonCustodial);
            }
        }

        Ok(())
    }

    /// Updates an existing NFT with new properties.
    pub fn update_nft(
        ctx: Context<UpdateNft>,
        collection_name: String,
        nft_name: String,
        display_name: String,
        symbol: String,
        uri: String,
        buy_price_usdt: u64,
        rarity: String,
        mint_quantity: u64,
        is_upgradeable: bool,
        is_evolvable: bool,
        is_fractional_eligible: bool,
        auto_staking_duration: String,
        earn_on_spend_ratio: u64,
        upgrade_bonus_ratio: u64,
        evolution_min_investment: u64,
        evolution_earnings_ratio: u64,
        passive_income_rate: u64,
        custodial_income_rate: Option<u64>,
    ) -> Result<()> {
        let nft_account = &mut ctx.accounts.nft;
        let current_timestamp = Clock::get()?.unix_timestamp;

        // Update all fields
        nft_account.collection_name = collection_name;
        nft_account.nft_name = nft_name;
        nft_account.display_name = display_name;
        nft_account.symbol = symbol;
        nft_account.uri = uri;
        nft_account.buy_price_usdt = buy_price_usdt;
        nft_account.rarity = rarity;
        nft_account.mint_quantity = mint_quantity;
        nft_account.is_upgradeable = is_upgradeable;
        nft_account.is_evolvable = is_evolvable;
        nft_account.is_fractional_eligible = is_fractional_eligible;
        nft_account.auto_staking_duration = auto_staking_duration;
        nft_account.earn_on_spend_ratio = earn_on_spend_ratio;
        nft_account.upgrade_bonus_ratio = upgrade_bonus_ratio;
        nft_account.evolution_min_investment = evolution_min_investment;
        nft_account.evolution_earnings_ratio = evolution_earnings_ratio;
        nft_account.passive_income_rate = passive_income_rate;
        nft_account.custodial_income_rate = custodial_income_rate;
        nft_account.updated_at = current_timestamp;

        msg!("NFT updated: {}", nft_account.nft_name);
        Ok(())
    }

    /// Allows a user to invest in a custodial NFT.
    pub fn invest_in_custodial_nft(ctx: Context<InvestInCustodialNft>, investment_amount: u64) -> Result<()> {
        let investment_account = &mut ctx.accounts.investment_account;
        let nft = &mut ctx.accounts.nft;
        
        require!(investment_amount > 0, CustomError::ZeroInvestmentAmount);
        require!(nft.custody_type == CustodyType::Custodial, CustomError::InvalidCustodyType);
        
        investment_account.investor = ctx.accounts.investor.key();
        investment_account.nft = nft.key();
        investment_account.amount += investment_amount;

        msg!("Investor {} invested {} in custodial NFT.", ctx.accounts.investor.key(), investment_amount);
        Ok(())
    }

    /// Allows a user to invest in a non-custodial NFT.
    pub fn invest_in_non_custodial_nft(ctx: Context<InvestInNonCustodialNft>, investment_amount: u64) -> Result<()> {
        let investment_account = &mut ctx.accounts.investment_account;
        let nft = &mut ctx.accounts.nft;
        let fractional_nft = &mut ctx.accounts.fractional_nft;

        require!(investment_amount > 0, CustomError::ZeroInvestmentAmount);
        require!(nft.custody_type == CustodyType::NonCustodial, CustomError::InvalidCustodyType);
        require!(fractional_nft.total_supply + investment_amount <= fractional_nft.supply_cap, CustomError::SupplyCapReached);
        
        investment_account.investor = ctx.accounts.investor.key();
        investment_account.nft = nft.key();
        investment_account.amount += investment_amount;
        
        fractional_nft.total_supply += investment_amount;
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.fractional_mint.to_account_info(),
            to: ctx.accounts.investor_token_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, investment_amount)?;

        msg!("Investor {} invested {} in non-custodial NFT.", ctx.accounts.investor.key(), investment_amount);
        Ok(())
    }
    
    /// This is a placeholder for the passive income distribution logic.
    pub fn distribute_passive_income(ctx: Context<DistributeIncome>) -> Result<()> {
        let nft_account = &mut ctx.accounts.nft;
        let current_timestamp = Clock::get()?.unix_timestamp;
        
        if nft_account.custody_type == CustodyType::Custodial {
            // Distribute based on the higher custodial_income_rate to investors
        } else {
            // Distribute based on the lower passive_income_rate to token holders
        }

        nft_account.last_distribution_timestamp = current_timestamp;
        msg!("Passive income distribution placeholder executed.");
        Ok(())
    }
    
    /// Allows the DAO admin to update the passive income rate of an NFT.
    pub fn update_passive_income_rate(ctx: Context<UpdateRate>, new_rate: u64) -> Result<()> {
        let nft_account = &mut ctx.accounts.nft;
        nft_account.passive_income_rate = new_rate;

        msg!("Passive income rate for NFT updated to {}", new_rate);
        Ok(())
    }

    
    /// Allows a user to create a new proposal.
    pub fn create_proposal(ctx: Context<CreateProposal>, dao_org: u8, proposal_type: u8, description: String) -> Result<()> {
        let dao_config = &mut ctx.accounts.dao_config;
        let proposal_account = &mut ctx.accounts.proposal;

        dao_config.proposal_count += 1;
        proposal_account.proposal_id = dao_config.proposal_count;
        proposal_account.proposer = ctx.accounts.proposer.key();
        proposal_account.proposal_type = proposal_type;
        proposal_account.description = description;
        proposal_account.votes_for = 0;
        proposal_account.votes_against = 0;
        proposal_account.dao_org = dao_org;
        proposal_account.status = ProposalStatus::Draft as u8;
        proposal_account.created_at = Clock::get()?.unix_timestamp;
        proposal_account.end_slot = Clock::get()?.slot + dao_config.voting_period_slots;
        proposal_account.executed_at = None;
        
        msg!("New proposal created: {}", proposal_account.description);
        Ok(())
    }

    /// Allows a user to create a rewards configuration proposal.
    pub fn create_config_proposal(
        ctx: Context<CreateConfigProposal>,
        dao_org: u8,
        proposed_distribution_interval: u64,
        proposed_max_rewards_per_user: u64,
        description: String
    ) -> Result<()> {
        let dao_config = &mut ctx.accounts.dao_config;
        let proposal_account = &mut ctx.accounts.proposal;
        let config_proposal = &mut ctx.accounts.config_proposal;

        dao_config.proposal_count += 1;
        proposal_account.proposal_id = dao_config.proposal_count;
        proposal_account.proposer = ctx.accounts.proposer.key();
        proposal_account.proposal_type = ProposalType::ConfigUpdate as u8;
        proposal_account.description = description;
        proposal_account.votes_for = 0;
        proposal_account.votes_against = 0;
        proposal_account.dao_org = dao_org;
        proposal_account.status = ProposalStatus::Draft as u8;
        proposal_account.created_at = Clock::get()?.unix_timestamp;
        proposal_account.end_slot = Clock::get()?.slot + dao_config.voting_period_slots;
        proposal_account.executed_at = None;

        config_proposal.proposal_id = dao_config.proposal_count;
        config_proposal.proposed_distribution_interval = proposed_distribution_interval;
        config_proposal.proposed_max_rewards_per_user = proposed_max_rewards_per_user;
        config_proposal.status = ConfigProposalStatus::Pending;
        config_proposal.created_at = Clock::get()?.unix_timestamp;
        
        msg!("New configuration proposal created: Distribution interval: {}, Max rewards: {}", 
             proposed_distribution_interval, proposed_max_rewards_per_user);
        Ok(())
    }

    /// CRITICAL: Create a DAO proposal for loyalty behavior changes
    /// This function enforces the rule requirement for loyalty changes
    pub fn create_loyalty_change_proposal(
        ctx: Context<CreateLoyaltyChangeProposal>,
        dao_org: u8,
        change_type: u8,
        parameter_name: String,
        old_value: String,
        new_value: String,
        reason: String,
    ) -> Result<()> {
        let dao_config = &mut ctx.accounts.dao_config;
        let proposal_account = &mut ctx.accounts.proposal;
        let loyalty_proposal = &mut ctx.accounts.loyalty_proposal;

        // Validate change type
        require!(change_type < 12, CustomError::InvalidChangeType);

        dao_config.proposal_count += 1;
        proposal_account.proposal_id = dao_config.proposal_count;
        proposal_account.proposer = ctx.accounts.proposer.key();
        proposal_account.proposal_type = ProposalType::LoyaltyChange as u8;
        proposal_account.description = format!(
            "Loyalty Change: {} - {}: {} -> {}",
            get_change_type_name(change_type),
            parameter_name,
            old_value,
            new_value
        );
        proposal_account.votes_for = 0;
        proposal_account.votes_against = 0;
        proposal_account.dao_org = dao_org;
        proposal_account.status = ProposalStatus::Draft as u8;
        proposal_account.created_at = Clock::get()?.unix_timestamp;
        proposal_account.end_slot = Clock::get()?.slot + dao_config.voting_period_slots;
        proposal_account.executed_at = None;

        loyalty_proposal.proposal_id = dao_config.proposal_count;
        loyalty_proposal.change_type = change_type;
        loyalty_proposal.parameter_name = parameter_name;
        loyalty_proposal.old_value = old_value;
        loyalty_proposal.new_value = new_value;
        loyalty_proposal.reason = reason;
        loyalty_proposal.status = ConfigProposalStatus::Pending;
        loyalty_proposal.created_at = Clock::get()?.unix_timestamp;
        
        msg!("New loyalty change proposal created: {} - {}: {} -> {}", 
             get_change_type_name(change_type), parameter_name, old_value, new_value);
        Ok(())
    }
    
    /// Allows a user to vote on a proposal using their token balance as weight.
    pub fn vote(ctx: Context<Vote>, proposal_id: u64, vote_type: u8) -> Result<()> {
        let proposal_account = &mut ctx.accounts.proposal;
        let voter_record = &mut ctx.accounts.voter_record;

        // FIX: Implement token-weighted voting
        let voter_token_balance = ctx.accounts.rac_token_account.amount;
        require!(voter_token_balance > 0, CustomError::InsufficientBalanceForVote);

        voter_record.voter = ctx.accounts.voter.key();
        voter_record.proposal_id = proposal_id;
        
        if vote_type == 1 {
            proposal_account.votes_for += voter_token_balance;
            msg!("Voted FOR proposal {} with a weight of {}", proposal_id, voter_token_balance);
        } else if vote_type == 0 {
            proposal_account.votes_against += voter_token_balance;
            msg!("Voted AGAINST proposal {} with a weight of {}", proposal_id, voter_token_balance);
        }

        Ok(())
    }

    /// Allows DAO to execute approved configuration proposals.
    pub fn execute_config_proposal(ctx: Context<ExecuteConfigProposal>, proposal_id: u64) -> Result<()> {
        let proposal_account = &ctx.accounts.proposal;
        let config_proposal = &mut ctx.accounts.config_proposal;
        let rewards_config = &mut ctx.accounts.rewards_config;

        require!(proposal_account.proposal_id == proposal_id, CustomError::InvalidProposalId);
        require!(proposal_account.proposal_type == ProposalType::ConfigUpdate as u8, CustomError::InvalidProposalType);
        require!(proposal_account.status == ProposalStatus::Approved as u8, CustomError::ProposalNotApproved);

        // Check if proposal has enough votes to pass (simple majority)
        let total_votes = proposal_account.votes_for + proposal_account.votes_against;
        require!(total_votes > 0, CustomError::NoVotesCast);
        require!(proposal_account.votes_for > proposal_account.votes_against, CustomError::ProposalNotPassed);

        // Execute the configuration changes
        rewards_config.distribution_interval = config_proposal.proposed_distribution_interval;
        rewards_config.max_rewards_per_user = config_proposal.proposed_max_rewards_per_user;
        rewards_config.updated_at = Clock::get()?.unix_timestamp;

        // Mark proposal as implemented
        config_proposal.status = ConfigProposalStatus::Implemented;
        config_proposal.implemented_at = Some(Clock::get()?.unix_timestamp);

        msg!("Configuration proposal {} executed successfully", proposal_id);
        Ok(())
    }
}

// Helper function to get change type name
fn get_change_type_name(change_type: u8) -> &'static str {
    match change_type {
        0 => "Point Release Delay",
        1 => "Referral Parameters",
        2 => "NFT Earning Ratios",
        3 => "Loyalty Network Settings",
        4 => "Merchant Limits",
        5 => "Inactivity Timeout",
        6 => "SMS OTP Settings",
        7 => "Subscription Plans",
        8 => "Asset Initiative Selection",
        9 => "Wallet Management",
        10 => "Payment Gateway",
        11 => "Email Notifications",
        _ => "Unknown Change Type",
    }
}

// Account contexts for existing functions remain the same...

/// The account context for the `create_rac_mint` instruction.
#[derive(Accounts)]
pub struct CreateRacMint<'info> {
    #[account(
        init,
        payer = admin,
        space = DaoConfig::LEN,
        seeds = [b"dao_config"],
        bump
    )]
    pub dao_config: Account<'info, DaoConfig>,
    #[account(
        init,
        payer = admin,
        mint::decimals = 9,
        mint::authority = admin,
    )]
    pub rac_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = rac_mint,
        associated_token::authority = admin,
    )]
    pub dao_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// The account context for initializing rewards configuration.
#[derive(Accounts)]
pub struct InitializeRewardsConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = RewardsConfig::LEN,
        seeds = [b"rewards_config"],
        bump
    )]
    pub rewards_config: Account<'info, RewardsConfig>,
    #[account(mut)]
    pub reward_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: This is the program ID
    pub program_id: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// The account context for the `create_nft` instruction.
#[derive(Accounts)]
#[instruction(collection_name: String, nft_name: String, display_name: String, symbol: String, is_custodial: bool)]
pub struct CreateNft<'info> {
    #[account(
        init,
        payer = admin,
        space = NftAccount::LEN,
        seeds = [b"nft", nft_name.as_bytes(), symbol.as_bytes()],
        bump
    )]
    pub nft: Account<'info, NftAccount>,
    #[account(
        init_if_needed,
        payer = admin,
        space = FractionalNft::LEN,
        seeds = [b"fractional", nft.key().as_ref()],
        bump,
        constraint = !is_custodial @ CustomError::AccountShouldNotBeUsed
    )]
    pub fractional_nft: Option<Account<'info, FractionalNft>>,
    #[account(
        init_if_needed,
        payer = admin,
        mint::decimals = 6,
        mint::authority = admin,
        constraint = !is_custodial @ CustomError::AccountShouldNotBeUsed
    )]
    pub fractional_mint: Option<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = fractional_mint.as_ref().unwrap(),
        associated_token::authority = admin,
        constraint = !is_custodial @ CustomError::AccountShouldNotBeUsed
    )]
    pub fractional_vault: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// The account context for the `update_nft` instruction.
#[derive(Accounts)]
#[instruction(collection_name: String, nft_name: String, display_name: String, symbol: String)]
pub struct UpdateNft<'info> {
    #[account(
        mut,
        seeds = [b"nft", nft_name.as_bytes(), symbol.as_bytes()],
        bump,
        constraint = nft.admin == admin.key() @ CustomError::Unauthorized
    )]
    pub nft: Account<'info, NftAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

/// The account context for a user investing in a custodial NFT.
#[derive(Accounts)]
#[instruction(investment_amount: u64)]
pub struct InvestInCustodialNft<'info> {
    #[account(mut)]
    pub nft: Account<'info, NftAccount>,
    #[account(
        // FIX: Allow multiple investments from the same user
        init_if_needed,
        payer = investor,
        space = CustodialInvestment::LEN,
        seeds = [b"investment", nft.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub investment_account: Account<'info, CustodialInvestment>,
    #[account(mut)]
    pub investor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// The account context for a user investing in a non-custodial NFT.
#[derive(Accounts)]
#[instruction(investment_amount: u64)]
pub struct InvestInNonCustodialNft<'info> {
    #[account(mut)]
    pub nft: Account<'info, NftAccount>,
    #[account(mut, seeds = [b"fractional", nft.key().as_ref()], bump)]
    pub fractional_nft: Account<'info, FractionalNft>,
    #[account(
        // FIX: Allow multiple investments from the same user
        init_if_needed,
        payer = investor,
        space = NonCustodialInvestment::LEN,
        seeds = [b"investment", nft.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub investment_account: Account<'info, NonCustodialInvestment>,
    #[account(mut)]
    pub fractional_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = fractional_mint,
        associated_token::authority = investor,
    )]
    pub investor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub investor: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// The account context for distributing passive income.
#[derive(Accounts)]
pub struct DistributeIncome<'info> {
    #[account(mut)]
    pub nft: Account<'info, NftAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

/// The account context for updating the passive income rate.
#[derive(Accounts)]
pub struct UpdateRate<'info> {
    // FIX: Enforce admin authority
    #[account(mut, has_one = admin @ CustomError::UnauthorizedAdmin)]
    pub nft: Account<'info, NftAccount>,
    #[account(mut)]
    pub dao_config: Account<'info, DaoConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

/// The account context for the `create_proposal` instruction.
#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [b"proposal", dao_config.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub dao_config: Account<'info, DaoConfig>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// The account context for creating configuration proposals.
#[derive(Accounts)]
pub struct CreateConfigProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [b"proposal", dao_config.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = proposer,
        space = ConfigProposal::LEN,
        seeds = [b"config_proposal", dao_config.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub config_proposal: Account<'info, ConfigProposal>,
    #[account(mut)]
    pub dao_config: Account<'info, DaoConfig>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// The account context for creating loyalty change proposals.
#[derive(Accounts)]
pub struct CreateLoyaltyChangeProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [b"proposal", dao_config.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = proposer,
        space = LoyaltyProposal::LEN,
        seeds = [b"loyalty_proposal", dao_config.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub loyalty_proposal: Account<'info, LoyaltyProposal>,
    #[account(mut)]
    pub dao_config: Account<'info, DaoConfig>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// The account context for the `vote` instruction.
#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct Vote<'info> {
    #[account(mut, seeds = [b"proposal", proposal_id.to_le_bytes().as_ref()], bump)]
    pub proposal: Account<'info, Proposal>,
    // FIX: Add VoterRecord account to prevent double voting
    #[account(
        init,
        payer = voter,
        space = VoterRecord::LEN,
        seeds = [b"voter_record", proposal_id.to_le_bytes().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub voter_record: Account<'info, VoterRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub rac_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

/// The account context for executing configuration proposals.
#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct ExecuteConfigProposal<'info> {
    #[account(mut, seeds = [b"proposal", proposal_id.to_le_bytes().as_ref()], bump)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut, seeds = [b"config_proposal", proposal_id.to_le_bytes().as_ref()], bump)]
    pub config_proposal: Account<'info, ConfigProposal>,
    #[account(mut, seeds = [b"rewards_config"], bump)]
    pub rewards_config: Account<'info, RewardsConfig>,
    #[account(mut)]
    pub executor: Signer<'info>,
}


// All Account Data Structures below...

#[account]
pub struct NftAccount {
    pub admin: Pubkey,
    pub collection_name: String,           // Collection Name (dropdown list)
    pub nft_name: String,                  // NFT Name (e.g., Pearl White, Lava Orange)
    pub display_name: String,              // Display Name
    pub symbol: String,
    pub uri: String,
    pub custody_type: CustodyType,
    
    // Pricing & Minting
    pub buy_price_usdt: u64,               // Buy Price in USDT (in smallest unit)
    pub rarity: String,                    // Common, Less Common, Rare, Very Rare
    pub mint_quantity: u64,                // Total number that can be minted
    
    // Features & Capabilities
    pub is_upgradeable: bool,              // Upgrade (Yes/No)
    pub is_evolvable: bool,                // Evolve (Yes/No)
    pub is_fractional_eligible: bool,      // Fractional (Yes/No)
    
    // Auto Staking
    pub auto_staking_duration: String,     // Forever, 1 Year, 2 Years, 5 Years
    
    // Earning Ratios
    pub earn_on_spend_ratio: u64,          // Earn on Spend % (in basis points, e.g., 100 = 1.00%)
    pub upgrade_bonus_ratio: u64,          // Upgrade Bonus Tokenization % (in basis points)
    
    // Evolution Settings
    pub evolution_min_investment: u64,     // Evolution Min Invest in USDT (in smallest unit)
    pub evolution_earnings_ratio: u64,     // Evolution Earnings % (in basis points)
    
    // Legacy fields for backward compatibility
    pub passive_income_rate: u64,
    pub custodial_income_rate: Option<u64>,
    pub last_distribution_timestamp: i64,
    
    // Metadata
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
pub struct CustodialInvestment {
    pub investor: Pubkey,
    pub nft: Pubkey,
    pub amount: u64,
}

#[account]
pub struct NonCustodialInvestment {
    pub investor: Pubkey,
    pub nft: Pubkey,
    pub amount: u64,
}

#[account]
pub struct DaoConfig {
    pub rac_mint: Pubkey,
    pub total_supply: u64,
    pub proposal_count: u64,
    pub quorum_bps: u16,
    pub voting_period_slots: u64,
    pub min_proposal_threshold: u64,
    pub admin_authority: Pubkey,
}

#[account]
pub struct FractionalNft {
    pub parent_nft: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub supply_cap: u64,
}

#[account]
pub struct Proposal {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub proposal_type: u8,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub dao_org: u8,
    pub status: u8,
    pub created_at: i64,
    pub end_slot: u64,
    pub executed_at: Option<i64>,
}

/// A record to ensure a user only votes once per proposal.
#[account]
pub struct VoterRecord {
    pub voter: Pubkey,
    pub proposal_id: u64,
}

/// Rewards configuration account
#[account]
pub struct RewardsConfig {
    pub program_id: Pubkey,
    pub admin_authority: Pubkey,
    pub reward_token_mint: Pubkey,
    pub distribution_interval: u64,
    pub max_rewards_per_user: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Configuration proposal account
#[account]
pub struct ConfigProposal {
    pub proposal_id: u64,
    pub proposed_distribution_interval: u64,
    pub proposed_max_rewards_per_user: u64,
    pub status: ConfigProposalStatus,
    pub created_at: i64,
    pub approved_at: Option<i64>,
    pub implemented_at: Option<i64>,
}

/// A proposal for loyalty application behavior changes.
#[account]
pub struct LoyaltyProposal {
    pub proposal_id: u64,
    pub change_type: u8,
    pub parameter_name: String,
    pub old_value: String,
    pub new_value: String,
    pub reason: String,
    pub status: ConfigProposalStatus,
    pub created_at: i64,
    pub approved_at: Option<i64>,
    pub implemented_at: Option<i64>,
}

// Account length implementations
impl NftAccount {
    pub const LEN: usize = 8 + 32 + (4 + 50) + (4 + 10) + (4 + 200) + 1 + 8 + (1 + 8) + 8;
}
impl CustodialInvestment {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}
impl NonCustodialInvestment {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}
impl DaoConfig {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 2 + 8 + 8 + 32;
}
impl FractionalNft {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8;
}
impl Proposal {
    pub const LEN: usize = 8 + 8 + 32 + 1 + (4 + 200) + 8 + 8 + 1 + 1 + 8 + 8 + (1 + 8);
}
impl VoterRecord {
    pub const LEN: usize = 8 + 32 + 8;
}
impl RewardsConfig {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 8 + 8;
}
impl ConfigProposal {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 1 + 8 + (1 + 8) + (1 + 8);
}
impl LoyaltyProposal {
    pub const LEN: usize = 8 + 8 + 1 + (4 + 100) + (4 + 500) + (4 + 500) + (4 + 1000) + 1 + 8 + (1 + 8) + (1 + 8);
}


#[error_code]
pub enum CustomError {
    #[msg("This account should not be used for this NFT type.")]
    AccountShouldNotBeUsed,
    #[msg("The NFT is not a custodial type.")]
    InvalidCustodyType,
    #[msg("The NFT is not a non-custodial type.")]
    InvalidNonCustodyType,
    #[msg("The fractional supply cap has been reached for this NFT.")]
    SupplyCapReached,
    #[msg("Fractional supply must be provided for a non-custodial NFT.")]
    MissingFractionalSupply,
    #[msg("You do not have enough tokens to vote.")]
    InsufficientBalanceForVote,
    #[msg("Required accounts for non-custodial NFT were not provided.")]
    MissingRequiredAccountsForNonCustodial,
    #[msg("You are not authorized to perform this action.")]
    UnauthorizedAdmin,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Investment amount must be greater than zero.")]
    ZeroInvestmentAmount,
    #[msg("Invalid proposal ID.")]
    InvalidProposalId,
    #[msg("Invalid proposal type.")]
    InvalidProposalType,
    #[msg("Proposal not approved.")]
    ProposalNotApproved,
    #[msg("No votes cast on proposal.")]
    NoVotesCast,
    #[msg("Proposal did not pass.")]
    ProposalNotPassed,
    #[msg("Invalid change type.")]
    InvalidChangeType,
    #[msg("Voting still active.")]
    VotingStillActive,
    #[msg("Quorum not met.")]
    QuorumNotMet,
}
