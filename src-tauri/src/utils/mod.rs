
use reqwest::Client;

pub fn create_http() -> Client {
    return reqwest::Client::builder()
        .user_agent("PaperFlow")
        .build()
        .expect("Failed to create client");
}
