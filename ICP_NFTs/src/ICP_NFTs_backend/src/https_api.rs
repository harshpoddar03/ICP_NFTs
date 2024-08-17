use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse,
    TransformContext, TransformFunc,
};
use ic_cdk::api::management_canister::http_request::TransformArgs;
use candid::{CandidType, Deserialize};
use serde_json::{self, json, Value};

use crate::nft::{verify_user_with_token, get_token_content, NFT};

#[derive(CandidType, Deserialize)]
pub struct ApiKeyResponse {
    api_key: String,
}

const HOST: &str = "1889-115-117-107-100.ngrok-free.app"; // Replace with your actual host
const MASTER_API_KEY: &str = "1234567890"; // Replace with your actual master API key

#[ic_cdk::update]
pub async fn generate_api_key(token_id: u64) -> Result<ApiKeyResponse, String> {
    let caller = ic_cdk::caller();
    
    // Verify token ownership
    if !verify_user_with_token(token_id, caller) {
        return Err("User does not own this token".to_string());
    }

    // Get token content
    let nft_content = get_token_content(token_id)
        .ok_or("Failed to get token content".to_string())?;

    // Generate API key
    let api_key = generate_one_time_api_key(nft_content).await?;

    Ok(ApiKeyResponse { api_key })
}

async fn generate_one_time_api_key(nft: NFT) -> Result<String, String> {
    let request_body = json!({
        "model": nft.model,
        "embeddings": nft.embeddings,
        "document": nft.pdfcontent,
    });

    let url = format!("https://{}/get_temp_api_key", HOST);
    let request_headers = vec![
        HttpHeader {
            name: "Host".to_string(),
            value: format!("{HOST}:443"),
        },
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "icp_canister".to_string(),
        },
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "X-Master-API-Key".to_string(),
            value: MASTER_API_KEY.to_string(),
        },
    ];

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::POST,
        body: Some(serde_json::to_vec(&request_body).map_err(|e| e.to_string())?),
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

    let cycles = 230_949_972_000;

    match http_request(request, cycles).await {
        Ok((response,)) => {
            let response_str = String::from_utf8(response.body)
                .map_err(|e| format!("Failed to parse response as UTF-8: {}", e))?;
            let response_json: Value = serde_json::from_str(&response_str)
                .map_err(|e| format!("Failed to parse JSON: {}", e))?;
            let api_key = response_json["temp_api_key"]
                .as_str()
                .ok_or_else(|| "API key not found in response".to_string())?
                .to_string();
            
            Ok(api_key)
        },
        Err((r, m)) => Err(format!("HTTP request failed. RejectionCode: {:?}, Error: {}", r, m)),
    }
}

// #[ic_cdk::query]
// fn transform(raw: TransformArgs) -> HttpResponse {
//     let headers = vec![
//         HttpHeader {
//             name: "Content-Security-Policy".to_string(),
//             value: "default-src 'self'".to_string(),
//         },
//         HttpHeader {
//             name: "Referrer-Policy".to_string(),
//             value: "strict-origin".to_string(),
//         },
//         HttpHeader {
//             name: "Permissions-Policy".to_string(),
//             value: "geolocation=(self)".to_string(),
//         },
//         HttpHeader {
//             name: "Strict-Transport-Security".to_string(),
//             value: "max-age=63072000".to_string(),
//         },
//         HttpHeader {
//             name: "X-Frame-Options".to_string(),
//             value: "DENY".to_string(),
//         },
//         HttpHeader {
//             name: "X-Content-Type-Options".to_string(),
//             value: "nosniff".to_string(),
//         },
//     ];

//     let mut res = HttpResponse {
//         status: raw.response.status.clone(),
//         body: raw.response.body.clone(),
//         headers,
//     };

//     if res.status == 200u64 {
//         res.body = raw.response.body;
//     } else {
//         ic_cdk::api::print(format!("Received an error from the API: err = {:?}", raw));
//     }
//     res
// }