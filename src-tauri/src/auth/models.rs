use reqwest::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AccessTokenResponse {
    pub access_token: String,
    pub expires_in: i64,
    pub refresh_token: String
    // Other fields if needed
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub expires_in: i64,
}



pub struct RedditApi {
    client: Client,
    access_token: Option<String>,
    token_expiry: Option<chrono::DateTime<chrono::Utc>>,
    client_id: String,
    user_agent: String,
}



pub enum TokenContext {
    Expire,
    Initial
}


pub enum TokenResponses {
    RefreshTokenResponse,
    AccessTokenResponse
}


pub trait TokenData {
    fn get_access_token(&self) -> &str;
    fn get_expires_in(&self) -> i64;
    fn get_token_expiry(&self) -> String;
    fn get_refresh_token(&self) -> &str;
}

impl TokenData for AccessTokenResponse {
    fn get_access_token(&self) -> &str {
        &self.access_token
    }

    fn get_expires_in(&self) -> i64 {
        self.expires_in
    }

    fn get_token_expiry(&self) -> String {
        (chrono::Utc::now() + chrono::Duration::seconds(self.expires_in as i64))
            .timestamp()
            .to_string()
    }

    fn get_refresh_token(&self) -> &str {
        &self.refresh_token
    }
}


impl TokenData for RefreshTokenResponse {
    fn get_access_token(&self) -> &str {
        &self.access_token
    }

    fn get_expires_in(&self) -> i64 {
        self.expires_in
    }

    fn get_token_expiry(&self) -> String {
        // Implement how to calculate token_expiry for RefreshTokenResponse
        (chrono::Utc::now() + chrono::Duration::seconds(self.expires_in as i64))
            .timestamp()
            .to_string()
    }

    fn get_refresh_token(&self) -> &str {
        ""
    }
}

