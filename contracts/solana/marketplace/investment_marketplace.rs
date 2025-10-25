// Tokenized Asset and Initiative Marketplace Smart Contract
// This contract handles fractionalized ownership, investment tracking, and passive income distribution

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::collections::HashMap;

declare_id!("Marketplace1111111111111111111111111111111111");

#[program]
pub mod marketplace {
    use super::*;

    // Initialize a new marketplace listing
    pub fn initialize_listing(
        ctx: Context<InitializeListing>,
        listing_id: u64,
        total_funding_goal: u64,
        token_price: u64,
        end_date: i64,
        campaign_type: CampaignType,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        listing.listing_id = listing_id;
        listing.creator = ctx.accounts.creator.key();
        listing.total_funding_goal = total_funding_goal;
        listing.current_funding_amount = 0;
        listing.token_price = token_price;
        listing.end_date = end_date;
        listing.campaign_type = campaign_type;
        listing.status = ListingStatus::Active;
        listing.created_at = clock.unix_timestamp;
        listing.updated_at = clock.unix_timestamp;
        listing.total_investors = 0;

        // Initialize token supply based on funding goal
        listing.total_token_supply = total_funding_goal / token_price;

        emit!(ListingCreated {
            listing_id,
            creator: ctx.accounts.creator.key(),
            total_funding_goal,
            token_price,
        });

        Ok(())
    }

    // Invest in a marketplace listing
    pub fn invest(
        ctx: Context<Invest>,
        investment_amount: u64,
        nft_multiplier: u64, // 100 = 1.0x, 150 = 1.5x
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let investment = &mut ctx.accounts.investment;
        let clock = Clock::get()?;

        // Validate investment
        require!(
            listing.status == ListingStatus::Active,
            MarketplaceError::ListingNotActive
        );

        // Check if campaign has expired
        if listing.campaign_type == CampaignType::TimeBound {
            require!(
                clock.unix_timestamp <= listing.end_date,
                MarketplaceError::CampaignExpired
            );
        }

        // Calculate effective investment amount with NFT multiplier
        let effective_amount = (investment_amount * nft_multiplier) / 100;
        
        // Check if investment exceeds remaining funding goal
        require!(
            listing.current_funding_amount + effective_amount <= listing.total_funding_goal,
            MarketplaceError::ExceedsFundingGoal
        );

        // Calculate tokens to be received
        let tokens_received = effective_amount / listing.token_price;
        require!(tokens_received > 0, MarketplaceError::InsufficientInvestment);

        // Update listing
        listing.current_funding_amount += effective_amount;
        listing.total_investors += 1;

        // Check if funding goal is reached
        if listing.current_funding_amount >= listing.total_funding_goal {
            listing.status = ListingStatus::Funded;
        }

        // Create investment record
        investment.investor = ctx.accounts.investor.key();
        investment.listing_id = listing.listing_id;
        investment.investment_amount = investment_amount;
        investment.effective_amount = effective_amount;
        investment.tokens_received = tokens_received;
        investment.nft_multiplier = nft_multiplier;
        investment.status = InvestmentStatus::Confirmed;
        investment.invested_at = clock.unix_timestamp;

        // Transfer tokens from investor to listing vault
        let transfer_instruction = Transfer {
            from: ctx.accounts.investor_token_account.to_account_info(),
            to: ctx.accounts.listing_vault.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, effective_amount)?;

        emit!(InvestmentMade {
            listing_id: listing.listing_id,
            investor: ctx.accounts.investor.key(),
            investment_amount,
            effective_amount,
            tokens_received,
            nft_multiplier,
        });

        Ok(())
    }

