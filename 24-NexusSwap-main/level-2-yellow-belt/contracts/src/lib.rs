#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, symbol_short};

#[contract]
pub struct NexusSwap;

#[contractimpl]
impl NexusSwap {
    pub fn record_swap(env: Env, user: Address, amount_in: u32, token_out: u32) {
        user.require_auth();
        // Record the swap intent
        env.storage().instance().set(&symbol_short!("last_swp"), &user);
        env.storage().instance().set(&symbol_short!("amt_in"), &amount_in);
        env.storage().instance().set(&symbol_short!("tkn_out"), &token_out);
    }

    pub fn get_last_swap(env: Env) -> Option<Address> {
        env.storage().instance().get(&symbol_short!("last_swp"))
    }
}
