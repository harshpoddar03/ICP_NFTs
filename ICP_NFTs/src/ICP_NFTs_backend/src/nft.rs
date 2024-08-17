use ic_cdk::export_candid;
use ic_cdk::print;
use std::collections::HashMap;
use std::cell::RefCell;
use std::net::ToSocketAddrs;
use candid::Principal;
use candid::CandidType;
use serde::Deserialize;
use candid;
use std::collections::HashSet;

#[derive(CandidType, Deserialize)]
#[derive(Clone)]
pub struct NFT {
    owner: Principal,
    pub model: String,
    pub name: String,
    pub description: String,
    pub embeddings: Vec<Vec<f32>>,
    pub pdfcontent: Vec<HashMap<String, String>>,
    pub nft_image: Vec<u8>,
}

thread_local! {
    static NFT_CONTRACT: RefCell<NFTContract> = RefCell::new(NFTContract::new());
}

struct NFTContract {
    tokens: HashMap<u64, NFT>,
    // addressToToken: HashMap<Principal, u64>,
    addressToTokens: HashMap<Principal, Vec<u64>>,  // Changed to store multiple tokens
    tokenToAddress: HashMap<u64, Principal>,
    authorized_minters: HashSet<Principal>,
    next_token_id: u64,
}

fn receive_from_js(data: Vec<String>) -> Vec<HashMap<String, String>> {
    data.chunks(2)
        .map(|chunk| {
            let mut map = HashMap::new();
            map.insert("id".to_string(), chunk[0].clone());
            map.insert("text".to_string(), chunk[1].clone());
            map
        })
        .collect()
}

impl NFTContract {
    fn new() -> Self {
        let mut contract = NFTContract {
            tokens: HashMap::new(),
            addressToTokens: HashMap::new(),  // Changed name
            tokenToAddress: HashMap::new(),
            authorized_minters: HashSet::new(),
            next_token_id: 0,
        };

        contract.authorized_minters.insert(ic_cdk::caller()); // added so that the owner ( deployer) is the first authorized minter
        contract
    }

    fn mint(&mut self, owner: Principal, model: String, embeddings: Vec<Vec<f32>>, json: Vec<String>, name: String, description: String, nft_image: Vec<u8>) -> u64 {
        let token_id = self.next_token_id;
        self.addressToTokens.entry(owner).or_insert_with(Vec::new).push(token_id);
        self.tokenToAddress.insert(token_id, owner);
        let pdfcontent = receive_from_js(json);
        self.tokens.insert(token_id, NFT { owner, model, name, description, embeddings, pdfcontent, nft_image });
        self.next_token_id += 1;
        token_id
    }
    // fn transfer(&mut self, to: Principal, token_id: u64) -> bool {
    //     let from = ic_cdk::caller();
    //     if let Some(nft) = self.tokens.get_mut(&token_id) {
    //         if nft.owner == from {
    //             nft.owner = to;
    //             self.addressToToken.remove(&from);
    //             self.addressToToken.insert(to, token_id);
    //             self.tokenToAddress.insert(token_id, to);
    //             return true;
    //         }
    //     }
    //     false
    // }
    fn transfer(&mut self, to: Principal, token_id: u64) -> bool {
        let from = ic_cdk::caller();
        if let Some(nft) = self.tokens.get_mut(&token_id) {
            if nft.owner == from {
                nft.owner = to;
                // Remove token from 'from' address
                if let Some(tokens) = self.addressToTokens.get_mut(&from) {
                    tokens.retain(|&t| t != token_id);
                }
                // Add token to 'to' address
                self.addressToTokens.entry(to).or_insert_with(Vec::new).push(token_id);
                self.tokenToAddress.insert(token_id, to);
                return true;
            }
        }
        false
    }

    fn all_user_nfts(&self, owner: Principal) -> Vec<u64> {
        self.addressToTokens.get(&owner).cloned().unwrap_or_default()
    }

    fn verify_user_with_token(&self,token_id: u64, owner: Principal) -> bool {
        if self.tokenToAddress.get(&token_id) == Some(&owner) {
            return true;
        }
        false
    }


    fn burn(&mut self, token_id: u64) -> bool {
        if let Some(nft) = self.tokens.remove(&token_id) {
            if let Some(tokens) = self.addressToTokens.get_mut(&nft.owner) {
                tokens.retain(|&t| t != token_id);
            }
            self.tokenToAddress.remove(&token_id);
            true
        } else {
            false
        }
    }

