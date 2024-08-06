mod https;
mod nft;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse,
    TransformContext, TransformFunc,
};
use ic_cdk::api::management_canister::http_request::TransformArgs;

use ic_cdk::export_candid;
use ic_cdk::print;
use candid::Principal;

// Re-export functions from both modules
// pub use https::*;

pub fn export_candid() -> String {
    candid::export_service!();
    __export_service()
}

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
        println!("Writing NFT Candid file to: {:?}", dir);
        let candid = export_candid();
        println!("Generated NFT Candid:\n{}", candid);
        write(dir.join("ICP_NFTs_backend.did"), candid).expect("Write failed.");
    }
}