    // Distribute passive income to token holders
    pub fn distribute_passive_income(
        ctx: Context<DistributePassiveIncome>,
        distribution_amount: u64,
        period_start: i64,
        period_end: i64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let distribution = &mut ctx.accounts.distribution;
        let clock = Clock::get()?;

        require!(
            listing.status == ListingStatus::Funded || listing.status == ListingStatus::Completed,
            MarketplaceError::ListingNotFunded
        );

        // Calculate distribution per token
        let distribution_per_token = distribution_amount / listing.total_token_supply;

        // Create distribution record
        distribution.listing_id = listing.listing_id;
        distribution.distribution_amount = distribution_amount;
        distribution.distribution_per_token = distribution_per_token;
        distribution.period_start = period_start;
        distribution.period_end = period_end;
        distribution.is_processed = false;
        distribution.created_at = clock.unix_timestamp;

        emit!(PassiveIncomeDistribution {
            listing_id: listing.listing_id,
            distribution_amount,
            distribution_per_token,
            period_start,
            period_end,
        });

        Ok(())
    }

    // Claim passive income earnings
    pub fn claim_passive_income(
        ctx: Context<ClaimPassiveIncome>,
        distribution_id: u64,
    ) -> Result<()> {
        let distribution = &mut ctx.accounts.distribution;
        let user_earning = &mut ctx.accounts.user_earning;
        let investment = &mut ctx.accounts.investment;
        let clock = Clock::get()?;

        require!(
            !user_earning.is_claimed,
            MarketplaceError::AlreadyClaimed
        );

        // Calculate earnings based on user's token balance
        let earnings = investment.tokens_received * distribution.distribution_per_token;

        require!(earnings > 0, MarketplaceError::NoEarningsToClaim);

        // Update user earning record
        user_earning.earnings_amount = earnings;
        user_earning.is_claimed = true;
        user_earning.claimed_at = clock.unix_timestamp;

        // Transfer earnings to user
        let transfer_instruction = Transfer {
            from: ctx.accounts.distribution_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.distribution_authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            &[&ctx.accounts.distribution_authority.to_account_info()],
        );

        token::transfer(cpi_ctx, earnings)?;

        emit!(PassiveIncomeClaimed {
            listing_id: distribution.listing_id,
            investor: ctx.accounts.investor.key(),
            earnings_amount: earnings,
            distribution_id,
        });

        Ok(())
    }

    // Complete a listing (when asset generates returns or is sold)
    pub fn complete_listing(
        ctx: Context<CompleteListing>,
        final_value: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        require!(
            listing.status == ListingStatus::Funded,
            MarketplaceError::ListingNotFunded
        );

        // Calculate return per token
        let return_per_token = final_value / listing.total_token_supply;

        // Update listing status
        listing.status = ListingStatus::Completed;
        listing.final_value = final_value;
        listing.return_per_token = return_per_token;
        listing.completed_at = clock.unix_timestamp;

        emit!(ListingCompleted {
            listing_id: listing.listing_id,
            final_value,
            return_per_token,
        });

        Ok(())
    }

    // Cancel a listing
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        require!(
            listing.status == ListingStatus::Active,
            MarketplaceError::ListingNotActive
        );

        listing.status = ListingStatus::Cancelled;
        listing.cancelled_at = clock.unix_timestamp;

        emit!(ListingCancelled {
            listing_id: listing.listing_id,
            cancelled_at: clock.unix_timestamp,
        });

        Ok(())
    }
}

// Account structures
#[account]
pub struct MarketplaceListing {
    pub listing_id: u64,
    pub creator: Pubkey,
    pub total_funding_goal: u64,
    pub current_funding_amount: u64,
    pub token_price: u64,
    pub total_token_supply: u64,
    pub end_date: i64,
    pub campaign_type: CampaignType,
    pub status: ListingStatus,
    pub total_investors: u64,
    pub final_value: u64,
    pub return_per_token: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub completed_at: i64,
    pub cancelled_at: i64,
}

#[account]
pub struct Investment {
    pub investor: Pubkey,
    pub listing_id: u64,
    pub investment_amount: u64,
    pub effective_amount: u64,
    pub tokens_received: u64,
    pub nft_multiplier: u64,
    pub status: InvestmentStatus,
    pub invested_at: i64,
}