    // fn get_content(&self, token_id: u64) -> Option<String> {
    //     let address = ic_cdk::caller();
    //     if self.tokenToAddress.get(&token_id) == Some(&address) {
    //         return self.tokens.get(&token_id).map(|nft| nft.content.clone());
    //     }
    //     None
    //     // self.tokens.get(&token_id).map(|nft| nft.content.clone())
    // }
    fn get_content(&self, token_id: u64) -> Option<NFT> {
        let address = ic_cdk::caller();
        if self.tokenToAddress.get(&token_id) == Some(&address) {
            return self.tokens.get(&token_id).cloned();
        }
        None
    }

    


    fn add_authorized_minter(&mut self, minter: Principal) -> Result<(), String> {
        if !self.authorized_minters.contains(&ic_cdk::caller()) {
            return Err("Not authorized to add minters".to_string());
        }
        self.authorized_minters.insert(minter);
        Ok(())
    }



}

// #[ic_cdk::query]
// pub fn get_token_content(token_id: u64) -> Option<String> {
//     println!("Attempting to get content for token ID: {}", token_id);
//     let result = NFT_CONTRACT.with(|contract| contract.borrow().get_content(token_id));
//     println!("Result: {:?}", result);
//     result
// }
#[ic_cdk::query]
pub fn get_token_content(token_id: u64) -> Option<NFT> {
    println!("Attempting to get content for token ID: {}", token_id);
    let result = NFT_CONTRACT.with(|contract| contract.borrow().get_content(token_id));
    println!("Result: {:?}", result.is_some());
    result
}
// #[ic_cdk::update]
// pub fn mint_nft(owner: Principal, content: String) -> (u64, String) {
//     let token_id = NFT_CONTRACT.with(|contract| contract.borrow_mut().mint(owner, content.clone()));
//     println!("Minted NFT with ID: {} and content: {}", token_id, content);
//     (token_id, content)
// }
#[ic_cdk::update]
pub fn mint_nft(owner: Principal, model: String, embeddings: Vec<Vec<f32>>, json: Vec<String>, name: String, description: String, nft_image: Vec<u8>) -> u64 {
    let token_id = NFT_CONTRACT.with(|contract| 
        contract.borrow_mut().mint(owner, model.clone(), embeddings.clone(), json.clone(), name.clone(), description.clone(), nft_image.clone())
    );
    println!("Minted NFT with ID: {} and model: {}", token_id, model);
    token_id
}

#[ic_cdk::update]
pub fn transfer_nft(to: Principal, token_id: u64) -> bool {
    // let from = ic_cdk::caller();
    NFT_CONTRACT.with(|contract| contract.borrow_mut().transfer(to, token_id))
}

#[ic_cdk::update]
pub fn burn_nft(token_id: u64) -> bool {
    NFT_CONTRACT.with(|contract| contract.borrow_mut().burn(token_id))
}

#[ic_cdk::update]
pub fn add_authorized_minter(minter: Principal) -> Result<(), String> {
    NFT_CONTRACT.with(|contract| contract.borrow_mut().add_authorized_minter(minter))
}

#[ic_cdk::query]
pub fn all_user_nfts(owner: Principal) -> Vec<u64> {
    NFT_CONTRACT.with(|contract| contract.borrow().all_user_nfts(owner))
}

#[ic_cdk::query]
pub fn verify_user_with_token(token_id: u64, owner: Principal) -> bool {
    NFT_CONTRACT.with(|contract| contract.borrow().verify_user_with_token(token_id, owner))
}
// Candid export
// pub fn export_candid() -> String {
//     candid::export_service!();
//     __export_service()
// }

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn generate_candid_nft() {
//         use std::env;
//         use std::fs::write;
//         use std::path::PathBuf;

//         let dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
//         let dir = dir.parent().unwrap().join("ICP_NFTs_backend");
//         println!("Writing NFT Candid file to: {:?}", dir);
//         let candid = export_candid();
//         println!("Generated NFT Candid:\n{}", candid);
//         write(dir.join("ICP_NFTs_backend.did"), candid).expect("Write failed.");
//     }
// }

// ic_cdk::export_candid!();