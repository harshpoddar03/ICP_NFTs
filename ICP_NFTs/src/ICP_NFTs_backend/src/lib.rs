use ic_cdk::export_candid;
use std::collections::HashMap;
use std::cell::RefCell;
use candid::Principal;
use candid::CandidType;
use serde::Deserialize;
use candid;

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
    next_token_id: u64,
}

impl NFTContract {
    fn new() -> Self {
        NFTContract {
            tokens: HashMap::new(),
            next_token_id: 0,
        }
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
}

#[ic_cdk::query]
fn get_token_content(token_id: u64) -> Option<String> {
    NFT_CONTRACT.with(|contract| contract.borrow().get_content(token_id))
}

#[ic_cdk::update]
fn mint_nft(content: String) -> u64 {
    let owner = ic_cdk::caller();
    NFT_CONTRACT.with(|contract| contract.borrow_mut().mint(owner, content))
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

// Candid export
ic_cdk::export_candid!();