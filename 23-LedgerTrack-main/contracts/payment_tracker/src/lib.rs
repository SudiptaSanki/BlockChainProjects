#![no_std]
use soroban_sdk::{contract, contractimpl, Symbol, Env, Address, String};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn initialize(env: Env, admin: Address) -> Symbol {
        admin.require_auth();
        Symbol::new(&env, "initialized")
    }

    pub fn execute_action(env: Env, from: Address, payload: String) -> Symbol {
        from.require_auth();
        Symbol::new(&env, "success")
    }
}

mod test;
