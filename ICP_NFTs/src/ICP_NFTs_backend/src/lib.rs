use ic_cdk::export_candid;
use ic_cdk::print;
use std::collections::HashMap;
use std::cell::RefCell;
use candid::Principal;
use candid::CandidType;
use serde::Deserialize;
use candid;
use std::collections::HashSet;

#[derive(CandidType, Deserialize)]
struct NFT {
    owner: Principal,
    content: String,
}

thread_local! {
    static NFT_CONTRACT: RefCell<NFTContract> = RefCell::new(NFTContract::new());
}

struct NFTContract {
    tokens: HashMap<u64, NFT>,
    authorized_minters: HashSet<Principal>,
    next_token_id: u64,
}

impl NFTContract {
    fn new() -> Self {
        let mut contract = NFTContract {
            tokens: HashMap::new(),
            authorized_minters: HashSet::new(),
            next_token_id: 0,
        };

        contract.authorized_minters.insert(ic_cdk::caller()); // added so that the owner ( deployer) is the first authorized minter
        contract
    }

    fn mint(&mut self, owner: Principal, content: String) -> u64 {
        let token_id = self.next_token_id;
        self.tokens.insert(token_id, NFT { owner, content });
        self.next_token_id += 1;
        token_id
    }

    fn transfer(&mut self, from: Principal, to: Principal, token_id: u64) -> bool {
        if let Some(nft) = self.tokens.get_mut(&token_id) {
            if nft.owner == from {
                nft.owner = to;
                return true;
            }
        }
        false
    }

    fn burn(&mut self, token_id: u64) -> bool {
        self.tokens.remove(&token_id).is_some()
    }

    fn get_content(&self, token_id: u64) -> Option<String> {
        self.tokens.get(&token_id).map(|nft| nft.content.clone())
    }

    fn add_authorized_minter(&mut self, minter: Principal) -> Result<(), String> {
        if !self.authorized_minters.contains(&ic_cdk::caller()) {
            return Err("Not authorized to add minters".to_string());
        }
        self.authorized_minters.insert(minter);
        Ok(())
    }



}

#[ic_cdk::query]
fn get_token_content(token_id: u64) -> Option<String> {
    println!("Attempting to get content for token ID: {}", token_id);
    let result = NFT_CONTRACT.with(|contract| contract.borrow().get_content(token_id));
    println!("Result: {:?}", result);
    result
}
#[ic_cdk::update]
fn mint_nft(owner: Principal, content: String) -> (u64, String) {
    let token_id = NFT_CONTRACT.with(|contract| contract.borrow_mut().mint(owner, content.clone()));
    println!("Minted NFT with ID: {} and content: {}", token_id, content);
    (token_id, content)
}

#[ic_cdk::update]
fn transfer_nft(to: Principal, token_id: u64) -> bool {
    let from = ic_cdk::caller();
    NFT_CONTRACT.with(|contract| contract.borrow_mut().transfer(from, to, token_id))
}

#[ic_cdk::update]
fn burn_nft(token_id: u64) -> bool {
    NFT_CONTRACT.with(|contract| contract.borrow_mut().burn(token_id))
}

#[ic_cdk::update]
fn add_authorized_minter(minter: Principal) -> Result<(), String> {
    NFT_CONTRACT.with(|contract| contract.borrow_mut().add_authorized_minter(minter))
}

// Candid export
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generate_candid() {
        use std::env;
        use std::fs::write;
        use std::path::PathBuf;

        let dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
        let dir = dir.parent().unwrap().join("ICP_NFTs_backend");
        print!("{:?}", dir);
        write(dir.join("ICP_NFTs_backend.did"), export_candid()).expect("Write failed.");
    }
}

// Make sure this function is available
pub fn export_candid() -> String {
    candid::export_service!();
    __export_service()
}