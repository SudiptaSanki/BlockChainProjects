#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address};

#[test]
def test_contract() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Contract);
    let client = ContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    env.mock_all_auths();
    let res = client.initialize(&admin);
    assert_eq!(res, Symbol::new(&env, "initialized"));
}
