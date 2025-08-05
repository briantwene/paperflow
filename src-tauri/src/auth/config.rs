use crate::auth::errors::AuthError;
use keyring::Entry;

#[derive(Debug, Clone)]
pub struct RedditAuthConfig {
    pub service_name: &'static str,
    pub token_key: &'static str,
    pub refresh_key: &'static str,
    pub expiry_key: &'static str,
    pub client_id: &'static str,
    pub redirect_port: u16,
    pub scopes: &'static [&'static str],
}

impl RedditAuthConfig {
    pub const REDDIT: Self = Self {
        service_name: "PaperFlow",
        token_key: "reddit_token",
        refresh_key: "reddit_refresh",
        expiry_key: "reddit_expiry",
        client_id: "auCw6dQt_04k1hUxwc_HrA",
        redirect_port: 32463,
        scopes: &["identity", "save", "read"],
    };
    
    pub fn create_entry(&self, key_type: KeyType) -> Result<Entry, AuthError> {
        let key = match key_type {
            KeyType::Access => self.token_key,
            KeyType::Refresh => self.refresh_key,
            KeyType::Expiry => self.expiry_key,
        };
        Entry::new(self.service_name, key).map_err(AuthError::from)
    }
    
    pub fn build_auth_url(&self) -> String {
        let redirect_url = format!("http://localhost:{}/callback", self.redirect_port);
        let scopes = self.scopes.join(",");
        
        format!(
            "https://www.reddit.com/api/v1/authorize?client_id={}&response_type=code&state=yooo&redirect_uri={}&duration=permanent&scope={}",
            self.client_id, redirect_url, scopes
        )
    }
}

#[derive(Debug, Clone, Copy)]
pub enum KeyType {
    Access,
    Refresh,
    Expiry,
}
