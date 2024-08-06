use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse,
    TransformContext, TransformFunc,
};
use ic_cdk::api::management_canister::http_request::TransformArgs;
use candid::Principal;

#[ic_cdk::update]
pub async fn send_http_request(endpoint: String, method: String, body: Option<String>) -> String {
    let host = "127.0.0.1"; // Replace with your Flask server's host
    let url = format!("https://{}/{}", host, endpoint);

    let request_headers = vec![
        HttpHeader {
            name: "Host".to_string(),
            value: format!("{host}:443"),
        },
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "icp_canister".to_string(),
        },
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
    ];

    let http_method = match method.to_lowercase().as_str() {
        "get" => HttpMethod::GET,
        "post" => HttpMethod::POST,
        // Add other methods as needed
        _ => return "Invalid HTTP method".to_string(),
    };

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: http_method,
        body: body.map(|b| b.into_bytes()),
        max_response_bytes: None,
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: ic_cdk::api::id(),
                method: "transform".to_string(),
            }),
            context: vec![],
        }),
        headers: request_headers,
    };

    let cycles = 949_972_000; // Adjust as needed

    match http_request(request, cycles).await {
        Ok((response,)) => {
            String::from_utf8(response.body).unwrap_or_else(|e| format!("Error decoding response: {}", e))
        }
        Err((r, m)) => {
            format!("HTTP request error. RejectionCode: {:?}, Error: {}", r, m)
        }
    }
}

#[ic_cdk::query]
pub fn transform(args: TransformArgs) -> HttpResponse {
    let headers = vec![
        HttpHeader {
            name: "Content-Security-Policy".to_string(),
            value: "default-src 'self'".to_string(),
        },
        // Add other security headers as needed
    ];

    let mut res = HttpResponse {
        status: args.response.status.clone(),
        body: args.response.body.clone(),
        headers,
    };

    if res.status == 200u64 {
        // Optionally process the body here if needed
    } else {
        ic_cdk::api::print(format!("Received an error from server: {:?}", args));
    }
    res
}


// // pub fn export_candid() -> String {
// //     candid::export_service!();
// //     __export_service()
// // }

// // #[cfg(test)]
// // mod tests {
// //     use super::*;

// //     #[test]
// //     fn generate_candid_nft() {
// //         use std::env;
// //         use std::fs::write;
// //         use std::path::PathBuf;

// //         let dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
// //         let dir = dir.parent().unwrap().join("ICP_NFTs_backend");
// //         println!("Writing NFT Candid file to: {:?}", dir);
// //         let candid = export_candid();
// //         println!("Generated NFT Candid:\n{}", candid);
// //         write(dir.join("ICP_NFTs_backend.did"), candid).expect("Write failed.");
// //     }
// // }

// // ic_cdk::export_candid!();