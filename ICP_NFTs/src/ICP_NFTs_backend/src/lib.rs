// use candid::{CandidType, Deserialize};
use candid_derive::CandidType;
use ic_cdk::export_candid::Principal;
use ic_cdk_macros::*;
use std::collections::HashMap;

use ic_cdk::update;
use ic_cdk::query;


#[derive(CandidType)]
struct NFT {
    owner: Principal,
    metadata: String,
}

type NFTStore = HashMap<u64, NFT>;

thread_local! {
    static NFT_STORE: std::cell::RefCell<NFTStore> = std::cell::RefCell::new(HashMap::new());
    static NEXT_ID: std::cell::RefCell<u64> = std::cell::RefCell::new(0);
}

#[ic_cdk::update]
fn mint(metadata: String) -> u64 {
    let id = NEXT_ID.with(|id| {
        let next_id = *id.borrow();
        *id.borrow_mut() += 1;
        next_id
    });

    let nft = NFT {
        owner: ic_cdk::caller(),
        metadata,
    };

    NFT_STORE.with(|store| store.borrow_mut().insert(id, nft));

    id
}

#[ic_cdk::query]
fn get_nft(id: u64) -> Option<NFT> {
    NFT_STORE.with(|store| store.borrow().get(&id).cloned())
}



