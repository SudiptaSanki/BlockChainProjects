#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, symbol_short, Symbol};

#[contract]
pub struct PulsePoll;

#[contractimpl]
impl PulsePoll {
    pub fn cast_vote(env: Env, voter: Address, option: u32) {
        voter.require_auth();
        
        // Ensure voter hasn't voted yet (simple mock logic)
        let voted_key = symbol_short!("voted");
        env.storage().instance().set(&voted_key, &voter);

        // Record vote for option
        let option_key = if option == 1 { symbol_short!("opt_1") } else { symbol_short!("opt_2") };
        let mut count: u32 = env.storage().instance().get(&option_key).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&option_key, &count);
    }

    pub fn get_votes(env: Env, option: u32) -> u32 {
        let option_key = if option == 1 { symbol_short!("opt_1") } else { symbol_short!("opt_2") };
        env.storage().instance().get(&option_key).unwrap_or(0)
    }
}
