use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse,
    TransformContext, TransformFunc,
};
use ic_cdk::api::management_canister::http_request::TransformArgs;
use candid::{CandidType, Deserialize, Principal};
use serde_json::{self, json, Value};

use crate::nft::{verify_user_with_token, get_token_content, NFT};

#[derive(CandidType, Deserialize)]

pub struct ChatResponse {
    jwt_token: String,
    url: String,
}

#[ic_cdk::update]
pub async fn chat(token_id: u64) -> Result<ChatResponse, String> {
    let caller = ic_cdk::caller();
    
    // Verify token ownership
    if !verify_user_with_token(token_id, caller) {
        return Err("User does not own this token".to_string());
    }

    // Get token content
    let nft_content = get_token_content(token_id)
        .ok_or("Failed to get token content".to_string())?;

    // Prepare chat request for Flask API
    let chat_request = prepare_chat_request(nft_content)?;

    // Make HTTP request to Flask API
    let response = make_flask_request(chat_request).await?;

    // Parse response and return JWT token
    // let jwt_token = parse_flask_response(response)?;

    parse_flask_response(response)
}

fn prepare_chat_request(nft: NFT) -> Result<Value, String> {
    Ok(json!({
        "model": nft.model,
        "embeddings": nft.embeddings,
        "document": nft.pdfcontent,
    }))
}

async fn make_flask_request(request_body: Value) -> Result<Vec<u8>, String> {
    let host = "5284-115-117-107-100.ngrok-free.app";
    let url = format!("https://{}/start_chat", host);

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

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
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
        Ok((response,)) => Ok(response.body),
        Err((r, m)) => Err(format!("HTTP request failed. RejectionCode: {:?}, Error: {}", r, m)),
    }
}

fn parse_flask_response(response: Vec<u8>) -> Result<ChatResponse, String> {
    let response_str = String::from_utf8(response)
        .map_err(|e| format!("Failed to parse response as UTF-8: {}", e))?;
    
    let response_json: Value = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let jwt_token = response_json["jwt_token"]
        .as_str()
        .ok_or_else(|| "JWT token not found in response".to_string())?
        .to_string();
    
    let url = response_json["url"]
        .as_str()
        .ok_or_else(|| "URL not found in response".to_string())?
        .to_string();

    Ok(ChatResponse { jwt_token, url })
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
//         ic_cdk::api::print(format!("Received an error from coinbase: err = {:?}", raw));
//     }
//     res
// }
