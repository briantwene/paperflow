use chrono::{Utc, TimeZone};
use serde_json::Value;

use super::models::AccessTokenResponse;
use crate::utils::{create_http, generate_user_agent};
use std::env::{set_var, var, VarError};

pub async fn get_access_token() -> Result<(), Box<dyn std::error::Error>> {
    //make a request to get the access token
    // Formulate the URL and parameters
    let token_url = "https://www.reddit.com/api/v1/access_token";
    let params = [
        (
            "grant_type",
            "https://oauth.reddit.com/grants/installed_client",
        ),
        ("device_id", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"), // Other required parameters
    ];

    // will remove this as need to change it to user based auth
    let client_id = String::from("jajajajajajjjajajajajajaja");

    let client = create_http();
    let user_agent = generate_user_agent();
    

    // Send POST request to get the access token
    let response = client
        .post(token_url)
        .basic_auth(client_id, Some(""))
        .header("User-Agent", user_agent)
        .form(&params)
        .send()
        .await?;

        // if successful then get the token and store it
        if response.status().is_success() {
            
            
            let token_response = response.json::<AccessTokenResponse>().await.expect("there was an error here fr sure");
            let access_token = token_response.access_token;
            let token_expiry = (chrono::Utc::now()
                + chrono::Duration::seconds(token_response.expires_in as i64))
            .timestamp().to_string();

           
            set_var("ACCESS_TOKEN", access_token);
            set_var("TOKEN_EXPIRY", token_expiry);
    
            Ok(())
        } else {
            // Handle the case where the response status is not successful
            let status_code = response.status();
            let response_text = response.text().await?;
            eprintln!("Request failed with status code: {}", status_code);
            eprintln!("Response: {}", response_text);
            Err("Request failed".into())
        }
    
}

// function for checking if the token is valid
pub async fn is_valid_token() -> Result<(), Box<dyn std::error::Error>> {
    //get the token from the env

    match var("TOKEN_EXPIRY") {
        Ok(expiry) if Utc.timestamp_opt(expiry.parse::<i64>().unwrap(), 0).unwrap() > chrono::Utc::now() => Ok(()),
        _ => {
            get_access_token().await?;
            Ok(())
        }
    }
}

// get token function 
pub async fn get_token() -> Result<String, VarError> {

    match var("ACCESS_TOKEN") {
        Ok(token) => Ok(token),
        Err(err) => Err(err)
    }
}
