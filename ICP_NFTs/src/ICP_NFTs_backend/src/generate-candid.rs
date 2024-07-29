use ICP_NFTs_backend::export_candid;

fn main() {
    use std::env;
    use std::fs::write;
    use std::path::PathBuf;

    let dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let did_path = dir.join("src").join("ICP_NFTs_backend.did");
    write(did_path, export_candid()).expect("Write failed.");
}