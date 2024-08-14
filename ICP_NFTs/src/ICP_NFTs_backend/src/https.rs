use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse,
    TransformContext, TransformFunc,
};
use ic_cdk::api::management_canister::http_request::TransformArgs;
use candid::Principal;
use ic_cdk::api::call::CallResult;



#[ic_cdk::update]
pub async fn send_http_request(endpoint: String, method: String, body: String) -> String {
    let host = "7a6d-106-221-222-178.ngrok-free.app"; // Replace with your Flask server's host
    let url = format!("https://{}/{}", host, endpoint);

    // type Timestamp = u64;
    // let start_timestamp: Timestamp = 1682978460; //May 1, 2023 22:01:00 GMT
    // let seconds_of_time: u64 = 60; //we start with 60 seconds
    // let host = "api.pro.coinbase.com";
    // let url = format!(
    //     "https://{}/products/ICP-USD/candles?start={}&end={}&granularity={}",
    //     host,
    //     start_timestamp.to_string(),
    //     start_timestamp.to_string(),
    //     seconds_of_time.to_string()
    // );


    let request_headers = vec![
        HttpHeader {
            name: "Host".to_string(),
            value: format!("{host}:443"), // or HTTPS
            // value: host.to_string(), // Removed port for standard format
        },
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "icp_canister".to_string(),
        },
        // HttpHeader {
        //     name: "Content-Type".to_string(),
        //     value: "application/json".to_string(),
        // },
    ];

    // let http_method = match method.to_lowercase().as_str() {
    //     "get" => HttpMethod::GET,
    //     "post" => HttpMethod::POST,
    //     // Add other methods as needed
    //     _ => return "Invalid HTTP method".to_string(),
    // };

    print!("Sending request to: {}\n", url);

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: HttpMethod::GET,
        body: Some(body.into_bytes()),
        max_response_bytes: None,
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: ic_cdk::api::id(),
                method: "transform".to_string(),
            }),
            context: vec![],
        }),
        // transform: None,
        headers: request_headers,
    };

    let cycles = 230_949_972_000;

    // let result: CallResult<(HttpResponse,)> = http_request(request, cycles).await;

    match http_request(request, cycles).await {
        //4. DECODE AND RETURN THE RESPONSE

        //See:https://docs.rs/ic-cdk/latest/ic_cdk/api/management_canister/http_request/struct.HttpResponse.html
        Ok((response,)) => {
            //Return the body as a string and end the method
            String::from_utf8(response.body).expect("Transformed response is not UTF-8 encoded.")
        }
        Err((r, m)) => {
            let message =
                format!("The http_request resulted into error. RejectionCode: {r:?}, Error: {m}");

            //Return the error as a string and end the method
            message
        }
    }
}

#[ic_cdk::query]
fn transform(raw: TransformArgs) -> HttpResponse {
    let headers = vec![
        HttpHeader {
            name: "Content-Security-Policy".to_string(),
            value: "default-src 'self'".to_string(),
        },
        HttpHeader {
            name: "Referrer-Policy".to_string(),
            value: "strict-origin".to_string(),
        },
        HttpHeader {
            name: "Permissions-Policy".to_string(),
            value: "geolocation=(self)".to_string(),
        },
        HttpHeader {
            name: "Strict-Transport-Security".to_string(),
            value: "max-age=63072000".to_string(),
        },
        HttpHeader {
            name: "X-Frame-Options".to_string(),
            value: "DENY".to_string(),
        },
        HttpHeader {
            name: "X-Content-Type-Options".to_string(),
            value: "nosniff".to_string(),
        },
    ];

    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers,
    };

    if res.status == 200u64 {
        res.body = raw.response.body;
    } else {
        ic_cdk::api::print(format!("Received an error from coinbase: err = {:?}", raw));
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