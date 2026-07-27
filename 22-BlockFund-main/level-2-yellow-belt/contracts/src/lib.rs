#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, symbol_short};

#[contract]
pub struct BlockFund;

#[contractimpl]
impl BlockFund {
    pub fn pledge(env: Env, from: Address, amount: u32) {
        from.require_auth();
        let key = symbol_short!("total");
        let mut total_pledged: u32 = env.storage().instance().get(&key).unwrap_or(0);
        total_pledged += amount;
        env.storage().instance().set(&key, &total_pledged);
        
        let last_pledger = symbol_short!("last_p");
        env.storage().instance().set(&last_pledger, &from);
    }

    pub fn get_total(env: Env) -> u32 {
        let key = symbol_short!("total");
        env.storage().instance().get(&key).unwrap_or(0)
    }
}
