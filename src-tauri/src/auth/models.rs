use reqwest::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AccessTokenResponse {
    pub access_token: String,
    pub expires_in: i64,
    scope: String,
    token_type: String,
    device_id: String
    // Other fields if needed
}

pub struct RedditApi {
    client: Client,
    access_token: Option<String>,
    token_expiry: Option<chrono::DateTime<chrono::Utc>>,
    client_id: String,
    user_agent: String,
}