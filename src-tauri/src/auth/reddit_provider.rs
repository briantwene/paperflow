use crate::auth::{
    config::RedditAuthConfig,
    errors::AuthResult,
    http_client::AuthHttpClient,
    models::{AccessTokenResponse, RefreshTokenResponse},
    provider::{AuthProvider, ProviderConfig, TokenKeys},
    storage::TokenStorage,
};
use async_trait::async_trait;

pub struct RedditProvider {
    pub storage: TokenStorage,
    pub http_client: AuthHttpClient,
    pub config: &'static RedditAuthConfig,
}

impl RedditProvider {
    pub fn new(http_client: AuthHttpClient) -> Self {
        Self {
            storage: TokenStorage::new(),
            http_client,
            config: &RedditAuthConfig::REDDIT,
        }
    }
}

impl ProviderConfig for RedditProvider {
    fn service_name() -> &'static str {
        "PaperFlow"
    }
    
    fn token_keys() -> TokenKeys {
        TokenKeys {
            access: "reddit_token",
            refresh: "reddit_refresh",
            expiry: "reddit_expiry",
        }
    }
}

#[async_trait]
impl AuthProvider for RedditProvider {
    type TokenResponse = AccessTokenResponse;
    type RefreshResponse = RefreshTokenResponse;
    
    async fn initiate_auth(&self) -> AuthResult<String> {
        Ok(self.config.build_auth_url())
    }
    
    async fn exchange_code(&self, code: &str) -> AuthResult<Self::TokenResponse> {
        self.http_client.exchange_code(code).await
    }
    
    async fn refresh_token(&self, refresh_token: &str) -> AuthResult<Self::RefreshResponse> {
        self.http_client.refresh_token(refresh_token).await
    }
    
    async fn revoke_token(&self, token: &str) -> AuthResult<()> {
        self.http_client.revoke_token(token).await
    }
    
    async fn get_stored_token(&self) -> AuthResult<String> {
        self.storage.get_access_token().await
    }
}
