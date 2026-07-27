#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, symbol_short, Symbol};

#[contract]
pub struct LedgerTrack;

#[contractimpl]
impl LedgerTrack {
    pub fn record_payment(env: Env, from: Address, to: Address, amount: u32) {
        from.require_auth();
        
        let payment_key = symbol_short!("last_pmt");
        env.storage().instance().set(&payment_key, &to);

        let amount_key = symbol_short!("last_amt");
        env.storage().instance().set(&amount_key, &amount);
    }

    pub fn get_last_payment_amount(env: Env) -> u32 {
        let amount_key = symbol_short!("last_amt");
        env.storage().instance().get(&amount_key).unwrap_or(0)
    }
}