#[account]
pub struct PassiveIncomeDistribution {
    pub listing_id: u64,
    pub distribution_amount: u64,
    pub distribution_per_token: u64,
    pub period_start: i64,
    pub period_end: i64,
    pub is_processed: bool,
    pub created_at: i64,
}

#[account]
pub struct UserPassiveEarning {
    pub investor: Pubkey,
    pub listing_id: u64,
    pub distribution_id: u64,
    pub investment_id: u64,
    pub token_balance: u64,
    pub earnings_amount: u64,
    pub is_claimed: bool,
    pub claimed_at: i64,
}

// Context structures
#[derive(Accounts)]
#[instruction(listing_id: u64)]
pub struct InitializeListing<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + MarketplaceListing::INIT_SPACE,
        seeds = [b"listing", listing_id.to_le_bytes().as_ref()],
        bump
    )]
    pub listing: Account<'info, MarketplaceListing>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        token::mint = reward_token_mint,
        token::authority = listing,
        seeds = [b"vault", listing.key().as_ref()],
        bump
    )]
    pub listing_vault: Account<'info, TokenAccount>,
    
    pub reward_token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(investment_amount: u64)]
pub struct Invest<'info> {
    #[account(
        mut,
        seeds = [b"listing", investment.listing_id.to_le_bytes().as_ref()],
        bump
    )]
    pub listing: Account<'info, MarketplaceListing>,
    
    #[account(
        init,
        payer = investor,
        space = 8 + Investment::INIT_SPACE,
        seeds = [b"investment", listing.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub investment: Account<'info, Investment>,
    
    #[account(mut)]
    pub investor: Signer<'info>,
    
    #[account(
        mut,
        associated_token::mint = reward_token_mint,
        associated_token::authority = investor
    )]
    pub investor_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"vault", listing.key().as_ref()],
        bump
    )]
    pub listing_vault: Account<'info, TokenAccount>,
    
    pub reward_token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(distribution_amount: u64)]
pub struct DistributePassiveIncome<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.listing_id.to_le_bytes().as_ref()],
        bump
    )]
    pub listing: Account<'info, MarketplaceListing>,
    
    #[account(
        init,
        payer = distribution_authority,
        space = 8 + PassiveIncomeDistribution::INIT_SPACE,
        seeds = [b"distribution", listing.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub distribution: Account<'info, PassiveIncomeDistribution>,
    
    #[account(mut)]
    pub distribution_authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"distribution_vault", listing.key().as_ref()],
        bump
    )]
    pub distribution_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(distribution_id: u64)]
