use anchor_lang::prelude::*;

declare_id!("ELtu4vRdjQVq2oU8HLJB1Vu9fecMVKzU22kxMSYyeEwS");

#[program]
pub mod improved_voting_dao {
    use super::*;

    pub fn create_dao(
        ctx: Context<CreateDAO>,
        name: String,
        description: String,
    ) -> Result<()> {
        require!(name.len() <= 64, ErrorCode::NameTooLong);
        require!(description.len() <= 256, ErrorCode::DescriptionTooLong);

        let dao = &mut ctx.accounts.dao;
        dao.authority = ctx.accounts.authority.key();
        dao.name = name;
        dao.description = description;
        dao.proposal_count = 0;
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        options: Vec<String>,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        require!(title.len() <= 128, ErrorCode::TitleTooLong);
        require!(description.len() <= 1024, ErrorCode::DescriptionTooLong);
        require!(options.len() <= 10, ErrorCode::TooManyOptions);
        require!(options.len() > 1, ErrorCode::InsufficientOptions);
        require!(end_time > start_time, ErrorCode::InvalidTimeRange);

        let dao = &mut ctx.accounts.dao;
        let proposal = &mut ctx.accounts.proposal;

        dao.proposal_count += 1;
        proposal.id = dao.proposal_count;
        proposal.authority = ctx.accounts.authority.key();
        proposal.title = title;
        proposal.description = description;
        proposal.start_time = start_time;
        proposal.end_time = end_time;
        proposal.options = options;
        proposal.vote_counts = vec![0; proposal.options.len()];
        proposal.is_active = true;

        Ok(())
    }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        option_index: u8,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let voter = &ctx.accounts.voter;

        require!(proposal.is_active, ErrorCode::ProposalInactive);
        require!(
            Clock::get()?.unix_timestamp >= proposal.start_time,
            ErrorCode::VotingNotStarted
        );
        require!(
            Clock::get()?.unix_timestamp <= proposal.end_time,
            ErrorCode::VotingEnded
        );
        require!(
            (option_index as usize) < proposal.options.len(),
            ErrorCode::InvalidOptionIndex
        );

        // Check if the voter has already voted
        let vote_account = &mut ctx.accounts.vote;
        require!(!vote_account.has_voted, ErrorCode::AlreadyVoted);

        // Record the vote
        proposal.vote_counts[option_index as usize] += 1;
        vote_account.has_voted = true;
        vote_account.option_index = option_index;

        Ok(())
    }

    pub fn close_proposal(ctx: Context<CloseProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;

        require!(
            Clock::get()?.unix_timestamp > proposal.end_time,
            ErrorCode::VotingNotEnded
        );

        proposal.is_active = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateDAO<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + DAO::SPACE
    )]
    pub dao: Account<'info, DAO>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub dao: Account<'info, DAO>,
    #[account(
        init,
        payer = authority,
        space = 8 + Proposal::SPACE
    )]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + Vote::SPACE,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseProposal<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = proposal.authority == authority.key()
    )]
    pub proposal: Account<'info, Proposal>,
}

#[account]
pub struct DAO {
    pub authority: Pubkey,
    pub name: String,
    pub description: String,
    pub proposal_count: u64,
}

impl DAO {
    const SPACE: usize = 32 + 64 + 256 + 8;
}

#[account]
pub struct Proposal {
    pub id: u64,
    pub authority: Pubkey,
    pub title: String,
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub options: Vec<String>,
    pub vote_counts: Vec<u64>,
    pub is_active: bool,
}

impl Proposal {
    const SPACE: usize = 8 + 32 + 128 + 1024 + 8 + 8 + (4 + 10 * 32) + (4 + 10 * 8) + 1;
}

#[account]
pub struct Vote {
    pub has_voted: bool,
    pub option_index: u8,
}

impl Vote {
    const SPACE: usize = 1 + 1;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Voting has not started yet")]
    VotingNotStarted,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Voting has not ended yet")]
    VotingNotEnded,
    #[msg("Invalid time range")]
    InvalidTimeRange,
    #[msg("Insufficient options")]
    InsufficientOptions,
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("Proposal is inactive")]
    ProposalInactive,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Name exceeds maximum length of 64 characters")]
    NameTooLong,
    #[msg("Description exceeds maximum length of 256 characters")]
    TitleTooLong,
    #[msg("Description exceeds maximum length of 1024 characters")]
    DescriptionTooLong,
    #[msg("Options exceed maximum length of 10")]
    TooManyOptions,
}
