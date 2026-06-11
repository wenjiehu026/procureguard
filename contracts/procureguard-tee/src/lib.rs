extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct SearchVendorsInput {
    pub category: String,
    pub quantity: u32,
    #[serde(rename = "maxBudget")]
    pub max_budget: u32,
    pub region: String,
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct SubmitPurchaseInput {
    #[serde(rename = "quoteId")]
    pub quote_id: String,
    pub amount: u32,
    pub currency: String,
    pub justification: String,
    #[serde(rename = "approvalId")]
    pub approval_id: String,
}

pub fn parse_search(input: &[u8]) -> Result<SearchVendorsInput, String> {
    serde_json::from_slice(input).map_err(|error| format!("search-vendors input: {error}"))
}

pub fn parse_submit(input: &[u8]) -> Result<SubmitPurchaseInput, String> {
    serde_json::from_slice(input).map_err(|error| format!("submit-purchase-request input: {error}"))
}

pub fn build_search_body(input: &SearchVendorsInput) -> Result<Vec<u8>, String> {
    serde_json::to_vec(input).map_err(|error| error.to_string())
}

pub fn build_submit_body(input: &SubmitPurchaseInput) -> Result<Vec<u8>, String> {
    let body = json!({
        "quoteId": input.quote_id,
        "amount": input.amount,
        "currency": input.currency,
        "justification": input.justification,
        "approvalId": input.approval_id,
        "employee": {
            "name": "{{profile.first_name}} {{profile.last_name}}",
            "email": "{{profile.verified_contacts.email.value}}",
            "department": "{{profile.department}}"
        },
        "piiHandling": "terminal3-placeholders"
    });

    serde_json::to_vec(&body).map_err(|error| error.to_string())
}

pub fn procurement_api_key_name() -> &'static str {
    "procurement_api_key"
}

#[cfg(all(target_arch = "wasm32", feature = "wasm"))]
mod wasm_contract {
    use super::*;

    wit_bindgen::generate!({
        world: "procureguard",
        path: "wit",
        additional_derives: [serde::Deserialize, serde::Serialize],
        generate_all,
    });

    struct Component;

    impl exports::z::procureguard::contracts::Guest for Component {
        fn search_vendors(
            req: exports::z::procureguard::contracts::GenericInput,
        ) -> Result<Vec<u8>, String> {
            let input = req.input.ok_or("search-vendors: missing input")?;
            let parsed = parse_search(&input)?;
            let body = build_search_body(&parsed)?;
            call_plain_http("/api/procurement/search", body)
        }

        fn submit_purchase_request(
            req: exports::z::procureguard::contracts::GenericInput,
        ) -> Result<Vec<u8>, String> {
            let input = req.input.ok_or("submit-purchase-request: missing input")?;
            let parsed = parse_submit(&input)?;
            let body = build_submit_body(&parsed)?;
            call_placeholder_http("/api/procurement/requests", body)
        }
    }

    fn call_plain_http(_path: &str, _body: Vec<u8>) -> Result<Vec<u8>, String> {
        Err("host http call is implemented by the T3 host bindings in the deployed contract".to_string())
    }

    fn call_placeholder_http(_path: &str, _body: Vec<u8>) -> Result<Vec<u8>, String> {
        Err("host http-with-placeholders call is implemented by the T3 host bindings in the deployed contract".to_string())
    }

    export!(Component);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_search_input() {
        let input = br#"{"category":"laptop","quantity":2,"maxBudget":4000,"region":"US"}"#;
        let parsed = parse_search(input).unwrap();

        assert_eq!(parsed.category, "laptop");
        assert_eq!(parsed.quantity, 2);
        assert_eq!(parsed.max_budget, 4000);
    }

    #[test]
    fn submit_body_uses_placeholders() {
        let input = SubmitPurchaseInput {
            quote_id: "q-atlas-laptop-14".to_string(),
            amount: 2960,
            currency: "USD".to_string(),
            justification: "Best allowlisted option".to_string(),
            approval_id: "mgr-123".to_string(),
        };

        let body = String::from_utf8(build_submit_body(&input).unwrap()).unwrap();

        assert!(body.contains("{{profile.first_name}}"));
        assert!(body.contains("{{profile.verified_contacts.email.value}}"));
        assert!(!body.contains("Ada Lovelace"));
    }

    #[test]
    fn secret_key_name_is_stable() {
        assert_eq!(procurement_api_key_name(), "procurement_api_key");
    }
}