pub struct ClaimPassiveIncome<'info> {
    #[account(
        seeds = [b"listing", distribution.listing_id.to_le_bytes().as_ref()],
        bump
    )]
    pub listing: Account<'info, MarketplaceListing>,
    
    #[account(
        mut,
        seeds = [b"distribution", listing.key().as_ref(), &distribution_id.to_le_bytes()],
        bump
    )]
    pub distribution: Account<'info, PassiveIncomeDistribution>,
    
    #[account(
        mut,
        seeds = [b"investment", listing.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub investment: Account<'info, Investment>,
    
    #[account(
        init,
        payer = investor,
        space = 8 + UserPassiveEarning::INIT_SPACE,
        seeds = [b"earning", distribution.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub user_earning: Account<'info, UserPassiveEarning>,
    
    #[account(mut)]
    pub investor: Signer<'info>,
    
    #[account(
        mut,
        associated_token::mint = reward_token_mint,
        associated_token::authority = investor
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"distribution_vault", listing.key().as_ref()],
        bump
    )]
    pub distribution_vault: Account<'info, TokenAccount>,
    
    pub distribution_authority: AccountInfo<'info>,
    pub reward_token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CompleteListing<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.listing_id.to_le_bytes().as_ref()],
        bump
    )]
    pub listing: Account<'info, MarketplaceListing>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.listing_id.to_le_bytes().as_ref()],
        bump
    )]
    pub listing: Account<'info, MarketplaceListing>,
    
    pub authority: Signer<'info>,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CampaignType {
    TimeBound,
    OpenEnded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ListingStatus {
    Active,
    Funded,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum InvestmentStatus {
    Pending,
    Confirmed,
    Cancelled,
    Refunded,
}

// Events
#[event]
pub struct ListingCreated {
    pub listing_id: u64,
    pub creator: Pubkey,
    pub total_funding_goal: u64,
    pub token_price: u64,
}

#[event]
pub struct InvestmentMade {
    pub listing_id: u64,
    pub investor: Pubkey,
    pub investment_amount: u64,
    pub effective_amount: u64,
    pub tokens_received: u64,
    pub nft_multiplier: u64,
}

#[event]
pub struct PassiveIncomeDistribution {
    pub listing_id: u64,
    pub distribution_amount: u64,
    pub distribution_per_token: u64,
    pub period_start: i64,
    pub period_end: i64,
}

#[event]
pub struct PassiveIncomeClaimed {
    pub listing_id: u64,
    pub investor: Pubkey,
    pub earnings_amount: u64,
    pub distribution_id: u64,
}

#[event]
pub struct ListingCompleted {
    pub listing_id: u64,
    pub final_value: u64,
    pub return_per_token: u64,
}

#[event]
pub struct ListingCancelled {
    pub listing_id: u64,
    pub cancelled_at: i64,
}

// Error types
#[error_code]
pub enum MarketplaceError {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Campaign has expired")]
    CampaignExpired,
    #[msg("Investment exceeds funding goal")]
    ExceedsFundingGoal,
    #[msg("Insufficient investment amount")]
    InsufficientInvestment,
    #[msg("Listing is not funded")]
    ListingNotFunded,
    #[msg("Earnings already claimed")]
    AlreadyClaimed,
    #[msg("No earnings to claim")]
    NoEarningsToClaim,
    #[msg("Invalid NFT multiplier")]
    InvalidNftMultiplier,
    #[msg("Unauthorized access")]
    Unauthorized,
}

// Constants
pub const NFT_MULTIPLIER_PRECISION: u64 = 100; // 1.0x = 100, 1.5x = 150
pub const MIN_INVESTMENT_AMOUNT: u64 = 1000; // Minimum investment in smallest token unit
pub const MAX_INVESTMENT_AMOUNT: u64 = 1_000_000_000; // Maximum investment amount

// Helper functions
impl MarketplaceListing {
    pub const INIT_SPACE: usize = 8 + // discriminator
        8 + // listing_id
        32 + // creator
        8 + // total_funding_goal
        8 + // current_funding_amount
        8 + // token_price
        8 + // total_token_supply
        8 + // end_date
        1 + // campaign_type
        1 + // status
        8 + // total_investors
        8 + // final_value
        8 + // return_per_token
        8 + // created_at
        8 + // updated_at
        8 + // completed_at
        8; // cancelled_at
}

impl Investment {
    pub const INIT_SPACE: usize = 8 + // discriminator
        32 + // investor
        8 + // listing_id
        8 + // investment_amount
        8 + // effective_amount
        8 + // tokens_received
        8 + // nft_multiplier
        1 + // status
        8; // invested_at
}

impl PassiveIncomeDistribution {
    pub const INIT_SPACE: usize = 8 + // discriminator
        8 + // listing_id
        8 + // distribution_amount
        8 + // distribution_per_token
        8 + // period_start
        8 + // period_end
        1 + // is_processed
        8; // created_at
}

impl UserPassiveEarning {
    pub const INIT_SPACE: usize = 8 + // discriminator
        32 + // investor
        8 + // listing_id
        8 + // distribution_id
        8 + // investment_id
        8 + // token_balance
        8 + // earnings_amount
        1 + // is_claimed
        8; // claimed_at
}
