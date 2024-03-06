use keyring::Entry;
use serde_json::json;
use std::error::Error;
use chrono::{Duration, TimeZone, Utc};


// a way for the frontend to show the status of the user auth

pub fn get_auth_status(providers: Vec<&str>) -> serde_json::Value {
    let service_name = "PaperFlow";  // Your service name
    let mut connections = serde_json::Map::new();

    for provider in providers {
        let token_key = format!("{}_token", provider);
        let expiry_key = format!("{}_expiry", provider);
        let refresh_key = format!("{}_refresh", provider);

        // Check if credentials exist
        let token_keyring = Entry::new(&service_name, &token_key).unwrap();
        let expiry_keyring = Entry::new(&service_name, &expiry_key).unwrap();
        let refresh_keyring = Entry::new(&service_name, &refresh_key).unwrap();

      

        let access_token = token_keyring.get_password().is_ok();
        let has_refresh_token = refresh_keyring.get_password().is_ok();
        let token_valid = if let Ok(expiry_str) = expiry_keyring.get_password() {
            println!("{:#?}", expiry_str);
            let expiry = expiry_str.parse::<i64>().unwrap_or(0);
            expiry > chrono::Utc::now().timestamp()
        } else {
            false
        };

        let connected = access_token || (has_refresh_token && token_valid);
        connections.insert(provider.to_string(), serde_json::Value::Bool(connected));
    }

    json!(connections)
}

fn main() {
    let providers = vec!["reddit"];
    let result = get_auth_status(providers);

    // Print the result as JSON
    println!("{}", serde_json::to_string_pretty(&result).unwrap());
}
