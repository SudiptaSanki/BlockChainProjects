#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, symbol_short, Symbol};

#[contract]
pub struct AuraMint;

#[contractimpl]
impl AuraMint {
    pub fn mint_nft(env: Env, to: Address, metadata_hash: Symbol) {
        to.require_auth();
        // Record the mint
        let key = symbol_short!("last_mint");
        env.storage().instance().set(&key, &metadata_hash);
        
        let owner_key = symbol_short!("owner");
        env.storage().instance().set(&owner_key, &to);
    }

    pub fn get_last_mint(env: Env) -> Option<Symbol> {
        env.storage().instance().get(&symbol_short!("last_mint"))
    }
}
