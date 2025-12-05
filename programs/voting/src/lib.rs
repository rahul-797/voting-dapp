use anchor_lang::prelude::*;

declare_id!("CkANkkC2LgoHpq3jLp5sgiGvxrEJEA76NZjS2NA8w8fr");

#[program]
pub mod voting {
    use super::*;
    pub fn initialize_poll(ctx: Context<InitializePoll>,
                            poll_id: u64,
                            description: String) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.candidate_count = 0;
        poll.poll_start = Clock::get()?.unix_timestamp as u64;
        poll.poll_end = 0;
        msg!("Greetings from {}", ctx.program_id);
        msg!("Poll initialized with ID: {}", poll.poll_id);
        msg!("Description: {}", poll.description);
        msg!("Poll start time: {}", poll.poll_start);
        Ok(())
    }
    pub fn initialize_candidate(ctx: Context<InitializeCandidate>,
                            name: String,
                            _poll_id: u64,
                            message: String) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.name = name;
        candidate.message = message;
        candidate.votes = 0;
        msg!("Candidate initialized with Name: {}", candidate.name);
        msg!("Votes: {}", candidate.votes);
        Ok(())
    }
    pub fn vote(ctx: Context<Vote>,
                            _name: String,
                            _poll_id: u64) -> Result<()> {
        let voter = &mut ctx.accounts.voter;
        if voter.has_voted {
            msg!("Voter already voted!");
            return Err(ErrorCode::AlreadyVoted.into());
        }
        voter.has_voted = true;
        let candidate = &mut ctx.accounts.candidate;
        candidate.votes += 1;
        msg!("Vote cast for candidate: {}", candidate.name);
        msg!("Total votes for {}: {}", candidate.name, candidate.votes);
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("You have already voted for this candidate in this poll.")]
    AlreadyVoted,
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Poll::INIT_SPACE,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub candidate_count: u64,
    pub poll_start: u64,
    pub poll_end: u64,
}

#[derive(Accounts)]
#[instruction(name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(
        mut,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [b"candidate", poll_id.to_le_bytes().as_ref(), name.as_ref()],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(16)]
    pub name: String,
    #[max_len(64)]
    pub message: String,
    pub votes: u64,
}

#[derive(Accounts)]
#[instruction(name: String, poll_id: u64)]
pub struct Vote<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Voter::INIT_SPACE,
        seeds = [
            b"vote",
            poll_id.to_le_bytes().as_ref(),
            user.key().as_ref()
            ],
        bump,
    )]
    pub voter: Account<'info, Voter>,
    #[account(
        mut,
        seeds = [
            b"candidate",
            poll_id.to_le_bytes().as_ref(),
            name.as_ref()
        ],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Voter {
    pub has_voted: bool,
}