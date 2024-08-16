use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse,
    TransformContext, TransformFunc,
};
use ic_cdk::api::management_canister::http_request::TransformArgs;
use ic_cdk::api::call::CallResult;
use candid::{CandidType, Deserialize};
use candid::Principal;
use serde_json::Value;

use crate::nft::{mint_nft, NFT};

#[derive(CandidType, Deserialize)]
pub struct PdfUploadResult {
    message: Option<String>,
    embeddings: Vec<Vec<f32>>,
    document: Vec<DocumentContent>,
}

#[derive(CandidType, Deserialize)]
struct DocumentContent {
    id: String,
    text: String,
}

#[derive(CandidType, Deserialize)]
pub struct ProcessPdfInput {
    pdf_contents: Vec<Vec<u8>>,
    selected_model: String,
    name: String,
    owner_principal: Principal,
}


#[ic_cdk::update]
pub async fn process_pdfs_and_mint_nft(input: ProcessPdfInput) -> Result<u64, String> {
    let host = "1320-115-117-107-100.ngrok-free.app"; // Replace with your Flask server's host
    let url = format!("https://{}/make_embedding", host);

    let boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    let mut body = Vec::new();

    for (index, pdf_content) in input.pdf_contents.iter().enumerate() {
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Disposition: form-data; name=\"file\"; filename=\"file.pdf\"\r\n");
        body.extend_from_slice(b"Content-Type: application/pdf\r\n\r\n");
        body.extend_from_slice(pdf_content);
        body.extend_from_slice(b"\r\n");
    }
    body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

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
            value: format!("multipart/form-data; boundary={}", boundary),
        },
    ];

    // Create multipart form-data
    // let boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    // let mut body = Vec::new();

    // for (index, pdf_content) in input.pdf_contents.into_iter().enumerate() {
    //     body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    //     body.extend_from_slice(format!("Content-Disposition: form-data; name=\"file\"; filename=\"file{}.pdf\"\r\n", index).as_bytes());
    //     body.extend_from_slice("Content-Type: application/pdf\r\n\r\n".as_bytes());
    //     body.extend_from_slice(&pdf_content);
    //     body.extend_from_slice("\r\n".as_bytes());
    // }
    // body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: HttpMethod::POST,
        body: Some(body),
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
            let response_body = String::from_utf8(response.body)
                .map_err(|e| format!("Failed to parse response body: {}", e))?;
            
            // Parse JSON response
            let json_value: Value = serde_json::from_str(&response_body)
                .map_err(|e| format!("Failed to parse JSON: {}. Response body: {}", e, response_body))?;

            // Extract embeddings with type annotation
            let embeddings: Vec<Vec<f32>> = json_value["embeddings"]
                .as_array()
                .ok_or("Missing 'embeddings' field")?
                .iter()
                .map(|v| {
                    v.as_array()
                        .ok_or("Invalid embedding format")?
                        .iter()
                        .map(|n| n.as_f64().ok_or("Invalid number in embedding").map(|f| f as f32))
                        .collect::<Result<Vec<f32>, _>>()
                })
                .collect::<Result<Vec<Vec<f32>>, _>>()
                .map_err(|e| format!("Error parsing embeddings: {}", e))?;

            // Extract document with type annotation
         // Extract document with type annotation
         let document: Vec<DocumentContent> = json_value["document"]
            .as_array()
            .ok_or("Missing 'document' field")?
            .iter()
            .map(|v: &Value| -> Result<DocumentContent, String> {
                Ok(DocumentContent {
                    id: v["id"].as_str().ok_or("Missing 'id' field")?.to_string(),
                    text: v["text"].as_str().ok_or("Missing 'text' field")?.to_string(),
                })
            })
            .collect::<Result<Vec<DocumentContent>, String>>()
            .map_err(|e| format!("Error parsing document: {}", e))?;

            // Convert document to the format expected by mint_nft
            let json_content: Vec<String> = document.into_iter()
                .flat_map(|doc| vec![doc.id, doc.text])
                .collect();

            // Mint NFT
            let token_id = mint_nft(
                input.owner_principal,
                input.selected_model,
                embeddings,
                json_content,
                input.name,
            );

            Ok(token_id)
        }
        Err((r, m)) => {
            Err(format!("The http_request resulted in error. RejectionCode: {:?}, Error: {}", r, m))
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